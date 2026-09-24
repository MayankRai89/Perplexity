import express from "express";
import multer from "multer";
import { authUser } from "../middlewares/auth.middleware.js";
import {
  listSpaces,
  createSpace,
  getSpace,
  updateSpace,
  deleteSpace,
  uploadDocument,
  deleteDocument,
  chatWithSpace,
  getSpaceChatHistory,
} from "../controllers/rag.controller.js";

const router = express.Router();

// Multer: store files in memory, accept PDF and text only, max 20 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "text/csv",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, TXT, MD, and CSV files are allowed."), false);
    }
  },
});

router.use(authUser);

// ─── Space routes ─────────────────────────────────────────────────────────────
router.get("/", listSpaces);
router.post("/", createSpace);
router.get("/:id", getSpace);
router.put("/:id", updateSpace);
router.delete("/:id", deleteSpace);

// ─── Document routes ──────────────────────────────────────────────────────────
router.post("/:id/upload", upload.single("file"), uploadDocument);
router.delete("/:id/documents/:docId", deleteDocument);

// ─── RAG Chat routes ──────────────────────────────────────────────────────────
router.post("/:id/chat", chatWithSpace);
router.get("/:id/chat/:chatId/messages", getSpaceChatHistory);

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

export default router;
