const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.role = require("./role.model");
db.organization_code = require("./organization_code.model");
db.tool = require("./tool.model");
db.tool_request = require("./tool_request.model");
db.notification = require("./notification.model");

db.ROLES = ["user", "admin"];

module.exports = db;