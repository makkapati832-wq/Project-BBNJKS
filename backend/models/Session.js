const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  sessionName: {
    type: String,
    required: true
  },
  // Link to Class (Required)
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true
  },
  // Link to Teacher (Required)
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  qrCode: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// --- THE FIX IS HERE: Make sure this uses module.exports ---
module.exports = mongoose.model("Session", sessionSchema);