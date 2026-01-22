const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true
  },
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

module.exports = mongoose.model("Attendance", attendanceSchema);
