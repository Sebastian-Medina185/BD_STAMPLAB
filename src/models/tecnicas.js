// src/models/tecnicas.js
const { sql, poolPromise } = require("../db");

async function getTecnicas() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request().query(`
        SELECT TecnicaID, Nombre, ImagenTecnica, Descripcion, Estado 
        FROM dbo.Tecnicas 
        ORDER BY TecnicaID
    `);
    return result.recordset;
}

async function getTecnicaById(tecnicaID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request()
        .input("tecnicaID", sql.Int, tecnicaID) // Cambiado de VarChar a Int
        .query("SELECT TecnicaID, Nombre, ImagenTecnica, Descripcion, Estado FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID");

    return result.recordset[0];
}

async function createTecnica(tecnica) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request()
        .input("nombre", sql.VarChar(20), tecnica.Nombre)
        .input("imagen", sql.VarChar(255), tecnica.ImagenTecnica)
        .input("descripcion", sql.VarChar(255), tecnica.Descripcion)
        .input("estado", sql.Bit, tecnica.Estado)
        .query(`
            INSERT INTO dbo.Tecnicas (Nombre, ImagenTecnica, Descripcion, Estado)
            VALUES (@nombre, @imagen, @descripcion, @estado);
            SELECT * FROM dbo.Tecnicas WHERE TecnicaID = SCOPE_IDENTITY();
        `);

    return result.recordset[0];
}

async function updateTecnica(tecnicaID, tecnica) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const exists = await pool.request()
        .input("tecnicaID", sql.Int, tecnicaID)
        .query("SELECT COUNT(*) as count FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID");

    if (exists.recordset[0].count === 0) {
        throw new Error('La técnica no existe');
    }

    const result = await pool.request()
        .input("tecnicaID", sql.Int, tecnicaID)
        .input("nombre", sql.VarChar(20), tecnica.Nombre)
        .input("imagen", sql.VarChar(255), tecnica.ImagenTecnica)
        .input("descripcion", sql.VarChar(255), tecnica.Descripcion)
        .input("estado", sql.Bit, tecnica.Estado)
        .query(`
            UPDATE dbo.Tecnicas 
            SET Nombre = @nombre, ImagenTecnica = @imagen, 
                Descripcion = @descripcion, Estado = @estado
            WHERE TecnicaID = @tecnicaID;
            SELECT * FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID;
        `);

    return result.recordset[0];
}

async function deleteTecnica(tecnicaID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const exists = await pool.request()
        .input("tecnicaID", sql.Int, tecnicaID)
        .query("SELECT * FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID");

    if (exists.recordset.length === 0) {
        throw new Error('La técnica no existe');
    }

    const result = await pool.request()
        .input("tecnicaID", sql.Int, tecnicaID)
        .query("DELETE FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID");

    return {
        deleted: true,
        tecnica: exists.recordset[0],
        rowsAffected: result.rowsAffected[0]
    };
}

module.exports = { getTecnicas, getTecnicaById, createTecnica, updateTecnica, deleteTecnica };
