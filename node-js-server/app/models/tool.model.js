const mongoose = require("mongoose");

const Tool = mongoose.model(
  "Tool",
  new mongoose.Schema({
    name: {type: String, required: true},
    manufacturing_date: {type: String, required: true},
    status: {type: String, required: true},  // 'avaialable', 'loaned', 'not available', 'broken'
    max_time_borrow: {type: String, required: true},
    categories: {type: String, default: ''},
    producer: {type: String, default: ''},
    description: {type: String, default: ''},
    owner:
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
  })
);

module.exports = Tool;