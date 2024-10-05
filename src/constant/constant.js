const responseMessage = {
    RESET_PASSWORD_MESSAGE: 'password reset successfully',
    OTP_SENT_MESSAGE: 'otp sent successfully',
    WRONG_CREDENTIAL_MESSAGE: 'Incorrect email or password',
    InCorrectContactNumber_MESSAGE: 'Incorrect phoneNumber',
    NOT_FOUND: 'Not found',
    USER_NOT_FOUND: 'user not found',
    PASSWORD_RESET_FAILED: 'Password reset failed',
    EMAIL_VERIFICATION_FAILED: 'Email verification failed',
    CURRENT_PASSWORD_NOT_MATCH: 'Current password does not match',
    PASSWORD_NOT_MATCH: 'New password and confirm password do not match',
    EMAIL_ALREADY_TAKEN: 'Email already taken',
    PASSWORDS_MUST_MATCH: 'Both password should be same',
    PHONE_NUMBER_ALREADY_TAKEN: 'PhoneNumber already taken',
    DRIVER_NOT_FOUND: 'Driver does not exist',
    UNAUTHORIZED:'Not authorized'
  };
  
  const userTypes = {
    USER: 'user',
    OWNER: 'owner',
    ADMIN: 'admin',
  };
  
  
  module.exports = { responseMessage, userTypes };
  