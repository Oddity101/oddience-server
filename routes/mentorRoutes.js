const express = require("express");
const {
  getMentor,
  getAllAppointments,
  updateAvailability,
  updateCompanyStage,
  getMentorDetails,
  updateProfile,
  createAppointment,
  createStripeConnectedAccount,
} = require("../controllers/mentorControllers");
const { isAuthenticated } = require("../middlewares/auth");
const router = express.Router();

router.route("/mentor/:token").get(getMentorDetails);
router.route("/admin/mentor").get(isAuthenticated, getMentor);
router
  .route("/mentor/availability")
  .post(isAuthenticated, updateAvailability);
router
  .route("/mentor/company-stage")
  .post(isAuthenticated, updateCompanyStage);
router
  .route("/mentor/profile/update")
  .put(isAuthenticated, updateProfile);
router.route("/onsched/appointments").get(getAllAppointments);
router.route("/mentor/appointment/create/:token").post(createAppointment);
router.route("/mentor/stripe/connect").get(isAuthenticated, createStripeConnectedAccount)

module.exports = router;
