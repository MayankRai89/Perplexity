import mongoose from "mongoose";

const spaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PerplexityUsers",
      required: true,
    },
    documents: [
      {
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        mimeType: { type: String },
        chunkCount: { type: Number, default: 0 },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const spaceModel = mongoose.model("PerplexitySpace", spaceSchema);
export default spaceModel;
