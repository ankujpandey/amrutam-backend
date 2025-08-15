const User = require('../models/User');
const { getCustomResponse } = require('../utils/customResponse');

exports.listApplications = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const applications = await User.find({ 'doctorApplication.status': status });
    return getCustomResponse(res, req, 200, "Applications list", true, "", applications);
  } catch (err) {
    return getCustomResponse(res, req, 500, err.message, false, "SERVER_ERROR");
  }
};

exports.reviewApplication = async (req, res) => {
  try {
    const { action, notes } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return getCustomResponse(res, req, 400, "Invalid action", false, "INVALID_ACTION");
    }

    const user = await User.findById(req.params.userId);
    if (!user) return getCustomResponse(res, req, 404, "User not found", false, "USER_NOT_FOUND");

    user.doctorApplication.status = action === 'approve' ? 'approved' : 'rejected';
    user.doctorApplication.reviewedAt = new Date();
    user.doctorApplication.reviewerId = req.userId;
    user.doctorApplication.notes = notes || '';
    if (action === 'approve') user.role = 'doctor';
    await user.save();

    return getCustomResponse(res, req, 200, `Application ${action}d`, true, "", user);
  } catch (err) {
    return getCustomResponse(res, req, 500, err.message, false, "SERVER_ERROR");
  }
};
