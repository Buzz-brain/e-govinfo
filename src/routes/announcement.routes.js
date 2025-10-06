const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const announcementController = require('../controllers/announcement.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate');

// GET /api/announcements (list, filters, search)
router.get('/', announcementController.getAnnouncements);

// GET /api/announcements/:id
router.get('/:id', announcementController.getAnnouncementById);

// POST /api/announcements (admin only)
router.post(
	'/',
	authMiddleware,
	roleMiddleware(['admin']),
	[
		body('title').isString().notEmpty().withMessage('Title is required'),
		body('content').isString().notEmpty().withMessage('Content is required'),
		body('category').isString().notEmpty().withMessage('Category is required'),
		body('author').isString().notEmpty().withMessage('Author is required'),
		// body('imageUrl').optional().isURL().withMessage('Image URL must be valid'),
		body('isUrgent').optional().isBoolean()
	],
	validate,
	announcementController.createAnnouncement
);

// PUT /api/announcements/:id (admin only)
router.put(
	'/:id',
	authMiddleware,
	roleMiddleware(['admin']),
	[
		body('title').optional().isString().notEmpty(),
		body('content').optional().isString().notEmpty(),
		body('category').optional().isString().notEmpty(),
		body('author').optional().isString().notEmpty(),
		// body('imageUrl').optional().isURL(),
		body('isUrgent').optional().isBoolean()
	],
	validate,
	announcementController.updateAnnouncement
);

// GET /api/announcements/:id/feedback (admin only)
router.get(
  "/:id/feedback",
  authMiddleware,
  roleMiddleware(["admin"]),
  announcementController.getAnnouncementFeedback
);

module.exports = router;
