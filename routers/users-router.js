import { Router } from 'express';
import database from '../database.js';

const router = Router();

// Query builders ------------------

const buildSetFields = (fields) => fields.reduce((setSql, field, index) =>
    setSql + `${field}=:${field}` + ((index === fields.length - 1) ? '' : ','), 'SET ');

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

// Data accessors ------------------

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

// Controllers ----------------------

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

// Endpoints -----------------------

router.get('/', (req, res) => getUsersController(req, res, null));
router.get('/:id', (req, res) => getUsersController(req, res, null));
router.get('/:id', (req, res) => getUsersController(req, res, 'types'));


export default router;