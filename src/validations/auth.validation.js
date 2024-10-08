const Joi = require('joi');

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
    method: Joi.string().required(),
  }),
};

const createPin = {
  body: Joi.object().keys({
    pin: Joi.string().required(),
    confirmPin: Joi.string().required(),
  }),
};

module.exports = {
  register,
  login,
  sendOtp,
  verifyOtp,
  createPin,
  forgotPin
};
