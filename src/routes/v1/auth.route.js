const express = require('express');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const multer = require('multer');
const auth = require('../../middlewares/auth');

const upload = multer({dest: 'uploads/'});

const router = express.Router();

router.post('/register', auth(), upload.single('userProfileImage'), validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/send-otp', validate(authValidation.sendOtp), authController.sendOtp);
router.get('/verify-otp', validate(authValidation.verifyOtp), authController.verifyOtp);
router.post('/set-pin', validate(authValidation.createPin), authController.setPin);
router.post('/forgot-pin', auth(), validate(authValidation.forgotPin), authController.forgotPin);
router.post('/loginWithPin', auth(), validate(authValidation.loginWithPin), authController.loginWithPin);
router.put('/upload-document', auth(),upload.single('uploadDocument'), authController.uploadUserDocument);

module.exports = router;
