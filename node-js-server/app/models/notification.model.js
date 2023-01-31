const mongoose = require("mongoose");

const Notification = mongoose.model(
  "Notification",
  new mongoose.Schema({
    content: { type: String, required: true },
    link:    {type: String},
    date:    { type: Date, required: true },
    seen:    {type: Boolean, default: false},
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Notification without recipient is visible for everyone
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Notification without request can be uset to admin broadcast messages
    }
  })
);

module.exports = Notification;
