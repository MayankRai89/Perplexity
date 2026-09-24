import { Server } from "socket.io";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import aiModel from "./services/ai.sevice.js";

async function generateChatTitle(userMessage, aiReply) {
  try {
    const prompt = [
      [
        "system",
        "You are a title generator. Given a user question and an AI answer, " +
          "respond with ONLY a concise title of 4-7 words that captures the topic. " +
          "No punctuation at the end. No quotes. No extra text.",
      ],
      [
        "human",
        `User: ${userMessage.substring(0, 300)}\nAI: ${aiReply.substring(0, 300)}`,
      ],
    ];
    const result = await aiModel.invoke(prompt);
    const title = result.content
      .trim()
      .replace(/^["']|["']$/g, "")
      .substring(0, 60);
    return title || null;
  } catch {
    return null;
  }
}

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Join a specific chat room
    socket.on("joinChat", ({ chatId }) => {
      if (chatId) {
        socket.join(chatId);
        console.log(`Socket ${socket.id} joined chat: ${chatId}`);
      }
    });

    socket.on("userMessage", async ({ chatId, userId, content }) => {
      try {
        console.log(
          `[Socket] userMessage received. chatId: ${chatId}, userId: ${userId}, content: "${content}"`,
        );
        let activeChatId = chatId;
        let isNewChat = false;

        if (!activeChatId) {
          isNewChat = true;
          const newChat = await chatModel.create({
            user: userId,
            title: content.substring(0, 40) || "New Chat",
          });
          activeChatId = newChat._id.toString();
          socket.join(activeChatId);
          console.log(`[Socket] Created new Chat thread: ${activeChatId}`);

          socket.emit("chatCreated", { chatId: activeChatId });
        }

        const userMsg = await messageModel.create({
          chat: activeChatId,
          content,
          role: "user",
        });
        console.log(`[Socket] Saved user message. Message ID: ${userMsg._id}`);

        socket.emit("messageSaved", {
          chatId: activeChatId,
          message: {
            id: userMsg._id,
            content: userMsg.content,
            role: "user",
            createdAt: userMsg.createdAt,
          },
        });

        const history = await messageModel
          .find({ chat: activeChatId })
          .sort({ createdAt: 1 })
          .limit(20);

        console.log(
          `[Socket] Found ${history.length} messages in chat history for thread: ${activeChatId}`,
        );

        const promptMessages = [
          [
            "system",
            "You are Perplexity, a helpful and precise AI search assistant. Answer concisely and use clear formatting (markdown).",
          ],
          ...history.map((msg) => {
            const roleName = msg.role === "user" ? "human" : "ai";
            return [roleName, msg.content];
          }),
        ];

        console.log(`[Socket] Invoking Gemini model...`);
        const aiResponse = await aiModel.invoke(promptMessages);
        const aiText = aiResponse.content;
        console.log(
          `[Socket] Gemini responded: "${aiText.substring(0, 60)}..."`,
        );

        const aiMsg = await messageModel.create({
          chat: activeChatId,
          content: aiText,
          role: "ai",
        });
        console.log(`[Socket] Saved AI response. Message ID: ${aiMsg._id}`);

        socket.emit("aiResponse", {
          chatId: activeChatId,
          message: {
            id: aiMsg._id,
            content: aiMsg.content,
            role: "ai",
            createdAt: aiMsg.createdAt,
          },
        });

        if (isNewChat) {
          generateChatTitle(content, aiText).then(async (title) => {
            if (!title) return;
            try {
              await chatModel.findByIdAndUpdate(activeChatId, { title });

              io.to(activeChatId).emit("titleUpdated", {
                chatId: activeChatId,
                title,
              });
              console.log(
                `[Socket] Title generated for ${activeChatId}: "${title}"`,
              );
            } catch (err) {
              console.error("[Socket] Failed to save generated title:", err);
            }
          });
        }
      } catch (err) {
        console.error("Error handling socket message:", err);
        socket.emit("error", { message: "Failed to process message." });
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};
