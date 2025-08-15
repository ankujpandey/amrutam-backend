exports.checkProperties = async function (obj) {
    var validObj = {};
    return new Promise(function (resolve, reject) {
        if (obj.doc) {
            obj.doc = "exist";
        }
        for (var key in obj) {
            // console.log("validating --",key)
            if (
                obj[key] !== null &&
                obj[key] != "" &&
                typeof obj[key] != "undefined"
            ) {
            } else {
                validObj.status = false;
                validObj.message = key + " value required";
                return resolve(validObj);
            }
        }
        validObj.status = true;
        resolve(validObj);
    });
};