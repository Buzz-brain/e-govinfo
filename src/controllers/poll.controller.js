const Poll = require('../models/Poll');
const mongoose = require('mongoose');

// GET /api/polls
exports.getPolls = async (req, res) => {
	const polls = await Poll.find().sort({ createdAt: -1 });
	res.json({ polls });
};

// GET /api/polls/:id
exports.getPollById = async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ error: 'Invalid poll ID' });
	}
	const poll = await Poll.findById(id);
	if (!poll) return res.status(404).json({ error: 'Poll not found' });
	res.json({ poll });
};

// POST /api/polls/:id/vote
exports.votePoll = async (req, res) => {
	const { id } = req.params;
	const { answers } = req.body;
	const userId = req.user ? req.user.id : null;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ error: 'Invalid poll ID' });
	}
	if (!userId) return res.status(401).json({ error: 'Authentication required' });
	const poll = await Poll.findById(id);
	if (!poll) return res.status(404).json({ error: 'Poll not found' });
	if (!poll.isActive || new Date() > poll.endDate) {
		return res.status(400).json({ error: 'Poll is not active or has ended' });
	}
	if (poll.voters.includes(userId)) {
		return res.status(409).json({ error: 'User has already voted' });
	}
	poll.voters.push(userId);
	poll.votes.push({ userId, answers });
	await poll.save();
	res.json({ message: 'Vote submitted successfully' });
};

// POST /api/polls (admin only)
exports.createPoll = async (req, res) => {
	const { title, description, questions, endDate } = req.body;
	if (!title || !description || !questions || !endDate)
		return res.status(400).json({ error: 'Missing required fields' });
	if (!Array.isArray(questions) || questions.length === 0)
		return res.status(400).json({ error: 'Questions must be a non-empty array' });
	for (const q of questions) {
		if (!q.text || !q.type) {
			return res.status(400).json({ error: 'Each question must have text and type' });
		}
		if ((q.type === 'single_choice' || q.type === 'multiple_choice') && (!Array.isArray(q.options) || q.options.length === 0)) {
			return res.status(400).json({ error: 'Choice questions must have non-empty options array' });
		}
	}
	const poll = await Poll.create({
		title,
		description,
		questions,
		endDate,
		isActive: true
	});
	// Notify all users about new poll
	const User = require('../models/User');
	const Notification = require('../models/Notification');
	const users = await User.find({}, '_id');
	const notifications = users.map(u => ({
	  userId: u._id,
	  title: 'New Poll',
	  body: `${title}: ${description}`,
	  type: 'poll',
	  actionUrl: `/poll/${poll._id}`
	}));
	await Notification.insertMany(notifications);
	res.status(201).json({ poll });
};

// GET /api/polls/:id/results
exports.getPollResults = async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).json({ error: 'Invalid poll ID' });
	}
	const poll = await Poll.findById(id);
	if (!poll) return res.status(404).json({ error: 'Poll not found' });
	// Aggregate results
	const results = poll.questions.map((q, idx) => {
		if (q.type === 'single_choice' || q.type === 'multiple_choice') {
			// Count votes for each option
			const optionCounts = q.options.map(opt => ({ option: opt, count: 0 }));
			poll.votes.forEach(vote => {
				const answer = vote.answers[idx];
				if (q.type === 'single_choice' && typeof answer === 'string') {
					const i = q.options.indexOf(answer);
					if (i >= 0) optionCounts[i].count++;
				} else if (q.type === 'multiple_choice' && Array.isArray(answer)) {
					answer.forEach(ans => {
						const i = q.options.indexOf(ans);
						if (i >= 0) optionCounts[i].count++;
					});
				}
			});
			return {
				question: q.text,
				type: q.type,
				options: optionCounts
			};
		} else {
			// For text questions, collect all answers
			const answers = poll.votes.map(vote => vote.answers[idx]).filter(a => !!a);
			return {
				question: q.text,
				type: q.type,
				answers
			};
		}
	});
	res.json({ pollId: poll._id, results });
};

// GET /api/polls/:id/has-voted
exports.hasVotedPoll = async (req, res) => {
	const { id } = req.params;
	const userId = req.user ? req.user.id : null;
	if (!mongoose.Types.ObjectId.isValid(id) || !userId) {
		return res.status(400).json({ error: 'Invalid poll ID or user' });
	}
	const poll = await Poll.findById(id);
	if (!poll) return res.status(404).json({ error: 'Poll not found' });
	const hasVoted = poll.voters.map(v => v.toString()).includes(userId.toString());
	res.json({ hasVoted });
};