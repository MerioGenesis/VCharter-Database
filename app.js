// Imports -------------------------------------
import express from 'express';
import cors from "cors";
import vehiclesRouter from './routers/vehicles-router.js';
import vehicleTypesRouter from './routers/vehicleTypes-router.js';
import usersRouter from './routers/users-router.js';
import userTypesRouter from './routers/userTypes-router.js';

// Configure express app -----------------------
const app = new express();
// Configure middleware ------------------------
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});
app.use(cors({ origin: '*' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------ENDPOINTS ---------------------//

// Vehicles
app.use('/api/vcharter/vehicles', vehiclesRouter);
// ---------------------------------------------

// Vehicle Types
app.use('/api/vcharter/vehicletypes', vehicleTypesRouter);
// ---------------------------------------------

// Users
app.use('/api/vcharter/users', usersRouter);
// ---------------------------------------------

// UserTypes
app.use('/api/vcharter/usertypes', userTypesRouter);


// Start server --------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
