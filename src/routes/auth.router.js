import { Router } from "express";
import { signup } from "../controllers/auth.controller.js";
import { registerValidationRules, validate } from "../middlewares/validation.middleware.js";

const authRouter = Router();

authRouter.post("/signup", registerValidationRules, validate, signup);
authRouter.post("/register", registerValidationRules, validate, signup);

export default authRouter;
