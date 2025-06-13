import Joi from "joi";
import { generalRules } from "../../utilities/generalRules.js";

export const createPostSchema = {
  body: Joi.object({
    content: Joi.string().min(3).required(),
  }),
  files: Joi.array().items(generalRules.file),
  headers: generalRules.headers
    .messages({ "any.required": "token is required" })
    .required(),
};

export const updatePostSchema = {
  body: Joi.object({
    content: Joi.string().min(3),
  }),
  files: Joi.array().items(generalRules.file),
  headers: generalRules.headers
    .messages({ "any.required": "token is required" })
    .required(),
};

export const idAndTokenSchema = {
  params: Joi.object({
    id: generalRules.objectId
      .messages({ "any.required": "post id is required" })
      .required(),
  }),
  headers: generalRules.headers
    .messages({ "any.required": "token is required" })
    .required(),
};

export const tokenSchema = {
  headers: generalRules.headers
    .messages({ "any.required": "token is required" })
    .required(),
};
