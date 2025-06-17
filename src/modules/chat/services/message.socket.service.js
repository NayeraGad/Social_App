import { chatModel, connectionUser } from "../../../DB/models/index.js";
import { authSocket } from "../../../middlewares/auth.js";

// ************************sendMessage**************************
export const sendMessage = async (socket) => {
  socket.on("sendMessage", async (data) => {
    const { user, statusCode } = await authSocket({ socket });
    const { message, destId } = data;

    if (statusCode !== 200) return socket.emit("authError", data);

    const userId = user._id;

    let chat;

    chat = await chatModel
      .findOneAndUpdate(
        {
          $or: [
            { mainUser: userId, subParticipant: destId },
            { mainUser: destId, subParticipant: userId },
          ],
        },
        {
          $push: { messages: { message, senderId: userId } },
        },
        { new: true }
      )
      .populate([
        { path: "mainUser" },
        { path: "messages.senderId" },
        { path: "subParticipant" },
      ]);

    if (!chat) {
      const newChat = await chatModel.create({
        mainUser: userId,
        subParticipant: destId,
        messages: { message, senderId: userId },
      });

      chat = await chatModel
        .findById(newChat._id)
        .populate([
          { path: "mainUser" },
          { path: "messages.senderId" },
          { path: "subParticipant" },
        ]);
    }

    socket.emit("successMessage", { message, chat });

    socket
      .to(connectionUser.get(destId.toString()))
      .emit("receiveMessage", { message });
  });
};
