const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// GET /api/notifications?userId=...
exports.getNotifications = async (req, res) => {
	const userId = req.user?.id;
	if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
		return res.status(400).json({ error: 'Valid userId required' });
	}
	const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
	const total = notifications.length;
	const unread = notifications.filter(n => !n.read).length;
	const read = total - unread;
	res.json({ notifications, counts: { total, read, unread } });
};

// POST /api/notifications/send (admin/mock)
exports.sendNotification = async (req, res) => {
	const { title, body, type, userIds, actionUrl } = req.body;
	if (!title || !body || !type || !userIds || !Array.isArray(userIds) || userIds.length === 0)
		return res.status(400).json({ error: 'Missing required fields' });
	const notifications = await Notification.insertMany(
		userIds.map(userId => ({ title, body, type, userId, actionUrl }))
	);
	res.status(201).json({ notifications });
};

// PATCH /api/notifications/:id/read
exports.markNotificationRead = async (req, res) => {
	const { id } = req.params;
	const userId = req.user?.id;
	if (!mongoose.Types.ObjectId.isValid(id) || !userId || !mongoose.Types.ObjectId.isValid(userId)) {
		return res.status(400).json({ error: 'Invalid notification ID or user' });
	}
	// Ensure notification belongs to user
	const notification = await Notification.findOneAndUpdate(
		{ _id: id, userId },
		{ read: true },
		{ new: true }
	);
	if (!notification) return res.status(404).json({ error: 'Notification not found or not owned by user' });
	res.json({ notification });
};

