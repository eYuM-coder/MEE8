const mongoose = require("mongoose");

const variableSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // "variables" or "user_cache"
    vars: { type: Object, default: {} },
    user_ids: { type: [String], default: [] } // Stores cached user IDs (["id_1", "id_2"])
}, { versionKey: false });

module.exports = mongoose.model("variables", variableSchema);
