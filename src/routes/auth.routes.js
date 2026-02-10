import express from "express";
import {
    registerUser,
    login,
    forgotPassword,
    verifyOTP,
    resetPassword
} from "../controllers/user.controller.js";

const authRoutes = express.Router();

authRoutes.post("/register", registerUser);
authRoutes.post("/login", login);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/verify-otp", verifyOTP);
authRoutes.post("/reset-password", resetPassword);

export default authRoutes;