import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import discoverModel from "../models/discover.model.js";
import { generateImagesFromPrompt } from "../config/services/imagen.service.js";

const router = express.Router();

router.use(authUser);

router.get("/", async (req, res) => {
  try {
    const feed = await discoverModel
      .find({})
      .populate("user", "Username email")
      .sort({ createdAt: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      feed,
    });
  } catch (error) {
    console.error("Error in GET /api/discover:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching discover feed.",
    });
  }
});

router.post("/generate", async (req, res) => {
  try {
    const { prompt, count, aspectRatio } = req.body;
    const userId = req.user.id;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required.",
      });
    }

    const imageCount = parseInt(count) || 4;
    if (imageCount < 1 || imageCount > 4) {
      return res.status(400).json({
        success: false,
        message: "Image count must be between 1 and 4.",
      });
    }

    const ratio = aspectRatio || "1:1";

    console.log(
      `[Discover API] Generating ${imageCount} images (ratio: ${ratio}) for user ${userId} with prompt: "${prompt}"`,
    );

    const images = await generateImagesFromPrompt(prompt, imageCount, ratio);

    const newPost = await discoverModel.create({
      user: userId,
      prompt: prompt.trim(),
      images,
      aspectRatio: ratio,
    });

    const populatedPost = await newPost.populate("user", "Username email");

    return res.status(201).json({
      success: true,
      post: populatedPost,
    });
  } catch (error) {
    console.error("Error in POST /api/discover/generate:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate images. Please try again.",
    });
  }
});

export default router;
