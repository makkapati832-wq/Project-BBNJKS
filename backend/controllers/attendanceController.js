const Attendance = require("../models/Attendance");
const User = require("../models/User"); 

exports.markAttendance = async (req, res) => {
  const { studentId, sessionId, timestamp } = req.body;

  try {
    // --- 1. Time Validation (Anti-Cheat) ---
    // If timestamp is older than 30 MINUTES, reject it.
    // Calculation: 30 * 60 * 1000 = 1,800,000 milliseconds
    if (timestamp) {
        const now = Date.now();
        const difference = now - timestamp;
        
        if (difference > 1800000) { 
            return res.status(400).json({ message: " QR Code Expired! Please scan the new code." });
        }
    }

    // --- 2. Check Duplicates ---
    const existingRecord = await Attendance.findOne({ studentId, sessionId });
    if (existingRecord) {
      return res.status(400).json({ 
        message: " You have already marked attendance for this session." 
      });
    }

    // --- 3. Create Record ---
    const attendance = new Attendance({ studentId, sessionId });
    await attendance.save();

    res.status(201).json({ message: " Attendance marked successfully", attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAttendanceBySession = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const attendanceList = await Attendance.find({ sessionId });
    const detailedList = await Promise.all(attendanceList.map(async (record) => {
      const student = await User.findById(record.studentId).select("name email");
      return {
        _id: record._id,
        studentName: student ? student.name : "Unknown Student",
        studentEmail: student ? student.email : "No Email",
        createdAt: record.createdAt
      };
    }));
    res.status(200).json(detailedList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};