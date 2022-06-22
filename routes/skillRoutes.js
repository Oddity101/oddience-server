const express = require("express");
const {
  getAllSkills,
  checkSkill,
  addSkill,
  updateSkill,
} = require("../controllers/skillControllers");
const { isAuthenticated, isAuthorized } = require("../middlewares/auth");

const router = express.Router();

router.route("/skills").get(isAuthenticated, getAllSkills);
router.route("/skills/check").post(checkSkill);
router.route("/skills/add").post(addSkill);
router
  .route("/skills/update/:skillId")
  .put(isAuthenticated, isAuthorized("admin"), updateSkill);

module.exports = router;
