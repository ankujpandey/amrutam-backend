const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const { signupSchema } = require('../validator/auth.validator.js');
const { generateToken } = require('../utils/jwt.util.js');
const { getCustomResponse } = require('../utils/customResponse.js');


exports.signup = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;
        
        const existing = await User.findOne({ email });
        if (existing) {
            return getCustomResponse(res, req, 400, 'Email already registered', false, "EMAIL_EXISTS")
        };
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Force role to patient on signup
        const user = await User.create({ name, email, phone, passwordHash, role: 'patient' });
        
        const token =  generateToken({ userId: user._id, role: user.role });
        
        let response = { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
        return getCustomResponse(res, req, 200, 'User Successfully Registered.', true, "", response, )
    } catch (err) { next(err); }
};

