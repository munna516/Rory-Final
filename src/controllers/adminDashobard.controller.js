import { successResponse, errorResponse } from "../utils/response.js";
import { AdminDashboardService } from "../services/adminDashboard.service.js";
export const getDashboard = async (req, res) => {

    try {
        const result = await AdminDashboardService.getDashboard();
        return successResponse(res, 200, "Dashboard fetched successfully", result);
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
}
