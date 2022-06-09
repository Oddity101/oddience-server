const express = require("express");
const {
  createUser,
  checkEmail,
  mentorLogin,
  getLinkedInDetails,
  forgotPassword,
  resetPassword,
} = require("../controllers/authControllers");

const router = express.Router();

router.route("/user/new").post(createUser);
router.route("/user/check/email").post(checkEmail);
router.route("/user/check/username").post(checkUsername);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").post(resetPassword);
router.route("/mentor/login").post(mentorLogin);
router.route("/mentor/linkedIn").post(getLinkedInDetails);

module.exports = router;
