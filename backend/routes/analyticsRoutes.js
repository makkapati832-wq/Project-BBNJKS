const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware"); // Import Auth Middleware
const { getDashboardStats } = require("../controllers/analyticsController");

// Protect this route so only logged-in users (Teachers) can see stats
router.get("/stats", protect, getDashboardStats);

module.exports = router;