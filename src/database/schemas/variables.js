const mongoose = require("mongoose");

const variableSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // "variables" or "user_cache"
    vars: { type: Object, default: {} }, // Stores variables as key-value pairs (e.g., { "a": 5, "b": 10 })
    user_ids: { type: [String], default: [] } // Stores cached user IDs (["id_1", "id_2"])
}, { versionKey: false });

module.exports = mongoose.model("variables", variableSchema);
