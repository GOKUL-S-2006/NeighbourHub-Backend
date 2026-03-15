const Issue = require("../models/Issue");


const cloudinary = require("../../cloudinary");

// ===================== CREATE ISSUE =====================
exports.createIssue = async (req, res) => {
  try {
    // Backend expects frontend to send 'image' as Cloudinary URL
    const { title, description, category, location, image } = req.body;

    const issue = await Issue.create({
      title,
      description,
      category,
      location,
      createdBy: req.user ? req.user.id : null,
      image: image || "", // save image URL from frontend, or empty string
    });

    res.status(201).json(issue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ===================== GET ALL ISSUES =====================
exports.getAllIssues = async (req, res) => {
  try {
    const issues = await Issue.find().sort({ votes: -1 });
    // issues now have: title, description, location, image (Cloudinary URL)
    res.json({ data: issues });
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
// UPVOTE ISSUE (toggle)
// ===================== UPVOTE (toggle) =====================
exports.upvoteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    const userId = req.user._id.toString(); // 🔹 convert ObjectId to string

    // 🔹 toggle logic using string comparison
    if (issue.votedBy.map(id => id.toString()).includes(userId)) {
      // User already voted → remove vote
      issue.votes = Math.max(0, issue.votes - 1);
      issue.votedBy = issue.votedBy.filter(id => id.toString() !== userId);
    } else {
      // User hasn't voted → add vote
      issue.votes += 1;
      issue.votedBy.push(userId);
    }

    await issue.save();
    res.json(issue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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
