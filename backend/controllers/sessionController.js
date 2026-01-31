const Session = require("../models/Session");
const QRCode = require("qrcode");

// 1. Create new session & generate QR (FR-3)
exports.createSession = async (req, res) => {
  const { sessionName, createdBy, classId, teacherId } = req.body;

  try {
    // Validate that Class and Teacher are provided
    if (!classId || !teacherId) {
      return res.status(400).json({ message: "Class and Teacher are required" });
    }

    const newSession = new Session({
      sessionName,
      createdBy,
      classId,   // Save Class ID (Links Session to Class)
      teacherId  // Save Teacher ID
    });

    // Generate QR data: "SESSION:SESSION_ID"
    const qrData = `SESSION:${newSession._id}`;
    const qrImage = await QRCode.toDataURL(qrData);

    newSession.qrCode = qrImage;
    await newSession.save();

    res.status(201).json({
      message: "Session created",
      session: newSession
    });
  } catch (error) {
    console.error("Create Session Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// 2. NEW: Get Sessions for a specific Class (For Teacher Reports Dropdown)
exports.getSessionsByClass = async (req, res) => {
  const { classId } = req.params;
  try {
    // Find sessions for this class and sort by newest first
    const sessions = await Session.find({ classId }).sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions for this class" });
  }
};

// 3. Get all sessions (General Admin use)
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find();
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Validate QR Code (FR-5)
exports.validateQR = async (req, res) => {
  const { sessionId } = req.body;

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ valid: false, message: "Invalid Session ID" });
    }

    if (!session.isActive) {
      return res.status(400).json({ valid: false, message: "Session is inactive" });
    }

    res.status(200).json({ 
      valid: true, 
      message: "QR Code is valid", 
      session 
    });
  } catch (error) {
    res.status(500).json({ error: "Invalid QR Format or Server Error" });
  }
};