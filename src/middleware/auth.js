const { getCustomResponse } = require('../utils/customResponse');
const { verifyJwtToken } = require('../utils/jwt.util');
const customValidation = require('../utils/customValidation');


exports.auth = async (req, res, next) => {
    let userId = req.userId || req.headers["x-user-id"];
    let userRole = req.userRole || req.headers["x-user-role"];

    const authHeader = req.headers.authorization;
    console.log("req",req.headers,req.userId);

    const checkData = await customValidation.checkProperties({userId, authHeader, userRole});
    if (!checkData.status) {
        return getCustomResponse(res, req, 401, checkData.message, false, "MISSING_FIELDS");
    }

    const token = authHeader.split(' ')[1];
    try {
        let payload = await verifyJwtToken(token);
        console.log("Payload:", payload);
        if(payload && payload.status){
            payload = payload.result;

            userId = payload.userId;
            userRole = payload.role;
            next();
        }else{
            return getCustomResponse(res, req, 401, "Invalid Token", false, "INVALID_TOKEN");
        }
    } catch (err) {
      console.log("Error verifying token:", err);
        if (err.name === 'TokenExpiredError') {
            return getCustomResponse(res, req, 401, "Token expired", false, "INVALID_EXPIRED");
        }
        return getCustomResponse(res, req, 401, "Invalid Token", false, "INVALID_TOKEN");
    }
};

exports.requireRole = (role) => {
  return (req, res, next) => {
    const userRole = req.userRole || req.headers["x-user-role"];
    if (!userRole) {
      return getCustomResponse(res, req, 401, 'Unauthorized', false, 'USER_ROLE_MISSING');
    }
    if (userRole !== role) {
      return getCustomResponse(res, req, 403, `Forbidden: requires ${role}`, false, 'ROLE_FORBIDDEN');
    }
    next();
  };
};