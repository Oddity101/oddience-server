const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "mentor",
  },
  amount: {
    type: Number,
  },
  reference: {
    type: String,
  },
  status: {
    type: String,
    default: "pending",
  },
  dateInitialized: {
    type: Date,
    default: new Date(Date.now()),
  },
  transactionId: String,
});

module.exports = mongoose.model("withdrawal", withdrawalSchema);
