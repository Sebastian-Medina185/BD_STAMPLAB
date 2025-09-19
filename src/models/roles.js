// src/models/roles.js
const { sql, poolPromise } = require("../../db");

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

async function getRolesActivos() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request().query(`
        SELECT RolID, Nombre, Descripcion 
        FROM dbo.Roles 
        WHERE Estado = 1
        ORDER BY Nombre
    `);
    return result.recordset;
}

async function getRolById(rolID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request()
        .input("rolID", sql.VarChar(2), rolID)
        .query("SELECT RolID, Nombre, Descripcion, Estado FROM dbo.Roles WHERE RolID = @rolID");
    
    return result.recordset[0];
}

// =================== CREAR ===================
async function createRol(rol) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que el RolID no existe
    const rolExists = await pool.request()
        .input("rolID", sql.VarChar(2), rol.RolID)
        .query("SELECT COUNT(*) as count FROM dbo.Roles WHERE RolID = @rolID");
    
    if (rolExists.recordset[0].count > 0) {
        throw new Error('Ya existe un rol con este ID');
    }

    const result = await pool.request()
        .input("rolID", sql.VarChar(2), rol.RolID)
        .input("nombre", sql.VarChar(15), rol.Nombre)
        .input("descripcion", sql.VarChar(100), rol.Descripcion || null)
        .input("estado", sql.Bit, rol.Estado !== undefined ? rol.Estado : true)
        .query(`
            INSERT INTO dbo.Roles (RolID, Nombre, Descripcion, Estado)
            VALUES (@rolID, @nombre, @descripcion, @estado);
            SELECT * FROM dbo.Roles WHERE RolID = @rolID;
        `);
    
    return result.recordset[0];
}

// =================== EDITAR ===================
async function updateRol(rolID, rol) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que el rol existe
    const rolExists = await pool.request()
        .input("rolID", sql.VarChar(2), rolID)
        .query("SELECT COUNT(*) as count FROM dbo.Roles WHERE RolID = @rolID");
    
    if (rolExists.recordset[0].count === 0) {
        throw new Error('El rol no existe');
    }

    // Construir la consulta de actualización dinámicamente
    let updateFields = [];
    let request = pool.request().input("rolID", sql.VarChar(2), rolID);

    if (rol.Nombre) {
        updateFields.push("Nombre = @nombre");
        request.input("nombre", sql.VarChar(15), rol.Nombre);
    }
    if (rol.Descripcion !== undefined) {
        updateFields.push("Descripcion = @descripcion");
        request.input("descripcion", sql.VarChar(100), rol.Descripcion);
    }
    if (rol.Estado !== undefined) {
        updateFields.push("Estado = @estado");
        request.input("estado", sql.Bit, rol.Estado);
    }

    if (updateFields.length === 0) {
        throw new Error('No se proporcionaron campos para actualizar');
    }

    const result = await request.query(`
        UPDATE dbo.Roles 
        SET ${updateFields.join(', ')}
        WHERE RolID = @rolID;
        SELECT * FROM dbo.Roles WHERE RolID = @rolID;
    `);
    
    return result.recordset[0];
}

// =================== ELIMINAR ===================
async function deleteRol(rolID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Usa un tipo correcto, aquí asumo texto hasta 50 chars
    const rolExists = await pool.request()
        .input("rolID", sql.VarChar(50), rolID)
        .query("SELECT * FROM dbo.Roles WHERE RolID = @rolID");

    if (rolExists.recordset.length === 0) {
        throw new Error('El rol no existe');
    }

    // Verificar si tiene usuarios asociados
    const hasUsuarios = await pool.request()
        .input("rolID", sql.VarChar(50), rolID)
        .query("SELECT COUNT(*) as count FROM dbo.Usuarios WHERE RolID = @rolID");

    if (hasUsuarios.recordset[0].count > 0) {
        throw new Error('No se puede eliminar el rol porque tiene usuarios asociados');
    }

    await pool.request()
        .input("rolID", sql.VarChar(50), rolID)
        .query("DELETE FROM dbo.Roles WHERE RolID = @rolID");

    return { deleted: true, rol: rolExists.recordset[0] };
}


// =================== CAMBIAR ESTADO ===================
async function cambiarEstadoRol(rolID, estado) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request()
        .input("rolID", sql.VarChar(2), rolID)
        .input("estado", sql.Bit, estado)
        .query(`
            UPDATE dbo.Roles 
            SET Estado = @estado
            WHERE RolID = @rolID;
            SELECT * FROM dbo.Roles WHERE RolID = @rolID;
        `);
    
    if (result.recordset.length === 0) {
        throw new Error('El rol no existe');
    }
    
    return result.recordset[0];
}

module.exports = { 
    getRoles, 
    getRolesActivos,
    getRolById, 
    createRol, 
    updateRol, 
    deleteRol,
    cambiarEstadoRol
};