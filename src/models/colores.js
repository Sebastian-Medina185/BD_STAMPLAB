// src/models/colores.js
const { sql, poolPromise } = require("../../db");

// =================== LISTAR ===================
async function getColores() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request().query(`
        SELECT ColorID, Nombre 
        FROM dbo.Colores 
        ORDER BY ColorID
    `);
    return result.recordset;
}


async function getColorById(colorID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request()
        .input("colorID", sql.Int, colorID) 
        .query("SELECT ColorID, Nombre FROM dbo.Colores WHERE ColorID = @colorID");

    return result.recordset[0];
}


// =================== CREAR ===================
async function createColor(color) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // ELIMINAR: Ya no verificas IDs duplicados
    // ELIMINAR: Ya no recibes ColorID del frontend

    const result = await pool.request()
        // ELIMINAR: .input("colorID", sql.VarChar(3), color.ColorID)
        .input("nombre", sql.VarChar(30), color.Nombre)
        .query(`
            INSERT INTO dbo.Colores (Nombre)
            VALUES (@nombre);
            SELECT * FROM dbo.Colores WHERE ColorID = SCOPE_IDENTITY();
        `);

    return result.recordset[0];
}


// =================== EDITAR ===================
async function updateColor(colorID, color) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que el color existe
    const colorExists = await pool.request()
        .input("colorID", sql.Int, colorID)
        .query("SELECT COUNT(*) as count FROM dbo.Colores WHERE ColorID = @colorID");

    if (colorExists.recordset[0].count === 0) {
        throw new Error('El color no existe');
    }

    const result = await pool.request()
        .input("colorID", sql.Int, colorID)
        .input("nombre", sql.VarChar(30), color.Nombre)
        .query(`
            UPDATE dbo.Colores 
            SET Nombre = @nombre
            WHERE ColorID = @colorID;
            SELECT * FROM dbo.Colores WHERE ColorID = @colorID;
        `);

    return result.recordset[0];
}

// =================== ELIMINAR ===================
async function deleteColor(colorID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que el color existe
    const colorExists = await pool.request()
        .input("colorID", sql.Int, colorID)
        .query("SELECT * FROM dbo.Colores WHERE ColorID = @colorID");

    if (colorExists.recordset.length === 0) {
        throw new Error('El color no existe');
    }

    // Verificar si tiene productos variantes asociados
    const hasVariantes = await pool.request()
        .input("colorID", sql.Int, colorID)
        .query("SELECT COUNT(*) as count FROM dbo.ProductosVariantes WHERE ColorID = @colorID");

    if (hasVariantes.recordset[0].count > 0) {
        throw new Error('No se puede eliminar el color porque tiene productos variantes asociados');
    }

    const result = await pool.request()
        .input("colorID", sql.Int, colorID)
        .query("DELETE FROM dbo.Colores WHERE ColorID = @colorID");

    return {
        deleted: true,
        color: colorExists.recordset[0],
        rowsAffected: result.rowsAffected[0]
    };
}

module.exports = {
    getColores,
    getColorById,
    createColor,
    updateColor,
    deleteColor
};