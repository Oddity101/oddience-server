const axios = require("axios");
const moment = require("moment");
const authorizeOnSched = require("./authorizeOnSched");
const capitalize = require("./capitalize");
const sendgridSendMail = require("./sendgridSendMail");

module.exports = async (transaction, mentor, appointmentError) => {
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
    .then(async () => {
      transaction.status = "paid";

      await transaction.save();

      const session_date = moment(new Date(transaction.date).toISOString())
        .tz("Africa/Lagos")
        .format("DD-MM-YYYY");

      const session_time = new Date(
        moment(new Date(transaction.date).toISOString())
          .tz("Africa/Lagos")
          .format()
      ).toTimeString();

      const msg = {
        to: transaction.customerEmail,
        from: "support@oddience.co",
        subject: "Booking Confirmed",
        template_id: process.env.MAIL_TEMPLATE_BOOKING_CONFIRMED_CLIENT,
        dynamic_template_data: {
          session_date,
          session_time,
          coach_first_name: capitalize(mentor.firstName),
          coach_last_name: capitalize(mentor.lastName),
        },
      };

      await sendgridSendMail(msg)
        .then(() => {})
        .catch((err) => {
          console.log(err);
        });

      const msgCoach = {
        to: mentor.email,
        from: "support@oddience.co",
        subject: "Booking Confirmed",
        template_id: process.env.MAIL_TEMPLATE_BOOKING_CONFIRMED_COACH,
        dynamic_template_data: {
          session_date,
          session_time,
          coach_first_name: capitalize(mentor.firstName),
          client_first_name: capitalize(transaction.customerName.split(" ")[0]),
          client_last_name: capitalize(transaction.customerName.split(" ")[1]),
          client_email: transaction.customerEmail,
        },
      };

      await sendgridSendMail(msgCoach)
        .then(() => {})
        .catch((err) => {
          console.log(err);
        });

      return transaction;
    })
    .catch((err) => {
      console.log(err);
      appointmentError = err;
      return appointmentError;
    });
};
