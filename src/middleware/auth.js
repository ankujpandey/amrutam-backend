const { getCustomResponse } = require('../utils/customResponse');
const { verifyJwtToken } = require('../utils/jwt.util');
const customValidation = require('../utils/customValidation');


exports.auth = async (req, res, next) => {
    const userId = req.userId;
    const userRole = req.userRole;
    const authHeader = req.headers.authorization;

    const checkData = await customValidation.checkProperties({userId, authHeader, userRole});
    if (!checkData.status) {
        return getCustomResponse(res, req, 401, checkData.message, false, "MISSING_FIELDS");
    }

    const token = authHeader.split(' ')[1];
    try {
        const payload = await verifyJwtToken(token);
        if(payload && payload.status){
            payload = payload.result;
            userRole = payload.userId;
            req.userRole = payload.role;
            next();
        }else{
            return getCustomResponse(res, req, 401, "Invalid Token", false, "INVALID_TOKEN");
        }
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return getCustomResponse(res, req, 401, "Token expired", false, "INVALID_EXPIRED");
        }
        return getCustomResponse(res, req, 401, "Invalid Token", false, "INVALID_TOKEN");
    }
};

exports.requireRole = (role) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return getCustomResponse(res, req, 401, 'Unauthorized', false, 'USER_ROLE_MISSING');
    }
    if (req.userRole !== role) {
      return getCustomResponse(res, req, 403, `Forbidden: requires ${role}`, false, 'ROLE_FORBIDDEN');
    }
    next();
  };
};