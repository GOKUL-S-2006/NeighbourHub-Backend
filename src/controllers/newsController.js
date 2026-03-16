const Issue = require("../models/Issue");

exports.generateNewsBrief = async (req, res) => {
  try {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week  = new Date(today); week.setDate(week.getDate() - 7);

    // fetch recent data
    const [todayIssues, weekIssues, resolvedThisWeek, emergencyIssues, topVoted] =
      await Promise.all([
        Issue.find({ createdAt: { $gte: today } }).select("title category severity location"),
        Issue.find({ createdAt: { $gte: week  } }).select("title category severity status votes location"),
        Issue.find({ status: "resolved", updatedAt: { $gte: week } }).select("title category"),
        Issue.find({ severity: "Emergency", status: { $ne: "resolved" } }).select("title location"),
        Issue.find().sort({ votes: -1 }).limit(3).select("title votes category status"),
      ]);

    // build data summary for Gemini
    const dataSummary = `
Community Data Summary for ${now.toDateString()}:

NEW ISSUES TODAY (${todayIssues.length}):
${todayIssues.map(i => `- ${i.title} [${i.category}, ${i.severity}]`).join("\n") || "None"}

ISSUES THIS WEEK (${weekIssues.length} total):
${weekIssues.slice(0, 5).map(i => `- ${i.title} [${i.status}]`).join("\n")}

RESOLVED THIS WEEK (${resolvedThisWeek.length}):
${resolvedThisWeek.map(i => `- ${i.title} [${i.category}]`).join("\n") || "None"}

ACTIVE EMERGENCIES (${emergencyIssues.length}):
${emergencyIssues.map(i => `- ${i.title}`).join("\n") || "None"}

TOP VOTED ISSUES:
${topVoted.map(i => `- ${i.title} (${i.votes} votes, ${i.status})`).join("\n")}
`;

    // call Gemini text API
    const prompt = `
You are a neighborhood news reporter for a community app called NeighbourHub.
Based on the community data below, write a short, friendly daily news brief.

Rules:
- Start with "NeighbourHub Daily Brief" and today's date
- Use simple bullet points
- Maximum 8 bullet points
- Be informative and community-friendly
- Mention resolved issues positively
- Flag emergencies urgently
- End with one positive/motivational line for the community
- Do NOT use markdown, asterisks for bold, or hashtags
- Use plain text only with bullet points using •

${dataSummary}
`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const geminiData = await geminiRes.json();

    if (geminiData.error) {
      // fallback if Gemini fails — generate without AI
      return res.json({
        brief: generateFallbackBrief(todayIssues, resolvedThisWeek, emergencyIssues, topVoted, now),
        source: "fallback",
        generatedAt: now.toISOString(),
        stats: {
          todayCount:    todayIssues.length,
          weekCount:     weekIssues.length,
          resolvedCount: resolvedThisWeek.length,
          emergencyCount:emergencyIssues.length,
        }
      });
    }

    const brief = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.json({
      brief,
      source: "gemini",
      generatedAt: now.toISOString(),
      stats: {
        todayCount:    todayIssues.length,
        weekCount:     weekIssues.length,
        resolvedCount: resolvedThisWeek.length,
        emergencyCount:emergencyIssues.length,
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// fallback brief without AI
function generateFallbackBrief(todayIssues, resolved, emergency, topVoted, now) {
  const date = now.toDateString();
  let brief  = `NeighbourHub Daily Brief\n${date}\n\n`;

  if (emergency.length > 0) {
    brief += `• URGENT: ${emergency.length} emergency ${emergency.length === 1 ? "issue requires" : "issues require"} immediate attention\n`;
    emergency.slice(0, 2).forEach(i => { brief += `  - ${i.title}\n`; });
  }

  if (todayIssues.length > 0) {
    brief += `• ${todayIssues.length} new ${todayIssues.length === 1 ? "issue was" : "issues were"} reported today\n`;
    todayIssues.slice(0, 2).forEach(i => { brief += `  - ${i.title}\n`; });
  } else {
    brief += `• No new issues reported today\n`;
  }

  if (resolved.length > 0) {
    brief += `• ${resolved.length} ${resolved.length === 1 ? "issue was" : "issues were"} resolved this week\n`;
    resolved.slice(0, 2).forEach(i => { brief += `  - ${i.title}\n`; });
  }

  if (topVoted.length > 0) {
    brief += `• Most discussed: ${topVoted[0].title} (${topVoted[0].votes} votes)\n`;
  }

  brief += `\nKeep reporting issues to make our neighbourhood better!`;
  return brief;
}