import { Server } from "socket.io";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import aiModel from "./services/ai.sevice.js";

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

    // Handle user sending a message
    socket.on("userMessage", async ({ chatId, userId, content }) => {
      try {
        console.log(`[Socket] userMessage received. chatId: ${chatId}, userId: ${userId}, content: "${content}"`);
        let activeChatId = chatId;

        // If no chatId is provided, create a new Chat session
        if (!activeChatId) {
          const newChat = await chatModel.create({
            user: userId,
            title: content.substring(0, 30) || "New Chat",
          });
          activeChatId = newChat._id.toString();
          socket.join(activeChatId);
          console.log(`[Socket] Created new Chat thread: ${activeChatId}`);
          // Let the client know a new chat session was created
          socket.emit("chatCreated", { chatId: activeChatId });
        }

        // Save the user's message
        const userMsg = await messageModel.create({
          chat: activeChatId,
          content,
          role: "user",
        });
        console.log(`[Socket] Saved user message. Message ID: ${userMsg._id}`);

        // Emit the saved user message back to the client
        socket.emit("messageSaved", {
          chatId: activeChatId,
          message: {
            id: userMsg._id,
            content: userMsg.content,
            role: "user",
            createdAt: userMsg.createdAt,
          },
        });

        // Retrieve chat history including the new message for context
        const history = await messageModel.find({ chat: activeChatId })
          .sort({ createdAt: 1 })
          .limit(20);
        
        console.log(`[Socket] Found ${history.length} messages in chat history for thread: ${activeChatId}`);

        const promptMessages = [
          ["system", "You are Perplexity, a helpful and precise AI search assistant. Answer concisely and use clear formatting (markdown)."],
          ...history.map(msg => {
            const roleName = msg.role === "user" ? "human" : "ai";
            console.log(`  -> Context [${roleName}]: "${msg.content.substring(0, 60)}..."`);
            return [roleName, msg.content];
          })
        ];

        // Call Gemini AI model to get response
        console.log(`[Socket] Invoking Gemini model...`);
        const aiResponse = await aiModel.invoke(promptMessages);
        const aiText = aiResponse.content;
        console.log(`[Socket] Gemini responded: "${aiText.substring(0, 60)}..."`);

        // Save the AI's response
        const aiMsg = await messageModel.create({
          chat: activeChatId,
          content: aiText,
          role: "ai",
        });
        console.log(`[Socket] Saved AI response. Message ID: ${aiMsg._id}`);

        // Emit AI response back to the client
        socket.emit("aiResponse", {
          chatId: activeChatId,
          message: {
            id: aiMsg._id,
            content: aiMsg.content,
            role: "ai",
            createdAt: aiMsg.createdAt,
          },
        });
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
