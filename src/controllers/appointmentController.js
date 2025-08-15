const Appointment = require('../models/Appointment');
const redis = require('../utils/redisClient');
const { getCustomResponse } = require('../utils/customResponse');

// key builder
function lockKey(doctorId, date, start) {
  return `lock:${doctorId}:${date}:${start}`;
}

/**
 * Lock a slot for 5 minutes (or until OTP success).
 * Uses Redis SET NX EX 300. Value = patientId.
 */
exports.lockSlot = async (req, res) => {
  try {
    const { doctorId, date, start, end } = req.body;

    const key = lockKey(doctorId, date, start);
    // Try to acquire lock if not exists; expire in 300s (5 min)
    const ok = await redis.set(key, String(req.userId), 'NX', 'EX', 300);
    if (!ok) {
      return getCustomResponse(res, req, 400, 'Slot already locked', false, 'SLOT_LOCKED');
    }

    // (Optional) you could store end time too in a hash, but not required
    await redis.hset(`${key}:meta`, { end, patientId: String(req.userId) });
    await redis.expire(`${key}:meta`, 300);

    getCustomResponse(res, req, 200, 'Slot locked (valid 5 min)', true, '', {
      doctorId, date, start, end, lockExpiresInSec: 300
    });
  } catch (err) {
    getCustomResponse(res, req, 500, err.message, false, 'SERVER_ERROR');
  }
};

/**
 * Confirm a slot if you own the Redis lock.
 * Creates Mongo "confirmed" appointment and deletes the Redis lock.
 * Mongo unique index guarantees no duplicate bookings.
 */
exports.confirmSlot = async (req, res) => {
  try {
    const { doctorId, date, start, end } = req.body;
    const key = lockKey(doctorId, date, start);

    // Check lock exists and belongs to this user
    const owner = await redis.get(key);
    if (!owner) {
      return getCustomResponse(res, req, 400, 'Lock missing or expired', false, 'LOCK_MISSING');
    }
    if (owner !== String(req.userId)) {
      return getCustomResponse(res, req, 403, 'Lock owned by another user', false, 'LOCK_OWNED_BY_OTHER');
    }

    // Create confirmed appointment
    try {
      const appt = await Appointment.create({
        doctorId,
        patientId: req.userId,
        date,
        start,
        end,
        status: 'confirmed'
      });

      // Delete the lock after confirmation
      await redis.del(key);
      await redis.del(`${key}:meta`);

      return getCustomResponse(res, req, 200, 'Appointment confirmed', true, '', appt);
    } catch (err) {
      // Duplicate unique index => already confirmed by someone else (rare race)
      if (err && err.code === 11000) {
        return getCustomResponse(res, req, 400, 'Slot already booked', false, 'SLOT_TAKEN');
      }
      throw err;
    }
  } catch (err) {
    return getCustomResponse(res, req, 500, err.message, false, 'SERVER_ERROR');
  }
};

/**
 * Cancel a confirmed appointment (Mongo).
 * If you also want to allow cancelling during lock (pre-confirm),
 * add an endpoint that deletes the Redis key if owned by the caller.
 */
exports.cancelSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const appt = await Appointment.findById(id);
    if (!appt) return getCustomResponse(res, req, 404, 'Appointment not found', false, 'NOT_FOUND');

    // Only patient who booked or the doctor/admin can cancel – adjust as needed
    const isPatient = String(appt.patientId) === String(req.userId);
    // TODO: you may also check role via req.userRole === 'doctor'/'admin'
    if (!isPatient) {
      return getCustomResponse(res, req, 403, 'Not allowed to cancel this appointment', false, 'FORBIDDEN');
    }

    // Combine date and start time to get appointment DateTime
    const apptDateTime = new Date(`${appt.date}T${appt.start}:00Z`);
    const now = new Date();
    const hoursDiff = (apptDateTime - now) / (1000 * 60 * 60);
    console.log({ apptDateTime, now, hoursDiff });
    if (hoursDiff < 24) {
      return getCustomResponse(res, req, 400, 'Cannot cancel within 24h', false, 'CANNOT_CANCEL');
    }

    appt.status = 'cancelled';
    await appt.save();
    return getCustomResponse(res, req, 200, 'Appointment cancelled', true, '', appt);
  } catch (err) {
    return getCustomResponse(res, req, 500, err.message, false, 'SERVER_ERROR');
  }
};

/**
 * Patient: list my confirmed/cancelled appointments.
 */
exports.myAppointments = async (req, res) => {
  try {
    const appts = await Appointment.find({ patientId: req.userId })
      .sort({ date: 1, start: 1 })
      .populate('doctorId', 'name email specialization');
    return getCustomResponse(res, req, 200, 'Appointments fetched', true, '', appts);
  } catch (err) {
    return getCustomResponse(res, req, 500, err.message, false, 'SERVER_ERROR');
  }
};

/**
 * Optional: Unlock a slot before it expires (if user owns the lock).
 * Useful if OTP fails or user backs out explicitly.
 */
exports.unlockSlot = async (req, res) => {
  try {
    const { doctorId, date, start } = req.body;
    const key = lockKey(doctorId, date, start);

    const owner = await redis.get(key);
    if (!owner) {
      return getCustomResponse(res, req, 200, 'Already unlocked or expired', true, '', { unlocked: true });
    }
    if (owner !== String(req.userId)) {
      return getCustomResponse(res, req, 403, 'Lock owned by another user', false, 'LOCK_OWNED_BY_OTHER');
    }

    await redis.del(key);
    await redis.del(`${key}:meta`);

    return getCustomResponse(res, req, 200, 'Slot unlocked', true, '', { unlocked: true });
  } catch (err) {
    return getCustomResponse(res, req, 500, err.message, false, 'SERVER_ERROR');
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return getCustomResponse(res, req, 400, "doctorId and date are required", false, "MISSING_FIELDS");
    }

    // Fetch doctor's recurring availability
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return getCustomResponse(res, req, 404, "Doctor not found", false, "NOT_FOUND");
    }

    // Filter availability for the given day
    const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
    const availabilityForDay = doctor.availability.filter(a => a.day === dayOfWeek);

    if (availabilityForDay.length === 0) {
      return getCustomResponse(res, req, 200, "No availability for this date", true, "", []);
    }

    // Get booked slots from Mongo
    const bookedSlots = await Appointment.find({ doctorId, date }).lean();
    const bookedTimes = bookedSlots.map(b => `${b.start}-${b.end}`);

    // Get locked slots from Redis
    const redisKeys = await redisClient.keys(`lock:${doctorId}:${date}:*`);
    const lockedTimes = redisKeys.map(key => key.split(":").slice(-2).join("-"));

    // Generate all possible slots
    const allSlots = [];
    availabilityForDay.forEach(av => {
      let currentTime = av.start;
      while (currentTime < av.end) {
        let nextTime = addMinutes(currentTime, av.slotDuration);
        allSlots.push({
          start: currentTime,
          end: nextTime,
          status: bookedTimes.includes(`${currentTime}-${nextTime}`)
            ? "booked"
            : lockedTimes.includes(`${currentTime}-${nextTime}`)
              ? "locked"
              : "available"
        });
        currentTime = nextTime;
      }
    });

    return getCustomResponse(res, req, 200, "Slots fetched successfully", true, "", allSlots);
  } catch (err) {
    console.error(err);
    return getCustomResponse(res, req, 500, "Server error", false, "SERVER_ERROR");
  }
};

exports.rescheduleAppointment  = async (req, res) => {
  try {
    const { id } = req.params;
    const { newSlot } = req.body;

    const appt = await Appointment.findById(id);
    if (!appt) return getCustomResponse(res, req, 404, 'Appointment not found', false, 'NOT_FOUND');

    // Only patient who booked or the doctor/admin can cancel – adjust as needed
    const isPatient = String(appt.patientId) === String(req.userId);
    // TODO: you may also check role via req.userRole === 'doctor'/'admin'
    if (!isPatient) {
      return getCustomResponse(res, req, 403, 'Not allowed to reschedule this appointment', false, 'FORBIDDEN');
    }

    // Combine date and start time to get appointment DateTime
    const apptDateTime = new Date(`${appt.date}T${appt.start}:00Z`);
    const now = new Date();
    const hoursDiff = (apptDateTime - now) / (1000 * 60 * 60);
    console.log({ apptDateTime, now, hoursDiff });
    if (hoursDiff < 24) {
      return getCustomResponse(res, req, 400, 'Cannot reschedule within 24h', false, 'CANNOT_CANCEL');
    }
// TODO: add start and end time of reschedule here in db.
    appt.status = 'cancelled';
    await appt.save();
    return getCustomResponse(res, req, 200, 'Appointment cancelled', true, '', appt);
  } catch (err) {
    return getCustomResponse(res, req, 500, err.message, false, 'SERVER_ERROR');
  }
};

// Helper to add minutes to HH:mm
function addMinutes(time, mins) {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(h);
  date.setMinutes(m + mins);
  return date.toTimeString().slice(0, 5);
}