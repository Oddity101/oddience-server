const catchAsyncErrors = require("../utils/catchAsyncErrors");

module.exports = catchAsyncErrors(async (req, res, next) => {
  console.log(req.body);
});
