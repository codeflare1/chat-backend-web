const nodemailer = require('nodemailer');
const httpStatus = require('http-status');
const config = require('../config/config');
const logger = require('../config/logger');
const { Otp } = require('../models');
const ApiError = require('../utils/ApiError');

const transport = nodemailer.createTransport(config.email.smtp);
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

const sendEmail = async (to, subject, text) => {
  const msg = { from: config.email.from, to, subject, text };
  await transport.sendMail(msg);
};


const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  const code = Math.floor(1000 + Math.random() * 9000);
  const otpObject = {
    otp: code,
    email: to,
    method: 'forgot-password',
    lastOtpSentTime: new Date(),
  };
  await Otp.create(otpObject);
  const text = `Dear user, use this verification code ${code} to reset your password
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};


const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const code = Math.floor(1000 + Math.random() * 9000);

  const text = `Dear user, use this verification code ${code}
To verify your email or click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

const verifyOtp = async (otp, phoneNumber) => {
  console.log('otp==>', otp, phoneNumber);

  const isOtpValid = await Otp.findOne({
    $and: [{ otp }, { phoneNumber }],
  });

  if (!isOtpValid) {
    throw new ApiError(httpStatus.NOT_FOUND, 'otp is not valid');
  }

  if (new Date().getTime() > new Date(isOtpValid.lastOtpSentTime).getTime() + 10 * 60 * 1000) {
    await Otp.deleteMany({ phoneNumber });
    throw new ApiError(httpStatus.NOT_FOUND, 'Otp Expired!');
  }

  await Otp.deleteMany({ phoneNumber });
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  verifyOtp,
};