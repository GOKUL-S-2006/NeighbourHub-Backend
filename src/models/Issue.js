const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    category: {
      type: String,
      default: "other",
    },

    location: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["open", "in-progress", "resolved"],
      default: "open",
    },

    votes: {
      type: Number,
      default: 0,
    },

    votedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    aiSummary: {
      type: String,
    },

    aiConfidence: {
      type: String,
    },

    // ✅ severity now inside the schema object
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Emergency"],
      default: "Low",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Issue", issueSchema);