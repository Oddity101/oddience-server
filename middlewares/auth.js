const jsonwebtoken = require("jsonwebtoken");
const Mentor = require("../models/Mentor");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");

// Checks if user is authenticated or not
exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.headers;


  if (!token) {
    return next(
      new ErrorHandler("You must be logged in to access this feature", 400)
    );
  }

  jsonwebtoken.verify(
    token,
    process.env.JWT_SECRET,
    {
      ignoreExpiration: false,
    },
    async function (err, decoded){
      if (err) {
          console.log(err);
          return next(new ErrorHandler(err.message, 400))
    }
      // console.log((decoded.exp - decoded.iat)/(1000 * 60 * 60))

      req.user = await Mentor.findById(decoded.id).populate('skills');


      next();
    }
  );
});

// Check if user is authorized for this feature

exports.isAuthorized = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler("You are not authorized to use this feature", 403)
      );
    }
    next();
  };
};
