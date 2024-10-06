const AWS = require('aws-sdk');
const { Otp } = require('../models');
const ApiError = require('../utils/ApiError');
const config = require('./config');

AWS.config.update({
  region: config.aws.region, // Replace with your AWS region
  accessKeyId: config.aws.accessId,  // Replace with your AWS Access Key ID
  secretAccessKey: config.aws.secretKey // Replace with your AWS Secret Access Key
});

const sns = new AWS.SNS();

const sendSMS = async (phoneNumber) => {
  const otp = Math.floor(1000 + Math.random() * 9000);
  const params = {
    Message: `<#> ${otp} is OTP for Gatsbyte Chat login, Do not share OTP with anyone`,
    PhoneNumber: phoneNumber,  // E.164 formatted phone number
  };

  try {
    await sns.publish(params).promise();
    await Otp.create({phoneNumber, otp, lastOtpSentTime: new Date});
    return 'otp sent succesfully';
  } catch (error) {
    console.error(`Error sending message: ${error.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
}
};

module.exports = {
  sendSMS
};