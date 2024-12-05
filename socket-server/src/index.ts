import { Server, Socket } from "socket.io";
import http from "http";
import { PrismaClient } from "@prisma/client";
import { verifyAccessToken } from "./lib/jwt";
import { v4 } from "uuid";
// import winston from "winston";

/*
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: "server.log" }),
  ],
});
*/

const PORT = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Socket.IO server is running\n");
});

const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "info" },
    { emit: "event", level: "warn" },
  ],
});

/*
prisma.$on("error", (e) => logger.error(e));
prisma.$on("warn", (e) => logger.warn(e));
*/

interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      id: string;
      username: string;
    };
  };
}

// Socket.IO server configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000, // Increased timeout for better connection stability
});

// Authentication middleware
io.use(async (socket: AuthenticatedSocket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    // logger.warn("Connection attempt without token");
    return next(new Error("Authentication error: Token missing"));
  }

  try {
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
      },
    });

    if (!user) {
      /*
      logger.warn(
        `Authentication failed: User not found for ID ${payload.userId}`
      );
      */
      return next(new Error("Authentication error: User not found"));
    }

    socket.data.user = user;
    next();
  } catch (err) {
    // logger.error("Token verification failed", { error: err });
    return next(new Error("Authentication error: Invalid token"));
  }
});

// Connection handler
io.on("connection", (socket: AuthenticatedSocket) => {
  const user = socket.data.user;
  // logger.info(`Client connected: ${socket.id}`, { username: user?.username });

  // Join chat room handler
  socket.on("JOIN_CHAT", ({ chatId }: { chatId: string }) => {
    if (!chatId) {
      /*
      logger.warn("Attempted to join chat with invalid ID", {
        socketId: socket.id,
      });
      */
      return;
    }

    socket.join(chatId);
    /*
    logger.info(`User joined chat room`, {
      username: user?.username,
      chatId: chatId,
    });
    */
  });

  // New message handler with robust error handling
  socket.on(
    "NEW_MESSAGE",
    async ({ chatId, message }: { chatId: string; message: string }) => {
      // Validate input
      if (!chatId || !message || message.trim() === "") {
        /*
        logger.warn("Received invalid message", {
          username: user?.username,
          chatId,
          messageLength: message?.length,
        });
        */
        return;
      }

      const messageForRealTime = {
        id: v4(),
        text: message,
        sender: {
          id: user?.id,
          username: user?.username,
        },
        chatId,
        createdAt: new Date().toISOString(),
      };

      try {
        if (!user?.id) {
          // logger.warn("Cannot create message: User ID is undefined");
          return;
        }
        io.to(chatId).emit("message", { message: messageForRealTime });

        // Persist message to database
        await prisma.message.create({
          data: {
            chatRoomId: chatId,
            senderId: user?.id,
            text: message,
          },
        });

        /*
        logger.info("Message processed", {
          username: user?.username,
          chatId,
          messageLength: message.length,
        });
        */
      } catch (error) {
        /*
        logger.error("Failed to process message", {
          error,
          username: user?.username,
          chatId,
        });
        */
      }
    }
  );

  // Disconnect handler
  socket.on("disconnect", () => {
    /*
    logger.info(`Client disconnected`, {
      socketId: socket.id,
      username: user?.username,
    });
    */
  });
});

// Server startup
server.listen(PORT, () => {
  // logger.info(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    await prisma.$disconnect();
    // logger.info("Prisma client disconnected");
    server.close(() => {
      // logger.info("HTTP server closed");
      process.exit(0);
    });
  } catch (err) {
    // logger.error("Error during shutdown", err);
    process.exit(1);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
