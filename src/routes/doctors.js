const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { applyDoctorSchema, updateAvailabilitySchema } = require('../validator/doctor.validator');
const doctorController = require('../controllers/doctorController');

router.get('/', doctorController.listDoctors);
router.post('/apply', auth, requireRole('patient'), validate(applyDoctorSchema), doctorController.applyDoctor);
router.patch('/availability', auth, requireRole('doctor'), validate(updateAvailabilitySchema), doctorController.updateAvailability);
router.get('/slots', auth, requireRole('doctor'), doctorController.slotsStatus);

module.exports = router;
