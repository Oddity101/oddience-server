const Skill = require("../models/Skill");
const Mentor = require("../models/Mentor");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const capitalize = require("../utils/capitalize");
const sendMail = require("../utils/sendMail");

// GET - /api/v1/skills?filter=review/all/rejected
exports.getAllSkills = catchAsyncErrors(async (req, res, next) => {
  let skills;
  if (req.query.filter === "review") {
    skills = await Skill.find({ status: "reviewing" });
  } else if (req.query.filter === "rejected") {
    skills = await Skill.find({ status: "rejected" });
  } else {
    skills = await Skill.find({ status: "active" });
  }

  const formSkills = [];

  skills.forEach((skill, i) => {
    formSkills.push({
      ...skill.formSkill,
      index: i
    });
  });

  res.status(200).json({
    success: true,
    count: formSkills.length,
    formSkills,
    skillIds: skills.map((skill) => skill._id),
  });
});

// POST - /api/v1/skills/check
exports.checkSkill = catchAsyncErrors(async (req, res, next) => {
  const skill = await Skill.findOne({ skill: req.body.skill });

  if (!skill || !skill.status === "active") {
    return next(
      new ErrorHandler(
        "Skill not on database. You can add it and after review it will be added to your profile",
        400
      )
    );
  }
  res.status(200).json({
    success: true,
  });
});

// POST - /api/v1/skills/add
exports.addSkill = catchAsyncErrors(async (req, res, next) => {
  const user = req.body.email;
  const newSkill = req.body.skill;

  await Skill.create({
    skill: newSkill.value,
    createdBy: user,
    formSkill: newSkill,
  });

  res.status(200).json({
    success: true,
  });
});

// PUT - /api/v1/skills/update/:skillId?action=accept/reject
exports.updateSkill = catchAsyncErrors(async (req, res, next) => {
  const skill = await Skill.findById(req.params.skillId);

  if (!skill) {
    return next(new ErrorHandler("Skill not found", 400));
  }

  const mentor = await Mentor.findOne({ email: skill.createdBy });

  if (req.query.action === "accept") {
    skill.status = "active";

    await skill.save();

    // Details of the mail to be sent to the user email
    const mailDetails = {
      from: `"Oddience" <${process.env.EMAIL_ADDRESS}>`,
      to: mentor.email,
      subject: "Topic Update",
      text: `Hey ${capitalize(
        mentor.firstName
      )}\n\nThe following topic(s) have been added to our database and will now be displayed on your dashboard and also be available for other coaches to select.\n${
        skill.skill
      }.\n\nThank you for your contribution to the Oddience collective`,
    };

    try {
      await sendMail(mailDetails);
      return res.status(200).json({
        success: true,
      });
    } catch (err) {
      console.log(err);
    }
  }

  if (req.query.action === "reject") {
    skill.status = "rejected";

    await skill.save();

    // Details of the mail to be sent to the user email
    const mailDetails = {
      from: `"Oddience" <${process.env.EMAIL_ADDRESS}>`,
      to: mentor.email,
      subject: "Topic Update",
      text: `Hey ${capitalize(
        mentor.firstName
      )}\n\nUnfortunately, after review the following topic was not accepted to the Oddience database.\n${
        skill.skill
      }.\n\nYou can attempt at adding another via your dashboard.\nThanks!`,
    };

    try {
      await sendMail(mailDetails);
      return res.status(200).json({
        success: true,
      });
    } catch (err) {
      console.log(err);
    }

    return res.status(200).json({
      success: true,
    });
  }
});
