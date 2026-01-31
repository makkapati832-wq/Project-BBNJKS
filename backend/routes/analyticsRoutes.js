const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
    getDashboardStats,
    getAdminStats
} = require("../controllers/analyticsController");

// Teacher dashboard analytics
router.get("/stats", protect, getDashboardStats);

// Admin dashboard analytics
router.get("/admin-stats", protect, (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access only" });
    }
    next();
}, getAdminStats);

module.exports = router;
