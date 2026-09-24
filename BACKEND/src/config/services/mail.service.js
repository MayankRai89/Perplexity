import nodemailer from "nodemailer";

let transporter;

if (process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS) {
  // Use direct SMTP with Gmail App Password (Recommended & most reliable)
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GOOGLE_USER,
      pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS,
    },
  });
} else {
  // Fallback to OAuth2
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GOOGLE_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN,
    },
  });
}

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("⚠️ Email service warning (OAuth2/SMTP not authenticated yet):", error.message);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `Perplexity <${process.env.GOOGLE_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw error;
  }
};

export default sendEmail;
