// src/models/partes.js
const { sql, poolPromise } = require("../../db");

// =================== LISTAR ===================
async function getPartes() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request().query(`
        SELECT ParteID, Nombre, Observaciones 
        FROM dbo.Partes 
        ORDER BY ParteID
    `);
    return result.recordset;
}

async function getParteById(parteID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request()
        .input("parteID", sql.Int, parteID) // Cambiado a Int
        .query("SELECT ParteID, Nombre, Observaciones FROM dbo.Partes WHERE ParteID = @parteID");
    
    return result.recordset[0];
}

// =================== CREAR ===================
async function createParte(parte) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request()
        .input("nombre", sql.VarChar(20), parte.Nombre)
        .input("observaciones", sql.VarChar(80), parte.Observaciones || null)
        .query(`
            INSERT INTO dbo.Partes (Nombre, Observaciones)
            VALUES (@nombre, @observaciones);
            SELECT * FROM dbo.Partes WHERE ParteID = SCOPE_IDENTITY();
        `);
    
    return result.recordset[0];
}

// =================== EDITAR ===================
async function updateParte(parteID, parte) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const exists = await pool.request()
        .input("parteID", sql.Int, parteID)
        .query("SELECT COUNT(*) as count FROM dbo.Partes WHERE ParteID = @parteID");
    
    if (exists.recordset[0].count === 0) {
        throw new Error('La parte no existe');
    }

    let updateFields = [];
    const request = pool.request().input("parteID", sql.Int, parteID);

    if (parte.Nombre) {
        updateFields.push("Nombre = @nombre");
        request.input("nombre", sql.VarChar(20), parte.Nombre);
    }
    if (parte.Observaciones !== undefined) {
        updateFields.push("Observaciones = @observaciones");
        request.input("observaciones", sql.VarChar(80), parte.Observaciones);
    }

    if (updateFields.length === 0) {
        throw new Error('No se proporcionaron campos para actualizar');
    }

    const result = await request.query(`
        UPDATE dbo.Partes 
        SET ${updateFields.join(', ')}
        WHERE ParteID = @parteID;
        SELECT * FROM dbo.Partes WHERE ParteID = @parteID;
    `);
    
    return result.recordset[0];
}

// =================== ELIMINAR ===================
async function deleteParte(parteID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const exists = await pool.request()
        .input("parteID", sql.Int, parteID)
        .query("SELECT * FROM dbo.Partes WHERE ParteID = @parteID");
    
    if (exists.recordset.length === 0) {
        throw new Error('La parte no existe');
    }

    const hasDisenos = await pool.request()
        .input("parteID", sql.Int, parteID)
        .query("SELECT COUNT(*) as count FROM dbo.Diseños WHERE ParteID = @parteID");
    
    if (hasDisenos.recordset[0].count > 0) {
        throw new Error('No se puede eliminar la parte porque tiene diseños asociados');
    }

    const result = await pool.request()
        .input("parteID", sql.Int, parteID)
        .query("DELETE FROM dbo.Partes WHERE ParteID = @parteID");
    
    return { 
        deleted: true, 
        parte: exists.recordset[0],
        rowsAffected: result.rowsAffected[0] 
    };
}

module.exports = { 
    getPartes, 
    getParteById, 
    createParte, 
    updateParte, 
    deleteParte
};