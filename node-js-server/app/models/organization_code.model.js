const mongoose = require("mongoose");

const OrganizationCode = mongoose.model(
  "OrganizationCode",
  new mongoose.Schema({
    organization_code: String
  })
);

module.exports = OrganizationCode;
