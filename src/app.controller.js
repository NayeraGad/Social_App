import connectionDB from "./DB/connectionDB.js";
import { authRouter, chatRouter, postsRouter, usersRouter } from "./modules/index.js";
import { AppError, globalErrorHandler } from "./utilities/error.js";
import cors from "cors";

const bootstrap = (app, express) => {
  app.use(cors());

  connectionDB();

  app.use(express.json());

  app.get("/", (req, res, next) => {
    return res.status(200).json("Welcome to social app");
  });

  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.use("/posts", postsRouter);
  app.use("/chat", chatRouter);

  app.use("*", (req, res, next) => {
    return next(new AppError(`invalid url ${req.originalUrl}`, 404));
  });

  app.use(globalErrorHandler);
};

export default bootstrap;
