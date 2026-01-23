const express = require("express");
const router = express.Router();
const { loginUser, registerUser, getUserProfile } = require("../controllers/authController");

// Route to Register a new user (Teacher or Student)
router.post("/register", registerUser);

// Route to Login
router.post("/login", loginUser);

// NEW: Route to Get User Profile (FR-2)
router.get("/profile/:userId", getUserProfile);

module.exports = router;