const mongoose = require("mongoose");

module.exports = async function connectDB(uri) {
    if(!uri) throw new Error("Mongo URI not found.")
    await mongoose.connect(uri, {dbName: "amrutam"});
    console.log("Mongo DB Cnnected.")
};