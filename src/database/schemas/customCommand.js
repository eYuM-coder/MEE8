const mongoose = require('mongoose');

const embedSchema = new mongoose.Schema({
  title: String,
  description: String,
  color: String,
  footer: String,
  thumbnail: String,
  image: String,
  timestamp: String,
});

const customCommandSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  json: {
    type: Object, // Change from String to Object
    default: null, // Set default as null instead of false
  },
  content: {
    type: String,
    required: true,
  },
  embed: embedSchema, // Use a subdocument for embeds
});

module.exports = mongoose.model('CustomCommand', customCommandSchema);
