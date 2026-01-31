const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true // Optimization: Index for fast lookup
  },
  course: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);