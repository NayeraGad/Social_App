import { providerTypes, usersModel } from "../../DB/models/index.js";
import { decodedToken, tokenTypes } from "../../middlewares/auth.js";
import {
  asyncHandler,
  checkOtpExpiration,
  cloudinary,
  Compare,
  Encrypt,
  eventEmitter,
  generateToken,
  Hash,
} from "../../utilities/index.js";
import { OAuth2Client } from "google-auth-library";

// ************************signup**************************
export const signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, gender } = req.body;

  if (await usersModel.findOne({ email })) {
    return next(new Error("Email already exists", { cause: 409 }));
  }

  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: "social_app/users",
    }
  );

  //hash password
  const hashedPassword = await Hash({ key: password });

  // encrypt phone
  const cipherPhone = await Encrypt({ key: phone });

  // Create user
  const user = await usersModel.create({
    name,
    email,
    password: hashedPassword,
    phone: cipherPhone,
    gender,
    image: { secure_url, public_id },
  });

  // Send otp
  eventEmitter.emit("confirmEmail", { email });

  return res.status(201).json({ message: "done", user });
});

// ************************confirmEmail**************************
export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { email, code } = req.body;

  await checkOtpExpiration({ email, code, otpFor: "email" });

  // Create user
  await usersModel.updateOne(
    { email },
    {
      confirmed: true,
      $unset: {
        otpEmail: 0,
        otpEmailCreatedAt: 0,
        failedAttempts: 0,
        otpEmailExpiresAt: 0,
      },
    }
  );

  return res.status(200).json({ message: "done" });
});

// ************************resendCode**************************
export const resendEmailCode = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await usersModel.findOne({ email, confirmed: false });
  // Check if email does not exist or already confirmed
  if (!user) {
    return next(
      new Error("Email not found or already confirmed", {
        cause: 404,
      })
    );
  }

  // Check if the user is temporarily banned for 5 minutes
  if (Date.now() - user.otpEmailExpiresAt < 5 * 60 * 1000) {
    return next(
      new Error(`You are banned from entering otp.`, {
        cause: 403,
      })
    );
  }

  // Send otp
  eventEmitter.emit("confirmEmail", { email });

  return res.status(201).json({ message: "done" });
});

// ************************login**************************
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await usersModel.findOne({
    email,
    confirmed: true,
    provider: providerTypes.system,
  });
  // Check if email does not exist or already confirmed
  if (!user) {
    return next(
      new Error("Email not found or not confirmed yet", {
        cause: 404,
      })
    );
  }

  if (!(await Compare({ key: password, hashed: user.password }))) {
    return next(new Error("Incorrect password", { cause: 400 }));
  }

  // Send otp to 2 steps validation users
  if (user?.isTwoStepsActive) {
    eventEmitter.emit("setTwoStepVerification", email);
    return res.status(200).json({ message: "done, otp sent to email" });
  }

  // Generate tokens
  const refresh_Token = await generateToken({
    payload: { email, id: user._id },
    SIGNATURE:
      user.role === "user"
        ? process.env.SIGNATURE_REFRESH_USER
        : process.env.SIGNATURE_REFRESH_ADMIN,
    options: { expiresIn: "1d" },
  });
  const access_Token = await generateToken({
    payload: { email, id: user._id },
    SIGNATURE:
      user.role === "user"
        ? process.env.SIGNATURE_ACCESS_USER
        : process.env.SIGNATURE_ACCESS_ADMIN,

    options: { expiresIn: "2w" },
  });

  return res.status(200).json({
    message: "done",
    data: {
      access_Token,
      refresh_Token,
    },
  });
});

// ************************loginWithGmail**************************
export const loginWithGmail = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;

  const client = new OAuth2Client();
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  }
  const { email, email_verified, name, picture } = await verify();

  let user = await usersModel.findOne({ email });

  if (!user) {
    user = await usersModel.create({
      name,
      email,
      confirmed: email_verified,
      image: picture,
      provider: providerTypes.google,
    });
  }

  if (user.provider !== providerTypes.google) {
    return next(new Error("Please login within system"));
  }

  // Generate token
  const access_Token = await generateToken({
    payload: { email, id: user._id },
    SIGNATURE:
      user.role === "user"
        ? process.env.SIGNATURE_ACCESS_USER
        : process.env.SIGNATURE_ACCESS_ADMIN,
    options: { expiresIn: "1d" },
  });

  return res.status(200).json({
    message: "done",
    token: access_Token,
  });
});

// ************************setTwoStepVerification**************************
export const setTwoStepVerification = asyncHandler(async (req, res, next) => {
  if (req.user.provider === providerTypes.google) {
    return next(
      new Error(
        "cannot activate two steps verification if registered using Google",
        {
          cause: 409,
        }
      )
    );
  }

  if (req.user.isTwoStepsActive) {
    return next(
      new Error("2 steps verification is active already", {
        cause: 409,
      })
    );
  }

  eventEmitter.emit("setTwoStepVerification", req.user.email);

  return res.status(200).json({ message: "done" });
});

// ************************checkTwoStepVerification**************************
export const checkTwoStepVerification = asyncHandler(async (req, res, next) => {
  const { _id, otpTwoSteps, otpVerificationExpiresAt } = req.user;
  const { code } = req.body;

  if (!otpTwoSteps) {
    return next(
      new Error("otp not found", {
        cause: 404,
      })
    );
  }

  if (otpVerificationExpiresAt && otpVerificationExpiresAt > 5 * 60 * 1000) {
    return next(
      new Error("otp expired", {
        cause: 400,
      })
    );
  }

  if (!(await Compare({ key: code, hashed: otpTwoSteps }))) {
    return next(
      new Error("Invalid otp", {
        cause: 400,
      })
    );
  }

  await usersModel.findByIdAndUpdate(
    { _id },
    {
      isTwoStepsActive: true,
      $unset: { otpTwoSteps: 0, otpTwoStepsCreatedAt: 0 },
    }
  );

  return res.status(200).json({ message: "done" });
});

// ************************loginConfirmation**************************
export const loginConfirmation = asyncHandler(async (req, res, next) => {
  const { code, email } = req.body;

  const user = await usersModel.findOne({ email, isTwoStepsActive: true });

  if (!user.email || !user.isTwoStepsActive) {
    return next(
      new Error("user not found or two steps validation is not active", {
        cause: 400,
      })
    );
  }

  if (
    user.otpVerificationExpiresAt &&
    user.otpVerificationExpiresAt > 5 * 60 * 1000
  ) {
    return next(
      new Error("otp expired", {
        cause: 400,
      })
    );
  }

  if (!(await Compare({ key: code, hashed: user.otpTwoSteps }))) {
    return next(
      new Error("Invalid otp", {
        cause: 400,
      })
    );
  }

  await usersModel.updateOne(
    { email },
    {
      isTwoStepsActive: true,
      $unset: { otpTwoSteps: 0, otpTwoStepsCreatedAt: 0 },
    }
  );

  // Generate tokens
  const access_Token = await generateToken({
    payload: { email, id: user._id },
    SIGNATURE:
      user.role === "user"
        ? process.env.SIGNATURE_ACCESS_USER
        : process.env.SIGNATURE_ACCESS_ADMIN,
    options: { expiresIn: "1d" },
  });
  const refresh_Token = await generateToken({
    payload: { email, id: user._id },
    SIGNATURE:
      user.role === "user"
        ? process.env.SIGNATURE_REFRESH_USER
        : process.env.SIGNATURE_REFRESH_ADMIN,
    options: { expiresIn: "2w" },
  });

  return res.status(200).json({
    message: "done",
    token: {
      access_Token,
      refresh_Token,
    },
  });
});

// ************************refreshToken**************************
export const refreshToken = asyncHandler(async (req, res, next) => {
  const { authorization } = req.body;

  const user = await decodedToken({
    authorization,
    tokenType: tokenTypes.refresh,
    next,
  });

  // Check if the refresh token was issued after the most recent password update time.
  if (
    user.changePasswordAt &&
    parseInt(user?.changePasswordAt.getTime() / 1000) > decodedToken.iat
  ) {
    return next(new Error("Token expired", { cause: 401 }));
  }

  // Generate tokens
  const refresh_Token = await generateToken({
    payload: { email: user.email, id: user._id },
    SIGNATURE:
      user.role === "user"
        ? process.env.SIGNATURE_REFRESH_USER
        : process.env.SIGNATURE_REFRESH_ADMIN,
    options: { expiresIn: "1d" },
  });

  return res.status(200).json({
    message: "done",
    token: {
      refresh_Token,
    },
  });
});

// ************************forgetPassword**************************
export const forgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await usersModel.findOne({ email, isDeleted: false });
  // Check if email does not exist or already confirmed
  if (!user) {
    return next(
      new Error("Email not found ", {
        cause: 404,
      })
    );
  }

  // Check if the user is temporarily banned for 5 minutes
  if (Date.now() - user?.otpPasswordExpiresAt < 5 * 60 * 1000) {
    return next(
      new Error(`You are banned from entering otp.`, {
        cause: 403,
      })
    );
  }

  // Send otp
  eventEmitter.emit("forgetPassword", { email });

  return res.status(201).json({ message: "done" });
});

// ************************resetPassword**************************
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, code, newPassword } = req.body;

  await checkOtpExpiration({ email, code, otpFor: "password" });

  const hashedPassword = await Hash({ key: newPassword });

  // Create user
  await usersModel.updateOne(
    { email },
    {
      password: hashedPassword,
      changePasswordAt: Date.now(),
      $unset: {
        otpPassword: 0,
        otpPasswordCreatedAt: 0,
        failedPasswordAttempts: 0,
        otpPasswordExpiresAt: 0,
      },
    }
  );

  return res.status(200).json({ message: "done" });
});
