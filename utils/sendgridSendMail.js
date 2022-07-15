const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = async (msg) => {
  await sgMail
    .send(msg)
    .then(() => {})
    .catch((err) => {
      console.log(err);
    });
};
