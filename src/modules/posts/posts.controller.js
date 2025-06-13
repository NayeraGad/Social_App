import { Router } from "express";
import * as PS from "./posts.service.js";
import * as PV from "./posts.validation.js";
import {
  authentication,
  extensionTypes,
  multerCloud,
  validation,
} from "../../middlewares/index.js";
import commentsRouter from "../comments/comments.controller.js";

const postsRouter = Router();

postsRouter.use('/:postId/comments', commentsRouter)

// Create post
postsRouter.post(
  "/createPost",
  multerCloud(extensionTypes.image).array("attachments", 5),
  validation(PV.createPostSchema),
  authentication,
  PS.createPost
);

// Update post
postsRouter.post(
  "/updatePost/:id",
  multerCloud(extensionTypes.image).array("attachments", 5),
  validation(PV.updatePostSchema),
  authentication,
  PS.updatePost
);

// Undo post
postsRouter.delete(
  "/undoPost/:id",
  validation(PV.idAndTokenSchema),
  authentication,
  PS.undoPost
);

// Freeze post
postsRouter.delete(
  "/freezePost/:id",
  validation(PV.idAndTokenSchema),
  authentication,
  PS.freezePost
);

// Restore post
postsRouter.delete(
  "/restorePost/:id",
  validation(PV.idAndTokenSchema),
  authentication,
  PS.restorePost
);

// ReactOn post
postsRouter.patch(
  "/reactOnPost/:id",
  validation(PV.idAndTokenSchema),
  authentication,
  PS.reactOnPost
);

// Archive post
postsRouter.patch(
  "/archivePost/:id",
  validation(PV.idAndTokenSchema),
  authentication,
  PS.archivePost
);

// Unarchive post
postsRouter.patch(
  "/unarchivePost/:id",
  validation(PV.idAndTokenSchema),
  authentication,
  PS.unarchivePost
);

// Get user's posts
postsRouter.get(
  "/getUserPosts",
  validation(PV.tokenSchema),
  authentication,
  PS.getUserPosts
);

// Get friends posts
postsRouter.get(
  "/getFriendsPosts",
  validation(PV.tokenSchema),
  authentication,
  PS.getFriendsPosts
);

// Get specific user's posts
postsRouter.get(
  "/getSpecificUsersPosts",
  validation(PV.tokenSchema),
  authentication,
  PS.getSpecificUsersPosts
);

export default postsRouter;
