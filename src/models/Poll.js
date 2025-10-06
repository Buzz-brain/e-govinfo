const mongoose = require('mongoose');

const pollQuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['single_choice', 'multiple_choice', 'text'], required: true },
  options: [String]
});

const pollSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  questions: [pollQuestionSchema],
  createdAt: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  votes: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answers: [mongoose.Schema.Types.Mixed]
  }]
});

module.exports = mongoose.model('Poll', pollSchema);
