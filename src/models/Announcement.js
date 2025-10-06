const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  author: { type: String, required: true },
  isUrgent: { type: Boolean, default: false },
  feedback: [{ type: mongoose.Schema.Types.ObjectId, ref: "Feedback" }],
});

module.exports = mongoose.model('Announcement', announcementSchema);