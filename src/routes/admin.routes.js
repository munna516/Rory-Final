import express from "express"
import { adminAuthMiddleware } from "../middlewares/adminAuth.js";
import { getDashboard } from "../controllers/adminDashobard.controller.js";

const adminRoutes = express.Router();

adminRoutes.get("/dashboard", adminAuthMiddleware, getDashboard);

export default adminRoutes;