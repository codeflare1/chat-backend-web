const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const { uploadFileS3 } = require('../config/upload-image');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { sendSMS,verifyOTP2 } = require('../config/aws-messaging');
const UserModel = require('../models/user.model')
const GroupModel = require('../models/groupModel')
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
      // const response = await authService.sendOtp(req.body);
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
  
  let number = `+${phoneNumber}`.replace(/\s+/g, '');
  //  await emailService.verifyOtp(otp, number);
await verifyOTP2(otpId,otp)
  let user;
  let tokens;
// console.log(number)
//     user = await User.findOne({ phoneNumber: number });
//     console.log(user)
//     tokens = await tokenService.generateAuthTokens(user);

  res.status(httpStatus.OK).send({ success: true, message: 'OTP verified successfully'});
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
  }else{
    tokens    = await tokenService.generateResetPasswordToken(user)
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

const fetchOtherUser = async (req, res) => {
  let user
  if(req.params.type=='group'){
    user = await GroupModel.findOne({ groupId: req.params.id })
    .populate({
      path: 'members.userId',
      select: '_id firstName lastName email image' 
    })
    .exec();

  if (!user) {
    return res.status(httpStatus.NOT_FOUND).send({ success: false, message: 'Group not found' });
  }

  res.status(httpStatus.OK).send({ success: true, user });

  }
   user = await authService.fetchOtherUser(req);

  res.status(httpStatus.OK).send({ success: true, user });
};



const uploadFiles = catchAsync(async (req, res) => {
  try {
    const files = req.files;
    console.log('files12', files);
    let imageURI;
    if (files && files?.length > 0) {
      imageURI = await uploadFileS3(files);
    };
    console.log('imageURI', imageURI);
    if (imageURI) {
      res.status(httpStatus.OK).send({ success: true, imageURI });
    } else {
      res.status(httpStatus.BAD_REQUEST).send({ success: false, message: `Uploaad failed` });
    }
  } catch (err) {
    console.log("err ------ ", err);

  }
});


const getAllUsers = async (req, res) => {
  try {
    console.log("query", req.query);
    let query = req.query
    // Convert search keyword to a case-insensitive regular expression
    const searchRegex = new RegExp(query.search, 'i');
    let limit = parseInt(query.limit || 10);
    let page = parseInt(query.page || 1);
    const skip = (page - 1) * limit;

    // Find users where the phoneNumber, firstName, or lastName matches the search keyword
    const filter = {
      $or: [
        { phoneNumber: { $regex: searchRegex } },
        { firstName: { $regex: searchRegex } },
        { lastName: { $regex: searchRegex } }
      ]
    };

    // Pagination options
    const options = {
      limit: limit,
      skip: skip
    };
    console.log("filter",filter)
    console.log("options",options)

    // Query the database with the search and pagination
    const users = await UserModel.find(filter, {firstName:1,lastName:1,image:1,phoneNumber:1},options);
    console.log('users',users)
    const total = await UserModel.countDocuments(filter); // Total matching users for pagination

    // Return the filtered and paginated users
   let obj =  {
      users,
      total,
      page,
      limit
    };
    return res.send({status:true,data:obj})
  } catch (error) {
    console.error('Error on getAllUser:', error);
    throw error;
  }
};
const updateUserProfile = async (req, res) => {
  const userId = req.user._id;
  const { firstName, lastName, profileImage, about, userName } = req.body;

  // Check if the userName is provided and is unique
  if (userName) {
    const existingUser = await UserModel.findOne({ userName, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(httpStatus.BAD_REQUEST).send({ message: 'Username is already taken' });
    }
  }

  const file = req.file;
  let imageURI;
  if (file) {
    imageURI = await uploadFileS3(file);
  }

  // Dynamically build the update object
  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (imageURI?.Location) updateData.image = imageURI.Location;
  if (about !== undefined) updateData.about = about;
  if (userName !== undefined) updateData.userName = userName;

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true }
  );

  if (!user) {
    return res.status(httpStatus.NOT_FOUND).send({ message: 'User not found' });
  }

  res.status(httpStatus.OK).send(user);
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
  fetchUser,
  fetchOtherUser,
  uploadFiles,
  getAllUsers,
  updateUserProfile
};
