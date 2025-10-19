const { sql, poolPromise } = require("../db");

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

    const nombre = color.Nombre ? color.Nombre.trim() : "";

    // Validaciones de Nombre
    if (!nombre) throw new Error("El nombre es obligatorio y no puede estar vacío.");
    if (nombre.length < 3) throw new Error("El nombre debe tener al menos 3 caracteres.");
    if (nombre.length > 15) throw new Error("El nombre no puede tener más de 15 caracteres.");
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) {
        throw new Error("El nombre solo puede contener letras y espacios (sin números ni caracteres especiales).");
    }

    // Validar nombre duplicado (insensible a mayúsculas/minúsculas)
    const existe = await pool.request()
        .input("nombre", sql.VarChar(30), nombre)
        .query("SELECT COUNT(*) AS count FROM dbo.Colores WHERE LOWER(Nombre) = LOWER(@nombre)");

    if (existe.recordset[0].count > 0) {
        throw new Error(`El color "${nombre}" ya existe.`);
    }

    const result = await pool.request()
        .input("nombre", sql.VarChar(30), nombre)
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

    // Verificar existencia
    const colorExists = await pool.request()
        .input("colorID", sql.Int, colorID)
        .query("SELECT COUNT(*) as count FROM dbo.Colores WHERE ColorID = @colorID");

    if (colorExists.recordset[0].count === 0) {
        throw new Error('El color no existe');
    }

    const nombre = color.Nombre ? color.Nombre.trim() : "";

    // Validaciones de Nombre
    if (!nombre) throw new Error("El nombre es obligatorio y no puede estar vacío.");
    if (nombre.length < 3) throw new Error("El nombre debe tener al menos 3 caracteres.");
    if (nombre.length > 15) throw new Error("El nombre no puede tener más de 15 caracteres.");
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) {
        throw new Error("El nombre solo puede contener letras y espacios (sin números ni caracteres especiales).");
    }

    // Evitar duplicados al actualizar
    const duplicado = await pool.request()
        .input("nombre", sql.VarChar(30), nombre)
        .input("colorID", sql.Int, colorID)
        .query(`
            SELECT COUNT(*) AS count 
            FROM dbo.Colores 
            WHERE LOWER(Nombre) = LOWER(@nombre)
            AND ColorID <> @colorID
        `);

    if (duplicado.recordset[0].count > 0) {
        throw new Error(`Ya existe otro color con el nombre "${nombre}".`);
    }

    const result = await pool.request()
        .input("colorID", sql.Int, colorID)
        .input("nombre", sql.VarChar(30), nombre)
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

    // Verificar existencia del color
    const colorExists = await pool.request()
        .input("colorID", sql.Int, colorID)
        .query("SELECT * FROM dbo.Colores WHERE ColorID = @colorID");

    if (colorExists.recordset.length === 0) {
        throw new Error('El color no existe');
    }

    // Verificar si está asociado a productos variantes
    const hasVariantes = await pool.request()
        .input("colorID", sql.Int, colorID)
        .query("SELECT COUNT(*) as count FROM dbo.ProductosVariantes WHERE ColorID = @colorID");

    if (hasVariantes.recordset[0].count > 0) {
        throw new Error('No se puede eliminar el color porque tiene productos asociados.');
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
