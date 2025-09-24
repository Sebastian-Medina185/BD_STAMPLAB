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
        .input("rolID", sql.Int, rolID)  // Cambiado a Int
        .query("SELECT RolID, Nombre, Descripcion, Estado FROM dbo.Roles WHERE RolID = @rolID");
    
    return result.recordset[0];
}

// =================== CREAR ===================
async function createRol(rol) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request()
        .input("nombre", sql.VarChar(15), rol.Nombre)
        .input("descripcion", sql.VarChar(100), rol.Descripcion || null)
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
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const exists = await pool.request()
        .input("rolID", sql.Int, rolID)
        .query("SELECT COUNT(*) as count FROM dbo.Roles WHERE RolID = @rolID");
    
    if (exists.recordset[0].count === 0) {
        throw new Error('El rol no existe');
    }

    let updateFields = [];
    const request = pool.request().input("rolID", sql.Int, rolID);

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

    const exists = await pool.request()
        .input("rolID", sql.Int, rolID)
        .query("SELECT * FROM dbo.Roles WHERE RolID = @rolID");

    if (exists.recordset.length === 0) {
        throw new Error('El rol no existe');
    }

    const hasUsuarios = await pool.request()
        .input("rolID", sql.Int, rolID)
        .query("SELECT COUNT(*) as count FROM dbo.Usuarios WHERE RolID = @rolID");

    if (hasUsuarios.recordset[0].count > 0) {
        throw new Error('No se puede eliminar el rol porque tiene usuarios asociados');
    }

    const result = await pool.request()
        .input("rolID", sql.Int, rolID)
        .query("DELETE FROM dbo.Roles WHERE RolID = @rolID");

    return { 
        deleted: true, 
        rol: exists.recordset[0],
        rowsAffected: result.rowsAffected[0]
    };
}

// =================== CAMBIAR ESTADO ===================
async function cambiarEstadoRol(rolID, estado) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request()
        .input("rolID", sql.Int, rolID)
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