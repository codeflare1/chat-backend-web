const config = require('./config');
const client = require("twilio")(config.twilio.acountSid, config.twilio.authToken);
const ApiError = require('../utils/ApiError');
const { Otp } = require('../models');
const httpStatus = require('http-status');

const sendSMS = async (to) => {
  const otp = Math.floor(1000 + Math.random() * 9000);
  const body = `<#> GATSBYCHAT: Your code is ${otp}, Do not share OTP with anyone`;

  try {
    await client.messages.create({ 
      from: config.twilio.twilioSmsNumber, 
      body, 
      to 
    });
    await Otp.create({phoneNumber: to, otp, lastOtpSentTime: new Date});
    return 'OTP sent successfully';
  } catch (err) {
    console.log("sendSMS error==>", err);
    throw new ApiError(httpStatus.BAD_REQUEST, err.message);
  }
};

module.exports = { sendSMS };