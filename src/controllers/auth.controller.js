import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import sendMail from "../config/services/mail.service.js";

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

    const emailVerifictionToken = jwt.sign(
      {
        email: email,
      },
      process.env.JWT_SECRET || "fallback_secret",
      {
        expiresIn: "24h",
      },
    );

    const verificationLink = `${req.protocol}://${req.get("host")}/api/auth/verify-email?token=${emailVerifictionToken}`;

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1a73e8; text-align: center;">Verify your email address</h2>
        <p>Hi ${username},</p>
        <p>Thank you for signing up for Perplexity! Please confirm your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #666; word-break: break-all;">${verificationLink}</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">This link will expire in 24 hours.</p>
      </div>
    `;

    const emailText = `Hi ${username},\n\nThank you for signing up for Perplexity! Please confirm your email address by clicking the link below:\n\n${verificationLink}\n\nThis link will expire in 24 hours.\n\nBest regards,\nPerplexity Team`;

    try {
      await sendMail(
        email,
        "Verify your Perplexity Account",
        emailText,
        emailHtml,
      );
      return res.status(201).json({
        message: "User registered successfully, verification email sent.",
        success: true,
        user: {
          id: newUser._id,
          username: newUser.Username,
          email: newUser.email,
          verified: newUser.verified,
        },
      });
    } catch (mailError) {
      console.error("Failed to send verification email:", mailError);
      return res.status(201).json({
        message:
          "User created successfully, but verification email failed to send.",
        success: true,
        user: {
          id: newUser._id,
          username: newUser.Username,
          email: newUser.email,
          verified: newUser.verified,
        },
      });
    }
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const signup = register;

function renderVerificationPage(success, message) {
  const statusIcon = success
    ? `<svg style="width:64px;height:64px;color:#10b981" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
    : `<svg style="width:64px;height:64px;color:#ef4444" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - Perplexity</title>
      <style>
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background: radial-gradient(circle at top left, #111827, #030712);
          color: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 40px;
          width: 90%;
          max-width: 400px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          animation: fadeIn 0.6s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .icon-container {
          margin-bottom: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.02);
          padding: 16px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 16px 0;
          letter-spacing: -0.025em;
        }
        p {
          font-size: 15px;
          line-height: 1.6;
          color: #9ca3af;
          margin: 0 0 32px 0;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: #ffffff;
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 12px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }
        .btn:active {
          transform: translateY(0);
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon-container">
          ${statusIcon}
        </div>
        <h1 style="color: ${success ? "#10b981" : "#ef4444"}">
          ${success ? "Verification Successful" : "Verification Failed"}
        </h1>
        <p>${message}</p>
        <a href="${frontendUrl}" class="btn">Go to Homepage</a>
        ${
          success
            ? `
        <p style="font-size: 13px; color: #9ca3af; margin-top: 20px; margin-bottom: 0;">
          Redirecting to home in <span id="countdown">3</span>s...
        </p>
        <script>
          let count = 3;
          const counter = setInterval(() => {
            count--;
            document.getElementById('countdown').textContent = count;
            if (count <= 0) {
              clearInterval(counter);
              window.location.href = "${frontendUrl}";
            }
          }, 1000);
        </script>
        `
            : ""
        }
      </div>
    </body>
    </html>
  `;
}

export async function verifyEmail(req, res) {
  try {
    const { token } = req.query;
    if (!token) {
      return res
        .status(400)
        .send(
          renderVerificationPage(
            false,
            "Verification token is missing from the request link.",
          ),
        );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    } catch (err) {
      return res
        .status(400)
        .send(
          renderVerificationPage(
            false,
            "The verification link is invalid or has expired.",
          ),
        );
    }

    const email = decoded.email;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .send(renderVerificationPage(false, "No user account was found."));
    }

    const loginToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "fallback_secret",
      {
        expiresIn: "1h",
      },
    );

    res.cookie("token", loginToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    if (user.verified) {
      return res.send(
        renderVerificationPage(
          true,
          "Your email address is already verified. You can access your account.",
        ),
      );
    }

    user.verified = true;
    await user.save();

    return res.send(
      renderVerificationPage(
        true,
        "Your email has been successfully verified! You can now access your account.",
      ),
    );
  } catch (error) {
    console.error("Error during email verification:", error);
    return res
      .status(500)
      .send(
        renderVerificationPage(
          false,
          "An unexpected error occurred during verification. Please try again later.",
        ),
      );
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.verified) {
      return res.status(403).json({
        message: "Please verify your email address before logging in.",
        verified: false,
      });
    }

    const token = jwt.sign(
      { id: user._id },
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

    return res.status(200).json({
      message: "Logged in successfully",
      success: true,
      user: {
        id: user._id,
        username: user.Username,
        email: user.email,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
/**
 *@route GET/API/AUTH/GET-ME
 *@desc Get Current User Details
 *@access Private
 */
export async function getMyProfile(req, res) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      message: "User details fetched successfully",
      success: true,
      user: {
        id: user._id,
        username: user.Username,
        email: user.email,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error("Error during getMyProfile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
