const express = require("express");
const router = express.Router();
const { markAttendance, getAttendanceBySession } = require("../controllers/attendanceController");

// Student marks attendance
router.post("/mark", markAttendance);

// Get attendance list for a session
router.get("/:sessionId", getAttendanceBySession);

module.exports = router;
