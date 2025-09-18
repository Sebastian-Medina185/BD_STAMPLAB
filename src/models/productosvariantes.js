// models/productosVariantes.js
const { sql, poolPromise } = require("../../db");

async function getProductosVariantes() {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM dbo.ProductosVariantes");
    return result.recordset;
}

async function getProductoVarianteById(id) {
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM dbo.ProductosVariantes WHERE VarianteID = @id");
    return result.recordset[0];
}

module.exports = { getProductosVariantes, getProductoVarianteById };