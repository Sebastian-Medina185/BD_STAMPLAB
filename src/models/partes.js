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
        .input("parteID", sql.VarChar(2), parteID)
        .query("SELECT ParteID, Nombre, Observaciones FROM dbo.Partes WHERE ParteID = @parteID");
    
    return result.recordset[0];
}

// =================== CREAR ===================
async function createParte(parte) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que el ParteID no existe
    const parteExists = await pool.request()
        .input("parteID", sql.VarChar(2), parte.ParteID)
        .query("SELECT COUNT(*) as count FROM dbo.Partes WHERE ParteID = @parteID");
    
    if (parteExists.recordset[0].count > 0) {
        throw new Error('Ya existe una parte con este ID');
    }

    const result = await pool.request()
        .input("parteID", sql.VarChar(2), parte.ParteID)
        .input("nombre", sql.VarChar(20), parte.Nombre)
        .input("observaciones", sql.VarChar(80), parte.Observaciones || null)
        .query(`
            INSERT INTO dbo.Partes (ParteID, Nombre, Observaciones)
            VALUES (@parteID, @nombre, @observaciones);
            SELECT * FROM dbo.Partes WHERE ParteID = @parteID;
        `);
    
    return result.recordset[0];
}

// =================== EDITAR ===================
async function updateParte(parteID, parte) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que la parte existe
    const parteExists = await pool.request()
        .input("parteID", sql.VarChar(2), parteID)
        .query("SELECT COUNT(*) as count FROM dbo.Partes WHERE ParteID = @parteID");
    
    if (parteExists.recordset[0].count === 0) {
        throw new Error('La parte no existe');
    }

    // Construir la consulta de actualización dinámicamente
    let updateFields = [];
    let request = pool.request().input("parteID", sql.VarChar(2), parteID);

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

    // Verificar que la parte existe
    const parteExists = await pool.request()
        .input("parteID", sql.VarChar(2), parteID)
        .query("SELECT * FROM dbo.Partes WHERE ParteID = @parteID");
    
    if (parteExists.recordset.length === 0) {
        throw new Error('La parte no existe');
    }

    // Verificar si tiene diseños asociados
    const hasDisenos = await pool.request()
        .input("parteID", sql.VarChar(2), parteID)
        .query("SELECT COUNT(*) as count FROM dbo.Diseños WHERE ParteID = @parteID");
    
    if (hasDisenos.recordset[0].count > 0) {
        throw new Error('No se puede eliminar la parte porque tiene diseños asociados');
    }

    const result = await pool.request()
        .input("parteID", sql.VarChar(2), parteID)
        .query("DELETE FROM dbo.Partes WHERE ParteID = @parteID");
    
    return { 
        deleted: true, 
        parte: parteExists.recordset[0],
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