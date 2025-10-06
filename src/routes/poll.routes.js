const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const pollController = require('../controllers/poll.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate');

// GET /api/polls
router.get('/', pollController.getPolls);

// GET /api/polls/:id
router.get('/:id', pollController.getPollById);

// POST /api/polls (admin only)
router.post(
	'/',
	authMiddleware,
	roleMiddleware(['admin']),
	[
		body('title').isString().notEmpty().withMessage('Title is required'),
		body('description').isString().notEmpty().withMessage('Description is required'),
		body('questions').isArray({ min: 1 }).withMessage('Questions must be a non-empty array'),
		body('questions.*.text').isString().notEmpty().withMessage('Each question must have text'),
		body('questions.*.type').isIn(['single_choice', 'multiple_choice', 'text']).withMessage('Invalid question type'),
		body('questions.*.options').optional().isArray(),
		body('endDate').isISO8601().withMessage('End date must be a valid ISO date')
	],
	validate,
	pollController.createPoll
);

// POST /api/polls/:id/vote
router.post(
	'/:id/vote',
	authMiddleware,
	[
		body('answers').isArray({ min: 1 }).withMessage('Answers must be a non-empty array')
	],
	validate,
	pollController.votePoll
);

// GET /api/polls/:id/results
router.get('/:id/results', pollController.getPollResults);

// GET /api/polls/:id/has-voted
router.get('/:id/has-voted', authMiddleware, pollController.hasVotedPoll);

module.exports = router;
