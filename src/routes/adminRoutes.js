const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

const { getDashboardStats } = require("../controllers/adminController");

// Dashboard stats
router.get("/dashboard", auth, adminOnly, getDashboardStats);

module.exports = router;
