const httpStatus = require('http-status');
const tokenService = require('./token.service');
const Token = require('../models/token.model');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const { User } = require('../models');
const { sendSMS } = require('../config/twilio.config');
const userService = require('./user.service');

const sendOtp = async (userBody) => {
  const { phoneNumber, method } = userBody;
  if (method === 'register') {
    if (await User.isPhoneNumberTaken(phoneNumber)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Phone number already taken');
    }
  }
  else if (method === 'forgot-pin') {
    if (!await User.isPhoneNumberTaken(phoneNumber)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Phone number does not exist');
    }
  };

  const notification = await sendSMS(phoneNumber);
  return notification;
};

const login = async (userBody) => {
  const user =  await User.findOne({phoneNumber: userBody.phoneNumber});
  console.log(user);
  if (!user || !(await user.isPinMatch(userBody.pin))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect phoneNumber & pin');
  }
  return user;
};

const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await refreshTokenDoc.remove();
};

const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.remove();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, error.message);
  }
};

const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    const user = await userService.getUserById(resetPasswordTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await userService.updateUserById(user.id, { password: newPassword });
    await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await userService.getUserById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

const createPin = async (req) => {
  const { pin, confirmPin, method, phoneNumber } = req.body;
  if (pin !== confirmPin) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'both pin should be match');
  };
  let user;
  if(method === 'register') {
    user = await User.create({pin, phoneNumber});
  } else {
    user = await User.findOne({ phoneNumber });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    user.pin = pin;
    await user.save();
  }
  
  return user;
};

const loginWithPin = async (req) => {
  const user =  await User.findOne({_id: req.user._id});
  if (!user || !(await user.isPinMatch(userBody.pin))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect pin');
  }
  return user;
};

const uploadUserDocument = async (req, image) => {
  const user = await User.findOneAndUpdate({ _id: req.user._id }, {documentType: req.query.documentType, userDocument: [image[0]?.imageURI, image[1]?.imageURI] }, { new: true });
  console.log('user', user);
  if(!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  };

  return user;
};

const fetchUser = async (req) => {
  const userId = req.user._id;
  const user = await User.findOne({_id: userId});
  console.log('user', user);
  if(!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  };

  return user;
};

module.exports = {
  sendOtp,
  login,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
  createPin,
  uploadUserDocument,
  loginWithPin,
  fetchUser
};