import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PerplexityUsers",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PerplexitySpace",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const chatModel = mongoose.model("PerplexityChats", chatSchema);
export default chatModel;
