import { Router } from "express";
import { authentication } from "../../middlewares/index.js";
import * as CS from "./services/chat.service.js";

const chatRouter = Router();

chatRouter.get("/:userId", authentication, CS.getChat);

export default chatRouter;
