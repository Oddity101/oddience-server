const connectDatabase = require("../config/connectDatabase");
const catchAsyncErrors = require("./catchAsyncErrors");
const skills = require("./skills");
const Skill = require("../models/Skill");
require("dotenv").config({ path: "./config/config.env" });

const seed = catchAsyncErrors(async () => {
  await connectDatabase();

  skills.forEach(async (skill, i) => {
    await Skill.create({
      skill,
      formSkill: { label: skill, value: skill },
      status: "active",
      createdBy: "hello@oddience.co"
    });
    console.log(i);
  });
});

seed();
