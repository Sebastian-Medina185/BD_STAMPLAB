// src/models/tallas.js
const { sql, poolPromise } = require("../db");

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

    const nombre = talla.Nombre ? talla.Nombre.trim() : "";

    // Validaciones de Nombre (ajustadas a VARCHAR(4))
    if (!nombre) throw new Error("El nombre es obligatorio y no puede estar vacío.");
    if (nombre.length < 1) throw new Error("El nombre debe tener al menos 1 carácter.");
    if (nombre.length > 4) throw new Error("El nombre no puede tener más de 4 caracteres.");
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) {
        throw new Error("El nombre solo puede contener letras y espacios (sin números ni caracteres especiales).");
    }

    // Validar nombre duplicado (insensible a mayúsculas/minúsculas)
    const existe = await pool.request()
        .input("nombre", sql.VarChar(4), nombre)
        .query("SELECT COUNT(*) AS count FROM dbo.Tallas WHERE LOWER(Nombre) = LOWER(@nombre)");

    if (existe.recordset[0].count > 0) {
        throw new Error(`La talla "${nombre}" ya existe.`);
    }

    const result = await pool.request()
        .input("nombre", sql.VarChar(4), nombre)
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

    // Verificar existencia
    const tallaExists = await pool.request()
        .input("tallaID", sql.Int, tallaID)
        .query("SELECT COUNT(*) as count FROM dbo.Tallas WHERE TallaID = @tallaID");

    if (tallaExists.recordset[0].count === 0) {
        throw new Error('La talla no existe');
    }

    const nombre = talla.Nombre ? talla.Nombre.trim() : "";

    // Validaciones de Nombre (ajustadas a VARCHAR(4))
    if (!nombre) throw new Error("El nombre es obligatorio y no puede estar vacío.");
    if (nombre.length < 1) throw new Error("El nombre debe tener al menos 1 carácter.");
    if (nombre.length > 4) throw new Error("El nombre no puede tener más de 4 caracteres.");
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) {
        throw new Error("El nombre solo puede contener letras y espacios (sin números ni caracteres especiales).");
    }

    // Evitar duplicados al actualizar
    const duplicado = await pool.request()
        .input("nombre", sql.VarChar(4), nombre)
        .input("tallaID", sql.Int, tallaID)
        .query(`
            SELECT COUNT(*) AS count 
            FROM dbo.Tallas 
            WHERE LOWER(Nombre) = LOWER(@nombre)
            AND TallaID <> @tallaID
        `);

    if (duplicado.recordset[0].count > 0) {
        throw new Error(`Ya existe otra talla con el nombre "${nombre}".`);
    }

    const result = await pool.request()
        .input("tallaID", sql.Int, tallaID)
        .input("nombre", sql.VarChar(4), nombre)
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

    // Verificar existencia de la talla
    const tallaExists = await pool.request()
        .input("tallaID", sql.Int, tallaID)
        .query("SELECT * FROM dbo.Tallas WHERE TallaID = @tallaID");

    if (tallaExists.recordset.length === 0) {
        throw new Error('La talla no existe');
    }

    // Verificar si está asociada a productos variantes
    const hasVariantes = await pool.request()
        .input("tallaID", sql.Int, tallaID)
        .query("SELECT COUNT(*) as count FROM dbo.ProductosVariantes WHERE TallaID = @tallaID");

    if (hasVariantes.recordset[0].count > 0) {
        throw new Error('No se puede eliminar la talla porque tiene productos asociados.');
    }

    const result = await pool.request()
        .input("tallaID", sql.Int, tallaID)
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