import User from "../models/User.js";
import Playlist from "../models/Playlist.js";
import Quiz from "../models/Quiz.js";

export const AdminDashboardService = {
    getDashboard: async () => {
        const [totalUsers, totalPlaylists, totalQuizzes, paidUserIds, recentPlaylists] =
            await Promise.all([
                User.countDocuments({ role: { $ne: "admin" } }),
                Playlist.countDocuments(),
                Quiz.countDocuments(),
                Playlist.distinct("userId", { playlist_type: "premium", userId: { $ne: null } }),
                Playlist.find({})
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select("title playlist_type createdAt userId")
                    .populate("userId", "email name")
                    .lean(),
            ]);

        const paidUsers = paidUserIds.length;
        const freeUsers = Math.max(totalUsers - paidUsers, 0);

        const recentActivity = recentPlaylists.map((playlist) => ({
            user:
                playlist.userId?.email ||
                playlist.userId?.name ||
                "Guest",
            playlistTitle: playlist.title || "Untitled",
            type: playlist.playlist_type === "premium" ? "Paid" : "Free",
            date: playlist.createdAt,
            playlistId: playlist._id,
        }));

        return {
            totals: {
                totalUsers,
                totalPlaylists,
                totalQuizzes,
                paidUsers,
                freeUsers,
            },
            recentActivity,
        };
    },
};