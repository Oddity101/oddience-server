const Admin = require("../models/Admin");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const sendAdminJWT = require("../utils/sendAdminJWT");

exports.createAdminUser = catchAsyncErrors(async (req, res, next) => {
  const { username, password } = req.body;

  if ((!username, !password)) {
    return next(new ErrorHandler("Please enter all required details", 400));
  }

  await Admin.create({
    username,
    password,
  });

  res.status(200).json({
    success: true,
  });
});

exports.adminLogin = catchAsyncErrors(async (req, res, next) => {
  let { username, password } = req.body;

  username = username.trim();

  if ((!username, !password)) {
    return next(new ErrorHandler("Please enter all required details", 400));
  }

  const admin = await Admin.findOne({ username });

  if (!admin) {
    return next(new ErrorHandler("User not found", 400));
  }

  const passwordMatched = await admin.comparePassword(password);

  if (!passwordMatched) {
    return next(new ErrorHandler("Incorrect password", 400));
  }

  sendAdminJWT(admin, 200, res);
});
