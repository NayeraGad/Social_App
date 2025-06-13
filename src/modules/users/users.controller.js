import { Router } from "express";
import * as US from "./users.service.js";
import * as UV from "./users.validation.js";
import {
  authentication,
  extensionTypes,
  multerCloud,
  validation,
} from "../../middlewares/index.js";

const usersRouter = Router();

// Update profile
usersRouter.patch(
  "/updateProfile",
  multerCloud(extensionTypes.image).single("profileImage"),
  validation(UV.updateProfileSchema),
  authentication,
  US.updateProfile
);

// Update password
usersRouter.patch(
  "/updatePassword",
  validation(UV.updatePasswordSchema),
  authentication,
  US.updatePassword
);

// View profile
usersRouter.get(
  "/profile",
  authentication,
  US.getProfile
);

// View other's profile
usersRouter.get(
  "/viewProfile/:id",
  validation(UV.idTokenSchema),
  authentication,
  US.viewProfile
);

// Block user
usersRouter.patch(
  "/blockUser",
  validation(UV.emailAndAuth),
  authentication,
  US.blockUser
);

// Unlock user
usersRouter.patch(
  "/unblockUser",
  validation(UV.emailAndAuth),
  authentication,
  US.unblockUser
);

// Update email request
usersRouter.patch(
  "/updateEmailRequest",
  validation(UV.emailAndAuth),
  authentication,
  US.updateEmailRequest
);

// Update email
usersRouter.patch(
  "/updateEmail",
  validation(UV.updateEmail),
  authentication,
  US.updateEmail
);

// Add or remove friend
usersRouter.patch(
  "/toggleFriend/:id",
  validation(UV.idTokenSchema),
  authentication,
  US.toggleFriend
);

export default usersRouter;
