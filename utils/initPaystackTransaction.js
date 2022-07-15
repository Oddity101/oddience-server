const axios = require("axios");

module.exports = async (email, mentor) => {
  const flwRes = await axios.get(
    `https://api.flutterwave.com/v3/transfers/rates?amount=${mentor.pricePerSesh}&destination_currency=USD&source_currency=NGN`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
    }
  );

  let { amount } = flwRes.data.data.source;

  amount = (amount * 100).toFixed(0);

  console.log(amount);

  let response;
  await axios
    .post(
      `https://api.paystack.co/transaction/initialize`,
      {
        email,
        amount,
        currency: "NGN",
        channels: ["card", "bank_transfer"],
        bearer: "subaccount",
        sub_account:
          mentor.paystackBankDetails.subaccount_details.subaccount_code,
        callback_url: `http://localhost:3001/coach/${mentor.username}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )
    .then((res) => {
      console.log(res.data.data);
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
