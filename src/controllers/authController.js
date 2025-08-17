const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getCustomResponse } = require('../utils/customResponse');
const { generateToken } = require('../utils/jwt.util');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// Signup
exports.signup = async (req, res) => {
  try {
    console.log("came to signup")
    const { name, email, password, phone, role, bio="",specialization=[] } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return getCustomResponse(res, req, 400, 'Email already registered', false, 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: role && role === 'doctor' ? 'doctor' : 'patient',
      doctorApplication: role === 'doctor' ? {
        status: 'pending',
        submittedAt: new Date(),
        bio,
        specialization,
      } : { status: 'none' }
    });

    const token = generateToken({ userId: user._id.toString(), role: user.role });

    return getCustomResponse(res, req, 201, 'Signup successful', true, '', {
      token,
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return getCustomResponse(res, req, 500, err.message, false, 'SERVER_ERROR');
  }
};

// Signin
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return getCustomResponse(res, req, 400, 'Invalid credentials', false, 'INVALID_CREDENTIALS');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return getCustomResponse(res, req, 400, 'Invalid credentials', false, 'INVALID_CREDENTIALS');
    }

    const token = generateToken({ userId: user._id.toString(), role: user.role });

    return getCustomResponse(res, req, 200, 'Signin successful', true, '', {
      token,
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role, doctorApplication: user.doctorApplication.status }
    });
  } catch (err) {
    return getCustomResponse(res, req, 500, err.message, false, 'SERVER_ERROR');
  }
};

