import mongoose from "mongoose";

const commentsSchema = mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      minLength: 3,
      trim: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attachments: [
      {
        secure_url: String,
        public_id: String,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isDeleted: Boolean,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const commentsModel =
  mongoose.models.Comment || mongoose.model("Comment", commentsSchema);
