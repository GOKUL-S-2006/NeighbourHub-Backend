const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const multer = require("multer");
const cloudinary = require("./cloudinary"); // create this file for Cloudinary config
const analyzeImage = require('./src/routes/analyzeImage');
// Import existing routes
const adminRoutes = require("./src/routes/adminRoutes");
const issueRoutes = require("./src/routes/issueRoutes");
const userRoutes = require("./src/routes/userRoutes");
const authRoutes = require("./src/routes/authRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
require("dotenv").config();
// Test route
app.get("/", (req, res) => {
  res.send("NeighbourHub backend running 🚀");
});

// Cloudinary upload setup
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.use('/api', analyzeImage);
// Upload endpoint
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    cloudinary.uploader.upload_stream(
      { folder: "your_folder_name" }, // Replace with your Cloudinary folder
      (error, result) => {
        if (error) return res.status(500).json(error);
        res.json(result); // returns Cloudinary info including secure_url
      }
    ).end(req.file.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Existing API routes
app.use("/api/issues", issueRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/news", require("./src/routes/newsRoutes"));
// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.error("Mongo error ❌", err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});