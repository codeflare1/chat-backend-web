const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const { uploadFileS3 } = require('../config/upload-image');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { sendSMS,verifyOTP2 } = require('../config/aws-messaging');
const UserModel = require('../models/user.model')
const register = catchAsync(async (req, res) => {
  const file = req.file;
  let imageURI;
  if (file) {
    imageURI = await uploadFileS3(file);
  }
  console.log("req.body --> ", req?.body);

  const user = await userService.createUser(req, imageURI?.Location);
  if (user) {
    res.status(httpStatus.OK).send({ success: true, user, message: 'profile created successfully' });
  } else {
    res.status(httpStatus.BAD_REQUEST).send({ success: true, message: 'User registration failed' });
  }
});

const login = catchAsync(async (req, res) => {
  console.log("req.body --> ", req?.body);
  const user = await authService.login(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.OK).send({ success: true, user, tokens });
});

const sendOtp = async (req, res) => {
  try {
    console.log("req.body --> ", req?.body);

    let findUser = await UserModel.findOne({phoneNumber:req.body.phoneNumber})
    if(findUser){
      const user = await authService.login(req.body);
      const tokens = await tokenService.generateAuthTokens(user);
      res.status(httpStatus.OK).send({ success: true,message:'Success', user, tokens });

    }else{
      const response = await authService.sendOtp(req.body);
      res.status(httpStatus.OK).send({ success: true, response });
    }

  } catch (error) {
    console.error("Error sending OTP: ", error);
    if (error instanceof ApiError) {
      res.status(error.statusCode).send({ success: false, message: error.message });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ success: false, message: "An unexpected error occurred" });
    }
  }
};


const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.status(httpStatus.OK).send({ ...tokens });
});

const forgotPin = catchAsync(async (req, res) => {
  console.log("req.body --> ", req?.body);
  const response = await authService.sendOtp(req.body);
  res.status(httpStatus.OK).send({ success: true, response });
});

const verifyOtp = catchAsync(async (req, res) => {
  const { otp, phoneNumber, method,otpId } = req.query;
  const number = `+${phoneNumber}`;
  //  await emailService.verifyOtp(otp, number);
await verifyOTP2(otpId,otp)
  let user;
  let tokens;

    // user = await User.findOne({ phoneNumber: number });
    // tokens = await tokenService.generateAuthTokens(user);

  res.status(httpStatus.OK).send({ success: true, message: 'OTP verified successfully' });
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
  if (req.body.method === 'register') {
    tokens = await tokenService.generateAuthTokens(user);
  }
  res.status(httpStatus.OK).send({ success: true, user, tokens });
});

const loginWithPin = catchAsync(async (req, res) => {
  // console.log(req.body)
  const user = await authService.loginWithPin(req);
  res.status(httpStatus.OK).send({ success: true,message:"Login Successfully!",statusCode:4, user });
});

const uploadUserDocument = catchAsync(async (req, res) => {
  try {
    console.log("************req.files --- ", req.files);
    console.log("#############req.filee --- ", req.file);

    const files = req.files;
    console.log('files12', files);
    let imageURI;
    if (files && files?.length > 0) {
      imageURI = await uploadFileS3(files);
    };
    console.log('imageURI', imageURI);
    if (imageURI) {
      const uploadUserDocument = await authService.uploadUserDocument(req, imageURI);
      res.status(httpStatus.OK).send({ success: true, uploadUserDocument });
    } else {
      res.status(httpStatus.BAD_REQUEST).send({ success: false, message: `Uploaad failed` });

    }
  } catch (err) {
    console.log("err ------ ", err);

  }
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
  res.status(httpStatus.OK).send({ success: true, user });
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
