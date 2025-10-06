const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const feedbackController = require("../controllers/feedback.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate");

// GET /api/feedback?userId=...
router.get("/", authMiddleware, feedbackController.getFeedback);

// POST /api/feedback
router.post(
  "/",
  authMiddleware,
  [
    body("type")
      .isIn(["feedback", "complaint"])
      .withMessage("Type is required"),
    body("title").isString().notEmpty().withMessage("Title is required"),
    body("description")
      .isString()
      .notEmpty()
      .withMessage("Description is required"),
    body("category").isString().notEmpty().withMessage("Category is required"),
    body("isAnonymous").optional().isBoolean(),
    body("attachment").optional().isString(),
    body("rating").optional().isNumeric(),
  ],
  validate,
  feedbackController.createFeedback
);

// GET /api/feedback/:id
router.get("/:id", authMiddleware, feedbackController.getFeedbackById);

// PUT /api/feedback/:id/status (admin only)
router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    body("status")
      .isIn(["submitted", "under_review", "resolved", "closed"])
      .withMessage("Status is required"),
  ],
  validate,
  feedbackController.updateFeedbackStatus
);

module.exports = router;
