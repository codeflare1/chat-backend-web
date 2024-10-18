const AWS = require('aws-sdk');
const { Otp } = require('../models');
const ApiError = require('../utils/ApiError');
const config = require('./config');
const Client = require('direct7')
const axios = require('axios');

AWS.config.update({
  region: config.aws.region, // Replace with your AWS region
  accessKeyId: config.aws.accessId,  // Replace with your AWS Access Key ID
  secretAccessKey: config.aws.secretKey // Replace with your AWS Secret Access Key
});
const sns = new AWS.SNS();
// const sendSMS = async (phoneNumber) => {
//   const otp = Math.floor(1000 + Math.random() * 9000);
//   const params = {
//     Message: `<#> GATSBYCHAT: Your code is ${otp}, Do not share OTP with anyone`,
//     PhoneNumber: phoneNumber,  // E.164 formatted phone number
//   };

//   try {
//     await sns.publish(params).promise();
//     await Otp.create({phoneNumber, otp, lastOtpSentTime: new Date});
//     return 'otp sent succesfully';
//   } catch (error) {
//     console.error(`Error sending message: ${error.message}`);
//     throw new ApiError(httpStatus.BAD_REQUEST, error.message);
// }
// };


async function sendSMS(phoneNumber) {
  const apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoLWJhY2tlbmQ6YXBwIiwic3ViIjoiNjdhNTY0M2EtNWU5ZS00OGFhLTkwNGItYTA5ZjE1ZDJmNmZlIn0.DLXn7r5FLt3aiXGAbKSVZlplX8DPUFihDbpB2u8LoGo";

  try {
      console.log("Sending OTP...");
      const response = await axios.post('https://api.d7networks.com/verify/v1/otp/send-otp', {
          originator: "SignOTP",
          recipient:phoneNumber,
          content: "Greetings from gatsbychat, your mobile verification code is: {}",
          expiry: 600,
          data_coding: "text"
      }, {
          headers: {
              Authorization: `Bearer ${apiToken}`
          }
      });

      console.log("OTP Sent Successfully:", response.data);
      let obj = {
        status:true,
        data:response.data,
        message:'OTP Sent Successfully'
      }
      return obj
  } catch (error) {
      console.error("Error sending OTP:", error.message);
      if (error.response) {
          console.error("Status Code:", error.response.status);
          console.error("Response Data:", error.response.data);
      }
  }
}
async function verifyOTP2(otpId, otpCode) {
  console.log("OTP ID:", otpId);
  console.log("OTP Code:", otpCode);

  const apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoLWJhY2tlbmQ6YXBwIiwic3ViIjoiNjdhNTY0M2EtNWU5ZS00OGFhLTkwNGItYTA5ZjE1ZDJmNmZlIn0.DLXn7r5FLt3aiXGAbKSVZlplX8DPUFihDbpB2u8LoGo";

  try {
      console.log("Verifying OTP...");
      const response = await axios.post('https://api.d7networks.com/verify/v1/otp/verify-otp', {
          otp_id: otpId, // Pass the variable directly
          otp_code: otpCode // Pass the variable directly
      }, {
          headers: {
              Authorization: `Bearer ${apiToken}`
          }
      });

      console.log("OTP Verified Successfully:", response.data);
      return response.data
  } catch (error) {
      console.error("Error verifying OTP:", error.message);
      if (error.response) {
          console.error("Status Code:", error.response.status);
          console.error("Response Data:", error.response.data);
          return error.response.data

      }
  }
}



module.exports = {
  sendSMS,
  verifyOTP2
};