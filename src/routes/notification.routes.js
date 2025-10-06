const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate');

// GET /api/notifications?userId=...
router.get(
	'/',
	authMiddleware,
	validate,
	notificationController.getNotifications
);

// POST /api/notifications/send (admin/mock)
router.post(
	'/send',
	authMiddleware,
	roleMiddleware(['admin']),
	[
		body('title').isString().notEmpty().withMessage('Title is required'),
		body('body').isString().notEmpty().withMessage('Body is required'),
		body('type').isString().notEmpty().withMessage('Type is required'),
		body('userIds').isArray({ min: 1 }).withMessage('userIds must be a non-empty array'),
		body('actionUrl').optional().isString()
	],
	validate,
	notificationController.sendNotification
);

// PATCH /api/notifications/:id/read
router.patch(
	'/:id/read',
	authMiddleware,
	[
		param('id').isString().notEmpty().withMessage('Notification ID is required')
	],
	validate,
	notificationController.markNotificationRead
);

module.exports = router;
