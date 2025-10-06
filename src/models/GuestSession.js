const mongoose = require("mongoose");

const guestSessionSchema = new mongoose.Schema({
  name: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GuestSession", guestSessionSchema);
