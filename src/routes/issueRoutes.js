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
  updateIssue

} = require("../controllers/issueController");

router.get("/", auth, getAllIssues);
router.put("/:id", auth, updateIssue);
router.delete("/:id", auth, deleteIssue);
router.patch("/:id/upvote", auth, upvoteIssue);

router.patch("/:id/status", updateStatus);
router.get("/my", auth, getMyIssues);


module.exports = router;
