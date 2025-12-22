import { Router } from "express";
import database from '../database.js';

const router = Router();

// Query builders ------------------

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


// Controlers ----------------------

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

// Endpoints -----------------------

router.get('/', (req, res) => getVehicleTypesController(req, res, null));
router.get('/:id', (req, res) => getVehicleTypesController(req, res, null));



export default router;