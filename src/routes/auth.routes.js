import express from "express";
import {
    registerUser,
    login,
    forgotPassword,
    verifyOTP,
    resetPassword,
    changePassword
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
const authRoutes = express.Router();

authRoutes.post("/register", registerUser);
authRoutes.post("/login", login);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/verify-otp", verifyOTP);
authRoutes.post("/reset-password", resetPassword);
authRoutes.patch("/change-password", authMiddleware, changePassword);

export default authRoutes;