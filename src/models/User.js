const mongoose = require('mongoose');

const RecurringRuleSchema = new mongoose.Schema({
  name: { type: String, required: true },              // e.g., "Regular Schedule"
  startDate: { type: String, required: true },         // "2024-01-01"
  endDate: { type: String, required: true },           // "2024-12-31"
  repeatWeekly: { type: Boolean, default: true }
}, { _id: true });

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
  availability: [AvailabilitySchema], // only for doctors
  recurringRules: [RecurringRuleSchema],
  specialization: [{ type: String }], // only for doctors
  modes: [{ type: String, enum: ['online','in-person'] }],
  doctorApplication: { type: DoctorApplicationSchema, default: () => ({}) }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);