const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
//const { adminUpdateStatus } = require("../controllers/adminController");

const { getDashboardStats,getAllIssuesAdmin ,adminDeleteIssue,adminUpdateStatus } = require("../controllers/adminController");

// Dashboard stats
router.get("/dashboard", auth, adminOnly, getDashboardStats);
router.get("/issues", auth, adminOnly, getAllIssuesAdmin);
router.patch("/issues/:id/status", auth, adminOnly, adminUpdateStatus);
router.delete("/issues/:id", auth, adminOnly, adminDeleteIssue);

module.exports = router;
