const customResponse = {};

customResponse.getCustomResponse = async function (res, req, code = "200", message = "", value = false, error_key = "", result = "", type = "", action_type = "", count = 0, responseId = "") {
    if (code == 200 && value == true) {
        value = true;
    } else {
        value = false;
    }
    result = result.result? result.result : result;
    const response = {
        message: message,
        success: value,
        result: result,
        error_key: error_key,
        count: count,
    };
    //Also we can save logs in db for api communication here. (if needed.)
    res.status(parseInt(code)).json(response);
};

module.exports = customResponse;