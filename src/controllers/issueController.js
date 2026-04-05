const Issue = require("../models/Issue");
const cloudinary = require("../../cloudinary");

// ===================== HELPER: HAVERSINE DISTANCE (meters) =====================
function getDistanceMeters(loc1, loc2) {
  const toRad = (val) => (val * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLon = toRad(loc2.lon - loc1.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.lat)) * Math.cos(toRad(loc2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ===================== HELPER: SIMILARITY CHECK =====================
function isSimilar(str1, str2) {
  if (!str1 || !str2) return false;
  const a = str1.toLowerCase();
  const b = str2.toLowerCase();
  // Check if any word from title1 appears in title2
  const words = a.split(" ").filter((w) => w.length > 3);
  const matches = words.filter((w) => b.includes(w));
  return matches.length >= 2; // at least 2 meaningful words match
}

// ===================== CREATE ISSUE =====================
exports.createIssue = async (req, res) => {
  try {
    const { title, description, category, location, image, severity } = req.body;

    // ── DUPLICATE DETECTION ──────────────────────────────
    if (location) {
      const [lat, lon] = location.split(",").map(Number);

      // Fetch all open/in-progress issues with same category
      const nearbyIssues = await Issue.find({
        status: { $in: ["open", "in-progress"] },
        category: category || "general",
      });

      for (const existing of nearbyIssues) {
        // 1. Check location — within 100 meters?
        const [eLat, eLon] = existing.location.split(",").map(Number);
        const distance = getDistanceMeters(
          { lat, lon },
          { lat: eLat, lon: eLon }
        );

        if (distance <= 100) {
          // 2. Check title similarity
          if (isSimilar(title, existing.title)) {
            return res.status(409).json({
              duplicate: true,
              message: "A similar issue has already been reported nearby.",
              existing,
            });
          }
        }
      }
    }
    // ── END DUPLICATE DETECTION ──────────────────────────

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