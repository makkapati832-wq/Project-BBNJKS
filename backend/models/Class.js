const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true
  },
  classCode: {
    type: String,
    required: true,
    unique: true, // Optimization: Fast lookup prevents duplicates
    uppercase: true, // Ensures "cs101" and "CS101" are treated the same
    trim: true
  },
  // Link to the Teacher (User) who owns this class
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  description: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Class", classSchema);