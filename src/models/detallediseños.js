// models/detalleDiseno.js
const { sql, poolPromise } = require("../../db");

async function getDetalleDiseno() {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM dbo.DetalleDiseno");
    return result.recordset;
}

async function getDetalleDisenoById(id) {
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM dbo.DetalleDiseno WHERE DetalleID = @id");
    return result.recordset[0];
}

module.exports = { getDetalleDiseno, getDetalleDisenoById };