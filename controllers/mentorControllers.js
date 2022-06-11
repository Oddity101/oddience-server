const qs = require("qs");
const crypto = require("crypto");
const Mentor = require("../models/Mentor");
const Transaction = require("../models/Transaction");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const authorizeOnSched = require("../utils/authorizeOnSched");
const { default: axios } = require("axios");
const capitalize = require("../utils/capitalize");
const Stripe = require("stripe");
const stripe = Stripe(`${process.env.STRIPE_API_KEY}`);

// api/v1/admin/mentor/
exports.getMentor = catchAsyncErrors(async (req, res, next) => {
  const mentor = req.user;

  let loginUrl;

  if (Object.keys(mentor).indexOf("stripeAccountId") > 0) {
    const account = await stripe.accounts.retrieve(mentor.stripeAccountId);

    if (!account.details_submitted) {
      mentor.stripeAccountComplete = false;

      await mentor.save();
    } else {
      mentor.stripeAccountComplete = true;
      await mentor.save();

      let loginLink = await stripe.accounts.createLoginLink(
        mentor.stripeAccountId
      );

      loginUrl = loginLink.url;
    }
  }

  const activeSkills = mentor.skills.filter((skill) => {
    return skill.status === "active";
  });
  res.status(200).json({
    success: true,
    mentor: {
      name:
        mentor.firstName.replace(
          mentor.firstName[0],
          mentor.firstName[0].toUpperCase()
        ) +
        " " +
        mentor.lastName.replace(
          mentor.lastName[0],
          mentor.lastName[0].toUpperCase()
        ),
      bio: mentor.bio,
      params: `${mentor.lastName}-${mentor.uniqueID}`,
      username: mentor.username,
      skills: activeSkills,
      pricePerSesh: mentor.pricePerSesh,
      uniqueID: mentor.uniqueID,
      resourceID: mentor.onSchedResourceID,
      stage: mentor.companyStage,
      imageUrl: mentor.profileImageUrl,
      availability: mentor.availability,
      account_id: mentor.stripeAccountId,
      loginUrl,
      account_complete: mentor.stripeAccountComplete,
    },
  });
});

// api/v1/mentor/:username
exports.getMentorDetails = catchAsyncErrors(async (req, res, next) => {
  const tzOffset = String(req.query.tzOffset).replace("-", "+");

  let transaction;
  let appointmentError;

  if (req.query.token && req.query.token !== "failed_transcaction") {
    transaction = await Transaction.findOne({
      token: req.query.token,
    });

    if (transaction.status !== "paid") {
      const access_token = await authorizeOnSched();
      const headers = {
        Authorization: `Bearer ${access_token}`,
      };

      await axios
        .put(
          `https://api.onsched.com/consumer/v1/appointments/${transaction.onSchedAppointmentId}/book`,
          {},
          { headers }
        )
        .then(async (response) => {
          transaction.status = "paid";

          await transaction.save();
        })
        .catch((err) => {
          appointmentError = err;
        });
    }
  }

  const mentor = await Mentor.findOne({ username: req.params.username });

  if (!mentor) {
    return next(new ErrorHandler("Mentor does not exist", 400));
  }

  const accessToken = await authorizeOnSched();

  const startDate = new Date(Date.now()).toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 7 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  await axios
    .get(
      `https://api.onsched.com/consumer/v1/availability/84325/${startDate}/${endDate}?resourceId=${mentor.onSchedResourceID}&tzOffset=${tzOffset}&dayAvailability=7`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    .then(async (response) => {
      const availableDays = response.data.availableDays;
      const availableTimes = response.data.availableTimes;

      // const { data } = await axios.get(
      //   `https://api.onsched.com/consumer/v1/resources/${mentor.onSchedResourceID}`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${accessToken}`,
      //     },
      //   }
      // );
      const activeSkills = mentor.skills.filter((skill) => {
        return skill.status === "active";
      });
      res.status(200).json({
        success: true,
        mentor: {
          name:
            mentor.firstName.replace(
              mentor.firstName[0],
              mentor.firstName[0].toUpperCase()
            ) +
            " " +
            mentor.lastName.replace(
              mentor.lastName[0],
              mentor.lastName[0].toUpperCase()
            ),
          bio: mentor.bio,
          skills: activeSkills,
          pricePerSesh: mentor.pricePerSesh,
          resourceID: mentor.onSchedResourceID,
          availableDays,
          availableTimes,
          stage: mentor.companyStage,
          imageUrl: mentor.profileImageUrl,
          account_id: mentor.stripeAccountId,
          appointmentError,
          transaction,
        },
      });
    })
    .catch((error) => {
      console.log(error.response);
    });
});

// api/v1/onsched/appointments
exports.getAllAppointments = catchAsyncErrors(async (req, res, next) => {
  const access_token = await authorizeOnSched();

  const headers = {
    Authorization: `Bearer ${access_token}`,
  };

  await axios
    .get("https://api.onsched.com/consumer/v1/appointments", {
      headers: headers,
    })
    .then((response) => {
      res.status(200).json({
        success: true,
        data: response.data,
      });
    })
    .catch((err) => {
      console.log(err.response.data);
      return next(new ErrorHandler("An error occurred", 400));
    });
});

// api/v1/mentor/availability/:token
exports.updateAvailability = catchAsyncErrors(async (req, res, next) => {
  const mentor = req.user;

  const access_token = await authorizeOnSched();
  const headers = {
    Authorization: `Bearer ${access_token}`,
  };

  const data = req.body.availability;
  if (req.body.timezoneId) {
    const timeResponse = await axios.put(
      `https://api.onsched.com/setup/v1/resources/${mentor.onSchedResourceID}`,
      { timezoneId: req.body.timezoneId },
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
  }
  // console.log(data)
  const response = await axios.put(
    `https://api.onsched.com/setup/v1/resources/${mentor.onSchedResourceID}/availability`,
    data,
    { headers }
  );
  // console.log(response.data)

  mentor.availability = data;
  await mentor.save();

  res.status(200).json({
    success: true,
  });
});

// api/v1/mentor/company-stage/:username
exports.updateCompanyStage = catchAsyncErrors(async (req, res, next) => {
  const mentor = req.user;
  mentor.companyStage = req.body.stage;

  await mentor.save();

  console.log(mentor);

  res.status(200).json({
    success: true,
  });
});

// /api/v1/mentor/profile?
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const mentor = req.user;

  if (req.query.bio) {
    mentor.bio = req.body.bio;
  }

  if (req.query.skills) {
    const newSkills = req.query.skills.filter((skill) => {
      return typeof skill !== "string";
    });
    const skills = req.query.skillsskills.filter((skill) => {
      return typeof skill === "string";
    });

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

    mentor.skills = skills;
  }

  if (req.query.price) {
    mentor.pricePerSesh = req.query.price;
  }

  if (req.query.image) {
    mentor.profileImageUrl = req.body.url;
  }

  await mentor.save();
  res.status(200).json({
    success: true,
  });
});

// /api/v1/mentor/createAppointment
exports.createAppointment = catchAsyncErrors(async (req, res, next) => {
  let { fName, lName, email, startDateTime } = req.body;
  fName = fName.trim();
  lName = lName.trim();
  email = email.trim();

  const mentor = await Mentor.findOne({ username: req.params.username });

  if (!mentor) {
    return next(new ErrorHandler("User not found", 400));
  }

  const access_token = await authorizeOnSched();
  const headers = {
    Authorization: `Bearer ${access_token}`,
  };

  await axios
    .post(
      `https://api.onsched.com/consumer/v1/appointments?completeBooking=IN`,
      {
        locationId: "735f246e-7d9e-4af4-953d-4cafe08aeb5f",
        serviceId: "84325",
        resourceId: mentor.onSchedResourceID,
        email,
        name: `${capitalize(fName)} ${capitalize(lName)}`,
        startDateTime: new Date(startDateTime).toISOString(),
        endDateTime: new Date(startDateTime + 30 * 60 * 1000).toISOString(),
      },
      {
        headers,
      }
    )
    .then(async (response) => {
      // return console.log(response.data)
      const token = await crypto.randomBytes(20).toString("hex");
      const transaction = await Transaction.create({
        customerName: fName + " " + lName,
        token,
        mentor: mentor._id,
        onSchedAppointmentId: response.data.id,
      });
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Oddience Mentoring Session with ${capitalize(
                  mentor.firstName
                )} ${capitalize(mentor.lastName)}`,
              },
              unit_amount: Number(mentor.pricePerSesh) * 100,
            },
            quantity: 1,
          },
        ],
        success_url: `https://app.oddience.co/coach/${req.body.username}?token=${token}`,
        cancel_url: `https://app.oddience.co/coach/${
          req.body.username
        }?token=${"failed_transaction"}`,
        payment_intent_data: {
          application_fee_amount: Number(mentor.pricePerSesh) * 10,
          transfer_data: {
            destination: mentor.stripeAccountId,
          },
        },
      });
      transaction.stripeTransactionId = session.id;
      transaction.stripePaymentIntent = session.payment_intent;
      await transaction.save();
      res.status(200).json({
        success: true,
        url: session.url,
      });
    })
    .catch((error) => {
      console.log(error);
      return next(new ErrorHandler(error.response.data.code, 400));
    });
});

// /api/v1/mentor/stripe/connect
exports.createStripeConnectedAccount = catchAsyncErrors(
  async (req, res, next) => {
    try {
      const mentor = req.user;

      const account = await stripe.accounts.create({ type: "express" });

      mentor.stripeAccountId = account.id;

      await mentor.save();

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `https://app.oddience.co/coach/dashboard`,
        return_url: `https://app.oddience.co/coach/dashboard`,
        type: "account_onboarding",
      });
      res.status(200).json({
        account,
        accountLink,
      });
    } catch (err) {
      console.log(err);
    }
  }
);
