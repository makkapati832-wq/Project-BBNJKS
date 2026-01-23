const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  sessionName: {
    type: String,
    required: true
  },
  // Linked to Class Model
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true
  },
  // Linked to User Model
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

module.exports = mongoose.model("Session", sessionSchema);