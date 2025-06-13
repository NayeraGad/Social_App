import Joi from "joi";
import { generalRules } from "../../utilities/generalRules.js";

export const createCommentSchema = {
  body: Joi.object({
    content: Joi.string().min(3).required(),
  }),
  params: Joi.object({
    postId: generalRules.objectId.required(),
  }),
  files: Joi.array().items(generalRules.file),
  headers: generalRules.headers
    .messages({ "any.required": "token is required" })
    .required(),
};

export const updateCommentSchema = {
  body: Joi.object({
    content: Joi.string().min(3),
  }),
  files: Joi.array().items(generalRules.file),
  params: Joi.object({
    postId: generalRules.objectId.required(),
    commentId: generalRules.objectId.required(),
  }),
  headers: generalRules.headers
    .messages({ "any.required": "token is required" })
    .required(),
};

export const idAndTokenSchema = {
  params: Joi.object({
    postId: generalRules.objectId.required(),
    commentId: generalRules.objectId.required(),
  }),
  headers: generalRules.headers
    .messages({ "any.required": "token is required" })
    .required(),
};


