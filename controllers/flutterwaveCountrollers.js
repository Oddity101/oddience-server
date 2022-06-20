const axios = require("axios");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");

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
  };

  mentor.usingFlutterwave = true;

  await mentor.save();

  res.status(200).json({
    success: true,
  });
});
