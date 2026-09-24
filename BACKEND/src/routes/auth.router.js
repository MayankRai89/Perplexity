import { Router } from "express";
import {
  signup,
  verifyEmail,
  login,
  getMyProfile,
} from "../controllers/auth.controller.js";
import {
  registerValidationRules,
  loginValidationRules,
  validate,
} from "../middlewares/validation.middleware.js";
import { authUser } from "../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/signup", registerValidationRules, validate, signup);
authRouter.post("/register", registerValidationRules, validate, signup);
authRouter.get("/verify-email", verifyEmail);
authRouter.post("/login", loginValidationRules, validate, login);
/***
 * @route GET/API/AUTH/GET-ME
 *@description GET CURRENT USER DETAILS
 *@access Private
 */
authRouter.get("/get-me", authUser, getMyProfile);
export default authRouter;
