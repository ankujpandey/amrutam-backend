const { getCustomResponse } = require("../utils/customResponse");


exports.validate = function (schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            return getCustomResponse(res, req, 400, error.details.map((e) => e.message).join(', '), false, "VALIDATION_FAILED");
        }
        next();
    };
}