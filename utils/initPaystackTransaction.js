const axios = require("axios");

module.exports = async (email, mentor) => {
  let amount = 0;
  if(process.env.ONLY_NAIRA !== "true") {
    const flwRes = await axios.get(
      `https://api.flutterwave.com/v3/transfers/rates?amount=${mentor.pricePerSesh}&destination_currency=USD&source_currency=NGN`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );
    amount  = flwRes.data.data.source;
  }else {
    amount   = mentor.pricePerSesh
  }

  amount = (amount * 100).toFixed(0);

  let response;
  await axios
    .post(
      `https://api.paystack.co/transaction/initialize`,
      {
        email,
        amount,
        currency: "NGN",
        channels: ["card", "bank_transfer"],
        bearer: "account",
        subaccount:
          mentor.paystackBankDetails.subaccount_details.subaccount_code,
        callback_url: `${process.env.FRONTEND_BASE_URL}/${mentor.username}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )
    .then((res) => {
      response = {
        url: res.data.data.authorization_url,
        ref: res.data.data.reference,
      };
    })
    .catch((err) => {
      console.log(err);
    });
  return response;
};
