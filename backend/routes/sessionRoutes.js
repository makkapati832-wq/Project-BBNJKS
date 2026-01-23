const express = require("express");
const router = express.Router();
// Import the new validateQR controller function
const { createSession, getAllSessions, validateQR } = require("../controllers/sessionController");

// Create a new session (Teacher generates QR)
router.post("/create", createSession);

// Get all sessions
router.get("/", getAllSessions);

// Validate QR (FR-5)
router.post("/validate", validateQR);

module.exports = router;