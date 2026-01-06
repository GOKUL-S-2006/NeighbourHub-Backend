const express = require("express");
const router = express.Router();

const issueController = require("../controllers/issueController");

// IMPORTANT: pass FUNCTIONS, not objects
router.post("/", issueController.createIssue);
router.get("/", issueController.getAllIssues);
router.patch("/:id/upvote", issueController.upvoteIssue);


module.exports = router;
