const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const JWT_SECRET = "MY_SUPER_SECRET_KEY_123"; 

// --- 1. Multer Config (Image Uploads) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure the 'uploads' folder exists in your backend root directory!
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        // Name file: fieldname-timestamp.ext (e.g., profileImage-171569999.jpg)
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5000000 } // Limit: 5MB
});

// Export Middleware
exports.uploadImage = upload.single('profileImage');

// --- 2. Update Profile Function (Enhanced) ---
exports.updateProfile = async (req, res) => {
    try {
        // Debugging: Print to console to ensure file arrived
        console.log("File received:", req.file);
        console.log("Body received:", req.body);

        // Validation 1: Check if file exists
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded. Please select an image." });
        }

        // Validation 2: Check if User ID exists
        const userId = req.body.userId;
        if (!userId) {
            return res.status(400).json({ message: "User ID is missing from request." });
        }

        // Create the full URL for the uploaded image
        // Example: http://localhost:5000/uploads/profileImage-123456789.jpg
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        
        // Update user in DB
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { profileImage: imageUrl },
            { new: true } // Return the updated document
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }

        // Send back the new image URL so frontend can update the <img> tag
        res.status(200).json({ 
            message: "Profile updated successfully", 
            user: updatedUser,
            imageUrl: imageUrl 
        });

    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// --- Existing Functions ---

exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword, role });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
        profileImage: user.profileImage, // Send profile image URL
        token: token 
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};