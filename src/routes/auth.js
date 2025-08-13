const express = require('express');
const router = express.Router();
const { signup, login, me } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { signupSchema, signinSchema } = require('../validator/auth.validator');

router.post('/signup', validate(signupSchema), signup);
// router.post('/login', validate(signinSchema), signin);

module.exports = router;