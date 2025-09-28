// =================================
// src/models/telas.js - ACTUALIZADO CON PATRÓN COLORES
// =================================
const { sql, poolPromise } = require("../db");

async function getTelas() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request().query(`
        SELECT TelaID, Nombre 
        FROM dbo.Telas 
        ORDER BY TelaID
    `);
    return result.recordset;
}

async function getTelaById(telaID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request()
        .input("telaID", sql.Int, telaID) // CAMBIO: VarChar(2) → Int
        .query("SELECT TelaID, Nombre FROM dbo.Telas WHERE TelaID = @telaID");
    
    return result.recordset[0];
}

// CREAR - Solo recibe Nombre (TelaID manual)
async function createTela(tela) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // ELIMINAR: Ya no verificamos IDs duplicados ni recibimos TelaID

    const result = await pool.request()
        .input("nombre", sql.VarChar(40), tela.Nombre)
        .query(`
            INSERT INTO dbo.Telas (Nombre)
            VALUES (@nombre);
            SELECT * FROM dbo.Telas WHERE TelaID = SCOPE_IDENTITY();
        `);
    
    return result.recordset[0];
}

async function updateTela(telaID, tela) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const telaExists = await pool.request()
        .input("telaID", sql.Int, telaID) // CAMBIO: VarChar(2) → Int
        .query("SELECT COUNT(*) as count FROM dbo.Telas WHERE TelaID = @telaID");
    
    if (telaExists.recordset[0].count === 0) {
        throw new Error('La tela no existe');
    }

    const result = await pool.request()
        .input("telaID", sql.Int, telaID) // CAMBIO: VarChar(2) → Int
        .input("nombre", sql.VarChar(40), tela.Nombre)
        .query(`
            UPDATE dbo.Telas 
            SET Nombre = @nombre
            WHERE TelaID = @telaID;
            SELECT * FROM dbo.Telas WHERE TelaID = @telaID;
        `);
    
    return result.recordset[0];
}

async function deleteTela(telaID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const telaExists = await pool.request()
        .input("telaID", sql.Int, telaID) // CAMBIO: VarChar(2) → Int
        .query("SELECT * FROM dbo.Telas WHERE TelaID = @telaID");
    
    if (telaExists.recordset.length === 0) {
        throw new Error('La tela no existe');
    }

    const hasProductos = await pool.request()
        .input("telaID", sql.Int, telaID) // CAMBIO: VarChar(2) → Int
        .query("SELECT COUNT(*) as count FROM dbo.Productos WHERE TelaID = @telaID");
    
    if (hasProductos.recordset[0].count > 0) {
        throw new Error('No se puede eliminar la tela porque tiene productos asociados');
    }

    const result = await pool.request()
        .input("telaID", sql.Int, telaID) // CAMBIO: VarChar(2) → Int
        .query("DELETE FROM dbo.Telas WHERE TelaID = @telaID");
    
    return { 
        deleted: true, 
        tela: telaExists.recordset[0],
        rowsAffected: result.rowsAffected[0] 
    };
}

module.exports = { getTelas, getTelaById, createTela, updateTela, deleteTela };