const mongoose = require("mongoose");
const validator = require("validator");

const skillSchema = new mongoose.Schema({
  skill: {
    type: String,
    required: true,
    unique: true,
  },
  formSkill: {
    value: String,
    label: String,
  },
  status: {
    type: String,
    default: "reviewing",
  },
  dateCreated: {
    type: Date,
    default: new Date(Date.now()),
  },
  createdBy: {
    type: String,
    validate: [validator.isEmail, "Please use a valid email"],
    required: true,
  },
});

module.exports = mongoose.model("skill", skillSchema);
