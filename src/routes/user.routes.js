import express from "express";
import {
    registerUser,
    login,
    forgotPassword,
    verifyOTP,
    resetPassword
} from "../controllers/user.controller.js";

const userRoutes = express.Router();

// Unified routes for both user and admin
userRoutes.post("/register", registerUser);
userRoutes.post("/login", login);
userRoutes.post("/forgot-password", forgotPassword);
userRoutes.post("/verify-otp", verifyOTP);
userRoutes.post("/reset-password", resetPassword);

export default userRoutes;