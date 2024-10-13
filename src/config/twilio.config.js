const config = require('./config');
// const client = require("twilio")(config.twilio.acountSid, config.twilio.authToken);
const ApiError = require('../utils/ApiError');
const { Otp } = require('../models');
const httpStatus = require('http-status');


const accountSid = 'AC8b7769ddb1a478b7978f171496c0ec21';
const authToken = '08d4235d0e5e0aeba50dab03a0ffb8de';
const client = require('twilio')(accountSid, authToken);


const sendSMS = async (to) => {
  try {
    // await client.messages.create({ 
    //   from: config.twilio.twilioSmsNumber, 
    //   body, 
    //   to 
    // });
    // let send_otp = await client.verify.v2.services("VAd3e92fa71f0886976cbbd7beec7b0acf").verifications.create({ to: to, channel: 'sms' })
    const otp = Math.floor(1000 + Math.random() * 9000);
    const body = `<#> GATSBYCHAT: Your code is ${otp}, Do not share OTP with anyone`;
    console.log("body ", body);
    let sms_body = {
      body: body,
      from: "+17074750729",
      to: to
    }
    const message = await client.messages.create(sms_body);

    console.log(`message-sent ------`, message?.body);

    // .then(verification => console.log(verification.sid));
    await Otp.create({ phoneNumber: to, otp, lastOtpSentTime: new Date });
    return 'OTP sent successfully';
  } catch (err) {
    console.log("sendSMS error==>", err);
    throw new ApiError(httpStatus.BAD_REQUEST, err.message);
  }
};

module.exports = { sendSMS };