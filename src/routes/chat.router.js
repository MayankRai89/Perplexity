import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import { getThreads, getThreadMessages, deleteThread } from "../controllers/chat.controller.js";

const router = express.Router();

// All chat history routes require user authentication
router.use(authUser);

router.get("/threads", getThreads);
router.get("/threads/:chatId", getThreadMessages);
router.delete("/threads/:chatId", deleteThread);

export default router;
