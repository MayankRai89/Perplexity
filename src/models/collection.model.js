import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PerplexityUsers",
      required: true,
    },
    threads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PerplexityChats",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const collectionModel = mongoose.model(
  "PerplexityCollection",
  collectionSchema,
);
export default collectionModel;
