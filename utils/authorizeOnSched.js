const axios = require("axios");
const qs = require("qs");
const Token = require("../models/Token");


module.exports = async () => {
  const token = await Token.find();

  if (token.length === 0){
    const data = {
      client_id: process.env.ON_SCHED_CLIENT_ID,
      client_secret: process.env.ON_SCHED_CLIENT_SECRET,
      grant_type: process.env.ON_SCHED_GRANT_TYPE,
      scope: process.env.ON_SCHED_SCOPE,
    };
    const response = await axios.post(
      `${process.env.ON_SCHED_BASE_URL}/connect/token`,
      qs.stringify(data)
    );

    await Token.create({
      token: response.data.access_token
    })
    return response.data.access_token;
  }
  const lastToken = token[0];

  if ((new Date(Date.now()).getTime() - new Date(lastToken.dateCreated).getTime()) > ( 50* 60* 1000)){
    const data = {
      client_id: process.env.ON_SCHED_CLIENT_ID,
      client_secret: process.env.ON_SCHED_CLIENT_SECRET,
      grant_type: process.env.ON_SCHED_GRANT_TYPE,
      scope: process.env.ON_SCHED_SCOPE,
    };
    const response = await axios.post(
      `${process.env.ON_SCHED_BASE_URL}/connect/token`,
      qs.stringify(data)
    );

    lastToken.token = response.data.access_token
    lastToken.dateCreated = new Date(Date.now());

    await lastToken.save();
    return response.data.access_token;
  }

  return lastToken.token

};

