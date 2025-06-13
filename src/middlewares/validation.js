import { AppError } from "../utilities/error.js";

export const validation = (schema) => {
  return async (req, res, next) => {
    let resultError = [];

    for (const key of Object.keys(schema)) {
      const result = schema[key].validate(req[key], {
        abortEarly: false,
      });

      if (result?.error) {
        resultError.push({ [key]: result.error.details });
      }
    }

    if (resultError.length) {
      return next(new AppError(resultError, 400))
    }

    next();
  };
};
