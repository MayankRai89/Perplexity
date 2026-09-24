import mongoose from "mongoose";

const discoverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PerplexityUsers",
      required: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    aspectRatio: {
      type: String,
      default: "1:1",
    },
  },
  {
    timestamps: true,
  },
);

const discoverModel = mongoose.model("PerplexityDiscover", discoverSchema);
export default discoverModel;
