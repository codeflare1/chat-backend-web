const config = require('./config');
const client = require("twilio")(config.twilio.acountSid, config.twilio.authToken);
const ApiError = require('../utils/ApiError');
const { Otp,User } = require('../models');
const httpStatus = require('http-status');

const sendSMS = async (to,method) => {
  const otp = Math.floor(1000 + Math.random() * 9000);
  const body = `<#> GATSBYCHAT: Your code is ${otp}, Do not share OTP with anyone`;

  try {

    if (method === 'forgot-pin') {
      const user = await User.findOne({ phoneNumber: to });

      if (user) {
        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60000);
  
        // Check if the previous OTP was sent less than 10 minutes ago
        if (user.lastOtpSentTime && user.lastOtpSentTime > tenMinutesAgo) {
          throw new ApiError(httpStatus.BAD_REQUEST, "OTP was sent recently. Please try again later.");
        }
  
        // Send SMS using Twilio
        await client.messages.create({
          from: config.twilio.twilioSmsNumber,
          body,
          to,
        });
  
        // Save the OTP, timestamp, and expiration time in the User model
        await User.updateOne(
          { phoneNumber: to },
          {
            $set: {
              otp,
              lastOtpSentTime: now,
              otpExpiresAt: new Date(now.getTime() + 10 * 60000), // 10 minutes from now
            },
          }
        );
      
      }
      
    }else{
        await client.messages.create({ 
          from: config.twilio.twilioSmsNumber, 
          body, 
          to 
        });
      await Otp.create({phoneNumber: to, otp, lastOtpSentTime: new Date});

    }
  
    return 'OTP sent successfully';
  } catch (err) {
    console.log("sendSMS error==>", err);
    throw new ApiError(httpStatus.BAD_REQUEST, err.message);
  }
};

module.exports = { sendSMS };