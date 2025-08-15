const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { lockSlotSchema, confirmSlotSchema, cancelSlotSchema, reschedule } = require('../validator/appointment.validator');
const appointmentController = require('../controllers/appointmentController');

router.post('/lock', auth, validate(lockSlotSchema), appointmentController.lockSlot);
router.post('/confirm', auth, requireRole('patient'), validate(confirmSlotSchema), appointmentController.confirmSlot);
router.patch('/:id/cancel', auth, validate(cancelSlotSchema), appointmentController.cancelSlot);
router.get('/my', auth, requireRole('patient'), appointmentController.myAppointments);
router.post('/unlock', auth, appointmentController.unlockSlot);
router.get("/available-slots", appointmentController.getAvailableSlots);
router.put('/:id/reschedule', auth, validate(reschedule), appointmentController.rescheduleAppointment);

module.exports = router;
