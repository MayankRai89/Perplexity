import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import sendMail from "../../services/mail.service.js";

export async function register(req, res) {
  try {
    const { email, password, username } = req.body;
    const user = await userModel.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    const newUser = await userModel.create({
      email,
      Password: password,
      Username: username,
    });

    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET || "fallback_secret",
      {
        expiresIn: "1h",
      },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    const userResponse = newUser.toObject();
    delete userResponse.Password;

    try {
      await sendMail(
        email,
        "Welcome to Perplexity!",
        "",
        `Hi ${username},\n\nWelcome to Perplexity!\nWe're excited to have you on board.\n\nHere's a quick link to get you started:\nhttps://perplexity.ai\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,`,
      );
      return res.status(201).json({
        message: "User registered successfully, and mail sent successfully",
        success: true,
        user: {
          id: newUser._id,
          username: newUser.Username,
          email: newUser.email,
        },
      });
    } catch (mailError) {
      console.log("Failed to send welcome email:", mailError);
      return res.status(201).json({
        message: "User created successfully, but welcome email failed to send",
        success: true,
        user: {
          id: newUser._id,
          username: newUser.Username,
          email: newUser.email,
        },
      });
    }
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const signup = register;
