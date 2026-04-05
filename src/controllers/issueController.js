const Issue = require("../models/Issue");
const cloudinary = require("../../cloudinary");

// ===================== HELPER: HAVERSINE DISTANCE (meters) =====================
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (val) => (val * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ===================== CREATE ISSUE =====================
exports.createIssue = async (req, res) => {
  try {
    const { title, description, category, location, image, severity } = req.body;

    // ── DUPLICATE DETECTION: 100m radius + same category ──
    if (location) {
      const [lat, lon] = location.split(",").map(Number);

      const activeIssues = await Issue.find({
        status: { $in: ["open", "in-progress"] },
      });

      for (const existing of activeIssues) {
        if (!existing.location) continue;

        const [eLat, eLon] = existing.location.split(",").map(Number);
        const distance = getDistanceMeters(lat, lon, eLat, eLon);

        console.log(`Distance to "${existing.title}" [${existing.category}]: ${Math.round(distance)}m`);

        // ✅ Same location (100m) + same category = duplicate
        if (distance <= 100 && existing.category === category) {
          return res.status(409).json({
            duplicate: true,
            message: "An issue has already been reported in this location.",
            existing,
          });
        }
      }
    }
    // ── END DUPLICATE DETECTION ───────────────────────────

    const issue = await Issue.create({
      title,
      description,
      category,
      location,
      image: image || "",
      severity: severity || "Low",
      createdBy: req.user ? req.user.id : null,
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
    res.json({ data: issues });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===================== GET MY ISSUES =====================
exports.getMyIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===================== UPVOTE (toggle) =====================
exports.upvoteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    const userId = req.user._id.toString();

    if (issue.votedBy.map((id) => id.toString()).includes(userId)) {
      issue.votes = Math.max(0, issue.votes - 1);
      issue.votedBy = issue.votedBy.filter((id) => id.toString() !== userId);
    } else {
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
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    if (issue.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    issue.title       = req.body.title       ?? issue.title;
    issue.description = req.body.description ?? issue.description;
    issue.category    = req.body.category    ?? issue.category;
    issue.location    = req.body.location    ?? issue.location;

    await issue.save();
    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===================== UPDATE STATUS =====================
exports.updateStatus = async (req, res) => {
  try {
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    res.json(issue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ===================== DELETE ISSUE (OWNER OR ADMIN) =====================
exports.deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

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