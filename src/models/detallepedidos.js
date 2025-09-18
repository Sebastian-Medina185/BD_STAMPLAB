// models/detallePedido.js
const { sql, poolPromise } = require("../../db");

async function getDetallePedido() {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM dbo.DetallePedido");
    return result.recordset;
}

async function getDetallePedidoById(id) {
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM dbo.DetallePedido WHERE DetalleID = @id");
    return result.recordset[0];
}

module.exports = { getDetallePedido, getDetallePedidoById };