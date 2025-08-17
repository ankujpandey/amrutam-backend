const Joi = require('joi');

exports.applyDoctorSchema = Joi.object({
  specialization: Joi.array().items(Joi.string()).min(1).required(),
  bio: Joi.string().min(10).max(500).required()
});

exports.updateAvailabilitySchema = Joi.object({
  availability: Joi.array().items(Joi.object({
    day: Joi.string().valid('Mon','Tue','Wed','Thu','Fri','Sat','Sun').required(),
    start: Joi.string().required(),
    end: Joi.string().required(),
    slotDuration: Joi.number().min(5).max(180)
  })).min(1).required()
});

exports.searchDoctor = Joi.object({
  specialization: Joi.string().optional(),
  mode: Joi.string().valid("online", "in-person").optional(),
  sortBy: Joi.string().valid("soonest").optional()
});

