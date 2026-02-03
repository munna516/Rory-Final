import { successResponse, errorResponse } from "../utils/response.js";
import { userService } from "../services/user.service.js";

export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;


        if (!email || !password) {
            return errorResponse(res, 400, "Email and password are required");
        }


        const result = await userService.loginAdmin(email, password);
        const { admin, token } = result;

        // Save token to cookie
        res.cookie("adminToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        return successResponse(res, 200, "Admin logged in successfully", { admin, token });
    } catch (error) {
        const status = error.status || 500;
        return errorResponse(res, status, error.message);
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return errorResponse(res, 400, "Email is required");
        }
        const result = await userService.forgotPassword(email, "admin");
        if (result.success) {
            return successResponse(res, 200, result.message, result);
        }
        return errorResponse(res, 400, result.message);
    } catch (error) {
        const status = error.status || 500;
        return errorResponse(res, status, error.message);
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return errorResponse(res, 400, "Email and OTP are required");
        }

        const result = await userService.verifyOTP(email, otp, "admin");
        if (result.success) {
            return successResponse(res, 200, result.message, result);
        }
        return errorResponse(res, 400, result.message);
    } catch (error) {
        const status = error.status || 500;
        return errorResponse(res, status, error.message);
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            return errorResponse(res, 400, "Email and password are required");
        }
        const result = await userService.resetPassword(email, newPassword, "admin");
        if (result.success) {
            return successResponse(res, 200, result.message, result);
        }
        return errorResponse(res, 400, result.message);
    } catch (error) {
        const status = error.status || 500;
        return errorResponse(res, status, error.message);
    }
};
