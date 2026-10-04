import crypto from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Server } from "socket.io";
import { config } from "./config";
import { logger } from "./logger";
import { prisma } from "./prisma";

const startedAt = Date.now();

const EVENT_RE = /^[a-z][a-z0-9:_-]{0,63}$/;
const ROOM_RE = /^(user|chat):[A-Za-z0-9_-]{1,64}$/;
const RESERVED_EVENTS = new Set([
  "connect",
  "connect_error",
  "disconnect",
  "disconnecting",
  "error",
  "newListener",
  "removeListener",
]);
const MAX_ROOMS = 100;

type EmitRequest = { event: string; rooms: string[]; payload: unknown };

function json(res: ServerResponse, status: number, body: unknown) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(data),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(data);
}

/** Constant-time comparison that does not leak the secret's length. */
function secretMatches(provided: string | string[] | undefined): boolean {
  if (!config.internalSecret || typeof provided !== "string" || provided.length === 0) return false;
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(config.internalSecret).digest();
  return crypto.timingSafeEqual(a, b);
}

class BodyTooLargeError extends Error {}

function readBody(req: IncomingMessage, limit: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers["content-length"] ?? 0);
    if (declared > limit) {
      reject(new BodyTooLargeError());
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new BodyTooLargeError());
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function parseEmitRequest(raw: string): EmitRequest | string {
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return "Body must be valid JSON";
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return "Body must be an object";
  const { event, rooms, payload } = body as Record<string, unknown>;
  if (typeof event !== "string" || !EVENT_RE.test(event) || RESERVED_EVENTS.has(event)) {
    return "Invalid event name";
  }
  if (!Array.isArray(rooms) || rooms.length === 0 || rooms.length > MAX_ROOMS) {
    return `rooms must be an array of 1-${MAX_ROOMS} room names`;
  }
  if (!rooms.every((room): room is string => typeof room === "string" && ROOM_RE.test(room))) {
    return "Invalid room name";
  }
  if (payload === undefined) return "payload is required";
  return { event, rooms: [...new Set(rooms)], payload };
}

export function createRequestHandler(getIo: () => Server | null) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const path = (req.url ?? "/").split("?")[0];

    try {
      if (req.method === "GET" && path === "/health") {
        let db = true;
        try {
          await prisma.$queryRaw`SELECT 1`;
        } catch (error) {
          db = false;
          logger.error("health: database check failed", { error });
        }
        json(res, db ? 200 : 503, {
          ok: db,
          db,
          uptime: Math.round((Date.now() - startedAt) / 1000),
          connections: getIo()?.engine.clientsCount ?? 0,
        });
        return;
      }

      if (path === "/internal/emit") {
        if (req.method !== "POST") {
          json(res, 405, { ok: false, error: "Method not allowed" });
          return;
        }
        if (!secretMatches(req.headers["x-internal-secret"])) {
          json(res, 401, { ok: false, error: "Unauthorized" });
          return;
        }
        const contentType = req.headers["content-type"] ?? "";
        if (!contentType.toLowerCase().startsWith("application/json")) {
          json(res, 415, { ok: false, error: "Content-Type must be application/json" });
          return;
        }
        const parsed = parseEmitRequest(await readBody(req, config.internalBodyLimit));
        if (typeof parsed === "string") {
          json(res, 400, { ok: false, error: parsed });
          return;
        }
        const io = getIo();
        if (!io) {
          json(res, 503, { ok: false, error: "Not ready" });
          return;
        }
        io.to(parsed.rooms).emit(parsed.event, parsed.payload);
        logger.debug("internal emit", { event: parsed.event, rooms: parsed.rooms.length });
        json(res, 200, { ok: true });
        return;
      }

      json(res, 404, { ok: false, error: "Not found" });
    } catch (error) {
      if (error instanceof BodyTooLargeError) {
        if (!res.headersSent) json(res, 413, { ok: false, error: "Payload too large" });
        return;
      }
      logger.error("http handler failed", { error, path });
      if (!res.headersSent) json(res, 500, { ok: false, error: "Internal error" });
    }
  };
}
