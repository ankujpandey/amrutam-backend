const jwt = require('jsonwebtoken');

exports.verifyJwtToken = (token) => {
    return new Promise((resolve) => {
        jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
            if (err) {
                return resolve({
                    statusCode: 401,
                    message: err.message,
                    status: false,
                    err: err
                });
            }
            resolve({
                statusCode: 200,
                message: "Ok",
                status: true,
                result: decoded
            });
        });
    });
};

exports.generateToken = (userData, time = "3600s") => {-
    console.log("userData", userData);
    return jwt.sign(userData, process.env.TOKEN_SECRET, { expiresIn: time });
};
