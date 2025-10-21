const { sql, poolPromise } = require("../db");

// =================== LISTAR ===================
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

// =================== OBTENER POR ID ===================
async function getTelaById(telaID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request()
        .input("telaID", sql.Int, telaID)
        .query("SELECT TelaID, Nombre FROM dbo.Telas WHERE TelaID = @telaID");

    return result.recordset[0];
}

// =================== CREAR ===================
async function createTela(tela) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const nombre = tela?.Nombre?.trim();
    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

    // 🔹 VALIDACIONES
    if (!nombre) {
        throw new Error("El nombre de la tela es obligatorio.");
    }
    if (!soloLetras.test(nombre)) {
        throw new Error("El nombre no puede contener números ni caracteres especiales.");
    }
    if (nombre.length < 3) {
        throw new Error("El nombre debe tener al menos 3 caracteres.");
    }
    if (nombre.length > 40) {
        throw new Error("El nombre no puede tener más de 40 caracteres.");
    }

    // 🔹 Verificar duplicados
    const duplicate = await pool.request()
        .input("nombre", sql.VarChar(40), nombre)
        .query("SELECT COUNT(*) AS count FROM dbo.Telas WHERE LOWER(LTRIM(RTRIM(Nombre))) = LOWER(LTRIM(RTRIM(@nombre)))");

    if (duplicate.recordset[0].count > 0) {
        throw new Error("Ya existe una tela con ese nombre.");
    }

    // 🔹 Crear registro
    const result = await pool.request()
        .input("nombre", sql.VarChar(40), nombre)
        .query(`
            INSERT INTO dbo.Telas (Nombre)
            VALUES (@nombre);
            SELECT * FROM dbo.Telas WHERE TelaID = SCOPE_IDENTITY();
        `);

    return {
        estado: true,
        mensaje: "Tela creada correctamente.",
        datos: result.recordset[0]
    };
}

// =================== ACTUALIZAR ===================
async function updateTela(telaID, tela) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const nombre = tela?.Nombre?.trim();
    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

    // 🔹 VALIDACIONES
    if (!nombre) {
        throw new Error("El nombre de la tela es obligatorio.");
    }
    if (!soloLetras.test(nombre)) {
        throw new Error("El nombre no puede contener números ni caracteres especiales.");
    }
    if (nombre.length < 3) {
        throw new Error("El nombre debe tener al menos 3 caracteres.");
    }
    if (nombre.length > 40) {
        throw new Error("El nombre no puede tener más de 40 caracteres.");
    }

    // 🔹 Verificar que exista la tela
    const telaExists = await pool.request()
        .input("telaID", sql.Int, telaID)
        .query("SELECT COUNT(*) AS count FROM dbo.Telas WHERE TelaID = @telaID");

    if (telaExists.recordset[0].count === 0) {
        throw new Error("La tela no existe.");
    }

    // 🔹 Verificar duplicados (excluyendo la misma tela)
    const duplicate = await pool.request()
        .input("nombre", sql.VarChar(40), nombre)
        .input("telaID", sql.Int, telaID)
        .query(`
            SELECT COUNT(*) AS count 
            FROM dbo.Telas 
            WHERE LOWER(LTRIM(RTRIM(Nombre))) = LOWER(LTRIM(RTRIM(@nombre)))
            AND TelaID <> @telaID
        `);

    if (duplicate.recordset[0].count > 0) {
        throw new Error("Ya existe una tela con ese nombre.");
    }

    // 🔹 Actualizar registro
    const result = await pool.request()
        .input("telaID", sql.Int, telaID)
        .input("nombre", sql.VarChar(40), nombre)
        .query(`
            UPDATE dbo.Telas 
            SET Nombre = @nombre
            WHERE TelaID = @telaID;
            SELECT * FROM dbo.Telas WHERE TelaID = @telaID;
        `);

    return {
        estado: true,
        mensaje: "Tela actualizada correctamente.",
        datos: result.recordset[0]
    };
}

// =================== ELIMINAR ===================
async function deleteTela(telaID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const telaExists = await pool.request()
        .input("telaID", sql.Int, telaID)
        .query("SELECT * FROM dbo.Telas WHERE TelaID = @telaID");

    if (telaExists.recordset.length === 0) {
        throw new Error("La tela no existe.");
    }

    const hasProductos = await pool.request()
        .input("telaID", sql.Int, telaID)
        .query("SELECT COUNT(*) AS count FROM dbo.Productos WHERE TelaID = @telaID");

    if (hasProductos.recordset[0].count > 0) {
        throw new Error("No se puede eliminar la tela porque tiene productos asociados.");
    }

    const result = await pool.request()
        .input("telaID", sql.Int, telaID)
        .query("DELETE FROM dbo.Telas WHERE TelaID = @telaID");

    return {
        estado: true,
        mensaje: "Tela eliminada correctamente.",
        datos: telaExists.recordset[0],
        filasAfectadas: result.rowsAffected[0]
    };
}

module.exports = {
    getTelas,
    getTelaById,
    createTela,
    updateTela,
    deleteTela
};