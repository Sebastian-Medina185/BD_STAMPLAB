// models/detallePedido.js
const { sql, poolPromise } = require("../../db");

async function getDetallePedido() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request().query(`
        SELECT 
            dp.DetallePedidoID,
            p.PedidoID,
            i.Nombre as Insumo,
            dp.Cantidad
        FROM dbo.DetallePedido dp
        INNER JOIN dbo.Pedidos p ON dp.PedidoID = p.PedidoID
        INNER JOIN dbo.Insumos i ON dp.InsumoID = i.InsumoID
        ORDER BY dp.DetallePedidoID
    `);
    return result.recordset;
}

async function getDetallePedidoById(id) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            SELECT 
                dp.DetallePedidoID,
                p.PedidoID,
                i.Nombre as Insumo,
                dp.Cantidad
            FROM dbo.DetallePedido dp
            INNER JOIN dbo.Pedidos p ON dp.PedidoID = p.PedidoID
            INNER JOIN dbo.Insumos i ON dp.InsumoID = i.InsumoID
            WHERE dp.DetallePedidoID = @id
        `);
    
    return result.recordset[0];
}

async function createDetallePedido(detalle) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar si existe el pedido
    const pedidoExists = await pool.request()
        .input("pedidoID", sql.Int, detalle.PedidoID)
        .query("SELECT COUNT(*) as count FROM dbo.Pedidos WHERE PedidoID = @pedidoID");

    if (pedidoExists.recordset[0].count === 0) {
        throw new Error(`No existe ningún pedido con el ID ${detalle.PedidoID}`);
    }

    // Verificar si existe el insumo
    const insumoExists = await pool.request()
        .input("insumoID", sql.Int, detalle.InsumoID)
        .query("SELECT COUNT(*) as count FROM dbo.Insumos WHERE InsumoID = @insumoID");

    if (insumoExists.recordset[0].count === 0) {
        throw new Error(`No existe ningún insumo con el ID ${detalle.InsumoID}`);
    }

    const result = await pool.request()
        .input("pedidoID", sql.Int, detalle.PedidoID)
        .input("insumoID", sql.Int, detalle.InsumoID)
        .input("cantidad", sql.Int, detalle.Cantidad)
        .query(`
            INSERT INTO dbo.DetallePedido (PedidoID, InsumoID, Cantidad)
            VALUES (@pedidoID, @insumoID, @cantidad);

            SELECT 
                dp.DetallePedidoID,
                p.PedidoID,
                i.Nombre as Insumo,
                dp.Cantidad
            FROM dbo.DetallePedido dp
            INNER JOIN dbo.Pedidos p ON dp.PedidoID = p.PedidoID
            INNER JOIN dbo.Insumos i ON dp.InsumoID = i.InsumoID
            WHERE dp.DetallePedidoID = SCOPE_IDENTITY();
        `);

    return result.recordset[0];
}

module.exports = { 
    getDetallePedido, 
    getDetallePedidoById,
    createDetallePedido
};