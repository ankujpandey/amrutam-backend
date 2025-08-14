const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.get('/applications', auth, requireRole('admin'), adminController.listApplications);
router.patch('/applications/:userId/review', auth, requireRole('admin'), adminController.reviewApplication);

module.exports = router;
