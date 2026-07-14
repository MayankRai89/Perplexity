import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import collectionModel from "../models/collection.model.js";

const router = express.Router();

router.use(authUser);

router.get("/", async (req, res) => {
  try {
    const collections = await collectionModel
      .find({ user: req.user.id })
      .populate({
        path: "threads",
        options: { sort: { updatedAt: -1 } },
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      collections,
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching collections.",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Collection name is required.",
      });
    }

    const collection = await collectionModel.create({
      name: name.trim(),
      description: description?.trim() || "",
      user: req.user.id,
      threads: [],
    });

    return res.status(201).json({
      success: true,
      collection,
    });
  } catch (error) {
    console.error("Error creating collection:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating collection.",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, description } = req.body;
    const collectionId = req.params.id;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Collection name is required.",
      });
    }

    const collection = await collectionModel
      .findOneAndUpdate(
        { _id: collectionId, user: req.user.id },
        { name: name.trim(), description: description?.trim() || "" },
        { new: true },
      )
      .populate("threads");

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found or access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      collection,
    });
  } catch (error) {
    console.error("Error updating collection:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating collection.",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const collectionId = req.params.id;
    const collection = await collectionModel.findOneAndDelete({
      _id: collectionId,
      user: req.user.id,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found or access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Collection deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting collection.",
    });
  }
});

router.post("/:id/threads", async (req, res) => {
  try {
    const { threadId, action } = req.body;
    const collectionId = req.params.id;

    if (!threadId) {
      return res.status(400).json({
        success: false,
        message: "Thread ID is required.",
      });
    }

    if (!["add", "remove"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be 'add' or 'remove'.",
      });
    }

    const collection = await collectionModel.findOne({
      _id: collectionId,
      user: req.user.id,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found or access denied.",
      });
    }

    const hasThread = collection.threads.includes(threadId);

    if (action === "add") {
      if (hasThread) {
        return res.status(400).json({
          success: false,
          message: "Thread is already in this collection.",
        });
      }
      collection.threads.push(threadId);
    } else if (action === "remove") {
      if (!hasThread) {
        return res.status(400).json({
          success: false,
          message: "Thread is not in this collection.",
        });
      }
      collection.threads = collection.threads.filter(
        (id) => id.toString() !== threadId,
      );
    }

    await collection.save();
    const updatedCollection = await collection.populate("threads");

    return res.status(200).json({
      success: true,
      collection: updatedCollection,
    });
  } catch (error) {
    console.error("Error editing collection threads:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while modifying collection threads.",
    });
  }
});

export default router;
