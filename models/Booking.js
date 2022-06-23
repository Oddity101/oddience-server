const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.ObjectId,
    ref: "mentor",
  },
  dateCreated: {
    type: Date,
    default: new Date(Date.now()),
  },
  client: {
    name: String,
    email: {
      type: String,
    },
  },
  status: {
    type: String,
    default: "pending",
  },
});

module.exports = mongoose.model("booking", bookingSchema);
