const express = require("express");
const {
  getBanks,
  getBankBranches,
  saveAccDetails,
  withdraw,
} = require("../controllers/flutterwaveCountrollers");
const { isAuthenticated } = require("../middlewares/auth");

const router = express.Router();

router.route("/flutterwave/banks/:country").get(getBanks);
router.route("/flutterwave/banks/:bankId/branches").get(getBankBranches);
router.route("/flutterwave/bank/new").post(isAuthenticated, saveAccDetails);
router.route("/flutterwave/withdraw").post(isAuthenticated, withdraw);

module.exports = router;
