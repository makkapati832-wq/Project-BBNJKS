const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware"); // Ensure you created this file!

const { 
  createClass, 
  updateClass, 
  deleteClass, 
  getAllClasses, 
  getTeacherClasses 
} = require("../controllers/classController");

// --- Protected Routes (Logged in Users Only) ---
router.post("/", protect, createClass);
router.put("/:classId", protect, updateClass);
router.delete("/:classId", protect, deleteClass);
router.get("/teacher/:teacherId", protect, getTeacherClasses);

// --- Public Routes ---
// This supports the search query (e.g., /classes?search=math)
router.get("/", getAllClasses);

module.exports = router;