import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  allowRequest: (_req, callback) => callback(null, true) // let them all connect
});

io.on("connection", (socket) => {
  socket.emit("ping")
  socket.on("pong", () => setTimeout(() => socket.emit("ping"), 1000))
})