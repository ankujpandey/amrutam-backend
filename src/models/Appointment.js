const mongoose = require("mongoose");

// const AppointmentSchema = new mongoose.Schema({
//   doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   slotStart: { type: Date, required: true },
//   slotEnd: { type: Date, required: true },
//   status: { type: String, enum: ['PENDING','BOOKED','COMPLETED','CANCELLED'], default: 'PENDING' },
//   otpHash: String,
//   otpExpiresAt: Date,
//   lockedAt: { type: Date, default: Date.now },
//   notes: String
// }, { timestamps: true });

// AppointmentSchema.index({ doctorId: 1, slotStart: 1, slotEnd: 1 });

const AppointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  start: { type: String, required: true }, // "HH:mm"
  end: { type: String, required: true },   // "HH:mm"
  status: { type: String, enum: ['locked','confirmed','cancelled'], default: 'locked' }
}, { timestamps: true });

// Prevent duplicate confirmed bookings for same slot
AppointmentSchema.index({ doctorId: 1, date: 1, start: 1 }, { unique: true });

module.exports = mongoose.model("Appointment", AppointmentSchema);
