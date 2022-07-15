const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
  },
  transactionId: {
    type: String,
  },
  stripePaymentIntent: {
    type: String,
  },
  mentor: {
    type: mongoose.Schema.ObjectId,
    ref: "mentor",
  },
  token: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "pending",
  },
  date: {
    type: Date,
  },
  dateInitialized: {
    type: Date,
    default: new Date(Date.now()),
  },
  onSchedAppointmentId: {
    type: String,
    required: true,
  },
  medium: String,
});

module.exports = mongoose.model("transaction", transactionSchema);
