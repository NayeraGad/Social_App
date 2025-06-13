import Joi from "joi";
import { Types } from "mongoose";

export const customId = (value, helper) => {
  let data = Types.ObjectId.isValid(value);

  return data ? value : helper.message("id is not valid");
};

export const generalRules = {
  objectId: Joi.string().custom(customId),
  email: Joi.string().email({
    tlds: { allow: ["com", "net"] },
    minDomainSegments: 2,
    maxDomainSegments: 4,
  }),
  password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/),
  code: Joi.string().length(4),
  file: Joi.object({
    size: Joi.number().positive(),
    path: Joi.string(),
    filename: Joi.string(),
    destination: Joi.string(),
    mimetype: Joi.string(),
    encoding: Joi.string(),
    originalname: Joi.string(),
    fieldname: Joi.string(),
  }),
  headers: Joi.object({
    "cache-control": Joi.string(),
    "postman-token": Joi.string(),
    "content-type": Joi.string(),
    "content-length": Joi.string(),
    host: Joi.string(),
    "user-agent": Joi.string(),
    accept: Joi.string(),
    "accept-encoding": Joi.string(),
    connection: Joi.string(),
    authorization: Joi.string().required(),
  }),
};
