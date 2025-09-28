// models/pedidos.js
const { sql, poolPromise } = require("../db");

async function getPedidos() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request().query(`
        SELECT PedidoID, Nit, FechaPedido, Estado 
        FROM dbo.Pedidos 
        ORDER BY PedidoID
    `);
    return result.recordset;
}

async function getPedidoById(pedidoID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request()
        .input("pedidoID", sql.Int, pedidoID)
        .query("SELECT PedidoID, Nit, FechaPedido, Estado FROM dbo.Pedidos WHERE PedidoID = @pedidoID");
    
    return result.recordset[0];
}

async function createPedido(pedido) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request()
        .input("nit", sql.VarChar(15), pedido.Nit)
        .input("fechaPedido", sql.Date, new Date(pedido.FechaPedido))
        .input("estado", sql.VarChar(20), pedido.Estado || 'Pendiente') // Cambiado a VarChar
        .query(`
            INSERT INTO dbo.Pedidos (Nit, FechaPedido, Estado)
            VALUES (@nit, @fechaPedido, @estado);
            SELECT * FROM dbo.Pedidos WHERE PedidoID = SCOPE_IDENTITY();
        `);
    
    return result.recordset[0];
}

async function updatePedido(pedidoID, pedido) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const exists = await pool.request()
        .input("pedidoID", sql.Int, pedidoID)
        .query("SELECT COUNT(*) as count FROM dbo.Pedidos WHERE PedidoID = @pedidoID");
    
    if (exists.recordset[0].count === 0) {
        throw new Error('El pedido no existe');
    }

    const result = await pool.request()
        .input("pedidoID", sql.Int, pedidoID)
        .input("nit", sql.VarChar(15), pedido.Nit)
        .input("fechaPedido", sql.Date, new Date(pedido.FechaPedido))
        .input("estado", sql.VarChar(20), pedido.Estado) // Cambiado a VarChar
        .query(`
            UPDATE dbo.Pedidos 
            SET Nit = @nit, 
                FechaPedido = @fechaPedido, 
                Estado = @estado
            WHERE PedidoID = @pedidoID;
            SELECT * FROM dbo.Pedidos WHERE PedidoID = @pedidoID;
        `);
    
    return result.recordset[0];
}

async function deletePedido(pedidoID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const exists = await pool.request()
        .input("pedidoID", sql.Int, pedidoID)
        .query("SELECT * FROM dbo.Pedidos WHERE PedidoID = @pedidoID");
    
    if (exists.recordset.length === 0) {
        throw new Error('El pedido no existe');
    }

    const hasDetalles = await pool.request()
        .input("pedidoID", sql.Int, pedidoID)
        .query("SELECT COUNT(*) as count FROM dbo.DetallePedido WHERE PedidoID = @pedidoID");
    
    if (hasDetalles.recordset[0].count > 0) {
        throw new Error('No se puede eliminar el pedido porque tiene detalles asociados');
    }

    const result = await pool.request()
        .input("pedidoID", sql.Int, pedidoID)
        .query("DELETE FROM dbo.Pedidos WHERE PedidoID = @pedidoID");
    
    return { 
        deleted: true, 
        pedido: exists.recordset[0],
        rowsAffected: result.rowsAffected[0] 
    };
}

module.exports = { 
    getPedidos, 
    getPedidoById, 
    createPedido, 
    updatePedido, 
    deletePedido 
};