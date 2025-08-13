const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
  day: { type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], required: true },
  start: { type: String, required: true }, // "09:00"
  end: { type: String, required: true },   // "13:00"
  slotDuration: { type: Number, default: 20 } // minutes
}, { _id: false });

const DoctorApplicationSchema = new mongoose.Schema({
  status: { type: String, enum: ['none','pending','approved','rejected'], default: 'none' },
  specialization: [{ type: String }],
  bio: String,
  submittedAt: Date,
  reviewedAt: Date,
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['patient','doctor','admin'], default: 'patient' },
  availability: [AvailabilitySchema],
  specialization: [{ type: String }],
  modes: [{ type: String, enum: ['online','in-person'] }],
  doctorApplication: { type: DoctorApplicationSchema, default: () => ({}) }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);