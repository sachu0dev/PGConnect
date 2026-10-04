import http from "node:http";
import { Server } from "socket.io";
import { config } from "./config";
import { createRequestHandler } from "./http";
import { logger } from "./logger";
import { prisma } from "./prisma";
import { registerSocketHandlers } from "./sockets";

let io: Server | null = null;

const server = http.createServer(createRequestHandler(() => io));
server.requestTimeout = 10_000;
server.headersTimeout = 10_000;

io = new Server(server, {
  serveClient: false,
  cors: { origin: [...config.clientOrigins], credentials: true, methods: ["GET", "POST"] },
  maxHttpBufferSize: config.maxHttpBufferSize,
  pingTimeout: 20_000,
  pingInterval: 25_000,
  connectTimeout: 10_000,
});

registerSocketHandlers(io);

server.listen(config.port, () => {
  logger.info("socket server listening", {
    port: config.port,
    origins: config.clientOrigins,
    internalEmit: Boolean(config.internalSecret),
  });
  if (!config.internalSecret) {
    logger.warn("SOCKET_INTERNAL_SECRET is not set; /internal/emit will reject every request");
  }
});

let shuttingDown = false;
function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("shutting down", { signal });
  const force = setTimeout(() => {
    logger.error("forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
  force.unref();
  // io.close() disconnects every socket and closes the underlying HTTP server.
  io?.close(() => {
    prisma
      .$disconnect()
      .catch((error: unknown) => logger.error("prisma disconnect failed", { error }))
      .finally(() => process.exit(0));
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => logger.error("unhandled rejection", { error: reason }));
process.on("uncaughtException", (error) => {
  logger.error("uncaught exception", { error });
  shutdown("uncaughtException");
});
