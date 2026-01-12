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
