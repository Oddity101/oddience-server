const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const coachSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  linkedInId: {
    type: String,
  },
  bio: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  pricePerSesh: {
    type: Number,
  },
  voiceBioUrl: {
    type: String,
  },
  skills: [
    {
      value: String,
      label: String,
    },
  ],
  role: String,
  uniqueID: String,
  onSchedResourceID: String,
  stripeAccountId: String,
  stripeAccountComplete: Boolean,
  companyStage: {},
  profileImageUrl: String,
  availability: {},
});

coachSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 15);
  }
});

coachSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME
  });
//   return jwt.sign(
//     {
//       exp: Math.floor(Date.now() / 1000) + 10,
//       id: this._id,
//     },
//     process.env.JWT_SECRET
//   );
};

coachSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("mentor", coachSchema);
