import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import sendEmail from "./config/services/mail.service.js";
import authRouter from "./routes/auth.router.js";
import chatRouter from "./routes/chat.router.js";
import discoverRouter from "./routes/discover.router.js";
import collectionRouter from "./routes/collection.router.js";
import ragRouter from "./routes/rag.router.js";
import morgan from "morgan";
import cors from "cors";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl) or allowed origins
      if (!origin || allowedOrigins.includes(origin) || !process.env.FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(null, origin);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  }),
);

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/discover", discoverRouter);
app.use("/api/collections", collectionRouter);
app.use("/api/spaces", ragRouter);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      console.log("profile:", profile);

      return done(null, profile);
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.get("/", (req, res) => {
  sendEmail(
    "[EMAIL_ADDRESS]",
    "Test Email Subject",
    "This is a test email sent with Nodemailer using OAuth2.",
    "<p>This is a test email sent with <b>Nodemailer</b> using OAuth2.</p>",
  );

  res.send(`
        <h1>Home</h1>
        <a href="/auth/google">Login with Google</a>
        `);
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
  "/auth/google/callback",
  (req, res, next) => {
    console.log(req.query);
    return next();
  },
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/profile");
  },
);

app.get("/profile", (req, res) => {
  res.send(`<h1>Profile</h1><pre>${JSON.stringify(req.user, null, 2)}</pre>`);
});

export default app;
