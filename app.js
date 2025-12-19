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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Controllers ---------------------------------

//SQL prepared statements builders

//Read
const read = async (query) => {
    try {
        const [result] = await database.query(query.sql, query.data);
        return (result.length === 0)
            ? { isSuccess: false, result: null, message: 'No record(s) found' }
            : { isSuccess: true, result: result, message: `${result.length} record(s) found` };

    } catch (error) {
        return { isSuccess: false, result: null, message: `Failed to execute query: ${error.message}` };
    }
}

const createVehicle = async (createQuery) => {
    try {
        const status = await database.query(createQuery.sql, createQuery.data);

        const readQuery = buildVehiclesReadQuery(status[0].insertId, null);

        const { isSuccess, result, message } = await read(readQuery)


        return isSuccess
            ? { isSuccess: true, result: result, message: `Record successfully recovered` }
            : { isSuccess: false, result: null, message: `Failed to recover the inserted record: ${message}` };

    } catch (error) {
        return { isSuccess: false, result: null, message: `Failed to execute query: ${error.message}` };
    }
}

const updateVehicle = async (updateQuery) => {
    try {
        const status = await database.query(updateQuery.sql, updateQuery.data);

        if (status[0].affectedRows === 0)
            return { isSuccess: false, result: null, message: `Failed to update record: no rows affected` };

        const readQuery = buildVehiclesReadQuery(updateQuery.data.v_id, null);

        const { isSuccess, result, message } = await read(readQuery)

        return isSuccess
            ? { isSuccess: true, result: result, message: `Record successfully recovered` }
            : { isSuccess: false, result: null, message: `Failed to recover the updated record: ${message}` };

    } catch (error) {
        return { isSuccess: false, result: null, message: `Failed to execute query: ${error.message}` };
    }
}

const deleteVehicles = async (deleteQuery) => {
    try {
        const status = await database.query(deleteQuery.sql, deleteQuery.data);

        return status[0].affectedRows === 0
            ? { isSuccess: false, result: null, message: `Failed to delete record: ${deleteQuery.data.v_id}` }
            : { isSuccess: true, result: null, message: `Record successfully removed` };

    } catch (error) {
        return { isSuccess: false, result: null, message: `Failed to execute query: ${error.message}` };
    }
}

const buildVehiclesReadQuery = (id, variant) => {
    const table = '((vehicles LEFT JOIN vehicletypes ON vehicles.v_vt_id = vehicletypes.vt_id))';
    const fields = ['v_id', 'v_name', 'v_brand', 'v_seatsNo', 'v_year', 'v_plate', 'v_imageURL', 'v_vt_id'];
    let sql = '';

    switch (variant) {
        case 'types':
            sql = `SELECT ${fields} FROM ${table} WHERE vehicles.v_vt_id=:ID`;
            break;
        default:
            sql = `SELECT ${fields} FROM ${table}`;
            if (id) sql += ` WHERE v_id=:ID`;
    }
    return { sql: sql, data: { ID: id } };
}

const buildSetFields = (fields) => fields.reduce((setSql, field, index) =>
    setSql + `${field}=:${field}` + ((index === fields.length - 1) ? '' : ','), 'SET ');


const buildVehiclesCreateQuery = (record) => {
    const table = 'vehicles';
    const fields = ['v_name', 'v_brand', 'v_seatsNo', 'v_year', 'v_plate', 'v_imageURL', 'v_vt_id'];
    const sql = `INSERT INTO ${table} ` + buildSetFields(fields);
    return { sql, data: record };
};

const buildVehiclesUpdateQuery = (record, id) => {
    const table = 'vehicles';
    const fields = ['v_name', 'v_brand', 'v_seatsNo', 'v_year', 'v_plate', 'v_imageURL', 'v_vt_id'];
    const sql = `UPDATE ${table} ` + buildSetFields(fields) + ` WHERE v_id=:v_id`;
    return { sql, data: { ...record, v_id: id } };
};

const buildVehiclesDeleteQuery = (id) => {
    let table = 'vehicles';
    const sql = `DELETE FROM ${table} WHERE v_id=:v_id`;
    return { sql, data: { v_id: id } };
};

const buildVehicleTypesReadQuery = (id, variant) => {
    let sql = '';
    const table = '(vehicletypes)';
    const fields = ['vt_id', 'vt_name'];

    switch (variant) {
        default:
            sql = `SELECT ${fields} FROM ${table}`;
            if (id) sql += ` WHERE vt_id=:ID`;
    }
    return { sql: sql, data: { ID: id } };
}

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

const getVehiclesController = async (req, res, variant) => {
    const id = req.params.id;
    //Validate request

    // Access data
    const query = buildVehiclesReadQuery(id, variant);
    const { isSuccess, result, message: accessorMessage } = await read(query);
    if (!isSuccess) return res.status(404).json({ message: accessorMessage });
    // Responses
    res.status(200).json(result);
}

const postVehiclesController = async (req, res) => {
    const record = req.body;
    //Validate request

    //Access data
    const query = buildVehiclesCreateQuery(record);
    const { isSuccess, result, message: accessorMessage } = await createVehicle(query);
    if (!isSuccess) return res.status(400).json({ message: accessorMessage });
    // Responses
    res.status(201).json(result);
}

const putVehiclesController = async (req, res) => {
    const id = req.params.id;
    const record = req.body;

    //Validate request

    //Access data
    const query = buildVehiclesUpdateQuery(record, id);
    const { isSuccess, result, message: accessorMessage } = await updateVehicle(query);
    if (!isSuccess) return res.status(400).json({ message: accessorMessage });

    // Responses
    res.status(200).json(result);
}

const deleteVehiclesController = async (req, res) => {
    const id = req.params.id;
    //Validate request

    //Access data
    const query = buildVehiclesDeleteQuery(id);
    const { isSuccess, result, message: accessorMessage } = await deleteVehicles(query);
    if (!isSuccess) return res.status(400).json({ message: accessorMessage });

    // Responses
    res.status(200).json(result);
}

const getVehicleTypesController = async (req, res, variant) => {
    const id = req.params.id;
    //Validate request

    //Access data
    const query = buildVehicleTypesReadQuery(id, variant);
    const { isSuccess, result, message: accessorMessage } = await read(query);
    if (!isSuccess) return res.status(404).json({ message: accessorMessage });
    // Responses
    res.status(200).json(result);
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

// Endpoints -----------------------------------

// Vehicles
app.get('/api/vcharter/vehicles', (req, res) => getVehiclesController(req, res, null));
app.get('/api/vcharter/vehicles/:id', (req, res) => getVehiclesController(req, res))
app.get('/api/vcharter/vehicles/types/:id', (req, res) => getVehiclesController(req, res, 'types'));

// Vehicle Types
app.get('/api/vcharter/vehicletypes', (req, res) => getVehicleTypesController(req, res, null));
app.get('/api/vcharter/vehicletypes/:id', (req, res) => getVehicleTypesController(req, res, null));

app.post('/api/vcharter/vehicles', postVehiclesController);
app.put('/api/vcharter/vehicles/:id', putVehiclesController);
app.delete('/api/vcharter/vehicles/:id', deleteVehiclesController);

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
