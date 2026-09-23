import spaceModel from "../models/space.model.js";
import {
  processDocument,
  deleteDocumentVectors,
  deleteSpaceVectors,
  retrieveContext,
  buildRagSystemPrompt,
} from "../config/services/rag.service.js";
import aiModel from "../config/services/ai.sevice.js";
import messageModel from "../models/message.model.js";
import chatModel from "../models/chat.model.js";
import { Types } from "mongoose";

// ─── Space CRUD ───────────────────────────────────────────────────────────────

export async function listSpaces(req, res) {
  try {
    const spaces = await spaceModel
      .find({ user: req.user.id })
      .sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, spaces });
  } catch (error) {
    console.error("Error listing spaces:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

export async function createSpace(req, res) {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Space name is required." });
    }
    const space = await spaceModel.create({
      name: name.trim(),
      description: description?.trim() || "",
      user: req.user.id,
      documents: [],
    });
    return res.status(201).json({ success: true, space });
  } catch (error) {
    console.error("Error creating space:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

export async function getSpace(req, res) {
  try {
    const space = await spaceModel.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!space) {
      return res.status(404).json({ success: false, message: "Space not found." });
    }
    return res.status(200).json({ success: true, space });
  } catch (error) {
    console.error("Error fetching space:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

export async function updateSpace(req, res) {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Space name is required." });
    }
    const space = await spaceModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name: name.trim(), description: description?.trim() || "" },
      { new: true }
    );
    if (!space) {
      return res.status(404).json({ success: false, message: "Space not found." });
    }
    return res.status(200).json({ success: true, space });
  } catch (error) {
    console.error("Error updating space:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

export async function deleteSpace(req, res) {
  try {
    const space = await spaceModel.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!space) {
      return res.status(404).json({ success: false, message: "Space not found." });
    }
    // Delete all Pinecone vectors for this space
    await deleteSpaceVectors(req.params.id);
    return res.status(200).json({ success: true, message: "Space deleted." });
  } catch (error) {
    console.error("Error deleting space:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// ─── Document Upload ──────────────────────────────────────────────────────────

export async function uploadDocument(req, res) {
  try {
    const space = await spaceModel.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!space) {
      return res.status(404).json({ success: false, message: "Space not found." });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const { originalname, mimetype, buffer } = req.file;
    const docId = new Types.ObjectId().toString();

    // Process & index document into Pinecone
    const chunkCount = await processDocument(
      space._id.toString(),
      docId,
      originalname,
      buffer,
      mimetype
    );

    // Save document metadata to Space
    space.documents.push({
      _id: docId,
      filename: originalname,
      originalName: originalname,
      mimeType: mimetype,
      chunkCount,
    });
    await space.save();

    return res.status(201).json({
      success: true,
      message: `Document "${originalname}" indexed with ${chunkCount} chunks.`,
      space,
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process document.",
    });
  }
}

// ─── Document Delete ──────────────────────────────────────────────────────────

export async function deleteDocument(req, res) {
  try {
    const space = await spaceModel.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!space) {
      return res.status(404).json({ success: false, message: "Space not found." });
    }

    const { docId } = req.params;
    const docIndex = space.documents.findIndex((d) => d._id.toString() === docId);
    if (docIndex === -1) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    // Remove from Pinecone
    await deleteDocumentVectors(space._id.toString(), docId);

    // Remove from space
    space.documents.splice(docIndex, 1);
    await space.save();

    return res.status(200).json({ success: true, message: "Document deleted.", space });
  } catch (error) {
    console.error("Error deleting document:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// ─── RAG Chat ─────────────────────────────────────────────────────────────────

export async function chatWithSpace(req, res) {
  try {
    const { content, chatId } = req.body;
    const spaceId = req.params.id;
    const userId = req.user.id;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: "Message content is required." });
    }

    const space = await spaceModel.findOne({ _id: spaceId, user: userId });
    if (!space) {
      return res.status(404).json({ success: false, message: "Space not found." });
    }

    // 1. Retrieve relevant context from Pinecone
    const contextChunks = await retrieveContext(spaceId, content.trim(), 5);

    // 2. Build or find chat thread
    let activeChatId = chatId;
    let isNewChat = false;

    if (!activeChatId) {
      isNewChat = true;
      const newChat = await chatModel.create({
        user: userId,
        title: content.trim().substring(0, 50) || "Space Chat",
        space: spaceId,
      });
      activeChatId = newChat._id.toString();
    }

    // 3. Save user message
    await messageModel.create({
      chat: activeChatId,
      content: content.trim(),
      role: "user",
    });

    // 4. Build conversation history (last 10 messages)
    const history = await messageModel
      .find({ chat: activeChatId })
      .sort({ createdAt: 1 })
      .limit(10);

    // 5. Build prompt with RAG context
    const systemPrompt = buildRagSystemPrompt(content, contextChunks);
    const promptMessages = [
      ["system", systemPrompt],
      ...history.map((msg) => [msg.role === "user" ? "human" : "ai", msg.content]),
    ];

    // 6. Invoke Gemini
    const aiResponse = await aiModel.invoke(promptMessages);
    const aiText = aiResponse.content;

    // 7. Save AI response
    const aiMsg = await messageModel.create({
      chat: activeChatId,
      content: aiText,
      role: "ai",
    });

    // 8. Auto-generate title for new chats
    if (isNewChat) {
      try {
        const titlePrompt = [
          ["system", "Generate a concise 4-7 word title for this conversation. No quotes, no punctuation at end."],
          ["human", `User: ${content.substring(0, 200)}\nAI: ${aiText.substring(0, 200)}`],
        ];
        const titleRes = await aiModel.invoke(titlePrompt);
        const title = titleRes.content.trim().substring(0, 60);
        if (title) {
          await chatModel.findByIdAndUpdate(activeChatId, { title });
        }
      } catch (_) { /* title generation is non-critical */ }
    }

    return res.status(200).json({
      success: true,
      chatId: activeChatId,
      isNewChat,
      message: {
        id: aiMsg._id,
        content: aiText,
        role: "ai",
        createdAt: aiMsg.createdAt,
      },
      sources: contextChunks.map((c) => ({
        filename: c.filename,
        text: c.text.substring(0, 300),
        score: c.score,
      })),
    });
  } catch (error) {
    console.error("Error in RAG chat:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process RAG chat.",
    });
  }
}

// ─── Space Chat History ───────────────────────────────────────────────────────

export async function getSpaceChatHistory(req, res) {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await chatModel.findOne({ _id: chatId, user: userId });
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found." });
    }

    const messages = await messageModel
      .find({ chat: chatId })
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, chatTitle: chat.title, messages });
  } catch (error) {
    console.error("Error fetching space chat history:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}
