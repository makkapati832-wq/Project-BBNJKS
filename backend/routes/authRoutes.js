const express = require("express");
const router = express.Router();

const { 
  loginUser, 
  registerUser, 
  getUserProfile,
  updateProfile,
  uploadImage 
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile/:userId", getUserProfile);

// --- NEW: Profile Image Upload Route ---
router.post("/upload-avatar", uploadImage, updateProfile);

module.exports = router;