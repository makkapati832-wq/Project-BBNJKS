const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Class = require("../models/Class");
const Session = require("../models/Session");

// GET: Admin dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const users = await User.countDocuments();
    const classes = await Class.countDocuments();
    const sessions = await Session.countDocuments();

    res.json({ users, classes, sessions });
  } catch (err) {
    res.status(500).json({ message: "Failed to load admin stats" });
  }
});

// GET all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// UPDATE user name & email (admin only)
router.put("/users/:id", async (req, res) => {
  const { name, email, currentAdminId } = req.body;

  // Prevent admin editing themselves
  if (req.params.id === currentAdminId) {
    return res.status(403).json({ message: "You cannot edit your own account" });
  }

  // Email uniqueness check
  const existing = await User.findOne({ email, _id: { $ne: req.params.id } });
  if (existing) {
    return res.status(400).json({ message: "Email already in use" });
  }

  try {
    await User.findByIdAndUpdate(req.params.id, { name, email });
    res.json({ message: "User updated successfully" });
  } catch {
    res.status(500).json({ message: "Failed to update user" });
  }
});


// DELETE user
router.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// GET all classes
router.get("/classes", async (req, res) => {
  try {
    const classes = await Class.find().populate("teacherId", "name email");
    res.json(classes);
  } catch {
    res.status(500).json({ message: "Failed to fetch classes" });
  }
});

// UPDATE any class
router.put("/classes/:id", async (req, res) => {
  const { className, description } = req.body;

  try {
    await Class.findByIdAndUpdate(req.params.id, { className, description });
    res.json({ message: "Class updated" });
  } catch {
    res.status(500).json({ message: "Failed to update class" });
  }
});

// DELETE any class and its sessions
router.delete("/classes/:id", async (req, res) => {
  try {
    await Session.deleteMany({ classId: req.params.id });
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: "Class and sessions deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete class" });
  }
});

//View sessions for a class
router.get("/classes/:id/sessions", async (req, res) => {
  try {
    const sessions = await Session.find({ classId: req.params.id });
    res.json(sessions);
  } catch {
    res.status(500).json({ message: "Failed to fetch sessions" });
  }
});

router.put("/sessions/:id", async (req, res) => {
  const { sessionName } = req.body;

  try {
    await Session.findByIdAndUpdate(req.params.id, { sessionName });
    res.json({ message: "Session updated" });
  } catch {
    res.status(500).json({ message: "Failed to update session" });
  }
});


// Delete a session
router.delete("/sessions/:id", async (req, res) => {
  try {
    await Session.findByIdAndDelete(req.params.id);
    res.json({ message: "Session deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete session" });
  }
});



module.exports = router;