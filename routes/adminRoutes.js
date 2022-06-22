const express = require("express");
const {
  createAdminUser,
  adminLogin,
} = require("../controllers/adminControllers");

const router = express.Router();

router.route("/admin/new").post(createAdminUser);
router.route("/admin/login").post(adminLogin);

module.exports = router;
