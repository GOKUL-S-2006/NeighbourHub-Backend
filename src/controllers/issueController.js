const Issue = require("../models/Issue");

const createIssue = async (req, res) => {
  try {
    const issue = await Issue.create(req.body);
    res.status(201).json(issue);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllIssues = async (req, res) => {
  try {
    const issues = await Issue.find();
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createIssue,
  getAllIssues
};
const upvoteIssue = async (req, res) => {
  try {
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { $inc: { votes: 1 } },
      { new: true }
    );

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.status(200).json(issue);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports = {
  createIssue,
  getAllIssues,
  upvoteIssue
};
