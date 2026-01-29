const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  // Link to the Student (User) who scanned
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true
  },
  // Link to the Session being attended
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true
  },
  status: {
    type: String,
    default: "Present"
  }
}, { timestamps: true });

// Prevent a student from marking attendance twice for the same session
// (This acts as a backup to the Controller logic)
attendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
