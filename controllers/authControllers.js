const axios = require("axios");
const qs = require("qs");
const createSIBContact = require("../utils/createSIBContact");
const Mentor = require("../models/Mentor");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const sendJwt = require("../utils/sendJwt");
const referralCodes = require("referral-codes");
const capitalize = require("../utils/capitalize");
const authorizeOnSched = require("../utils/authorizeOnSched");

// api/v1/user/email/check
exports.checkEmail = catchAsyncErrors(async (req, res, next) => {
  const user = await Mentor.findOne({ email: req.body.email });

  if (user) {
    return next(new ErrorHandler("User already exists", 400));
  }

  res.status(200).json({
    success: true,
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
  } = req.body;
  // console.log(profileImageUrl)
  firstName = firstName.trim().toLowerCase();
  lastName = lastName.trim().toLowerCase();
  email = email.trim();
  bio = bio.trim();

  if (confirmPassword !== password) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  const access_token = await authorizeOnSched();

  const name = capitalize(firstName) + " " + capitalize(lastName);

  const headers = {
    Authorization: `Bearer ${access_token}`,
  };

  await axios
    .post(
      "https://sandbox-api.onsched.com/setup/v1/resources",
      { name, email, serviceIds: ["182251"] },
      { headers }
    )
    .then(async (response) => {
      const uniqueID = await referralCodes.generate({
        length: 10,
      });

      await createSIBContact(email, capitalize(firstName), capitalize(lastName));
      const mentor = await Mentor.create({
        firstName,
        lastName,
        bio,
        password,
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

  // res.status(200).json({
  //   success: true,
  //   message: "Successfully created user",
  //   params,
  // });
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
  // res.status(200).json({
  //   success: true,
  //   message: "Successfully logged in",
  //   // link: `${process.env.TEST_BASE_URL}/mentor/dashboard?user=${params}`,
  //   params
  // });
});

// /api/v1/mentor/linkedIn
exports.getLinkedInDetails = catchAsyncErrors(async (req, res, next) => {
  try {
    let { code, state } = req.body;

    const options = {
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://stellular-mandazi-a2b5b2.netlify.app",
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
