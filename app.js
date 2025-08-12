// app.js
const express = require('express');
const cors = require('cors');
require("dotenv").config();
const helmet = require("helmet");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
// const database = require("./config/database");
// const routes = require("./app/Http/routes");
// const util = require("./app/util/customResponse");

const app = express();
app.use(cors());
app.use(express.json());
// app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.send('Amrutam Backend Running');
});

// Helmet initialization
app.use(helmet());

// compress all responses
// app.use(compression());

// // MongoDB connection
// mongoose.connect(database.mongodb.uri, {
//   useNewUrlParser: true,
//   /*  user: database.mongodb.username,
//     pass: database.mongodb.password */
// });
// mongoose.Promise = global.Promise;
// console.log("----------------------------------");

// // On connection error
// mongoose.connection.on("error", (error) => {
//   console.log("Database error: " + error);
// });

// // On successful connection
// mongoose.connection.on("connected", () => {
//   console.log("Connected to mongo database");
// });





// Routes
// app.use("/pro/v1/api", routes);

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



