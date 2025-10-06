const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["feedback", "complaint"],
    required: true,
  },
  title: { type: String },
  description: { type: String, required: true },
  category: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false },
  attachment: { type: String },
  rating: { type: Number },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["submitted", "under_review", "resolved", "closed"],
    default: "submitted",
  },
  referenceType: { type: String, enum: ["announcement", null], default: null },
  referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
});

module.exports = mongoose.model("Feedback", feedbackSchema);
