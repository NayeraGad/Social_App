import { Router } from "express";
import * as AS from "./auth.service.js";
import * as AV from "./auth.validation.js";
import {
  extensionTypes,
  multerCloud,
  validation,
  authentication,
} from "../../middlewares/index.js";

const authRouter = Router()

// Signup
authRouter.post(
  "/signup",
  multerCloud(extensionTypes.image).single("profileImage"),
  validation(AV.signupSchema),
  AS.signup
);

// Confirm email
authRouter.patch(
  "/confirmEmail",
  validation(AV.confirmEmailSchema),
  AS.confirmEmail
);

// Resend email code
authRouter.post(
  "/resendEmailCode",
  validation(AV.emailSchema),
  AS.resendEmailCode
);

//Login
authRouter.post("/login", validation(AV.loginSchema), AS.login);

//Login with Gmail
authRouter.post("/loginWithGmail", AS.loginWithGmail);

//Activate two steps verification
authRouter.patch(
  "/setTwoStepVerification",
  validation(AV.setTwoStepVerificationSchema),
  authentication,
  AS.setTwoStepVerification
);

//Check two steps verification
authRouter.post(
  "/checkTwoStepVerification",
  validation(AV.checkTwoStepVerificationSchema),
  authentication,
  AS.checkTwoStepVerification
);

//Login confirmation
authRouter.post(
  "/loginConfirmation",
  validation(AV.loginConfirmationSchema),
  AS.loginConfirmation
);

//Refresh token
authRouter.get(
  "/refreshToken",
  validation(AV.refreshTokenSchema),
  AS.refreshToken
);

// Forget password
authRouter.post(
  "/forgetPassword",
  validation(AV.emailSchema),
  AS.forgetPassword
);

// Reset password
authRouter.patch(
  "/resetPassword",
  validation(AV.resetPasswordSchema),
  AS.resetPassword
);

export default authRouter