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
      verifyTransaction(transaction, transaction.mentor)
        .then(async (trans) => {
          transaction = trans;

          await transaction.save();
        })
        .catch((err) => {
          console.log(err);
          return next(new ErrorHandler("An error occurred", 500));
        });
    }

    res.status(200);
  }
});
