const Joi = require('joi');

exports.lockSlotSchema = Joi.object({
  doctorId: Joi.string().required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  start: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  end: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  mode: Joi.string().valid('online','in-person').optional().default('online'),
});

// Confirm using Redis lock (preferred)
exports.confirmSlotSchema = Joi.object({
  doctorId: Joi.string().required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  start: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  end: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  mode: Joi.string().valid('online','in-person').optional().default('online'),
});

exports.cancelSlotSchema = Joi.object({
  reason: Joi.string().optional()
});

exports.reschedule = {
  body: {
    newSlot: { type: 'string', empty: false }
  }
};