const express = require("express");
const router = express.Router();

const { 
  createClass, 
  updateClass, 
  deleteClass, 
  getAllClasses, 
  getTeacherClasses 
} = require("../controllers/classController");

// Create Class
router.post("/", createClass);

// Update Class
router.put("/:classId", updateClass);

// NEW: Delete Class
router.delete("/:classId", deleteClass);

// Get all Classes (For Student Dashboard)
router.get("/", getAllClasses);

// NEW: Get classes by teacher ID (For Teacher Dashboard Dropdown)
router.get("/teacher/:teacherId", getTeacherClasses);

module.exports = router;