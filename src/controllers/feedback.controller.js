const Feedback = require("../models/Feedback");
const mongoose = require("mongoose");

// GET /api/feedback?userId=...
exports.getFeedback = async (req, res) => {
  const { userId, type, status, category } = req.query;
  let filter = {};
  // If admin, allow userId param; otherwise, use req.user.id
  if (req.user.role === 'admin') {
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = userId;
    }
  } else {
    filter.userId = req.user.id;
  }
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (category) filter.category = category;
  const feedback = await Feedback.find(filter).sort({ createdAt: -1 });
  res.json({ feedback });
};

// POST /api/feedback
exports.createFeedback = async (req, res) => {
  const {
    type,
    title,
    description,
    category,
    isAnonymous,
    attachment,
    rating,
    referenceType,
    referenceId
  } = req.body;
  const userId = req.user ? req.user.id : null;
  if (!type || !description || !category || !userId)
    return res.status(400).json({ error: "Missing required fields" });
  let feedbackTitle = title;
  // If feedback is for an announcement and no title, generate one
  if (!feedbackTitle && referenceType === 'announcement' && referenceId) {
    const Announcement = require('../models/Announcement');
    const announcement = await Announcement.findById(referenceId);
    feedbackTitle = announcement ? `Feedback on: ${announcement.title}` : 'Feedback';
  }

  const feedback = await Feedback.create({
    type,
    title: feedbackTitle,
    description,
    category,
    isAnonymous,
    attachment,
    rating,
    userId,
    referenceType,
    referenceId
  });

  if (referenceType === "announcement" && referenceId) {
    const Announcement = require("../models/Announcement");
    await Announcement.findByIdAndUpdate(referenceId, {
      $push: { feedback: feedback._id },
    });
  }

  res.status(201).json({ feedback });
};

// GET /api/feedback/:id
exports.getFeedbackById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid feedback ID" });
  }
  const feedback = await Feedback.findById(id);
  if (!feedback) return res.status(404).json({ error: "Feedback not found" });
  res.json({ feedback });
};

// PUT /api/feedback/:id/status (admin only)
exports.updateFeedbackStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid feedback ID" });
  }
  if (!status) return res.status(400).json({ error: "Missing status field" });
  const feedback = await Feedback.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
  if (!feedback) return res.status(404).json({ error: "Feedback not found" });
  // Notify feedback owner about status update
  const Notification = require('../models/Notification');
  await Notification.create({
    userId: feedback.userId,
    title: 'Feedback Status Updated',
    body: `Your feedback '${feedback.title}' status is now '${status}'.`,
    type: 'feedback',
    // actionUrl: `/feedback/${feedback._id}`
    actionUrl: `/submissions`
  });
  res.json({ feedback });
};
