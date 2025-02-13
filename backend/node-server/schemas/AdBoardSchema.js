const mongoose = require('mongoose');

const AdBoardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  ads: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ad"
  }]
}, {
  timestamps: true
});

// Export the model so that AdBoard.findOne becomes available
module.exports = mongoose.model("AdBoard", AdBoardSchema);
