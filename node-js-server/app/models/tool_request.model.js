const mongoose = require("mongoose");

const ToolRequest = mongoose.model(
  "ToolRequest",
  new mongoose.Schema({
    status: {type: String, default: "pending"},  // approved, rejected, pending, closed
    content: {type: String, default: ""},
    borrow_duration: {type: Number, required: true},
    expiration_date: {type: Date, required: true},
    date: {type: Date, required: true},
    owner_feedback: {type: Boolean, default: false},
    my_feedback: {type: Boolean, default: false},
    approval_date: {type: Date, required: false},
    tool:
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tool"
      },
    requestor:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
  })
);

module.exports = ToolRequest;