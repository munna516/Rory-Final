import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import constants from "../config/constant.js";
import { sendEmail } from "../utils/email.js";

export const userService = {
    createUser: async (name, email, password) => {
        const hashedPassword = await bcrypt.hash(password, 12);

        // Step 1: Check existing user
        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser.role !== "guest") {
            return { success: false, message: "User already exists", status: 400 };
        }

        // Step 2: Create OR upgrade
        const user = await User.findOneAndUpdate(
            { email },
            {
                $set: {
                    name,
                    password: hashedPassword,
                    role: "user"
                },
                $setOnInsert: {
                    email
                }
            },
            {
                new: true,
                upsert: true
            }
        ).select("-password");

        return user;
    },

    loginUser: async (email, password) => {
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error("User not found");

            throw error;
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            const error = new Error("Invalid password");

            throw error;
        }

        if (!constants.JWT_SECRET) {
            const error = new Error("JWT secret is not configured");
            error.status = 500;
            throw error;
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            constants.JWT_SECRET,
            { expiresIn: constants.JWT_EXPIRES_IN }
        );

        // Remove sensitive fields before returning
        const safeUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isPremium: user.isPremium,
            createdAt: user.createdAt,
        };

        return { user: safeUser, token };
    },

    loginAdmin: async (email, password) => {
        const admin = await User.findOne({ email, role: "admin" });
        if (!admin) {
            const error = new Error("Admin not found");
            throw error;
        }

        const isPasswordCorrect = await bcrypt.compare(password, admin.password);
        if (!isPasswordCorrect) {
            const error = new Error("Invalid password");
            throw error;
        }

        if (!constants.JWT_SECRET) {
            const error = new Error("JWT secret is not configured");
            error.status = 500;
            throw error;
        }

        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: admin.role },
            constants.JWT_SECRET,
            { expiresIn: constants.JWT_EXPIRES_IN }
        );

        // Remove sensitive fields before returning
        const safeAdmin = {
            id: admin._id,
            email: admin.email,
            role: admin.role,
            createdAt: admin.createdAt,
        };

        return { admin: safeAdmin, token };
    },

    forgotPassword: async (email, role = null) => {
        // Unified password reset for both user and admin
        // If role is provided, filter by role; otherwise allow any role except guest
        const query = role
            ? { email, role }
            : { email, role: { $in: ["user", "admin"] } };

        const user = await User.findOne(query);
        if (!user) {
            const roleText = role === "admin" ? "Admin" : "User";
            return { success: false, message: `${roleText} not found`, status: 400 };
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        user.passwordResetOTP = otp.toString();
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        user.isOTPVerified = false;
        await user.save();

        const isAdmin = user.role === "admin";
        const greeting = isAdmin ? "Hello Admin," : "Hello,";
        const title = isAdmin ? "Admin Password Reset Request" : "Password Reset Request";
        const message = isAdmin
            ? "We received a request to reset your admin password. Please use the OTP below to continue."
            : "We received a request to reset your password. Please use the OTP below to continue.";
        const footer = isAdmin
            ? "Soundtrack My Night Admin Security Team"
            : "Soundtrack My Night Security Team";
        const warning = isAdmin
            ? "If you did not request this, please contact the system administrator immediately."
            : "If you did not request this, you can safely ignore this email.";

        await sendEmail(
            email,
            "🔐 Password Reset OTP",
            `
            <div style="font-family:Arial, sans-serif; max-width:500px; margin:auto; padding:20px; color:#111;">
              
              <h2 style="text-align:center;">${title}</h2>
          
              <p>${greeting}</p>
          
              <p>
                ${message}
              </p>
          
              <div style="text-align:center; margin:30px 0;">
                <span style="
                  font-size:28px;
                  letter-spacing:6px;
                  font-weight:bold;
                  background:#f3f4f6;
                  padding:12px 24px;
                  border-radius:8px;
                  display:inline-block;
                ">
                  ${otp}
                </span>
              </div>
          
              <p>
                This OTP will expire in <strong>10 minutes</strong>.  
                ${warning}
              </p>
          
              <hr style="margin:30px 0;" />
          
              <p style="font-size:13px; color:#555;">
                ${footer}
              </p>
          
            </div>
            `
        );

        return { success: true, message: "Password reset email sent successfully", status: 200 };
    },
    verifyOTP: async (email, otp, role = null) => {
        // Unified OTP verification for both user and admin
        const query = role
            ? { email, role }
            : { email, role: { $in: ["user", "admin"] } };

        const user = await User.findOne(query).select("passwordResetOTP passwordResetExpires isOTPVerified role");
        if (!user) {
            const roleText = role === "admin" ? "Admin" : "User";
            return { success: false, message: `${roleText} not found`, status: 400 };
        }

        // Convert OTP to string for comparison (handles both string and number)
        const userOTP = user.passwordResetOTP?.toString();
        const providedOTP = otp?.toString();

        if (userOTP !== providedOTP) {
            return { success: false, message: "Invalid OTP", status: 400 };
        }
        if (user.passwordResetExpires < Date.now()) {
            return { success: false, message: "OTP expired", status: 400 };
        }
        user.isOTPVerified = true;
        await user.save();
        return { success: true, message: "OTP verified successfully", status: 200 };
    },
    resetPassword: async (email, newPassword, role = null) => {
        // Unified password reset for both user and admin
        const query = role
            ? { email, role, isOTPVerified: true }
            : { email, role: { $in: ["user", "admin"] }, isOTPVerified: true };

        const user = await User.findOne(query).select("password passwordResetOTP passwordResetExpires isOTPVerified role");
        if (!user) {
            const roleText = role === "admin" ? "Admin" : "User";
            return { success: false, message: `${roleText} not found or OTP not verified`, status: 400 };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        user.passwordResetOTP = null;
        user.passwordResetExpires = null;
        user.isOTPVerified = false;
        await user.save();
        return { success: true, message: "Password reset successfully", status: 200 };
    }
}