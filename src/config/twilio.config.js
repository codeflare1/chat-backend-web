const config = require('./config');
const ApiError = require('../utils/ApiError');
const { Otp } = require('../models');
const httpStatus = require('http-status');

// const client = require('twilio')(config.twilio.accountSid, config.twilioauthToken);

let accountSid = "AC8b7769ddb1a478b7978f171496c0ec21";
let authToken = "5c35996649bea8fcb477eca392354814";
let twilioSmsNumber = +17074750729;
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
    return { is_already_exist: 0, message: 'OTP sent successfully' };
  } catch (err) {
    console.log("sendSMS error==>", err);
    // throw new ApiError(httpStatus.BAD_REQUEST, err.message);
    throw new ApiError(httpStatus.BAD_REQUEST, `Phone number not exist on twilio`);

  }
};

module.exports = { sendSMS };