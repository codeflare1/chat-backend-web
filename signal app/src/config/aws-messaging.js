const AWS = require('aws-sdk');
const config = require('./config');
const {Otp} = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
// Configure the region
AWS.config.update({
  region: config.aws.region,
  accessKeyId: config.aws.accessId,
  secretAccessKey: config.aws.secretKey
});

const sns = new AWS.SNS();

const sendSMS = async (phoneNumber) => {
  const otp = Math.floor(1000 + Math.random() * 9000);
  const params = {
    Message: `<#> ${otp} is OTP for Gatsbyte Chat login, Do not share OTP with anyone`,
    PhoneNumber: phoneNumber,
  };
  try {
    const data = await sns.publish(params).promise();
    const lastOtpSentTime = new Date();
    const otps = await Otp.create({phoneNumber, otp, lastOtpSentTime});
    console.log('otps', otps);
    return data;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

module.exports = {
  sendSMS
}
