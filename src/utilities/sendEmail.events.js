import { EventEmitter } from "node:events";
import { customAlphabet, nanoid } from "nanoid";
import sendEmail from "../services/index.js";
import { usersModel } from "../DB/models/index.js";
import { Hash } from "./encryption/hash.js";
import { html } from "../services/template.js";

export const eventEmitter = new EventEmitter();

eventEmitter.on("confirmEmail", async (data) => {
  const { email } = data;

  // Generate otp
  const otp = customAlphabet("0123456789", 4)();

  // Hash otp
  const hash = await Hash({ key: otp });

  // Update otp in database
  await usersModel.updateOne(
    { email },
    { otpEmail: hash, otpEmailCreatedAt: Date.now(), failedAttempts: 0 }
  );

  // Email content
  const emailSent = await sendEmail({
    to: email,
    subject: "Confirm Email",
    html: html({ otp, message: "Email Confirmation" }),
  });

  if (!emailSent) {
    return nextTick(new Error("Failed to send email"));
  }
});

eventEmitter.on("confirmNewEmail", async (data) => {
  const { email, _id } = data;

  // Generate otp
  const otp = customAlphabet("0123456789", 4)();

  // Hash otp
  const hash = await Hash({ key: otp });

  // Update otp in database
  await usersModel.updateOne({ tempEmail: email, _id }, { otpNewEmail: hash });

  // Email content
  const emailSent = await sendEmail({
    to: email,
    subject: "Confirm new Email",
    html: html({ otp, message: "New Email Confirmation" }),
  });

  if (!emailSent) {
    return nextTick(new Error("Failed to send email"));
  }
});

eventEmitter.on("forgetPassword", async (data) => {
  const { email } = data;

  // Generate otp
  const otp = customAlphabet("0123456789", 4)();

  // Hash otp
  const hash = await Hash({ key: otp });

  // Update otp in database
  await usersModel.updateOne(
    { email },
    { otpPassword: hash, otpPasswordCreatedAt: Date.now(), failedAttempts: 0 }
  );

  // Email content
  const emailSent = await sendEmail({
    to: email,
    subject: "Forget Password",
    html: html({ otp, message: "Forget Password" }),
  });

  if (!emailSent) {
    return nextTick(new Error("Failed to send email"));
  }
});

eventEmitter.on("setTwoStepVerification", async (data) => {
  // Generate otp
  const otp = customAlphabet("0123456789", 4)();

  // Hash otp
  const hash = await Hash({ key: otp });

  // Update otp in database
  await usersModel.updateOne(
    { email: data },
    {
      otpTwoSteps: hash,
      otpTwoStepsCreatedAt: Date.now(),
    }
  );

  // Email content
  const emailSent = await sendEmail({
    to: data,
    subject: "Two steps verification",
    html: html({ otp, message: "Two steps verification code" }),
  });

  if (!emailSent) {
    return nextTick(new Error("Failed to send email"));
  }
});

eventEmitter.on(
  "viewProfile",
  async ({ viewer, viewedProfileId, viewsArray }) => {
    const { email } = await usersModel.findById({ _id: viewedProfileId });

    // Email content
    const emailSent = await sendEmail({
      to: email,
      subject: "Profile views",
      text: `${viewer} has viewed your account 5 times at these time periods: ${viewsArray}`,
    });

    if (!emailSent) {
      return nextTick(new Error("Failed to send email"));
    }
  }
);
