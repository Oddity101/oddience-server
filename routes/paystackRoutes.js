const express = require("express");
const {
  getCountries,
  getBanks,
  saveAccDetails,
} = require("../controllers/paystackControllers");
const { isAuthenticated } = require("../middlewares/auth");

const router = express.Router();

router.route("/paystack/countries").get(getCountries);
router.route("/paystack/banks").get(getBanks);
router.route("/paystack/bank/new").post(isAuthenticated, saveAccDetails);

module.exports = router;
