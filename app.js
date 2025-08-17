// app.js
const express = require('express');
const cors = require('cors');
require("dotenv").config();
const helmet = require("helmet");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const { getCustomResponse } = require("./src/utils/customResponse");

// fetch routes.
const authRoutes = require('./src/routes/auth');
const doctorRoutes = require('./src/routes/doctors');
const appointmentRoutes = require('./src/routes/appointments');
const adminRoutes = require('./src/routes/admin');

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
mongoose.connect(process.env.MONGO_URI).then(()=>{
  console.log('MongoDB connected');
}).catch(err=>{
  console.error('Mongo connect error', err);
  process.exit(1);
});

app.use((req, res, next) => {
  console.log(req.url);
  next();
});

// Routes
app.use('/amrutam/v1/api/auth', authRoutes);
app.use('/amrutam/v1/api/doctors', doctorRoutes);
app.use('/amrutam/v1/api/appointments', appointmentRoutes);
app.use('/amrutam/v1/api/admin', adminRoutes);

// self start server after resoving uncaught exception.
process.on("uncaughtException", function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Promise Rejection:", reason);
});

// start server
const server = app.listen(process.env.PORT, () => {
  const port = server.address().port;
  console.log("App is running on port", port);
});

// to check server health
app.get('/health', (req, res) => {
  res.status(200).json({
    message: 'Working',
    success: true,
    result: "",
    error_key: ""
  })
});

// page not found
app.use((req, res, next) => {
  getCustomResponse(res, req, 404, "Sorry Unable to find this page", false,"","Ok",);
});

// basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  let status = err.status || 500;
  let errMessage = 'Internal Server Error';
  getCustomResponse(res, req, status, errMessage, false,"BAD_RESPONSE","",);
});



