const express = require('express');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const multer = require('multer');

const upload = multer({dest: 'uploads/'});

const router = express.Router();

router.post('/register', upload.single('userProfileImage'), validate(authValidation.register), authController.register);

module.exports = router;
