import { Router } from "express";
import * as CS from "./comments.service.js";
import * as CV from "./comments.validation.js";
import {
  authentication,
  extensionTypes,
  multerCloud,
  validation,
} from "../../middlewares/index.js";

const commentsRouter = Router({ mergeParams: true });

// Create comment
commentsRouter.post(
  "/createComment",
  multerCloud(extensionTypes.image).array("attachments", 5),
  validation(CV.createCommentSchema),
  authentication,
  CS.createComment
);

// Update comment
commentsRouter.post(
  "/updateComment/:commentId",
  multerCloud(extensionTypes.image).array("attachments", 5),
  validation(CV.updateCommentSchema),
  authentication,
  CS.updateComment
);

// Freeze comment
commentsRouter.delete(
  "/freezeComment/:commentId",
  validation(CV.idAndTokenSchema),
  authentication,
  CS.freezeComment
);

// Restore comment
commentsRouter.delete(
  "/restoreComment/:commentId",
  validation(CV.idAndTokenSchema),
  authentication,
  CS.restoreComment
);

// ReactOn comment
commentsRouter.patch(
  "/reactOnComment/:commentId",
  validation(CV.idAndTokenSchema),
  authentication,
  CS.reactOnComment
);

export default commentsRouter;
