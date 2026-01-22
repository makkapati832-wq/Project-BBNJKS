const Attendance = require("../models/Attendance");

// Mark attendance (Updated with Duplicate Check)
exports.markAttendance = async (req, res) => {
  const { studentId, sessionId } = req.body;

  try {
    // 1. Check if attendance already exists for this Student + Session
    const existingRecord = await Attendance.findOne({ studentId, sessionId });

    if (existingRecord) {
      return res.status(400).json({ 
        message: "⚠️ You have already marked attendance for this session." 
      });
    }

    // 2. If not, create new record
    const attendance = new Attendance({
      studentId,
      sessionId
    });

    await attendance.save();

    res.status(201).json({
      message: "✅ Attendance marked successfully",
      attendance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get attendance list by session
exports.getAttendanceBySession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const attendanceList = await Attendance.find({ sessionId });
    res.status(200).json(attendanceList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
