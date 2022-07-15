const express = require("express");
const paystackTransactionHook = require("../webhooks/paystackTransactionHook");

const router = express.Router();

router.route("/paystack/transaction/webhook").post(paystackTransactionHook);

module.exports = router;
