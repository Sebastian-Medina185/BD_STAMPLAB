// src/models/usuarios.js
const { sql, poolPromise } = require("../../db");

// =================== LISTAR ===================
async function getUsuarios() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request().query(`
        SELECT u.DocumentoID, u.Nombre, u.Correo, u.Direccion, u.Telefono, 
               u.RolID, r.Nombre as RolNombre, r.Descripcion as RolDescripcion
        FROM dbo.Usuarios u
        INNER JOIN dbo.Roles r ON u.RolID = r.RolID
    `);
    return result.recordset;
}

async function getUsuarioById(documentoID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request()
        .input("documentoID", sql.VarChar(15), documentoID)
        .query(`
            SELECT u.DocumentoID, u.Nombre, u.Correo, u.Direccion, u.Telefono, 
                   u.RolID, r.Nombre as RolNombre, r.Descripcion as RolDescripcion
            FROM dbo.Usuarios u
            INNER JOIN dbo.Roles r ON u.RolID = r.RolID
            WHERE u.DocumentoID = @documentoID
        `);
    return result.recordset[0];
}

// =================== CREAR ===================
async function createUsuario(usuario) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que el rol existe
    const rolExists = await pool.request()
        .input("rolID", sql.VarChar(2), usuario.RolID)
        .query("SELECT COUNT(*) as count FROM dbo.Roles WHERE RolID = @rolID AND Estado = 1");
    
    if (rolExists.recordset[0].count === 0) {
        throw new Error('El rol especificado no existe o está inactivo');
    }

    // Verificar que el documento no existe
    const documentExists = await pool.request()
        .input("documentoID", sql.VarChar(15), usuario.DocumentoID)
        .query("SELECT COUNT(*) as count FROM dbo.Usuarios WHERE DocumentoID = @documentoID");
    
    if (documentExists.recordset[0].count > 0) {
        throw new Error('Ya existe un usuario con este número de documento');
    }

    // Verificar que el correo no existe
    const emailExists = await pool.request()
        .input("correo", sql.VarChar(100), usuario.Correo)
        .query("SELECT COUNT(*) as count FROM dbo.Usuarios WHERE Correo = @correo");
    
    if (emailExists.recordset[0].count > 0) {
        throw new Error('Ya existe un usuario con este correo electrónico');
    }

    const result = await pool.request()
        .input("documentoID", sql.VarChar(15), usuario.DocumentoID)
        .input("nombre", sql.VarChar(50), usuario.Nombre)
        .input("correo", sql.VarChar(100), usuario.Correo)
        .input("direccion", sql.VarChar(150), usuario.Direccion)
        .input("telefono", sql.VarChar(15), usuario.Telefono)
        .input("contraseña", sql.VarChar(100), usuario.Contraseña)
        .input("rolID", sql.VarChar(2), usuario.RolID)
        .query(`
            INSERT INTO dbo.Usuarios (DocumentoID, Nombre, Correo, Direccion, Telefono, Contraseña, RolID)
            VALUES (@documentoID, @nombre, @correo, @direccion, @telefono, @contraseña, @rolID);
            SELECT * FROM dbo.Usuarios WHERE DocumentoID = @documentoID;
        `);
    
    return result.recordset[0];
}

// =================== EDITAR ===================
async function updateUsuario(documentoID, usuario) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que el usuario existe
    const userExists = await pool.request()
        .input("documentoID", sql.VarChar(15), documentoID)
        .query("SELECT COUNT(*) as count FROM dbo.Usuarios WHERE DocumentoID = @documentoID");
    
    if (userExists.recordset[0].count === 0) {
        throw new Error('El usuario no existe');
    }

    // Si se está actualizando el rol, verificar que existe
    if (usuario.RolID) {
        const rolExists = await pool.request()
            .input("rolID", sql.VarChar(2), usuario.RolID)
            .query("SELECT COUNT(*) as count FROM dbo.Roles WHERE RolID = @rolID AND Estado = 1");
        
        if (rolExists.recordset[0].count === 0) {
            throw new Error('El rol especificado no existe o está inactivo');
        }
    }

    // Si se está actualizando el correo, verificar que no existe en otro usuario
    if (usuario.Correo) {
        const emailExists = await pool.request()
            .input("correo", sql.VarChar(100), usuario.Correo)
            .input("documentoID", sql.VarChar(15), documentoID)
            .query("SELECT COUNT(*) as count FROM dbo.Usuarios WHERE Correo = @correo AND DocumentoID != @documentoID");
        
        if (emailExists.recordset[0].count > 0) {
            throw new Error('Ya existe otro usuario con este correo electrónico');
        }
    }

    // Construir la consulta de actualización dinámicamente
    let updateFields = [];
    let request = pool.request().input("documentoID", sql.VarChar(15), documentoID);

    if (usuario.Nombre) {
        updateFields.push("Nombre = @nombre");
        request.input("nombre", sql.VarChar(50), usuario.Nombre);
    }
    if (usuario.Correo) {
        updateFields.push("Correo = @correo");
        request.input("correo", sql.VarChar(100), usuario.Correo);
    }
    if (usuario.Direccion) {
        updateFields.push("Direccion = @direccion");
        request.input("direccion", sql.VarChar(150), usuario.Direccion);
    }
    if (usuario.Telefono) {
        updateFields.push("Telefono = @telefono");
        request.input("telefono", sql.VarChar(15), usuario.Telefono);
    }
    if (usuario.Contraseña) {
        updateFields.push("Contraseña = @contraseña");
        request.input("contraseña", sql.VarChar(100), usuario.Contraseña);
    }
    if (usuario.RolID) {
        updateFields.push("RolID = @rolID");
        request.input("rolID", sql.VarChar(2), usuario.RolID);
    }

    if (updateFields.length === 0) {
        throw new Error('No se proporcionaron campos para actualizar');
    }

    const result = await request.query(`
        UPDATE dbo.Usuarios 
        SET ${updateFields.join(', ')}
        WHERE DocumentoID = @documentoID;
        SELECT * FROM dbo.Usuarios WHERE DocumentoID = @documentoID;
    `);
    
    return result.recordset[0];
}

// =================== ELIMINAR ===================
async function deleteUsuario(documentoID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que el usuario existe
    const userExists = await pool.request()
        .input("documentoID", sql.VarChar(15), documentoID)
        .query("SELECT * FROM dbo.Usuarios WHERE DocumentoID = @documentoID");
    
    if (userExists.recordset.length === 0) {
        throw new Error('El usuario no existe');
    }

    // Verificar si el usuario tiene cotizaciones asociadas
    const hasCotizaciones = await pool.request()
        .input("documentoID", sql.VarChar(15), documentoID)
        .query("SELECT COUNT(*) as count FROM dbo.Cotizaciones WHERE DocumentoID = @documentoID");
    
    if (hasCotizaciones.recordset[0].count > 0) {
        throw new Error('No se puede eliminar el usuario porque tiene cotizaciones asociadas');
    }

    const result = await pool.request()
        .input("documentoID", sql.VarChar(15), documentoID)
        .query("DELETE FROM dbo.Usuarios WHERE DocumentoID = @documentoID");
    
    return { 
        deleted: true, 
        user: userExists.recordset[0],
        rowsAffected: result.rowsAffected[0] 
    };
}

// =================== VALIDACIONES Y UTILIDADES ===================
async function getRoles() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request().query("SELECT * FROM dbo.Roles WHERE Estado = 1 ORDER BY Nombre");
    return result.recordset;
}

module.exports = { 
    getUsuarios, 
    getUsuarioById, 
    createUsuario, 
    updateUsuario, 
    deleteUsuario,
    getRoles
};