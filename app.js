// app.js
const express = require('express');
const cors = require('cors');
require("dotenv").config();
const helmet = require("helmet");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const connectDB = require("./config/database");
// const routes = require("./app/Http/routes");
const util = require("./src/util/customResponse");

const app = express();
app.use(cors());
app.use(express.json());
// app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.send('Amrutam Backend Running');
});

// Helmet initialization
app.use(helmet());


// MongoDB connection
(async ()=> {
    try {
        await connectDB(process.env.MONGO_URI)
    } catch (error) {
        console.error("Failed to connect to mongo.", error)
    }
})();


// Routes
// app.use("/amrutam/api", routes);

// self start server after resoving uncaught exception.
process.on("uncaughtException", function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

const server = app.listen(process.env.PORT, () => {
  const port = server.address().port;
  console.log("App is running on port", port);
});

app.get('/pro/v1/api/health', (req, res) => {
  res.status(200).json({
    message: 'Working',
    success: true,
    result: "",
    error_key: ""
  })
});

app.use((req, res, next) => {
  util.getCustomResponse(res, req, 404, "Sorry Unable to find this page", false,"","Ok",);
});



