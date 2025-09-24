// =================================
// src/models/telas.js - ACTUALIZADO CON PATRÓN COLORES
// =================================
const { sql, poolPromise } = require("../../db");

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
        .input("telaID", sql.VarChar(2), telaID)
        .query("SELECT TelaID, Nombre FROM dbo.Telas WHERE TelaID = @telaID");
    
    return result.recordset[0];
}

// CREAR - Solo recibe Nombre (TelaID manual)
async function createTela(tela) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que el TelaID no existe
    const telaExists = await pool.request()
        .input("telaID", sql.VarChar(2), tela.TelaID)
        .query("SELECT COUNT(*) as count FROM dbo.Telas WHERE TelaID = @telaID");
    
    if (telaExists.recordset[0].count > 0) {
        throw new Error('Ya existe una tela con este ID');
    }

    const result = await pool.request()
        .input("telaID", sql.VarChar(2), tela.TelaID)
        .input("nombre", sql.VarChar(40), tela.Nombre)
        .query(`
            INSERT INTO dbo.Telas (TelaID, Nombre)
            VALUES (@telaID, @nombre);
            SELECT * FROM dbo.Telas WHERE TelaID = @telaID;
        `);
    
    return result.recordset[0];
}

async function updateTela(telaID, tela) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const telaExists = await pool.request()
        .input("telaID", sql.VarChar(2), telaID)
        .query("SELECT COUNT(*) as count FROM dbo.Telas WHERE TelaID = @telaID");
    
    if (telaExists.recordset[0].count === 0) {
        throw new Error('La tela no existe');
    }

    const result = await pool.request()
        .input("telaID", sql.VarChar(2), telaID)
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
        .input("telaID", sql.VarChar(2), telaID)
        .query("SELECT * FROM dbo.Telas WHERE TelaID = @telaID");
    
    if (telaExists.recordset.length === 0) {
        throw new Error('La tela no existe');
    }

    const hasProductos = await pool.request()
        .input("telaID", sql.VarChar(2), telaID)
        .query("SELECT COUNT(*) as count FROM dbo.Productos WHERE TelaID = @telaID");
    
    if (hasProductos.recordset[0].count > 0) {
        throw new Error('No se puede eliminar la tela porque tiene productos asociados');
    }

    const result = await pool.request()
        .input("telaID", sql.VarChar(2), telaID)
        .query("DELETE FROM dbo.Telas WHERE TelaID = @telaID");
    
    return { 
        deleted: true, 
        tela: telaExists.recordset[0],
        rowsAffected: result.rowsAffected[0] 
    };
}

module.exports = { getTelas, getTelaById, createTela, updateTela, deleteTela };