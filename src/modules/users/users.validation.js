import Joi from "joi";
import { generalRules } from "../../utilities/generalRules.js";
import { genderEnum } from "../../DB/models/usersModels.js";

export const updateProfileSchema = {
  body: Joi.object({
    name: Joi.string().alphanum().min(3).max(30),
    gender: Joi.string().valid(genderEnum.male, genderEnum.female),
    phone: Joi.string().regex(/^01[0125][0-9]{8}$/),
  }),
  file: generalRules.file,
  headers: generalRules.headers
    .messages({ "any.required": "token is required" })
    .required(),
};

export const updatePasswordSchema = {
  body: Joi.object({
    oldPassword: generalRules.password,
    newPassword: generalRules.password,
    cPassword: Joi.string().valid(Joi.ref("newPassword")),
  })
    .messages({ "any.required": "{#key} is required." })
    .options({ presence: "required" }),
  headers: generalRules.headers
    .messages({ "any.required": "token is required" })
    .required(),
};

export const idTokenSchema = {
  params: Joi.object({
    id: generalRules.objectId.required(),
  }),
  headers: generalRules.headers
    .messages({ "any.required": "token is required" })
    .required(),
};

export const emailAndAuth = {
  body: Joi.object({
    email: generalRules.email.required(),
  }),
  headers: generalRules.headers
    .messages({ "any.required": "token is required" })
    .required(),
};

export const updateEmail = {
  body: Joi.object({
    oldCode: generalRules.code.required(),
    newCode: generalRules.code.required(),
  }),
  headers: generalRules.headers
    .messages({ "any.required": "token is required" })
    .required(),
};
