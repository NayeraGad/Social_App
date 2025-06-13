import { usersModel } from "../DB/models/index.js";
import { Compare } from "./index.js";

export const checkOtpExpiration = async ({ email, code, otpFor }) => {
  const user =
    otpFor === "email"
      ? await usersModel.findOne({ email, confirmed: false })
      : await usersModel.findOne({ email, isDeleted: false });

  // Check if email does not exist or is already confirmed
  if (!user) {
    throw new Error("Email not found or already confirmed");
  }

  // Select otp fields based on the `otpFor` value
  const otpField = otpFor === "email" ? user.otpEmail : user.otpPassword;
  const otpCreatedAt =
    otpFor === "email" ? user.otpEmailCreatedAt : user.otpPasswordCreatedAt;
  const otpFailedAttempts =
    otpFor === "email" ? user.failedAttempts : user.failedPasswordAttempts;
  const otpExpiresAt =
    otpFor === "email" ? user.otpEmailExpiresAt : user.otpPasswordExpiresAt;

  // Check if user is banned
  if (Date.now() - otpExpiresAt < 5 * 60 * 1000) {
    throw new Error("You are banned from entering otp.");
  }

  // Check if OTP has expired
  if (Date.now() - otpCreatedAt > 2 * 60 * 1000) {
    throw new Error("OTP expired");
  }

  // Compare OTP
  const isMatch = await Compare({ key: code, hashed: otpField });
  if (!isMatch) {
    if (otpFailedAttempts >= 5) {
      await usersModel.updateOne(
        { email },
        {
          [`${
            otpFor === "email" ? "otpEmailExpiresAt" : "otpPasswordExpiresAt"
          }`]: Date.now(),
          [`${
            otpFor === "email" ? "failedAttempts" : "failedPasswordAttempts"
          }`]: 0,
        }
      );
      throw new Error(
        "Too many tries. You are temporarily banned for 5 minutes."
      );
    }

    // Increment failed attempts
    await usersModel.updateOne(
      { email },
      {
        [`${otpFor === "email" ? "failedAttempts" : "failedPasswordAttempts"}`]:
          otpFailedAttempts + 1,
      }
    );
    throw new Error(
      `Invalid code. You have ${5 - otpFailedAttempts} tries left.`
    );
  }
};
