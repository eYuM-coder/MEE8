const mongoose = require("mongoose");

const dmsystem = mongoose.Schema({
  userId: { type: String },
  optedout: { type: String },
});

module.exports = mongoose.model("dmsystem", dmsystem);
