const Joi = require('joi');
const { query } = require('../config/logger');

const register = {
  body: Joi.object().keys({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
  }),
};

const login = {
  body: Joi.object().keys({
    phoneNumber: Joi.string().required(),
    pin: Joi.string().required(),
  }),
};

const sendOtp = {
  body: Joi.object().keys({
    phoneNumber: Joi.string().required(),
    method: Joi.string().required(),
    pin: Joi.string().optional(),

  }),
};

const forgotPin = {
  body: Joi.object().keys({
    phoneNumber: Joi.string().required(),
    method: Joi.string().required(),
  }),
};

const verifyOtp = {
  query: Joi.object().keys({
    phoneNumber: Joi.string().required(),
    otp: Joi.string().required(),
    method: Joi.string().optional(),
    otpId:Joi.string().required(),
  }),
};

const createPin = {
  body: Joi.object().keys({
    pin: Joi.string().required(),
    confirmPin: Joi.string().required(),
    method: Joi.string().required(),
    phoneNumber: Joi.string().required(),
  }),
};

const loginWithPin = {
  body: Joi.object().keys({
    pin: Joi.string().required(),
  }),
};

module.exports = {
  register,
  login,
  sendOtp,
  verifyOtp,
  createPin,
  forgotPin,
  loginWithPin
};
