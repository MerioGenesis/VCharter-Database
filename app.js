// Imports -------------------------------------
import express from 'express';
import cors from "cors";
import database from './database.js';

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

// Controllers ---------------------------------

const read = async (selectSql) => {
    try {
        const [result] = await database.query(selectSql);
        return (result.length === 0)
            ? { isSuccess: false, result: null, message: 'No record(s) found' }
            : { isSuccess: true, result: result, message: `${result.length} record(s) found` };

    } catch (error) {
        return { isSuccess: false, result: null, message: `Failed to execute query: ${error.message}` };
    }
}

const buildVehiclesSelectSql = (id, variant) => {
    let sql = '';
    const table = '((vehicles LEFT JOIN vehicletypes ON vehicles.v_vt_id = vehicletypes.vt_id))';
    const fields = ['v_id', 'v_name', 'v_brand', 'v_seatsNo', 'v_year', 'v_plate', 'v_imageURL', 'v_vt_id'];

    switch (variant) {
        case 'types':
            sql = `SELECT ${fields} FROM ${table} WHERE vehicles.v_vt_id=${id}`;
            break;
        default:
            sql = `SELECT ${fields} FROM ${table}`;
            if (id) sql += ` WHERE v_id=${id}`;
    }
    return sql;
}

const buildVehicleTypesSelectSql = (id, variant) => {
    let sql = '';
    const table = '(vehicletypes)';
    const fields = ['vt_id', 'vt_name'];

    switch (variant) {
        default:
            sql = `SELECT ${fields} FROM ${table}`;
            if (id) sql += ` WHERE vt_id=${id}`;
    }
    return sql;
}

const buildUsersSelectSql = (id, variant) => {
    let sql = '';
    const table = '((users LEFT JOIN userTypes on users.u_ut_userTypeId = userTypes.ut_id))';
    const fields = ['u_id', 'u_f_name', 'u_l_name', 'u_gender', 'u_dob', 'u_address', 'u_city', 'u_postcode', 'u_email', 'u_phone', 'u_ut_userTypeId'];

    switch (variant) {
        case 'types':
            sql = `SELECT ${fields} FROM ${table} WHERE users.u_ut_userTypeId=${id}`;
            break;
        default:
            sql = `SELECT ${fields} FROM ${table}`;
            if (id) sql += ` WHERE u_id=${id}`;
    }
    return sql;
}

const getVehiclesController = async (req, res, variant) => {
    const id = req.params.id; // Undefined in the case of the /api/vehicles endpoint



    //Validate request


    // Access data
    const sql = buildVehiclesSelectSql(id, variant);
    const { isSuccess, result, message } = await read(sql);
    if (!isSuccess) return res.status(404).json({ message });
    // Responses
    res.status(200).json(result);
}

const getVehicleTypesController = async (req, res) => {
    const id = req.params.id;


    //Validate request


    //Access data
    const sql = buildVehicleTypesSelectSql(id, null);
    const { isSuccess, result, message } = await read(sql);
    if (!isSuccess) return res.status(404).json({ message });
    // Responses
    res.status(200).json(result);
}

const getUsersController = async (req, res) => {
    const id = req.params.id; // Undefined in the case of the /api/vehicles endpoint

    //Validate request


    // Access data
    const sql = buildUsersSelectSql(id, null);
    const { isSuccess, result, message } = await read(sql);
    if (!isSuccess) return res.status(404).json({ message });
    // Responses
    res.status(200).json(result);
}

// Endpoints -----------------------------------

// Vehicles
app.get('/api/vcharter/vehicles', (req, res) => getVehiclesController(req, res, null));
app.get('/api/vcharter/vehicles/:id', (req, res) => getVehiclesController(req, res, null))
app.get('/api/vcharter/vehicles/types/:id', (req, res) => getVehiclesController(req, res, 'types'));

// Vehicle Types
app.get('/api/vcharter/vehicletypes', (req, res) => getVehicleTypesController(req, res, null));
app.get('/api/vcharter/vehicletypes/:id', (req, res) => getVehicleTypesController(req, res, null));

// Customers
app.get('/api/vcharter/users', (req, res) => getUsersController(req, res, null));
app.get('/api/vcharter/users/:id', (req, res) => getUsersController(req, res, null));

// Start server --------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
