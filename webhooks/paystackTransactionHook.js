const catchAsyncErrors = require("../utils/catchAsyncErrors");
const Transaction = require("../models/Transaction");
const Mentor = require("../models/Mentor");
const verifyTransaction = require("../utils/verifyTransaction");
const ErrorHandler = require("../utils/ErrorHandler");

module.exports = catchAsyncErrors(async (req, res, next) => {
  if (req.body.event === "charge.success") {
    let transaction = await Transaction.findOne({
      token: req.body.data.reference,
    }).populate("mentor");

    if (transaction.status !== "paid") {
      const res = await verifyTransaction(transaction, transaction.mentor);

      if (res.err) {
        return next(new ErrorHandler("An error occurred", 500));
      }

      transaction = res.transaction;
    }

    res.status(200);
  }
});
