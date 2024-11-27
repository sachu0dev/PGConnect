import { Server } from "socket.io";
import http from "http";

const PORT = 4000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Socket.IO server is running\n");
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000/",
  },
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("message", (msg) => {
    console.log(`Message received: ${msg}`);
    io.emit("message", msg); //
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
