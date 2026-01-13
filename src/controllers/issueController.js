const Issue = require("../models/Issue");


// ===================== CREATE ISSUE =====================
exports.createIssue = async (req, res) => {
  try {
    const issue = await Issue.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      location: req.body.location,
      createdBy: req.user.id, // from JWT
    });

    res.status(201).json(issue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// ===================== GET ALL ISSUES =====================
exports.getAllIssues = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalCount = await Issue.countDocuments();

    const issues = await Issue.find()
      .sort({ votes: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      data: issues,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ===================== GET MY ISSUES =====================
exports.getMyIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ===================== UPVOTE (1 PER USER) =====================
exports.upvoteIssue = async (req, res) => {
  try {
    // optional: block admin voting
    if (req.user.role === "admin") {
      return res.status(403).json({ message: "Admins cannot upvote issues" });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (issue.votedBy.includes(req.user.id)) {
      return res.status(400).json({
        message: "You have already upvoted this issue",
      });
    }

    issue.votes += 1;
    issue.votedBy.push(req.user.id);

    await issue.save();
    res.json(issue);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ===================== UPDATE ISSUE (OWNER ONLY) =====================
exports.updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (issue.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    issue.title = req.body.title ?? issue.title;
    issue.description = req.body.description ?? issue.description;
    issue.category = req.body.category ?? issue.category;
    issue.location = req.body.location ?? issue.location;

    await issue.save();
    res.json(issue);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ===================== UPDATE STATUS (ADMIN ONLY) =====================
exports.updateStatus = async (req, res) => {
  try {
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.json(issue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// ===================== DELETE ISSUE (OWNER OR ADMIN) =====================
exports.deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (
      issue.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await issue.deleteOne();
    res.json({ message: "Issue deleted successfully ✅" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
