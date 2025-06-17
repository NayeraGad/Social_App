import { Server } from "socket.io";
import { logout, registerAccount } from "./services/chat.socket.service.js";
import { sendMessage } from "./services/message.socket.service.js";

export const runIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: "*",
  });

  io.on("connection", async (socket) => {
    await registerAccount(socket);
    await sendMessage(socket);
    await logout(socket);
  });
};
