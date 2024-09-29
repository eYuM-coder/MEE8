const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: { type: String },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  messageTimeout: { type: Date, default: Date.now },
  username: { type: String, required: true },
  background: {
    type: String,
    default:
      "https://img.freepik.com/premium-photo/abstract-blue-black-gradient-plain-studio-background_570543-8893.jpg",
  },
});

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  levelingEnabled: { type: Boolean, default: true },
  users: [userSchema],
});

module.exports = mongoose.model("levels", guildSchema);
