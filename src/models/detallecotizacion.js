// models/detalleCotizacion.js
const { sql, poolPromise } = require("../../db");

async function getDetalleCotizacion() {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM dbo.DetalleCotizacion");
    return result.recordset;
}

async function getDetalleCotizacionById(id) {
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM dbo.DetalleCotizacion WHERE DetalleID = @id");
    return result.recordset[0];
}

module.exports = { getDetalleCotizacion, getDetalleCotizacionById };