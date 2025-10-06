
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require('../middlewares/validate');

// GET /api/users/guests (admin only)
router.get('/guests', authMiddleware, roleMiddleware(['admin']), userController.getAllGuests);

// GET /api/users/:id
router.get('/:id', authMiddleware, userController.getUserById);

// PUT /api/users/:id (profile update)
router.put(
	'/:id',
	authMiddleware,
	[
		body('fullName').optional().isString(),
		body('email').optional().isEmail(),
		body('phone').optional().isString(),
		body('region').optional().isString(),
		body('address').optional().isString(),
		body('avatar').optional().isString()
	],
	validate,
	userController.updateUserProfile
);

// PUT /api/users/:id/password (change password)
router.put(
	'/:id/password',
	authMiddleware,
	[
		body('oldPassword').isString().notEmpty().withMessage('Old password required'),
		body('newPassword').isString().isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
	],
	validate,
	userController.changeUserPassword
);

// GET /api/users (admin only)
router.get('/', authMiddleware, roleMiddleware(['admin']), userController.getAllUsers);

module.exports = router;
