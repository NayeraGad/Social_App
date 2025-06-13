import Joi from "joi";
import { generalRules } from "../../utilities/generalRules.js";
import { genderEnum } from "../../DB/models/usersModels.js";

export const signupSchema = {
  body: Joi.object({
    name: Joi.string().alphanum().min(3).max(30),
    email: generalRules.email,
    password: generalRules.password,
    cPassword: Joi.string().valid(Joi.ref("password")),
    gender: Joi.string().valid(genderEnum.male, genderEnum.female),
    phone: Joi.string().regex(/^01[0125][0-9]{8}$/),
  })
    .messages({ "any.required": "{#key} is required." })
    .options({ presence: "required" }),
  file: generalRules.file
    .messages({ "any.required": "image is required" })
    .required(),
};

export const confirmEmailSchema = {
  body: Joi.object({
    email: generalRules.email,
    code: generalRules.code,
  })
    .messages({ "any.required": "{#key} is required." })
    .options({ presence: "required" }),
};

export const emailSchema = {
  body: Joi.object({
    email: generalRules.email.required(),
  }),
};

export const loginSchema = {
  body: Joi.object({
    email: generalRules.email,
    password: generalRules.password,
  })
    .messages({ "any.required": "{#key} is required." })
    .options({ presence: "required" }),
};

export const refreshTokenSchema = {
  body: Joi.object({
    authorization: Joi.string(),
  }).options({ presence: "required" }),
};

export const resetPasswordSchema = {
  body: Joi.object({
    email: generalRules.email,
    code: generalRules.code,
    newPassword: generalRules.password,
    cPassword: generalRules.password.valid(Joi.ref("newPassword")),
  })
    .messages({ "any.required": "{#key} is required." })
    .options({ presence: "required" }),
};

export const setTwoStepVerificationSchema = {
  headers: generalRules.headers.required(),
};

export const checkTwoStepVerificationSchema = {
  body: Joi.object({
    code: generalRules.code,
  }).options({ presence: "required" }),
  headers: generalRules.headers.required(),
};

export const loginConfirmationSchema = {
  body: Joi.object({
    email: generalRules.email.required(),
    code: generalRules.code.required(),
  }),
};