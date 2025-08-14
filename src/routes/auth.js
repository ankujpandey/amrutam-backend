const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { signupSchema, signinSchema } = require('../validator/auth.validator');
const { validate } = require('../middleware/validate');

// Auth routes
router.post('/signup', validate(signupSchema), authController.signup);
router.post('/signin', validate(signinSchema), authController.signin);

module.exports = router;