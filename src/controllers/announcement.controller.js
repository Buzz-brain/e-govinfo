const mongoose = require("mongoose");
const Announcement = require("../models/Announcement");
const Feedback = require("../models/Feedback");

// GET /api/announcements (list, with filters/search)
exports.getAnnouncements = async (req, res) => {
  const { category, isUrgent, search } = req.query;
  let filter = {};
  if (category) filter.category = category;
  if (isUrgent) filter.isUrgent = isUrgent === "true";
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }
  const announcements = await Announcement.find(filter).sort({ createdAt: -1 });
  res.json({ announcements });
};

// GET /api/announcements/:id
exports.getAnnouncementById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid announcement ID" });
  }
  const announcement = await Announcement.findById(id);
  if (!announcement)
    return res.status(404).json({ error: "Announcement not found" });
  res.json({ announcement });
};

// POST /api/announcements (admin only)
exports.createAnnouncement = async (req, res) => {
  const { title, content, category, imageUrl, author, isUrgent } = req.body;
  if (!title || !content || !category || !author)
    return res.status(400).json({ error: "Missing required fields" });
  const announcement = await Announcement.create({
    title,
    content,
    category,
    imageUrl,
    author,
    isUrgent,
  });
  // Notify all users about new announcement
  const User = require("../models/User");
  const Notification = require("../models/Notification");
  const users = await User.find({}, "_id");
  const notifications = users.map((u) => ({
    userId: u._id,
    title: "New Announcement",
    body: `${title}: ${content}`,
    type: "announcement",
    actionUrl: `/announcement/${announcement._id}`,
  }));
  await Notification.insertMany(notifications);
  res.status(201).json({ announcement });
};

// PUT /api/announcements/:id (admin only)
exports.updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid announcement ID" });
  }
  const update = req.body;
  const announcement = await Announcement.findByIdAndUpdate(id, update, {
    new: true,
  });
  if (!announcement)
    return res.status(404).json({ error: "Announcement not found" });
  res.json({ announcement });
};

// GET /api/announcements/:id/feedback (admin only)
exports.getAnnouncementFeedback = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid announcement ID" });
  }
  // Only admin can view all feedback for an announcement
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Forbidden" });
  }
  const announcement = await Announcement.findById(id);
  if (!announcement) {
    return res.status(404).json({ error: "Announcement not found" });
  }
  const feedback = await Feedback.find({ referenceType: 'announcement', referenceId: id }).sort({ createdAt: -1 });
  res.json({ feedback });
};