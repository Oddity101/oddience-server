const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  stripeTransactionId: {
    type: String,
  },
  stripePaymentIntent: {
    type: String,
  },
  mentor: {
    type: mongoose.Schema.ObjectId,
    ref: 'mentor'
  },
  token: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'pending'
  },
  dateInitialized: {
    type: Date,
    default: new Date(Date.now()),
  },
  onSchedAppointmentId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("transaction", transactionSchema);
