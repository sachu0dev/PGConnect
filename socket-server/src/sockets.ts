import type { Server, Socket } from "socket.io";
import { config } from "./config";
import { verifyAccessToken } from "./lib/jwt";
import { logger } from "./logger";
import { isChatParticipant, loadActiveUser } from "./prisma";
import { TokenBucket } from "./rate-limit";

type SocketData = { userId: string; bucket: TokenBucket; lastTypingAt: number; dropped: number };
type AppSocket = Socket<Record<string, never>, Record<string, never>, Record<string, never>, SocketData>;
type Ack = (response: { ok: true } | { ok: false; error: string }) => void;

const CHAT_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_DROPPED_EVENTS = 100;

function chatIdFrom(input: unknown): string | null {
  if (typeof input !== "object" || input === null) return null;
  const chatId = (input as { chatId?: unknown }).chatId;
  return typeof chatId === "string" && CHAT_ID_RE.test(chatId) ? chatId : null;
}

function toAck(value: unknown): Ack {
  return typeof value === "function" ? (value as Ack) : () => {};
}

export function registerSocketHandlers(io: Server) {
  // Authenticate the handshake: verify the access token and reject banned users.
  io.use(async (rawSocket, next) => {
    const socket = rawSocket as unknown as AppSocket;
    const auth = socket.handshake.auth as { token?: unknown } | undefined;
    const userId = verifyAccessToken(auth?.token);
    if (!userId) return next(new Error("unauthorized"));
    try {
      const user = await loadActiveUser(userId);
      if (!user) return next(new Error("unauthorized"));
      socket.data.userId = user.id;
      socket.data.bucket = new TokenBucket(config.eventsPerSecond);
      socket.data.lastTypingAt = 0;
      socket.data.dropped = 0;
      next();
    } catch (error) {
      logger.error("auth middleware failed", { error });
      next(new Error("server_error"));
    }
  });

  io.on("connection", (rawSocket) => {
    const socket = rawSocket as unknown as AppSocket;
    const { userId } = socket.data;
    void socket.join(`user:${userId}`);
    logger.debug("socket connected", { socketId: socket.id, userId });

    // Connection-level rate limit for every inbound event.
    socket.use((_packet, next) => {
      if (socket.data.bucket.take()) return next();
      socket.data.dropped += 1;
      if (socket.data.dropped > MAX_DROPPED_EVENTS) {
        logger.warn("socket disconnected for flooding", { socketId: socket.id, userId });
        socket.disconnect(true);
        return;
      }
      next(new Error("rate_limited"));
    });

    socket.on("error", (error) => {
      // Errors raised by middleware (e.g. rate_limited) land here; don't crash.
      logger.debug("socket event rejected", { socketId: socket.id, error: error.message });
    });

    socket.on("chat:join", async (input: unknown, ackInput: unknown) => {
      const ack = toAck(ackInput);
      const chatId = chatIdFrom(input);
      if (!chatId) return ack({ ok: false, error: "invalid_chat" });
      const room = `chat:${chatId}`;
      if (socket.rooms.has(room)) return ack({ ok: true });
      const joinedChats = [...socket.rooms].filter((r) => r.startsWith("chat:")).length;
      if (joinedChats >= config.maxRoomsPerSocket) return ack({ ok: false, error: "too_many_rooms" });
      try {
        const [user, allowed] = await Promise.all([
          loadActiveUser(userId),
          isChatParticipant(chatId, userId),
        ]);
        if (!user) {
          ack({ ok: false, error: "unauthorized" });
          socket.disconnect(true);
          return;
        }
        if (!allowed) return ack({ ok: false, error: "not_found" });
        await socket.join(room);
        ack({ ok: true });
      } catch (error) {
        logger.error("chat:join failed", { error, chatId, userId });
        ack({ ok: false, error: "server_error" });
      }
    });

    socket.on("chat:leave", async (input: unknown, ackInput: unknown) => {
      const ack = toAck(ackInput);
      const chatId = chatIdFrom(input);
      if (!chatId) return ack({ ok: false, error: "invalid_chat" });
      await socket.leave(`chat:${chatId}`);
      ack({ ok: true });
    });

    socket.on("typing", (input: unknown) => {
      const chatId = chatIdFrom(input);
      if (!chatId) return;
      const room = `chat:${chatId}`;
      if (!socket.rooms.has(room)) return;
      const now = Date.now();
      if (now - socket.data.lastTypingAt < 1000) return;
      socket.data.lastTypingAt = now;
      socket.to(room).emit("typing", { chatId, userId });
    });

    socket.on("disconnect", (reason) => {
      logger.debug("socket disconnected", { socketId: socket.id, userId, reason });
    });
  });
}
