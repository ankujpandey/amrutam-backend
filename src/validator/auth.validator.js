const Joi = require('joi');

module.exports.signupSchema = Joi.object({
    name: Joi.string().min(3).max(50).required().messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 3 characters long'
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Invalid email format'
    }),
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
        'string.pattern.base': 'Phone must be 10 digits'
    }),
    password: Joi.string().min(6).max(50).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters'
    }),
    role: Joi.string().valid('patient', 'doctor').optional()
});

module.exports.signinSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Invalid email format'
    }),
    password: Joi.string().min(6).max(50).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters'
    })
});