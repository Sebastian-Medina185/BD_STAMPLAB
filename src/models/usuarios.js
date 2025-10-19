// src/models/usuarios.js
const { sql, poolPromise } = require("../db");

// =================== VALIDACIONES ===================
function validarUsuario(usuario, esEdicion = false) {
    const errores = [];

    // Validar DocumentoID (solo en creación)
    if (!esEdicion) {
        if (!usuario.DocumentoID || usuario.DocumentoID.trim() === "") {
            errores.push("El número de documento es obligatorio");
        } else {
            const documentoStr = usuario.DocumentoID.trim();
            
            if (!/^\d+$/.test(documentoStr)) {
                errores.push("El documento solo puede contener números");
            }
            
            if (documentoStr.length < 4) {
                errores.push("El documento debe tener al menos 4 dígitos");
            }
            
            if (documentoStr.length > 10) {
                errores.push("El documento no puede tener más de 10 dígitos");
            }
        }
    }

    // Validar Nombre
    if (usuario.Nombre !== undefined) {
        const nombre = usuario.Nombre ? usuario.Nombre.trim() : "";
        
        if (!nombre) {
            errores.push("El nombre es obligatorio y no puede estar vacío");
        } else {
            if (nombre.length < 3) {
                errores.push("El nombre debe tener al menos 3 caracteres");
            }
            
            if (nombre.length > 30) {
                errores.push("El nombre no puede tener más de 30 caracteres");
            }
            
            if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñüÜ\s]+$/.test(nombre)) {
                errores.push("El nombre solo puede contener letras y espacios");
            }
        }
    }

    // Validar Correo
    if (usuario.Correo !== undefined) {
        const correo = usuario.Correo ? usuario.Correo.trim() : "";
        
        if (!correo) {
            errores.push("El correo electrónico es obligatorio");
        } else {
            if (correo.length < 6) {
                errores.push("El correo debe tener al menos 6 caracteres");
            }
            
            if (correo.length > 40) {
                errores.push("El correo no puede tener más de 40 caracteres");
            }
            
            // Validar formato de correo (permite caracteres especiales)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) {
                errores.push("Formato de correo electrónico inválido");
            }
        }
    }

    // Validar Teléfono
    if (usuario.Telefono !== undefined) {
        const telefono = usuario.Telefono ? usuario.Telefono.trim() : "";
        
        if (!telefono) {
            errores.push("El teléfono es obligatorio");
        } else {
            if (!/^\d+$/.test(telefono)) {
                errores.push("El teléfono solo puede contener números");
            }
            
            if (telefono.length < 7) {
                errores.push("El teléfono debe tener al menos 7 dígitos");
            }
            
            if (telefono.length > 10) {
                errores.push("El teléfono no puede tener más de 10 dígitos");
            }
        }
    }

    // Validar Dirección
    if (usuario.Direccion !== undefined) {
        const direccion = usuario.Direccion ? usuario.Direccion.trim() : "";
        
        if (!direccion) {
            errores.push("La dirección es obligatoria");
        } else {
            if (direccion.length < 8) {
                errores.push("La dirección debe tener al menos 8 caracteres");
            }
            
            if (direccion.length > 80) {
                errores.push("La dirección no puede tener más de 80 caracteres");
            }
        }
    }

    // Validar Contraseña (solo cuando se proporciona)
    if (usuario.Contraseña !== undefined) {
        const contraseña = usuario.Contraseña || "";
        
        if (!contraseña) {
            errores.push("La contraseña es obligatoria");
        } else {
            if (contraseña.length < 8) {
                errores.push("La contraseña debe tener al menos 8 caracteres");
            }
            
            if (contraseña.length > 50) {
                errores.push("La contraseña no puede tener más de 50 caracteres");
            }
            
            if (!/[A-Z]/.test(contraseña)) {
                errores.push("La contraseña debe contener al menos una letra mayúscula");
            }
            
            if (!/[a-z]/.test(contraseña)) {
                errores.push("La contraseña debe contener al menos una letra minúscula");
            }
            
            if (!/[0-9]/.test(contraseña)) {
                errores.push("La contraseña debe contener al menos un número");
            }
            
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(contraseña)) {
                errores.push("La contraseña debe contener al menos un carácter especial (!@#$%^&*...)");
            }
        }
    }

    // Validar RolID
    if (usuario.RolID !== undefined) {
        if (!usuario.RolID || usuario.RolID === "" || usuario.RolID === null) {
            errores.push("El rol es obligatorio");
        } else {
            // Validar que sea un número
            const rolIDNum = parseInt(usuario.RolID);
            if (isNaN(rolIDNum)) {
                errores.push("El rol debe ser un número válido");
            }
        }
    }

    return errores;
}

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

    // Validar datos del usuario
    const erroresValidacion = validarUsuario(usuario, false);
    if (erroresValidacion.length > 0) {
        const error = new Error(erroresValidacion.join(", "));
        error.tipo = "validacion";
        error.errores = erroresValidacion;
        throw error;
    }

    // Limpiar datos (trim)
    const documentoID = usuario.DocumentoID.trim();
    const nombre = usuario.Nombre.trim();
    const correo = usuario.Correo.trim();
    const direccion = usuario.Direccion.trim();
    const telefono = usuario.Telefono.trim();
    const rolID = parseInt(usuario.RolID);

    // Verificar que el rol existe
    const rolExists = await pool.request()
        .input("rolID", sql.Int, rolID)
        .query("SELECT COUNT(*) as count FROM dbo.Roles WHERE RolID = @rolID AND Estado = 1");
    
    if (rolExists.recordset[0].count === 0) {
        throw new Error('El rol especificado no existe o está inactivo');
    }

    // Verificar que el documento no existe
    const documentExists = await pool.request()
        .input("documentoID", sql.VarChar(15), documentoID)
        .query("SELECT COUNT(*) as count FROM dbo.Usuarios WHERE DocumentoID = @documentoID");
    
    if (documentExists.recordset[0].count > 0) {
        throw new Error('Ya existe un usuario con este número de documento');
    }

    // Verificar que el correo no existe (case insensitive)
    const emailExists = await pool.request()
        .input("correo", sql.VarChar(100), correo)
        .query("SELECT COUNT(*) as count FROM dbo.Usuarios WHERE LOWER(Correo) = LOWER(@correo)");
    
    if (emailExists.recordset[0].count > 0) {
        throw new Error('Ya existe un usuario con este correo electrónico');
    }

    const result = await pool.request()
        .input("documentoID", sql.VarChar(15), documentoID)
        .input("nombre", sql.VarChar(30), nombre)
        .input("correo", sql.VarChar(100), correo)
        .input("direccion", sql.VarChar(150), direccion)
        .input("telefono", sql.VarChar(15), telefono)
        .input("contraseña", sql.VarChar(100), usuario.Contraseña)
        .input("rolID", sql.Int, rolID)
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

    // Validar datos del usuario (edición)
    const erroresValidacion = validarUsuario(usuario, true);
    if (erroresValidacion.length > 0) {
        const error = new Error(erroresValidacion.join(", "));
        error.tipo = "validacion";
        error.errores = erroresValidacion;
        throw error;
    }

    // Si se está actualizando el rol, verificar que existe
    if (usuario.RolID !== undefined) {
        const rolID = parseInt(usuario.RolID);
        const rolExists = await pool.request()
            .input("rolID", sql.Int, rolID)
            .query("SELECT COUNT(*) as count FROM dbo.Roles WHERE RolID = @rolID AND Estado = 1");
        
        if (rolExists.recordset[0].count === 0) {
            throw new Error('El rol especificado no existe o está inactivo');
        }
    }

    // Si se está actualizando el correo, verificar que no existe en otro usuario
    if (usuario.Correo) {
        const correo = usuario.Correo.trim();
        const emailExists = await pool.request()
            .input("correo", sql.VarChar(100), correo)
            .input("documentoID", sql.VarChar(15), documentoID)
            .query("SELECT COUNT(*) as count FROM dbo.Usuarios WHERE LOWER(Correo) = LOWER(@correo) AND DocumentoID != @documentoID");
        
        if (emailExists.recordset[0].count > 0) {
            throw new Error('Ya existe otro usuario con este correo electrónico');
        }
    }

    // Construir la consulta de actualización dinámicamente
    let updateFields = [];
    let request = pool.request().input("documentoID", sql.VarChar(15), documentoID);

    if (usuario.Nombre) {
        updateFields.push("Nombre = @nombre");
        request.input("nombre", sql.VarChar(30), usuario.Nombre.trim());
    }
    if (usuario.Correo) {
        updateFields.push("Correo = @correo");
        request.input("correo", sql.VarChar(100), usuario.Correo.trim());
    }
    if (usuario.Direccion) {
        updateFields.push("Direccion = @direccion");
        request.input("direccion", sql.VarChar(150), usuario.Direccion.trim());
    }
    if (usuario.Telefono) {
        updateFields.push("Telefono = @telefono");
        request.input("telefono", sql.VarChar(15), usuario.Telefono.trim());
    }
    if (usuario.Contraseña) {
        updateFields.push("Contraseña = @contraseña");
        request.input("contraseña", sql.VarChar(100), usuario.Contraseña);
    }
    if (usuario.RolID !== undefined) {
        updateFields.push("RolID = @rolID");
        request.input("rolID", sql.Int, parseInt(usuario.RolID));
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

// =================== VALIDACIONES ===================
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