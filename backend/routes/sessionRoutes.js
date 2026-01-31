const express = require("express");
const router = express.Router();

const { 
  createSession, 
  getAllSessions, 
  validateQR, 
  getSessionsByClass 
} = require("../controllers/sessionController");

// Create a new session (Teacher generates QR)
router.post("/create", createSession);

// Get all sessions (Admin/Debug)
router.get("/", getAllSessions);

// Validate QR (FR-5 - Student scans QR)
router.post("/validate", validateQR);

// NEW: Get sessions for a specific class (For Teacher Reports)
router.get("/class/:classId", getSessionsByClass);

module.exports = router;