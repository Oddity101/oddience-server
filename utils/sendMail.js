const nodemailer = require('nodemailer');
const ErrorHandler = require('./ErrorHandler');

module.exports = async (mailDetails) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PWD,
        }
    })

    await transporter.sendMail(mailDetails, function(err, data) {
        if(err) {
            console.log(err)
        }
    });

}