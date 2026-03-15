const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  createIssue,
  getAllIssues,
  upvoteIssue,
  updateStatus,
  getMyIssues,
  deleteIssue,
  updateIssue,
} = require("../controllers/issueController");

router.post("/", auth, createIssue);
router.get("/", getAllIssues);
router.get("/my", auth, getMyIssues);
router.put("/:id", auth, updateIssue);
router.patch("/:id/status", auth, updateStatus);  // ✅ auth added
router.delete("/:id", auth, deleteIssue);
router.patch("/:id/upvote", auth, upvoteIssue);

module.exports = router;