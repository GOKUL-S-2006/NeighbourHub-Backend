const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    category: {
      type: String,
      default: "other"
    },
    location: { type: String, required: true },
    votes: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issue", issueSchema);
