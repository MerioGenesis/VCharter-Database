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

const read = async (sql) => {
    try {
        const [result] = await database.query(sql);
        return (result.length === 0)
            ? { isSuccess: false, result: null, message: 'No record(s) found' }
            : { isSuccess: true, result: result, message: `${result.length} record(s) found` };

    } catch (error) {
        return { isSuccess: false, result: null, message: `Failed to execute query: ${error.message}` };
    }
}

const createVehicle = async (sql, record) => {
    try {
        const status = await database.query(sql, record);

        const recoverRecordSql = buildVehiclesSelectSql(status[0].insertId, null);
        const { isSuccess, result, message } = await read(recoverRecordSql)


        return isSuccess
            ? { isSuccess: true, result: result, message: `Record successfully recovered` }
            : { isSuccess: false, result: null, message: `Failed to recover the inserted record: ${message}` };

    } catch (error) {
        return { isSuccess: false, result: null, message: `Failed to execute query: ${error.message}` };
    }
}

const updateVehicle = async (sql, id, record) => {
    try {
        const status = await database.query(sql, { ...record, v_id: id });

        if (status[0].affectedRows === 0)
            return { isSuccess: false, result: null, message: `Failed to update record: no rows affected` };

        const recoverRecordSql = buildVehiclesSelectSql(id, null);

        const { isSuccess, result, message } = await read(recoverRecordSql)

        return isSuccess
            ? { isSuccess: true, result: result, message: `Record successfully recovered` }
            : { isSuccess: false, result: null, message: `Failed to recover the updated record: ${message}` };

    } catch (error) {
        return { isSuccess: false, result: null, message: `Failed to execute query: ${error.message}` };
    }
}

const deleteVehicles = async (sql, id) => {
    try {
        const status = await database.query(sql, { v_id: id });

        return status[0].affectedRows === 0
            ? { isSuccess: false, result: null, message: `Failed to delete record: ${id}` }
            : { isSuccess: true, null: result, message: `Record successfully removed` };

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

const buildSetFields = (fields) => fields.reduce((setSql, field, index) =>
    setSql + `${field}=:${field}` + ((index === fields.length - 1) ? '' : ','), 'SET ');


const buildVehiclesInsertSql = () => {
    const table = 'vehicles';
    const fields = ['v_name', 'v_brand', 'v_seatsNo', 'v_year', 'v_plate', 'v_imageURL', 'v_vt_id'];
    return `INSERT INTO ${table} ` + buildSetFields(fields);
};

const buildVehiclesUpdateSql = () => {
    const table = 'vehicles';
    const fields = ['v_name', 'v_brand', 'v_seatsNo', 'v_year', 'v_plate', 'v_imageURL', 'v_vt_id'];
    return `UPDATE ${table} ` + buildSetFields(fields) + ` WHERE v_id=:v_id`;
};

const buildVehiclesDeleteSql = () => {
    const table = 'vehicles';
    return `DELETE FROM ${table} WHERE v_id=:v_id`;
};

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

const buildUserTypesSelectSql = (id, variant) => {
    let sql = '';
    const table = '(userTypes)';
    const fields = ['ut_id', 'ut_typeName'];

    switch (variant) {
        default:
            sql = `SELECT ${fields} FROM ${table}`;
            if (id) sql += ` WHERE ut_id=${id}`;
    }
    return sql;
}

const getVehiclesController = async (res, id, variant) => {
    //Validate request

    // Access data
    const sql = buildVehiclesSelectSql(id, variant);
    const { isSuccess, result, message } = await read(sql);
    if (!isSuccess) return res.status(404).json({ message });
    // Responses
    res.status(200).json(result);
}

const postVehiclesController = async (req, res) => {
    //Validate request

    //Access data
    const sql = buildVehiclesInsertSql();
    const { isSuccess, result, message: accessorMessage } = await createVehicle(sql, req.body);
    if (!isSuccess) return res.status(400).json({ message: accessorMessage });
    // Responses
    res.status(201).json(result);
}

const putVehiclesController = async (req, res) => {
    //Validate request
    const id = req.params.id;
    const record = req.body;

    //Access data
    const sql = buildVehiclesUpdateSql();
    const { isSuccess, result, message: accessorMessage } = await updateVehicle(sql, id, record);
    if (!isSuccess) return res.status(400).json({ message: accessorMessage });

    // Responses
    res.status(200).json(result);
}

const deleteVehiclesController = async (req, res) => {
    //Validate request
    const id = req.params.id;

    //Access data
    const sql = buildVehiclesDeleteSql();
    const { isSuccess, result, message: accessorMessage } = await deleteVehicles(sql, id);
    if (!isSuccess) return res.status(400).json({ message: accessorMessage });

    // Responses
    res.status(200).json(result);
}

const getVehicleTypesController = async (res, id, variant) => {
    //Validate request

    //Access data
    const sql = buildVehicleTypesSelectSql(id, variant);
    const { isSuccess, result, message } = await read(sql);
    if (!isSuccess) return res.status(404).json({ message });
    // Responses
    res.status(200).json(result);
}

const getUsersController = async (res, id, variant) => {
    //Validate request

    // Access data
    const sql = buildUsersSelectSql(id, variant);
    const { isSuccess, result, message } = await read(sql);
    if (!isSuccess) return res.status(404).json({ message });
    // Responses
    res.status(200).json(result);
}

const getUserTypesController = async (res, id, variant) => {
    //Validate request

    // Access data
    const sql = buildUserTypesSelectSql(id, variant);
    const { isSuccess, result, message } = await read(sql);
    if (!isSuccess) return res.status(404).json({ message });
    // Responses
    res.status(200).json(result);
}

// Endpoints -----------------------------------

// Vehicles
app.get('/api/vcharter/vehicles', (req, res) => getVehiclesController(res, null, null));
app.get('/api/vcharter/vehicles/:id', (req, res) => getVehiclesController(res, req.params.id))
app.get('/api/vcharter/vehicles/types/:id', (req, res) => getVehiclesController(res, req.params.id, 'types'));

// Vehicle Types
app.get('/api/vcharter/vehicletypes', (req, res) => getVehicleTypesController(res, null, null));
app.get('/api/vcharter/vehicletypes/:id', (req, res) => getVehicleTypesController(res, req.params.id, null));

app.post('/api/vcharter/vehicles', postVehiclesController);
app.put('/api/vcharter/vehicles/:id', putVehiclesController);
app.delete('/api/vcharter/vehicles/:id', deleteVehiclesController);

// Users
app.get('/api/vcharter/users', (req, res) => getUsersController(res, null, null));
app.get('/api/vcharter/users/:id', (req, res) => getUsersController(res, req.params.id, null));
app.get('/api/vcharter/users/types/:id', (req, res) => getUsersController(res, req.params.id, 'types'));

// UserTypes
app.get('/api/vcharter/usertypes', (req, res) => getUserTypesController(res, null, null));
app.get('/api/vcharter/usertypes/:id', (req, res) => getUserTypesController(res, req.params.id, null));

// Start server --------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
