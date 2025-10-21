const { sql, poolPromise } = require("../db");

// =================== LISTAR ===================
async function getRoles() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request().query(`
        SELECT RolID, Nombre, Descripcion, Estado 
        FROM dbo.Roles 
        ORDER BY RolID
    `);
    return result.recordset;
}

// =================== OBTENER POR ID ===================
async function getRolById(rolID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request()
        .input("rolID", sql.Int, rolID)
        .query("SELECT RolID, Nombre, Descripcion, Estado FROM dbo.Roles WHERE RolID = @rolID");

    return result.recordset[0];
}

// =================== CREAR ===================
async function createRol(rol) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    // === VALIDACIONES ===
    if (!rol.Nombre || rol.Nombre.trim().length === 0) {
        throw new Error("El nombre no puede estar vacío o contener solo espacios.");
    }

    const nombreTrim = rol.Nombre.trim();

    // Validar duplicado
    const checkNombre = await pool.request()
        .input("nombre", sql.VarChar(50), nombreTrim)
        .query("SELECT COUNT(*) AS existe FROM dbo.Roles WHERE LOWER(Nombre) = LOWER(@nombre)");

    if (checkNombre.recordset[0].existe > 0) {
        throw new Error(`El nombre "${nombreTrim}" ya existe.`);
    }

    // Validaciones de nombre
    if (nombreTrim.length < 3) {
        throw new Error("El nombre debe tener al menos 3 caracteres.");
    }
    if (nombreTrim.length > 25) {
        throw new Error("El nombre no debe superar los 25 caracteres.");
    }
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+$/.test(nombreTrim)) {
        throw new Error("El nombre solo puede contener letras, sin espacios, números ni caracteres especiales.");
    }

    // Validaciones descripción
    if (!rol.Descripcion || rol.Descripcion.trim().length === 0) {
        throw new Error("La descripción no puede estar vacía o contener solo espacios.");
    }

    const descTrim = rol.Descripcion.trim();

    if (descTrim.length < 20) {
        throw new Error("La descripción debe tener al menos 20 caracteres.");
    }
    if (descTrim.length > 50) {
        throw new Error("La descripción no debe superar los 50 caracteres.");
    }
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(descTrim)) {
        throw new Error("La descripción solo puede contener letras y espacios, sin números ni caracteres especiales.");
    }

    // === INSERT ===
    const result = await pool.request()
        .input("nombre", sql.VarChar(50), nombreTrim)
        .input("descripcion", sql.VarChar(100), descTrim)
        .input("estado", sql.Bit, rol.Estado !== undefined ? rol.Estado : true)
        .query(`
            INSERT INTO dbo.Roles (Nombre, Descripcion, Estado)
            VALUES (@nombre, @descripcion, @estado);
            SELECT * FROM dbo.Roles WHERE RolID = SCOPE_IDENTITY();
        `);

    return result.recordset[0];
}

// =================== EDITAR ===================
async function updateRol(rolID, rol) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    // Verificar existencia del rol y obtener datos actuales
    const rolActual = await pool.request()
        .input("rolID", sql.Int, rolID)
        .query("SELECT * FROM dbo.Roles WHERE RolID = @rolID");

    if (rolActual.recordset.length === 0) {
        throw new Error("El rol no existe.");
    }

    const rolData = rolActual.recordset[0];
    const nombreActual = rolData.Nombre;

    // === VALIDACIÓN ESPECIAL PARA ADMINISTRADOR Y CLIENTE ===
    if (nombreActual.toLowerCase() === 'administrador' || nombreActual.toLowerCase() === 'cliente') {
        // Solo permitir editar descripción
        if (rol.Nombre && rol.Nombre.trim().toLowerCase() !== nombreActual.toLowerCase()) {
            throw new Error(`No se puede cambiar el nombre del rol "${nombreActual}".`);
        }

        // No permitir cambiar el estado
        if (rol.Estado !== undefined && rol.Estado !== rolData.Estado) {
            throw new Error(`No se puede cambiar el estado del rol "${nombreActual}".`);
        }

        // Validar descripción
        if (!rol.Descripcion || rol.Descripcion.trim().length === 0) {
            throw new Error("La descripción no puede estar vacía o contener solo espacios.");
        }

        const descTrim = rol.Descripcion.trim();

        if (descTrim.length < 20) {
            throw new Error("La descripción debe tener al menos 20 caracteres.");
        }
        if (descTrim.length > 50) {
            throw new Error("La descripción no debe superar los 50 caracteres.");
        }
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(descTrim)) {
            throw new Error("La descripción solo puede contener letras y espacios, sin números ni caracteres especiales.");
        }

        // Actualizar solo la descripción
        const result = await pool.request()
            .input("rolID", sql.Int, rolID)
            .input("descripcion", sql.VarChar(100), descTrim)
            .query(`
                UPDATE dbo.Roles
                SET Descripcion = @descripcion
                WHERE RolID = @rolID;
                SELECT * FROM dbo.Roles WHERE RolID = @rolID;
            `);

        return result.recordset[0];
    }

    // === VALIDACIONES NORMALES PARA OTROS ROLES ===
    if (!rol.Nombre || rol.Nombre.trim().length === 0) {
        throw new Error("El nombre no puede estar vacío o contener solo espacios.");
    }

    const nombreTrim = rol.Nombre.trim();

    // Validar duplicado (excluyendo el mismo rolID)
    const checkNombre = await pool.request()
        .input("nombre", sql.VarChar(50), nombreTrim)
        .input("rolID", sql.Int, rolID)
        .query(`
            SELECT COUNT(*) AS existe 
            FROM dbo.Roles 
            WHERE LOWER(Nombre) = LOWER(@nombre) AND RolID <> @rolID
        `);

    if (checkNombre.recordset[0].existe > 0) {
        throw new Error(`El nombre "${nombreTrim}" ya existe en otro rol.`);
    }

    // Validaciones nombre
    if (nombreTrim.length < 3) {
        throw new Error("El nombre debe tener al menos 3 caracteres.");
    }
    if (nombreTrim.length > 25) {
        throw new Error("El nombre no debe superar los 25 caracteres.");
    }
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+$/.test(nombreTrim)) {
        throw new Error("El nombre solo puede contener letras, sin espacios, números ni caracteres especiales.");
    }

    // Validaciones descripción
    if (!rol.Descripcion || rol.Descripcion.trim().length === 0) {
        throw new Error("La descripción no puede estar vacía o contener solo espacios.");
    }

    const descTrim = rol.Descripcion.trim();

    if (descTrim.length < 20) {
        throw new Error("La descripción debe tener al menos 20 caracteres.");
    }
    if (descTrim.length > 50) {
        throw new Error("La descripción no debe superar los 50 caracteres.");
    }
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(descTrim)) {
        throw new Error("La descripción solo puede contener letras y espacios, sin números ni caracteres especiales.");
    }

    // === UPDATE COMPLETO ===
    const result = await pool.request()
        .input("rolID", sql.Int, rolID)
        .input("nombre", sql.VarChar(50), nombreTrim)
        .input("descripcion", sql.VarChar(100), descTrim)
        .input("estado", sql.Bit, rol.Estado !== undefined ? rol.Estado : true)
        .query(`
            UPDATE dbo.Roles
            SET Nombre = @nombre, Descripcion = @descripcion, Estado = @estado
            WHERE RolID = @rolID;
            SELECT * FROM dbo.Roles WHERE RolID = @rolID;
        `);

    return result.recordset[0];
}

// =================== ELIMINAR ===================
async function deleteRol(rolID) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    const rolExist = await pool.request()
        .input("rolID", sql.Int, rolID)
        .query("SELECT * FROM dbo.Roles WHERE RolID = @rolID");

    if (rolExist.recordset.length === 0) {
        throw new Error("El rol no existe.");
    }

    const rolData = rolExist.recordset[0];

    // Evitar eliminar roles protegidos
    if (rolData.Nombre.toLowerCase() === 'administrador' || rolData.Nombre.toLowerCase() === 'cliente') {
        throw new Error(`No se puede eliminar el rol "${rolData.Nombre}" porque es un rol del sistema.`);
    }

    // Verificar si tiene usuarios asociados
    const checkUsuarios = await pool.request()
        .input("rolID", sql.Int, rolID)
        .query("SELECT COUNT(*) AS count FROM dbo.Usuarios WHERE RolID = @rolID");

    if (checkUsuarios.recordset[0].count > 0) {
        throw new Error("No se puede eliminar el rol porque tiene usuarios asociados.");
    }

    await pool.request()
        .input("rolID", sql.Int, rolID)
        .query("DELETE FROM dbo.Roles WHERE RolID = @rolID");

    return { eliminado: true };
}

module.exports = {
    getRoles,
    getRolById,
    createRol,
    updateRol,
    deleteRol
};