// src/models/tecnicas.js
const { sql, poolPromise } = require("../../db");

async function getTecnicas() {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT TecnicaID, Nombre, ImagenTecnica, Descripcion, Estado FROM dbo.Tecnicas ORDER BY TecnicaID");
    return result.recordset;
}

async function getTecnicaById(tecnicaID) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("tecnicaID", sql.VarChar(2), tecnicaID)
        .query("SELECT TecnicaID, Nombre, ImagenTecnica, Descripcion, Estado FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID");
    return result.recordset[0];
}

async function createTecnica(tecnica) {
    const pool = await poolPromise;
    const exists = await pool.request()
        .input("tecnicaID", sql.VarChar(2), tecnica.TecnicaID)
        .query("SELECT COUNT(*) as count FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID");

    if (exists.recordset[0].count > 0) throw new Error("Ya existe una técnica con este ID");

    const result = await pool.request()
        .input("tecnicaID", sql.VarChar(2), tecnica.TecnicaID)
        .input("nombre", sql.VarChar(20), tecnica.Nombre)
        .input("imagen", sql.VarChar(255), tecnica.ImagenTecnica)
        .input("descripcion", sql.VarChar(255), tecnica.Descripcion)
        .input("estado", sql.Bit, tecnica.Estado)
        .query(`
            INSERT INTO dbo.Tecnicas (TecnicaID, Nombre, ImagenTecnica, Descripcion, Estado)
            VALUES (@tecnicaID, @nombre, @imagen, @descripcion, @estado);
            SELECT * FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID;
        `);

    return result.recordset[0];
}

async function updateTecnica(tecnicaID, tecnica) {
    const pool = await poolPromise;
    const exists = await pool.request()
        .input("tecnicaID", sql.VarChar(2), tecnicaID)
        .query("SELECT COUNT(*) as count FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID");

    if (exists.recordset[0].count === 0) throw new Error("La técnica no existe");

    let updateFields = [];
    let request = pool.request().input("tecnicaID", sql.VarChar(2), tecnicaID);

    if (tecnica.Nombre) { updateFields.push("Nombre = @nombre"); request.input("nombre", sql.VarChar(20), tecnica.Nombre); }
    if (tecnica.ImagenTecnica) { updateFields.push("ImagenTecnica = @imagen"); request.input("imagen", sql.VarChar(255), tecnica.ImagenTecnica); }
    if (tecnica.Descripcion) { updateFields.push("Descripcion = @descripcion"); request.input("descripcion", sql.VarChar(255), tecnica.Descripcion); }
    if (tecnica.Estado !== undefined) { updateFields.push("Estado = @estado"); request.input("estado", sql.Bit, tecnica.Estado); }

    if (updateFields.length === 0) throw new Error("No se enviaron campos para actualizar");

    const result = await request.query(`
        UPDATE dbo.Tecnicas
        SET ${updateFields.join(", ")}
        WHERE TecnicaID = @tecnicaID;
        SELECT * FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID;
    `);

    return result.recordset[0];
}

async function deleteTecnica(tecnicaID) {
    const pool = await poolPromise;
    const exists = await pool.request()
        .input("tecnicaID", sql.VarChar(2), tecnicaID)
        .query("SELECT * FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID");

    if (exists.recordset.length === 0) throw new Error("La técnica no existe");

    const result = await pool.request()
        .input("tecnicaID", sql.VarChar(2), tecnicaID)
        .query("DELETE FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID");

    return { deleted: true, tecnica: exists.recordset[0], rowsAffected: result.rowsAffected[0] };
}

module.exports = { getTecnicas, getTecnicaById, createTecnica, updateTecnica, deleteTecnica };
