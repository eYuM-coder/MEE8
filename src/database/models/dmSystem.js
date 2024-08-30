const mongoose = require("mongoose");

const dmsystem = mongoose.Schema({
  userID: { type: String },
  optedout: { type: Boolean },
});

module.exports = mongoose.model("dmsystem", dmsystem);
