import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
  getThreads,
  getThreadMessages,
  deleteThread,
  renameThread,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.use(authUser);

router.get("/threads", getThreads);
router.get("/threads/:chatId", getThreadMessages);
router.delete("/threads/:chatId", deleteThread);
router.patch("/threads/:chatId", renameThread);

export default router;
