const express = require("express");
const {
  getAllSkills,
  checkSkill,
  addSkill,
  updateSkill,
} = require("../controllers/skillControllers");
const { isAuthenticated } = require("../middlewares/auth")

const router = express.Router();

router.route("/skills").get(getAllSkills);
router.route("/skills/check").post(checkSkill);
router.route("/skills/add").post(addSkill);
router.route("/skills/update/:skillId").put(updateSkill);

module.exports = router;
