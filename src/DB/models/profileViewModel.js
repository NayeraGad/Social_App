import mongoose from "mongoose";

const profileViewSchema = mongoose.Schema({
  viewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  viewedProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  totalViews: Number,
  viewedAt: [
    {
      type: Date,
      default: Date.now(),
    },
  ],
});

export const profileViewModel =
  mongoose.models.profileView ||
  mongoose.model("profileView", profileViewSchema);
