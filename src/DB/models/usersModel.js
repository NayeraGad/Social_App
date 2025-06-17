import mongoose from "mongoose";

export const genderEnum = {
  male: "male",
  female: "female",
};

export const roleTypes = {
  user: "user",
  admin: "admin",
};

export const providerTypes = {
  system: "system",
  google: "google",
};

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
      maxLength: 30,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w]{2,4}/],
    },
    password: {
      type: String,
      trim: true,
      match: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/],
    },
    phone: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: Object.values(genderEnum),
      default: genderEnum.male,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: roleTypes,
      default: roleTypes.user,
    },
    image: {
      secure_url: String,
      public_id: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: String,
      enum: providerTypes,
      default: providerTypes.system,
    },

    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],

    otpEmail: String,
    otpEmailCreatedAt: Date,
    failedAttempts: {
      type: Number,
    },
    otpEmailExpiresAt: Date,

    changePasswordAt: Date,
    otpPassword: String,
    otpPasswordCreatedAt: Date,
    failedPasswordAttempts: {
      type: Number,
    },
    otpPasswordExpiresAt: Date,

    isTwoStepsActive: {
      type: Boolean,
    },
    otpTwoSteps: String,
    otpTwoStepsCreatedAt: Date,

    blockedUsers: [],
    tempEmail: String,
    otpNewEmail: String,
  },
  { timeStamp: true }
);

export const usersModel =
  mongoose.models.User || mongoose.model("User", userSchema);

export const connectionUser = new Map();
