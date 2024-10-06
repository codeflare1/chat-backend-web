const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const {uploadFileS3} = require('../config/upload-image');
const { User } = require('../models');

const register = catchAsync(async (req, res) => {
  const file = req.file;
  let imageURI;
  if(file) {
    imageURI = await uploadFileS3(file);
  }
  const user = await userService.createUser(req, imageURI.Location);
  res.status(httpStatus.CREATED).send({ user });
});

const login = catchAsync(async (req, res) => {
  const user = await authService.login(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.OK).send({ user, tokens });
});

const sendOtp = catchAsync(async (req, res) => {
  const response = await authService.sendOtp(req.body);
  res.status(httpStatus.OK).send({ response });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPin = catchAsync(async (req, res) => {
  const response = await authService.sendOtp(req.body);
  res.status(httpStatus.OK).send(response);
});

const verifyOtp = catchAsync(async (req, res) => {
  const { otp, phoneNumber, method } = req.query;
  const number = `+${phoneNumber}`;
  await emailService.verifyOtp(otp, number);
  let user;
  if(method === 'register') {
   user = await User.create({phoneNumber: number});
  }else {
    user = await User.findOne({phoneNumber: number});
  }
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(200).send({success: true, data:'otp verified successfully', tokens});
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

const setPin = catchAsync(async (req, res) => {
  const user = await authService.createPin(req);
  res.status(httpStatus.OK).send(user);
});

const verifyOtpByEmail = async (otp, email) => {
  const isOtpValid = await Otp.findOne({
    $and: [{ otp }, { email }],
  });

  if (!isOtpValid) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }

  if (new Date().getTime() > new Date(isOtpValid.lastOtpSentTime).getTime() + 1 * 60 * 1000) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Otp Expired!');
  }

  await Otp.deleteMany({ email });
};

module.exports = {
  register,
  login,
  sendOtp,
  logout,
  refreshTokens,
  forgotPin,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  verifyOtp,
  setPin,
  verifyOtpByEmail,
};
