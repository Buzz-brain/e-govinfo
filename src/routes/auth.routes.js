
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require("../middlewares/auth.middleware");
const rateLimiter = require('../middlewares/rateLimiter');

// POST /auth/register
router.post('/register', rateLimiter, authController.register);

// POST /auth/login
router.post('/login', rateLimiter, authController.login);

// POST /auth/guest
router.post('/guest', authController.guestLogin);

// GET /auth/me
// Exclude /auth/me from rate limiter for frequent calls
router.get("/me", authMiddleware, authController.me);

// POST /auth/logout
router.post('/logout', authController.logout);

module.exports = router;
