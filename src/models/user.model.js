const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: false,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    image: {
      type: String,
      required: false,
      trim: true,
    },
    pin: {
      type: String,
      required: false,
      trim: true,
      minlength: 4,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
    },
    userDocument: {
      type: String,
      required: false,
    },

  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.statics.isPhoneNumberTaken = async function (phoneNumber) {
  const user = await this.findOne({ phoneNumber});
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPinMatch = async function (pin) {
  const user = this;
  return bcrypt.compare(pin, user.pin);
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('pin')) {
    user.pin = await bcrypt.hash(user.pin, 8);
  }
  next();
});

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
