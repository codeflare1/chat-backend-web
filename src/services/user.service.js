const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

const createUser = async (req, image) => {
  const user = await User.findOneAndUpdate({
    phoneNumber: req.user.phoneNumber
  }, 
  {...req.body, image,statusCode: 3}, 
  {new: true}
  );

  if(!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'user not found');
  };

  return user;
};

const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

const getUserById = async (id) => {
  return User.findById(id);
};

const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

const getUserByPhoneNumber = async (phoneNumber) => {
  console.log('phoneNumber', phoneNumber);
  return User.findOne({ phoneNumber });
};

const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  getUserByPhoneNumber,
};