// cloudinary.js
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dkhdzqxgj",       // Replace with your real Cloud Name
  api_key: "217668823166379",           // Replace with your real API Key
  api_secret: "2px8DTScd0rc3daCp2K_cgLr5O0", // Replace with your real API Secret
});

module.exports = cloudinary;