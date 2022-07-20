const express = require("express");
const {
  createUser,
  checkEmail,
  checkUsername,
  mentorLogin,
  getLinkedInDetails,
  forgotPassword,
  resetPassword,
  verifyUser,
  resendVerificationMail,
} = require("../controllers/authControllers");

const router = express.Router();

router.route("/user/new").post(createUser);
router.route("/mentor/verify").post(verifyUser);
router.route("/mentor/resend/verify").post(resendVerificationMail);
router.route("/user/check/email").post(checkEmail);
router.route("/user/check/username").post(checkUsername);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").post(resetPassword);
router.route("/mentor/login").post(mentorLogin);
router.route("/mentor/linkedIn").post(getLinkedInDetails);

module.exports = router;
