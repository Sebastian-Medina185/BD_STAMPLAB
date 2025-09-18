// models/pedidos.js
const { sql, poolPromise } = require("../../db");

async function getPedidos() {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM dbo.Pedidos");
    return result.recordset;
}

async function getPedidoById(id) {
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM dbo.Pedidos WHERE PedidoID = @id");
    return result.recordset[0];
}

module.exports = { getPedidos, getPedidoById };