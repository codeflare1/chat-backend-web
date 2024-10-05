const Joi = require('joi');

const register = {
  body: Joi.object().keys({
    email: Joi.string().optional().email(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
  }),
};


module.exports = {
  register,
};
