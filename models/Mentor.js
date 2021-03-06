const mongoose = require("mongoose");
const crypto = require("crypto");
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
      type: mongoose.Schema.ObjectId,
      ref: "skill",
    },
  ],
  role: String,
  bookings: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "booking",
    },
  ],
  transactions: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "transaction",
    },
  ],
  uniqueID: String,
  username: {
    type: String,
    required: true,
  },
  dateCreated: {
    type: Date,
    default: new Date(Date.now()),
  },
  onSchedResourceID: String,
  stripeAccountId: String,
  stripeAccountComplete: Boolean,
  usingFlutterwave: {
    type: Boolean,
    default: false,
  },
  flutterwaveBankDetails: {
    accNo: String,
    accBalance: Number,
    country: String,
    bank: {
      id: Number,
      code: String,
      name: String,
    },
    branch: {
      bank_id: Number,
      bic: mongoose.Schema.Types.Mixed,
      branch_code: String,
      branch_name: String,
      id: Number,
      swift_code: mongoose.Schema.Types.Mixed,
    },
  },
  paystackBankDetails: {
    country: String,
    bank: {},
    subaccount_details: {
      business_name: String,
      accNo: String,
      subaccount_code: String,
    },
  },
  usingPaystack: Boolean,
  companyStage: {},
  profileImageUrl: String,
  availability: {},
  withdrawals: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "withdrawal",
    },
  ],
  lastWithdrawalPending: {
    type: Boolean,
    default: false,
  },
  lastWithdrawalFailed: {
    type: Boolean,
    default: false,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verifyToken: String,
});

coachSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 15);
  }
});

coachSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME,
  });
};

coachSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate reset password token
coachSchema.methods.getResetPasswordToken = async function () {
  // Generate token
  const resetToken = await crypto.randomBytes(20).toString("hex");

  // Hash and set to resetPasswordToken
  this.resetPasswordToken = await crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set resetPasswordExpire
  this.resetPasswordExpires = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("mentor", coachSchema);
