import mongoose from "mongoose";
import { commentsModel } from "./commentsModel.js";

const postsSchema = mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      minLength: 3,
      trim: true,
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
    isArchived: Boolean,
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

postsSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "postId",
});

postsSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  if (update.isDeleted === true) {
    const postId = this.getQuery()._id;

    await commentsModel.updateMany({ postId }, { isDeleted: true });
  }

  next();
});

export const postsModel =
  mongoose.models.post || mongoose.model("post", postsSchema);
