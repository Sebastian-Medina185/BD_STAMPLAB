// src/models/tallas.js
const { sql, poolPromise } = require("../../db");

// =================== LISTAR ===================
async function getTallas() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request().query(`
        SELECT TallaID, Nombre 
        FROM dbo.Tallas 
        ORDER BY TallaID
    `);
    return result.recordset;
}

async function getTallaById(tallaID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request()
        .input("tallaID", sql.Int, tallaID)
        .query("SELECT TallaID, Nombre FROM dbo.Tallas WHERE TallaID = @tallaID");
    
    return result.recordset[0];
}

// =================== CREAR ===================
async function createTalla(talla) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    

    const result = await pool.request()
        .input("nombre", sql.VarChar(4), talla.Nombre)
        .query(`
            INSERT INTO dbo.Tallas (Nombre)
            VALUES (@nombre);
            SELECT * FROM dbo.Tallas WHERE TallaID = SCOPE_IDENTITY();
        `);
    
    return result.recordset[0];
}

// =================== EDITAR ===================
async function updateTalla(tallaID, talla) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que la talla existe
    const tallaExists = await pool.request()
        .input("tallaID", sql.VarChar(2), tallaID)
        .query("SELECT COUNT(*) as count FROM dbo.Tallas WHERE TallaID = @tallaID");
    
    if (tallaExists.recordset[0].count === 0) {
        throw new Error('La talla no existe');
    }

    const result = await pool.request()
        .input("tallaID", sql.VarChar(2), tallaID)
        .input("nombre", sql.VarChar(4), talla.Nombre)
        .query(`
            UPDATE dbo.Tallas 
            SET Nombre = @nombre
            WHERE TallaID = @tallaID;
            SELECT * FROM dbo.Tallas WHERE TallaID = @tallaID;
        `);
    
    return result.recordset[0];
}

// =================== ELIMINAR ===================
async function deleteTalla(tallaID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que la talla existe
    const tallaExists = await pool.request()
        .input("tallaID", sql.VarChar(2), tallaID)
        .query("SELECT * FROM dbo.Tallas WHERE TallaID = @tallaID");
    
    if (tallaExists.recordset.length === 0) {
        throw new Error('La talla no existe');
    }

    // Verificar si tiene productos variantes asociados
    const hasVariantes = await pool.request()
        .input("tallaID", sql.VarChar(2), tallaID)
        .query("SELECT COUNT(*) as count FROM dbo.ProductosVariantes WHERE TallaID = @tallaID");
    
    if (hasVariantes.recordset[0].count > 0) {
        throw new Error('No se puede eliminar la talla porque tiene productos variantes asociados');
    }

    const result = await pool.request()
        .input("tallaID", sql.VarChar(2), tallaID)
        .query("DELETE FROM dbo.Tallas WHERE TallaID = @tallaID");
    
    return { 
        deleted: true, 
        talla: tallaExists.recordset[0],
        rowsAffected: result.rowsAffected[0] 
    };
}

module.exports = { 
    getTallas, 
    getTallaById, 
    createTalla, 
    updateTalla, 
    deleteTalla
};