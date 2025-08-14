const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getCustomResponse } = require('../utils/customResponse');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// Signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

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
      role: role && role === 'doctor' ? 'patient' : 'patient', // Always patient until approved
      doctorApplication: role === 'doctor' ? {
        status: 'pending',
        submittedAt: new Date()
      } : { status: 'none' }
    });

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return getCustomResponse(res, req, 201, 'Signup successful', true, '', {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
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

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return getCustomResponse(res, req, 200, 'Signin successful', true, '', {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    return getCustomResponse(res, req, 500, err.message, false, 'SERVER_ERROR');
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { availability } = req.body;

    if (!Array.isArray(availability) || availability.length === 0) {
      return getCustomResponse(res, req, 400, "Invalid availability format", false, "INVALID_INPUT");
    }

    await User.findByIdAndUpdate(
      doctorId,
      { availability },
      { new: true }
    );

    return getCustomResponse(res, req, 200, "Availability updated successfully", true, "", availability);
  } catch (err) {
    console.error(err);
    return getCustomResponse(res, req, 500, "Server error", false, "SERVER_ERROR");
  }
};
