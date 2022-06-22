const axios = require("axios");
const Withdrawal = require("../models/Withdrawal");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const capitalize = require("../utils/capitalize");
const Flutterwave = require("flutterwave-node-v3");
const flw = new Flutterwave(
  `FLWPUBK_TEST-5adf6eef76571dfea7e25bb03b10966e-X`,
  `FLWSECK_TEST-ea14ce925a08f3cf7e1e2a67bee5650e-X`
);

exports.getBanks = catchAsyncErrors(async (req, res, next) => {
  await axios
    .get(`https://api.flutterwave.com/v3/banks/${req.params.country}`, {
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
    })
    .then((response) => {
      const banks = response.data.data;

      res.status(200).json({
        success: true,
        count: banks.length,
        banks,
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

exports.getBankBranches = catchAsyncErrors(async (req, res, next) => {
  await axios
    .get(`https://api.flutterwave.com/v3/banks/${req.params.bankId}/branches`, {
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
    })
    .then((response) => {
      const branches = response.data.data;

      res.status(200).json({
        success: true,
        count: branches.length,
        branches,
      });
    })
    .catch((error) => {
      console.log(error.response.data);
      if (
        error.response.data.message ===
        "No branches found for specified bank id"
      ) {
        res.status(200).json({
          success: false,
        });
      }
    });
});

exports.saveAccDetails = catchAsyncErrors(async (req, res, next) => {
  const mentor = req.user;

  let { bank, accNo, branch, country } = req.body;

  if (!bank || !accNo || !country) {
    return next(new ErrorHandler("An error occurred", 500));
  }

  mentor.flutterwaveBankDetails = {
    bank,
    accNo,
    country,
    branch,
    accBalance: mentor.flutterwaveBankDetails.accBalance,
  };

  mentor.usingFlutterwave = true;

  await mentor.save();

  res.status(200).json({
    success: true,
  });
});

// /api/v1/flutterwave/withdraw
exports.withdraw = catchAsyncErrors(async (req, res, next) => {
  const mentor = req.user;
  const amount = Number(req.body.amount);
  const prevBal = mentor.flutterwaveBankDetails.accBalance;

  const bank = mentor.flutterwaveBankDetails;

  if (mentor.lastWithdrawalPending) {
    return next(
      new ErrorHandler(
        "Your last withdrawal is pending. You cannot initiate another withdrawal until that is resolved",
        401
      )
    );
  }

  if (prevBal < amount) {
    return next(
      new ErrorHandler(
        "You do not have sufficient funds for this withdrawal",
        401
      )
    );
  }

  const details = {
    account_bank: bank.bank.id,
    account_number: bank.accNo,
    amount,
    currency: "NGN",
    full_name: `${capitalize(mentor.firstName)} ${capitalize(mentor.lastName)}`,
    debit_currency: "USD",
    narration: `Withdrawal by ${capitalize(mentor.firstName)} ${capitalize(
      mentor.lastName
    )} on ${new Date(Date.now()).toString()}`,
  };
  flw.Transfer.initiate(details)
    .then(async (response) => {
      const withdrawal = await Withdrawal.create({
        mentor: mentor._id,
        amount,
        reference: response.data.reference,
        transactionId: response.data.id,
      });
      mentor.lastWithdrawalPending = true;
      if (mentor.withdrawals && mentor.withdrawals.length > 0) {
        mentor.withdrawals.push(withdrawal._id);
      } else {
        mentor.withdrawals = [withdrawal._id];
      }
      await mentor.save();
      console.log(response);
    })
    .catch((error) => {
      console.log(error);
    });
});
