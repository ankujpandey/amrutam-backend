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

    console.log(doctor.availability, "Doctor's availability");
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


/**
 * Doctor’s slots status for a specific date.
 * Returns:
 * - redisLocks: [{ start, end, patientId, ttl }]
 * - appointments: confirmed/cancelled from Mongo
 */
exports.slotsStatus = async (req, res) => {
  try {
    const { date } = req.query;
    const doctorId = req.headers["x-user-id"];

    console.log("Fetching confirmed appointments for doctor:", doctorId, "on date:", date);

    if (!date) {
      return getCustomResponse(res, req, 400, 'date is required (YYYY-MM-DD)', false, 'MISSING_DATE');
    }

    const appointments = await Appointment.find({ 
      doctorId, 
      date, 
      status: "confirmed" 
    })
      .sort({ start: 1 })
      .populate("patientId", "name email phone");

    return getCustomResponse(res, req, 200, 'Confirmed appointments with patient details', true, '', {
      date,
      appointments
    });

  } catch (err) {
    console.error("Error fetching appointments:", err);
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