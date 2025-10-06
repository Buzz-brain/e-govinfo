const User = require('../models/User');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// GET /api/users/:id
exports.getUserById = async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ error: 'Invalid user ID' });
	}
	const user = await User.findById(id).select('-password');
	if (!user) return res.status(404).json({ error: 'User not found' });
	res.json({ user });
};

// PUT /api/users/:id (profile update)
exports.updateUserProfile = async (req, res) => {
	console.log(req.body)
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ error: 'Invalid user ID' });
	}
	// Only allow user to update their own profile
	if (!req.user || req.user.id !== id) {
		return res.status(403).json({ error: 'Forbidden' });
	}
	const allowedFields = ['fullName', 'email', 'phone', 'region', 'address', 'avatar'];
	const update = {};
	for (const field of allowedFields) {
		if (req.body[field] !== undefined) update[field] = req.body[field];
	}
	// Prevent email/phone duplication
	if (update.email) {
		const exists = await User.findOne({ email: update.email, _id: { $ne: id } });
		if (exists) return res.status(409).json({ error: 'Email already in use' });
	}
	if (update.phone) {
		const exists = await User.findOne({ phone: update.phone, _id: { $ne: id } });
		if (exists) return res.status(409).json({ error: 'Phone already in use' });
	}
	const user = await User.findByIdAndUpdate(id, update, { new: true, select: '-password' });
	res.json({ user });
};

// PUT /api/users/:id/password (change password)
exports.changeUserPassword = async (req, res) => {
	const { id } = req.params;
	const { oldPassword, newPassword } = req.body;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ error: 'Invalid user ID' });
	}
	if (!req.user || req.user.id !== id) {
		return res.status(403).json({ error: 'Forbidden' });
	}
	if (!oldPassword || !newPassword) {
		return res.status(400).json({ error: 'Both old and new password required' });
	}
	const user = await User.findById(id);
	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}
	const match = await bcrypt.compare(oldPassword, user.password);
	if (!match) {
		return res.status(401).json({ error: 'Old password incorrect' });
	}
	user.password = await bcrypt.hash(newPassword, 10);
	await user.save();
	res.json({ message: 'Password updated successfully' });
};

// GET /api/users (admin only) - fetch all users
exports.getAllUsers = async (req, res) => {
	if (!req.user || req.user.role !== 'admin') {
		return res.status(403).json({ error: 'Forbidden' });
	}
	const users = await User.find().select('-password');
	res.json({ users });
};

// GET /api/users/guests (admin only) - fetch all guests
exports.getAllGuests = async (req, res) => {
	if (!req.user || req.user.role !== 'admin') {
		return res.status(403).json({ error: 'Forbidden' });
	}
	const guests = await User.find({ role: 'guest' }).select('-password');
	res.json({ guests });
};