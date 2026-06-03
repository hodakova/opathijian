import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { registerRoomHandlers } from "./sockets/roomHandlers.js";

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  registerRoomHandlers(io, socket);
});

httpServer.listen(3000, () => {
  console.log("Server running on port 3000");
});