const nodemailer = require('nodemailer');
const httpStatus = require('http-status');
const config = require('../config/config');
const logger = require('../config/logger');
const { Otp } = require('../models');
const ApiError = require('../utils/ApiError');

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  const msg = { from: config.email.from, to, subject, text };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
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

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
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
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this phoneNumber');
  }

  if (new Date().getTime() > new Date(isOtpValid.lastOtpSentTime).getTime() + 10 * 60 * 1000) {
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