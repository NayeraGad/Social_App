import mongoose from "mongoose";

const chatSchema = mongoose.Schema(
  {
    mainUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subParticipant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [
      {
        message: {
          type: String,
          required: true,
        },
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export const chatModel =
  mongoose.models.Chat || mongoose.model("Chat", chatSchema);
