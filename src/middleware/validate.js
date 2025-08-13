const { getCustomResponse } = require("../utils/customResponse");


exports.validate = function (schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            // return res.status(400).json({
            //     errors: error.details.map(err => err.message)
            // });

            getCustomResponse(res, req, 400, error.details, false, "VALIDATION_FAILED");
            return;
        }
        next();
    };
}