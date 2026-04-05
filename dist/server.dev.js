"use strict";

var express = require("express");

var cors = require("cors");

var mongoose = require("mongoose");

require("dotenv").config();

var multer = require("multer");

var cloudinary = require("./cloudinary"); // create this file for Cloudinary config
// Import existing routes


var adminRoutes = require("./src/routes/adminRoutes");

var issueRoutes = require("./src/routes/issueRoutes");

var userRoutes = require("./src/routes/userRoutes");

var authRoutes = require("./src/routes/authRoutes");

var app = express(); // Middleware

app.use(cors());
app.use(express.json()); // Test route

app.get("/", function (req, res) {
  res.send("NeighbourHub backend running 🚀");
}); // Cloudinary upload setup

var storage = multer.memoryStorage();
var upload = multer({
  storage: storage
}); // Upload endpoint

app.post("/api/upload", upload.single("image"), function _callee(req, res) {
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;

          if (req.file) {
            _context.next = 3;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            message: "No file uploaded"
          }));

        case 3:
          cloudinary.uploader.upload_stream({
            folder: "your_folder_name"
          }, // Replace with your Cloudinary folder
          function (error, result) {
            if (error) return res.status(500).json(error);
            res.json(result); // returns Cloudinary info including secure_url
          }).end(req.file.buffer);
          _context.next = 10;
          break;

        case 6:
          _context.prev = 6;
          _context.t0 = _context["catch"](0);
          console.error(_context.t0);
          res.status(500).json({
            message: "Server error"
          });

        case 10:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 6]]);
}); // Existing API routes

app.use("/api/issues", issueRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/news", require("./src/routes/newsRoutes")); // MongoDB connection

mongoose.connect(process.env.MONGO_URI).then(function () {
  return console.log("MongoDB connected ✅");
})["catch"](function (err) {
  return console.error("Mongo error ❌", err.message);
});
var PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
  console.log("Server running on port ".concat(PORT));
});