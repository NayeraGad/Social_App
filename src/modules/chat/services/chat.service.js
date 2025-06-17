import { chatModel } from "../../../DB/models/index.js";
import { asyncHandler } from "../../../utilities/error.js";

export const getChat = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  const chat = await chatModel
    .findOne({
      $or: [
        { mainUser: req.user._id, subParticipant: userId },
        { mainUser: userId, subParticipant: req.user._id },
      ],
    })
    .populate([
      { path: "mainUser" },
      { path: "messages.senderId" },
      { path: "subParticipant" },
    ]);

  return res.status(200).json({ message: "done", chat });
});
