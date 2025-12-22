// Imports -------------------------------------
import express from 'express';
import cors from "cors";
import vehiclesRouter from './routers/vehicles-router.js';
import vehicleTypesRouter from './routers/vehicleTypes-router.js';

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


const buildUsersReadQuery = (id, variant) => {
    let sql = '';
    const table = '((users LEFT JOIN userTypes on users.u_ut_userTypeId = userTypes.ut_id))';
    const fields = ['u_id', 'u_f_name', 'u_l_name', 'u_gender', 'u_dob', 'u_address', 'u_city', 'u_postcode', 'u_email', 'u_phone', 'u_ut_userTypeId'];

    switch (variant) {
        case 'types':
            sql = `SELECT ${fields} FROM ${table} WHERE users.u_ut_userTypeId=:ID`;
            break;
        default:
            sql = `SELECT ${fields} FROM ${table}`;
            if (id) sql += ` WHERE u_id=:ID`;
    }
    return { sql: sql, data: { ID: id } };
}

const buildUserTypesReadQuery = (id, variant) => {
    let sql = '';
    const table = '(userTypes)';
    const fields = ['ut_id', 'ut_typeName'];

    switch (variant) {
        default:
            sql = `SELECT ${fields} FROM ${table}`;
            if (id) sql += ` WHERE ut_id=:ID`;
    }
    return { sql: sql, data: { ID: id } };
}



const getUsersController = async (req, res, variant) => {
    const id = req.params.id;
    //Validate request

    // Access data
    const query = buildUsersReadQuery(id, variant);
    const { isSuccess, result, message: accessorMessage } = await read(query);
    if (!isSuccess) return res.status(404).json({ message: accessorMessage });
    // Responses
    res.status(200).json(result);
}

const getUserTypesController = async (req, res, variant) => {
    const id = req.params.id;
    //Validate request

    // Access data
    const query = buildUserTypesReadQuery(id, variant);
    const { isSuccess, result, message: accessorMessage } = await read(query);
    if (!isSuccess) return res.status(404).json({ message: accessorMessage });
    // Responses
    res.status(200).json(result);
}

// ----------------------ENDPOINTS ---------------------

// Vehicles
app.use('/api/vcharter/vehicles', vehiclesRouter);
// ---------------------------------------------

// Vehicle Types
app.use('/api/vcharter/vehicletypes', vehicleTypesRouter);
// ---------------------------------------------

// Users
app.get('/api/vcharter/users', (req, res) => getUsersController(req, res, null));
app.get('/api/vcharter/users/:id', (req, res) => getUsersController(req, res, null));
app.get('/api/vcharter/users/types/:id', (req, res) => getUsersController(req, res, 'types'));

// UserTypes
app.get('/api/vcharter/usertypes', (req, res) => getUserTypesController(req, res, null));
app.get('/api/vcharter/usertypes/:id', (req, res) => getUserTypesController(req, res, null));

// Start server --------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
