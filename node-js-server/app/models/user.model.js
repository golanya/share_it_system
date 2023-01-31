const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    fname: {type: String, required: true},
    lname: {type: String, required: true},
    phone: {type: String, required: true},
    job: {type: String, required: false},
    description: {type: String, required: false},
    rank: {type: Number, default: 1},
    is_suspended: {type: Boolean, default: false},
    is_deleted: {type: Boolean, default: false},
    allow_emails: {type: Boolean, default: false},
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role"
      }
    ]
  })
);

module.exports = User;
