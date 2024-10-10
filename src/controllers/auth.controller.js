const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const { uploadFileS3 } = require('../config/upload-image');
const { User } = require('../models');

const register = catchAsync(async (req, res) => {
  const file = req.file;
  let imageURI;
  if (file) {
    imageURI = await uploadFileS3(file);
  }
  const user = await userService.createUser(req, imageURI?.Location);
  if (user) {
    res.status(httpStatus.OK).send({ success: true, user, message: 'profile created successfully' });
  } else {
    res.status(httpStatus.BAD_REQUEST).send({ success: true, message: 'User registration failed' });
  }
});

const login = catchAsync(async (req, res) => {
  const user = await authService.login(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.OK).send({ success: true, user, tokens });
});

const sendOtp = catchAsync(async (req, res) => {
  const response = await authService.sendOtp(req.body);
  res.status(httpStatus.OK).send({ success: true, response });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.status(httpStatus.OK).send({ ...tokens });
});

const forgotPin = catchAsync(async (req, res) => {
  const response = await authService.sendOtp(req.body);
  res.status(httpStatus.OK).send({ success: true, response });
});

const verifyOtp = catchAsync(async (req, res) => {
  const { otp, phoneNumber, method } = req.query;
  const number = `+${phoneNumber}`;
  await emailService.verifyOtp(otp, number);
  let user;
  let tokens;
  if (method === 'forgot-pin') {
    user = await User.findOne({ phoneNumber: number });
    tokens = await tokenService.generateAuthTokens(user);
  };

  res.status(httpStatus.OK).send({ success: true, data: 'OTP verified successfully', tokens });
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);

  if (verifyEmailToken) {
    await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
    res.status(httpStatus.NO_CONTENT).send();
  } else {
    res.status(httpStatus.BAD_REQUEST).send({ message: 'Failed to generate verification email token' });
  }
});

const verifyEmail = catchAsync(async (req, res) => {
  try {
    await authService.verifyEmail(req.query.token);
    res.status(httpStatus.NO_CONTENT).send();
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).send({ message: 'Email verification failed' });
  }
});

const setPin = catchAsync(async (req, res) => {
  const user = await authService.createPin(req);
  let tokens;
  if(req.body.method === 'register') {
    tokens = await tokenService.generateAuthTokens(user);
  }
  res.status(httpStatus.OK).send({success: true, user, tokens});
});

const loginWithPin = catchAsync(async (req, res) => {
  const user = await authService.loginWithPin(req);
  res.status(httpStatus.OK).send({success: true , user});
});

const uploadUserDocument = catchAsync(async (req, res) => {
  const files = req.files;
  console.log('files12', files);
  let imageURI;
  if (files) {
    imageURI = await uploadFileS3(files);
  };
  console.log('imageURI', imageURI);
  const uploadUserDocument = await authService.uploadUserDocument(req, imageURI);
  res.status(httpStatus.OK).send({success: true, uploadUserDocument});
});

const verifyOtpByEmail = async (otp, email) => {
  const isOtpValid = await Otp.findOne({ $and: [{ otp }, { email }] });

  if (!isOtpValid) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }

  if (new Date().getTime() > new Date(isOtpValid.lastOtpSentTime).getTime() + 1 * 60 * 1000) {
    throw new ApiError(httpStatus.NOT_FOUND, 'OTP Expired!');
  }
  await Otp.deleteMany({ email });
};

const fetchUser = async (req, res) => {
  const user = await authService.fetchUser(req);
  res.status(httpStatus.OK).send({success: true , user});
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
  loginWithPin,
  setPin,
  verifyOtpByEmail,
  uploadUserDocument,
  loginWithPin,
  fetchUser
};
