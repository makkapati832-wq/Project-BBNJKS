const User = require("../models/User");
const Class = require("../models/Class");
const Attendance = require("../models/Attendance");

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Get Totals
        // (Optional: You could filter Class.countDocuments({ teacherId: req.user.id }) to only show YOUR classes)
        const studentCount = await User.countDocuments({ role: "student" });
        const classCount = await Class.countDocuments();
        
        // 2. Get Recent Attendance Activity (Last 5 scans)
        // We use .populate() to replace IDs with actual Names
        const recentActivity = await Attendance.find()
            .sort({ createdAt: -1 }) // Newest first
            .limit(5)
            .populate('studentId', 'name email')
            .populate('sessionId', 'sessionName');

        res.status(200).json({
            studentCount,
            classCount,
            recentActivity
        });
    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
};