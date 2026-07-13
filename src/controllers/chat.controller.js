import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";

export async function getThreads(req, res) {
  try {
    const userId = req.user.id;
    const threads = await chatModel.find({ user: userId }).sort({ updatedAt: -1 });
    
    return res.status(200).json({
      success: true,
      threads,
    });
  } catch (error) {
    console.error("Error in getThreads:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching threads.",
    });
  }
}

export async function getThreadMessages(req, res) {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Optional safety check: Verify chat belongs to this user
    const chat = await chatModel.findOne({ _id: chatId, user: userId });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat thread not found or access denied.",
      });
    }

    const messages = await messageModel.find({ chat: chatId }).sort({ createdAt: 1 });
    
    return res.status(200).json({
      success: true,
      chatTitle: chat.title,
      messages,
    });
  } catch (error) {
    console.error("Error in getThreadMessages:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching messages.",
    });
  }
}

export async function deleteThread(req, res) {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await chatModel.findOneAndDelete({ _id: chatId, user: userId });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat thread not found or access denied.",
      });
    }

    // Delete all associated messages
    await messageModel.deleteMany({ chat: chatId });

    return res.status(200).json({
      success: true,
      message: "Chat thread and messages deleted successfully.",
    });
  } catch (error) {
    console.error("Error in deleteThread:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting thread.",
    });
  }
}
