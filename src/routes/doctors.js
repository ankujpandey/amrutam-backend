const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { applyDoctorSchema, updateAvailabilitySchema, searchDoctor } = require('../validator/doctor.validator');
const doctorController = require('../controllers/doctorController');

router.get('/doctor/:id', auth, doctorController.findDoctor);
router.get('/search', validate(searchDoctor), doctorController.searchDoctors);
// router.post('/apply', auth, requireRole('doctor'), validate(applyDoctorSchema), doctorController.applyDoctor);
router.patch('/update-availability', auth, requireRole('doctor'), validate(updateAvailabilitySchema), doctorController.updateAvailability);
router.get('/slots', auth, requireRole('doctor'), doctorController.slotsStatus);
router.get("/:id/availability", auth, doctorController.getAvailability);

module.exports = router;
