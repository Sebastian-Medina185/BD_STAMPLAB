// src/models/productos.js
const { sql, poolPromise } = require("../../db");

async function getProductos() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request().query(`
        SELECT ProductoID, Nombre, Descripcion, TelaID 
        FROM dbo.Productos 
        ORDER BY ProductoID
    `);
    return result.recordset;
}

async function getProductoById(productoID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request()
        .input("productoID", sql.Int, productoID)
        .query("SELECT ProductoID, Nombre, Descripcion, TelaID FROM dbo.Productos WHERE ProductoID = @productoID");
    
    return result.recordset[0];
}

async function createProducto(producto) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar si existe la tela
    const telaExists = await pool.request()
        .input("telaID", sql.Int, producto.TelaID)
        .query("SELECT COUNT(*) as count FROM dbo.Telas WHERE TelaID = @telaID");

    if (telaExists.recordset[0].count === 0) {
        throw new Error(`No existe ninguna tela con el ID ${producto.TelaID}`);
    }

    const result = await pool.request()
        .input("nombre", sql.VarChar(15), producto.Nombre)
        .input("descripcion", sql.VarChar(200), producto.Descripcion)
        .input("telaID", sql.Int, producto.TelaID)
        .query(`
            INSERT INTO dbo.Productos (Nombre, Descripcion, TelaID)
            VALUES (@nombre, @descripcion, @telaID);
            SELECT * FROM dbo.Productos WHERE ProductoID = SCOPE_IDENTITY();
        `);
    
    return result.recordset[0];
}

async function updateProducto(productoID, producto) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const exists = await pool.request()
        .input("productoID", sql.Int, productoID)
        .query("SELECT COUNT(*) as count FROM dbo.Productos WHERE ProductoID = @productoID");
    
    if (exists.recordset[0].count === 0) {
        throw new Error('El producto no existe');
    }

    const result = await pool.request()
        .input("productoID", sql.Int, productoID)
        .input("nombre", sql.VarChar(15), producto.Nombre)
        .input("descripcion", sql.VarChar(200), producto.Descripcion)
        .input("telaID", sql.Int, producto.TelaID)
        .query(`
            UPDATE dbo.Productos 
            SET Nombre = @nombre, 
                Descripcion = @descripcion, 
                TelaID = @telaID
            WHERE ProductoID = @productoID;
            SELECT * FROM dbo.Productos WHERE ProductoID = @productoID;
        `);
    
    return result.recordset[0];
}

async function deleteProducto(productoID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const exists = await pool.request()
        .input("productoID", sql.Int, productoID)
        .query("SELECT * FROM dbo.Productos WHERE ProductoID = @productoID");
    
    if (exists.recordset.length === 0) {
        throw new Error('El producto no existe');
    }

    const result = await pool.request()
        .input("productoID", sql.Int, productoID)
        .query("DELETE FROM dbo.Productos WHERE ProductoID = @productoID");
    
    return { 
        deleted: true, 
        producto: exists.recordset[0],
        rowsAffected: result.rowsAffected[0] 
    };
}

module.exports = { 
    getProductos,
    getProductoById,
    createProducto,
    updateProducto,
    deleteProducto
};
