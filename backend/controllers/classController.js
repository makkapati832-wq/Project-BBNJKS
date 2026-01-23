const Class = require("../models/Class");

// FR-3: Create a new Class
exports.createClass = async (req, res) => {
  const { className, classCode, teacherId, description } = req.body;

  try {
    const existingClass = await Class.findOne({ classCode });
    if (existingClass) {
      return res.status(400).json({ message: "Class code already exists" });
    }

    const newClass = new Class({
      className,
      classCode,
      teacherId,
      description
    });

    await newClass.save();
    res.status(201).json({ message: "Class created successfully", class: newClass });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// FR-3: Update Class Details
exports.updateClass = async (req, res) => {
  const { classId } = req.params;
  const updates = req.body;

  try {
    const updatedClass = await Class.findByIdAndUpdate(
      classId, 
      updates, 
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json({ message: "Class updated successfully", class: updatedClass });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// NEW: Delete a Class
exports.deleteClass = async (req, res) => {
  const { classId } = req.params;
  try {
    const deletedClass = await Class.findByIdAndDelete(classId);
    if (!deletedClass) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.status(200).json({ message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Classes (For Student Dashboard)
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().sort({ createdAt: -1 });
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch classes" });
  }
};

// NEW: Get Classes specifically for a Teacher (For the Dropdown)
exports.getTeacherClasses = async (req, res) => {
  const { teacherId } = req.params;
  try {
    const classes = await Class.find({ teacherId: teacherId });
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch teacher classes" });
  }
};