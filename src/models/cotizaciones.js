// models/cotizaciones.js
const { sql, poolPromise } = require("../../db");

async function getCotizaciones() {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM dbo.Cotizaciones");
    return result.recordset;
}

async function getCotizacionById(id) {
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM dbo.Cotizaciones WHERE CotizacionID = @id");
    return result.recordset[0];
}

module.exports = { getCotizaciones, getCotizacionById };