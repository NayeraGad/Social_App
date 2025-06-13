import { usersModel } from "../DB/models/index.js";
import { asyncHandler, verifyToken } from "../utilities/index.js";

export const tokenTypes = {
  access: "access",
  refresh: "refresh",
};

export const decodedToken = async ({ authorization, tokenType, next }) => {
  const [prefix, token] = authorization?.split(" ") || [];

  if (!prefix || !token) {
    return next(new Error("Token not found", { cause: 401 }));
  }

  let ACCESS_SIGNATURE = undefined;
  let REFRESH_SIGNATURE = undefined;

  // Set SIGNATURE based on roles
  if (prefix === process.env.PREFIX_ADMIN) {
    ACCESS_SIGNATURE = process.env.SIGNATURE_ACCESS_ADMIN;
    REFRESH_SIGNATURE = process.env.SIGNATURE_REFRESH_ADMIN;
  } else if (prefix === process.env.PREFIX_USER) {
    ACCESS_SIGNATURE = process.env.SIGNATURE_ACCESS_USER;
    REFRESH_SIGNATURE = process.env.SIGNATURE_REFRESH_USER;
  } else {
    return next(new Error("Invalid token prefix", { cause: 401 }));
  }

  const decodedToken = await verifyToken({
    token,
    SIGNATURE:
      tokenType == tokenTypes.access ? ACCESS_SIGNATURE : REFRESH_SIGNATURE,
  });

  if (!decodedToken?.id) {
    return next(new Error("Invalid token payload", { cause: 403 }));
  }

  const user = await usersModel.findOne({
    _id: decodedToken.id,
    isDeleted: false,
  });

  if (!user) {
    return next(new Error("User not found or deleted", { cause: 404 }));
  }

  if (
    user.changePasswordAt &&
    parseInt(user?.changePasswordAt.getTime() / 1000) > decodedToken.iat
  ) {
    return next(new Error("Token expired", { cause: 401 }));
  }

  if (user?.isDeleted) {
    return next(new Error("User is deleted", { cause: 401 }));
  }

  return user;
};

export const authentication = asyncHandler(async (req, res, next) => {
  const { authorization } = req.headers;

  const user = await decodedToken({
    authorization,
    tokenType: tokenTypes.access,
    next,
  });

  req.user = user;
  next();
});

export const authorization = (accessRoles = []) => {
  return asyncHandler((req, res, next) => {
    if (!req.user || !accessRoles.includes(req.user.role)) {
      return next(new Error("Access denied"), { cause: 403 });
    }

    return next();
  });
};

export const authSocket = async ({ socket }) => {
  const [prefix, token] = socket?.handshake?.auth?.authorization?.split(" ");

  if (!prefix || !token) {
    return { message: "Token not found", statusCode: 401 };
  }

  let ACCESS_SIGNATURE = undefined;

  if (prefix === process.env.PREFIX_ADMIN) {
    ACCESS_SIGNATURE = process.env.SIGNATURE_ACCESS_ADMIN;
  } else if (prefix === process.env.PREFIX_USER) {
    ACCESS_SIGNATURE = process.env.SIGNATURE_ACCESS_USER;
  } else {
    return { message: "Invalid token prefix", statusCode: 401 };
  }

  const decodedToken = await verifyToken({
    token,
    SIGNATURE: ACCESS_SIGNATURE,
  });

  if (!decodedToken?.id) {
    return { message: "Invalid token payload", statusCode: 403 };
  }

  const user = await usersModel.findOne({
    _id: decodedToken.id,
    isDeleted: false,
  });

  if (!user) {
    return { message: "User not found or deleted", statusCode: 404 };
  }

  if (
    user.changePasswordAt &&
    parseInt(user?.changePasswordAt.getTime() / 1000) > decodedToken.iat
  ) {
    return { message: "Token expired", statusCode: 401 };
  }

  if (user?.isDeleted) {
    return { message: "User is deleted", statusCode: 401 };
  }

  return { user, statusCode: 200 };
};
