const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,   // Ensures no duplicate emails
    lowercase: true, // Converts email to lowercase before saving
    trim: true
  },
  role: {
    type: String,
    enum: ["teacher", "student", "admin"], // Restricts role to these 3 values
    required: true
  },
  password: {
    type: String,
    required: true
  },
  // --- NEW FIELD: Stores the URL of the uploaded image ---
  profileImage: {
    type: String, 
    default: "https://via.placeholder.com/150" // Default image if user hasn't uploaded onegfdfs
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);