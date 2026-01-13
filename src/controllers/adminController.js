const Issue = require("../models/Issue");
const User = require("../models/User");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const openIssues = await Issue.countDocuments({ status: "open" });
    const inProgressIssues = await Issue.countDocuments({ status: "in-progress" });
    const resolvedIssues = await Issue.countDocuments({ status: "resolved" });

    const totalUsers = await User.countDocuments();

    const totalVotesAgg = await Issue.aggregate([
      { $group: { _id: null, totalVotes: { $sum: "$votes" } } }
    ]);

    const totalVotes = totalVotesAgg[0]?.totalVotes || 0;

    res.json({
      totalIssues,
      openIssues,
      inProgressIssues,
      resolvedIssues,
      totalUsers,
      totalVotes,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllIssuesAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, category } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const totalCount = await Issue.countDocuments(filter);

    const issues = await Issue.find(filter)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
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

exports.adminUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["open", "in-progress", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.json({
      message: "Status updated successfully",
      issue,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.adminDeleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    await issue.deleteOne();

    res.json({
      message: "Issue deleted by admin successfully ✅",
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
