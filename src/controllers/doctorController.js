const User = require('../models/User');
const Appointment = require('../models/Appointment');
const redis = require('../utils/redisClient');
const { getCustomResponse } = require('../utils/customResponse');

exports.findDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await User.findOne({
      _id: id,
      role: 'doctor',
      'doctorApplication.status': 'approved'
    }).select('-passwordHash');
    return getCustomResponse(res, req, 200, 'Doctor fetched successfully', true, '', doctor);
  } catch (err) {
    return getCustomResponse(res, req, 500, err.message, false, 'SERVER_ERROR');
  }
};

exports.applyDoctor = async (req, res) => {
  try {
    const { specialization, bio } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return getCustomResponse(res, req, 404, 'User not found', false, 'USER_NOT_FOUND');

    if (user.doctorApplication.status === 'pending')
      return getCustomResponse(res, req, 400, 'Application already pending', false, 'ALREADY_PENDING');

    user.doctorApplication = {
      status: 'pending',
      specialization,
      bio,
      submittedAt: new Date()
    };

    await user.save();
    return getCustomResponse(res, req, 200, 'Application submitted', true, '', user);
  } catch (err) {
    return getCustomResponse(res, req, 500, err.message, false, 'SERVER_ERROR');
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return getCustomResponse(res, req, 404, 'User not found', false, 'USER_NOT_FOUND');

    user.availability = availability;
    await user.save();
    return getCustomResponse(res, req, 200, 'Availability updated', true, '', user.availability);
  } catch (err) {
    return getCustomResponse(res, req, 500, err.message, false, 'SERVER_ERROR');
  }
};


/**
 * Doctor’s slots status for a specific date.
 * Returns:
 * - redisLocks: [{ start, end, patientId, ttl }]
 * - appointments: confirmed/cancelled from Mongo
 */
exports.slotsStatus = async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    const doctorId = req.userId; // doctor authenticated

    if (!date) {
      return getCustomResponse(res, req, 400, 'date is required (YYYY-MM-DD)', false, 'MISSING_DATE');
    }

    // 1) Redis locks for this doctor + date
    const pattern = `lock:${doctorId}:${date}:*`;
    const locks = [];
    let cursor = '0';
    do {
      const reply = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = reply[0];
      const keys = reply[1];
      if (keys && keys.length) {
        for (const key of keys) {
          const ttl = await redis.ttl(key);
          const meta = await redis.hgetall(`${key}:meta`);
          const parts = key.split(':'); // ['lock', doctorId, date, start]
          const start = parts[3];
          locks.push({
            start,
            end: meta.end || null,
            patientId: meta.patientId || null,
            ttl
          });
        }
      }
    } while (cursor !== '0');

    // 2) Mongo confirmed/cancelled appointments for that date
    const appointments = await Appointment.find({ doctorId, date })
      .sort({ start: 1 });

    return getCustomResponse(res, req, 200, 'Slots status', true, '', {
      date,
      redisLocks: locks,
      appointments
    });
  } catch (err) {
    return getCustomResponse(res, req, 500, err.message, false, 'SERVER_ERROR');
  }
};

exports.searchDoctors = async (req, res, next) => {
  try {
    const { specialization, mode, sortBy } = req.query;

    const filter = {};
    if (specialization) filter.specialization = specialization;
    if (mode) filter.modes = mode; // e.g. "online" or "in-person"

    let doctors = await User.find({
      role: 'doctor',
      'doctorApplication.status': 'approved',
      ...filter
    }).lean();

    // Sorting by soonest availability
    if (sortBy === 'soonest') {
      doctors.sort((a, b) => new Date(a.nextAvailableSlot) - new Date(b.nextAvailableSlot));
    }

    return getCustomResponse(res, req, 200, 'Doctors fetched successfully', true, '', doctors);
  } catch (err) {
    next(err);
  }
};