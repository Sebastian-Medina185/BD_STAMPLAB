const { sql, poolPromise } = require("../db");

// =================== LISTAR ===================
async function getProveedores() {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    const result = await pool.request().query(`
        SELECT Nit, Nombre, Correo, Telefono, Direccion, Estado
        FROM dbo.Proveedores
        ORDER BY Nombre
    `);
    return result.recordset;
}

async function getProveedorById(nit) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    const result = await pool.request()
        .input("nit", sql.VarChar(20), nit)
        .query("SELECT Nit, Nombre, Correo, Telefono, Direccion, Estado FROM dbo.Proveedores WHERE Nit = @nit");

    return result.recordset[0];
}

// =================== VALIDACIONES ===================
function validarProveedor(proveedor, esNuevo = true) {
    const errores = [];

    // NIT: obligatorio, solo números
    if (!proveedor.Nit || proveedor.Nit.trim() === "") {
        errores.push("El NIT es obligatorio");
    } else if (!/^\d+$/.test(proveedor.Nit)) {
        errores.push("El NIT solo debe contener números");
    }

    // Nombre: obligatorio, solo letras y espacios, longitud 3–20
    if (!proveedor.Nombre || proveedor.Nombre.trim() === "") {
        errores.push("El nombre es obligatorio");
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/.test(proveedor.Nombre)) {
        errores.push("El nombre solo puede contener letras y espacios");
    } else if (proveedor.Nombre.length < 3 || proveedor.Nombre.length > 20) {
        errores.push("El nombre debe tener entre 3 y 20 caracteres");
    }

    // Correo: obligatorio, solo letras, números y un solo @, longitud 20–50
    if (!proveedor.Correo || proveedor.Correo.trim() === "") {
        errores.push("El correo es obligatorio");
    } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(proveedor.Correo)) {
        errores.push("El correo no tiene un formato válido");
    } else if (proveedor.Correo.length < 10 || proveedor.Correo.length > 30) {
        errores.push("El correo debe tener entre 10 y 30 caracteres");
    }

    // Teléfono: obligatorio, solo números o con +, longitud 7–15
    if (!proveedor.Telefono || proveedor.Telefono.trim() === "") {
        errores.push("El teléfono es obligatorio");
    } else if (!/^\+?\d+$/.test(proveedor.Telefono)) {
        errores.push("El teléfono solo puede contener números (y opcionalmente '+')");
    } else if (proveedor.Telefono.length < 7 || proveedor.Telefono.length > 15) {
        errores.push("El teléfono debe tener entre 7 y 15 caracteres");
    }

    // Dirección: obligatoria, letras, números, espacios, ., -, #
    if (!proveedor.Direccion || proveedor.Direccion.trim() === "") {
        errores.push("La dirección es obligatoria");
    } else if (!/^[A-Za-z0-9\s\.\-#]+$/.test(proveedor.Direccion)) {
        errores.push("La dirección contiene caracteres no permitidos");
    } else if (proveedor.Direccion.length < 10 || proveedor.Direccion.length > 20) {
        errores.push("La dirección debe tener entre 10 y 20 caracteres");
    }

    if (errores.length > 0) {
        const error = new Error(errores.join(", "));
        error.statusCode = 400;
        throw error;
    }
}

// =================== CREAR ===================
async function createProveedor(proveedor) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    // Validar datos
    validarProveedor(proveedor, true);

    // Verificar duplicado NIT
    const existeNit = await pool.request()
        .input("nit", sql.VarChar(20), proveedor.Nit)
        .query("SELECT COUNT(*) as count FROM dbo.Proveedores WHERE Nit = @nit");

    if (existeNit.recordset[0].count > 0) {
        throw new Error("Ya existe un proveedor con este NIT");
    }

    // Verificar duplicado Nombre
    const existeNombre = await pool.request()
        .input("nombre", sql.VarChar(50), proveedor.Nombre)
        .query("SELECT COUNT(*) as count FROM dbo.Proveedores WHERE Nombre = @nombre");

    if (existeNombre.recordset[0].count > 0) {
        throw new Error("Ya existe un proveedor con este nombre");
    }

    const result = await pool.request()
        .input("nit", sql.VarChar(20), proveedor.Nit)
        .input("nombre", sql.VarChar(50), proveedor.Nombre)
        .input("correo", sql.VarChar(100), proveedor.Correo)
        .input("telefono", sql.VarChar(15), proveedor.Telefono)
        .input("direccion", sql.VarChar(155), proveedor.Direccion)
        .input("estado", sql.Bit, proveedor.Estado ?? 1) // Por defecto activo
        .query(`
            INSERT INTO dbo.Proveedores (Nit, Nombre, Correo, Telefono, Direccion, Estado)
            VALUES (@nit, @nombre, @correo, @telefono, @direccion, @estado);
            SELECT * FROM dbo.Proveedores WHERE Nit = @nit;
        `);

    return result.recordset[0];
}

// =================== EDITAR ===================
async function updateProveedor(nit, proveedor) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    const existe = await pool.request()
        .input("nit", sql.VarChar(20), nit)
        .query("SELECT COUNT(*) as count FROM dbo.Proveedores WHERE Nit = @nit");

    if (existe.recordset[0].count === 0) {
        throw new Error("El proveedor no existe");
    }

    // Validar los datos enviados
    validarProveedor({ ...proveedor, Nit: nit }, false);

    let updateFields = [];
    let request = pool.request().input("nit", sql.VarChar(20), nit);

    if (proveedor.Nombre) {
        updateFields.push("Nombre = @nombre");
        request.input("nombre", sql.VarChar(50), proveedor.Nombre);
    }
    if (proveedor.Correo) {
        updateFields.push("Correo = @correo");
        request.input("correo", sql.VarChar(100), proveedor.Correo);
    }
    if (proveedor.Telefono) {
        updateFields.push("Telefono = @telefono");
        request.input("telefono", sql.VarChar(15), proveedor.Telefono);
    }
    if (proveedor.Direccion) {
        updateFields.push("Direccion = @direccion");
        request.input("direccion", sql.VarChar(155), proveedor.Direccion);
    }
    if (proveedor.Estado !== undefined) {
        updateFields.push("Estado = @estado");
        request.input("estado", sql.Bit, proveedor.Estado);
    }

    if (updateFields.length === 0) throw new Error("No se enviaron campos para actualizar");

    const result = await request.query(`
        UPDATE dbo.Proveedores
        SET ${updateFields.join(", ")}
        WHERE Nit = @nit;
        SELECT * FROM dbo.Proveedores WHERE Nit = @nit;
    `);

    return result.recordset[0];
}

// =================== ELIMINAR ===================
async function deleteProveedor(nit) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    const exists = await pool.request()
        .input("nit", sql.VarChar(20), nit)
        .query("SELECT * FROM dbo.Proveedores WHERE Nit = @nit");

    if (exists.recordset.length === 0) {
        throw new Error("El proveedor no existe");
    }

    const result = await pool.request()
        .input("nit", sql.VarChar(20), nit)
        .query("DELETE FROM dbo.Proveedores WHERE Nit = @nit");

    return { deleted: true, proveedor: exists.recordset[0], rowsAffected: result.rowsAffected[0] };
}

module.exports = {
    getProveedores,
    getProveedorById,
    createProveedor,
    updateProveedor,
    deleteProveedor
};