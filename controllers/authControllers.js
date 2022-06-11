const axios = require("axios");
const crypto = require("crypto");
const validator = require("validator");
const qs = require("qs");
const createSIBContact = require("../utils/createSIBContact");
const Mentor = require("../models/Mentor");
const Skill = require("../models/Skill");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const sendMail = require("../utils/sendMail");
const ErrorHandler = require("../utils/ErrorHandler");
const sendJwt = require("../utils/sendJwt");
const referralCodes = require("referral-codes");
const capitalize = require("../utils/capitalize");
const authorizeOnSched = require("../utils/authorizeOnSched");

// api/v1/user/check/email
exports.checkEmail = catchAsyncErrors(async (req, res, next) => {
  const user = await Mentor.findOne({ email: req.body.email });

  if (user) {
    return next(new ErrorHandler("User already exists", 400));
  }

  res.status(200).json({
    success: true,
  });
});

// api/v1/user/check/username
exports.checkUsername = catchAsyncErrors(async (req, res, next) => {
  const user = await Mentor.findOne({ username: req.body.username });

  if (user) {
    return next(
      new ErrorHandler(
        "That username is not available. Please try another",
        400
      )
    );
  }

  res.status(200).json({
    success: true,
    message: "Available",
  });
});

// /api/v1/user/coach/create
exports.createUser = catchAsyncErrors(async (req, res, next) => {
  let {
    firstName,
    lastName,
    password,
    confirmPassword,
    email,
    bio,
    role,
    skills,
    pricePerSesh,
    profileImageUrl,
    linkedInId,
    username,
  } = req.body;
  // console.log(profileImageUrl)
  firstName = firstName.trim().toLowerCase();
  lastName = lastName.trim().toLowerCase();
  email = email.trim();
  bio = bio.trim();
  username = username.trim();

  if (!username || !/^[A-Za-z0-9._~()'!*:@,;+?-]*$/g.test(username)) {
    return next(new ErrorHandler("Please enter a valid username", 400));
  }

  const mentorExists = await Mentor.findOne({ username });

  if (mentorExists) {
    return next(new ErrorHandler("Username is not available", 400));
  }

  if (confirmPassword !== password) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  if (
    !validator.isStrongPassword(password, {
      pointsPerUnique: 0,
      pointsPerRepeat: 0,
    }) ||
    !password.length > 0
  ) {
    return next(new ErrorHandler("Passwords is not valid", 400));
  }

  const newSkills = skills.filter((skill) => {
    return typeof skill !== "string";
  });
  skills = skills.filter((skill) => {
    return typeof skill === "string";
  });

  console.log(newSkills);

  if (newSkills.length > 0) {
    newSkills.forEach(async (skill) => {
      const newSkill = await Skill.create({
        skill: skill.value,
        createdBy: email,
        formSkill: skill,
      });

      skills.push(newSkill._id);
    });
  }

  const access_token = await authorizeOnSched();

  const name = capitalize(firstName) + " " + capitalize(lastName);

  const headers = {
    Authorization: `Bearer ${access_token}`,
  };

  await axios
    .post(
      "https://api.onsched.com/setup/v1/resources",
      { name, email, serviceIds: ["84325"] },
      { headers }
    )
    .then(async (response) => {
      const uniqueID = await referralCodes.generate({
        length: 10,
      });

      await createSIBContact(
        email,
        capitalize(firstName),
        capitalize(lastName)
      );
      const mentor = await Mentor.create({
        firstName,
        lastName,
        bio,
        password,
        username,
        email,
        skills,
        uniqueID: uniqueID[0],
        pricePerSesh,
        onSchedResourceID: response.data.id,
        profileImageUrl,
        linkedInId,
      });

      const params = encodeURI(`${lastName.toLowerCase()}-${uniqueID[0]}`);
      sendJwt(mentor, 200, res, params);
    })
    .catch((err) => {
      console.log(err);
    });
});

// /api/v1/mentor/login
exports.mentorLogin = catchAsyncErrors(async (req, res, next) => {
  let { email, password } = req.body;

  const mentor = await Mentor.findOne({ email }).select("+password");

  if (!mentor) {
    return next(new ErrorHandler("User does not exist", 400));
  }

  const isPasswordMatched = await mentor.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Password", 400));
  }
  const params = encodeURI(
    `${mentor.lastName.toLowerCase()}-${mentor.uniqueID}`
  );

  sendJwt(mentor, 200, res, params);
});

// /api/v1/mentor/linkedIn
exports.getLinkedInDetails = catchAsyncErrors(async (req, res, next) => {
  try {
    let { code, state } = req.body;

    const options = {
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://app.oddience.co",
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    };

    const response = await axios.post(
      `https://www.linkedin.com/oauth/v2/accessToken`,
      qs.stringify(options)
    );

    const access_token = response.data.access_token;
    const headers = {
      Authorization: `Bearer ${access_token}`,
    };

    const dataResponse = await axios.get(
      "https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))",
      {
        headers,
        // projection:'(id,firstName,lastName,emailAddress,profilePicture(displayImage~:playableStreams))'
      }
    );

    const profileImageUrl =
      dataResponse.data.profilePicture["displayImage~"].elements[3]
        .identifiers[0].identifier;
    const emailOptions = {
      q: "members",
      projection: "(elements*(handle~))",
    };
    const emailResponse = await axios.get(
      "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
      // qs.stringify(emailOptions),
      { headers }
    );
    const email = emailResponse.data.elements[0]["handle~"].emailAddress;
    const data = dataResponse.data;
    const mentor = await Mentor.findOne({ linkedInId: data.id });
    if (mentor) {
      const params = encodeURI(
        `${mentor.lastName.toLowerCase()}-${mentor.uniqueID}`
      );
      return sendJwt(mentor, 200, res, params);
    }
    res.status(200).json({
      success: true,
      data: {
        firstName: Object.values(data.firstName.localized)[0],
        lastName: Object.values(data.lastName.localized)[0],
        email,
        linkedInId: data.id,
        profileImageUrl,
      },
    });
  } catch (err) {
    console.log(err);
  }
});

// /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  // Finds a mentor in the database by the email entered
  const mentor = await Mentor.findOne({ email: req.body.email });

  if (!mentor) {
    return next(new ErrorHandler("User does not exist", 400));
  }

  // Gets reset password token from User models
  const resetToken = await mentor.getResetPasswordToken();

  await mentor.save();

  // Details of the mail to be sent to the user email
  const mailDetails = {
    from: `"Oddience" <${process.env.EMAIL_ADDRESS}>`,
    to: mentor.email,
    subject: "Reset Password",
    text: `Hey ${capitalize(
      mentor.firstName
    )}\nPlease click the link below to reset your password.(Note: This link expires in 10 minutes)\n\nhttps://app.oddience.co/password/forgot?token=${resetToken}\n\nIf you did not request for this mail please ignore this mail.\nThanks!`,
  };

  try {
    await sendMail(mailDetails);
    res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.log(err);
    return next(new ErrorHandler("An error occurred", 500));
  }
});

// /ai/v1/password/reset/:token
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // Hash incoming token in the request parameters
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  // Checks is passwords match
  if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  if (
    !validator.isStrongPassword(password, {
      pointsPerUnique: 0,
      pointsPerRepeat: 0,
    })
  ) {
    return next(new ErrorHandler("Passwords is not valid", 400));
  }
  // Finds a user with the resetPasswordToken
  const mentor = await Mentor.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!mentor) {
    return next(
      new ErrorHandler(
        "Reset password link has expired or token is invalid",
        400
      )
    );
  }

  // Store new PWD in DB
  mentor.password = password;
  mentor.resetPasswordToken = null;
  mentor.resetPasswordExpire = null;

  await mentor.save();

  res.status(200).json({
    success: true,
    message: "Password successfully changed",
  });
});
