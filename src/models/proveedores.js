// src/models/proveedores.js
const { sql, poolPromise } = require("../../db");

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

// =================== CREAR ===================
async function createProveedor(proveedor) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    // Verificar duplicado
    const exists = await pool.request()
        .input("nit", sql.VarChar(20), proveedor.Nit)
        .query("SELECT COUNT(*) as count FROM dbo.Proveedores WHERE Nit = @nit");

    if (exists.recordset[0].count > 0) {
        throw new Error("Ya existe un proveedor con este NIT");
    }

    const result = await pool.request()
        .input("nit", sql.VarChar(20), proveedor.Nit)
        .input("nombre", sql.VarChar(50), proveedor.Nombre)
        .input("correo", sql.VarChar(100), proveedor.Correo)
        .input("telefono", sql.VarChar(15), proveedor.Telefono)
        .input("direccion", sql.VarChar(155), proveedor.Direccion)
        .input("estado", sql.Bit, proveedor.Estado)
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

    const exists = await pool.request()
        .input("nit", sql.VarChar(20), nit)
        .query("SELECT COUNT(*) as count FROM dbo.Proveedores WHERE Nit = @nit");

    if (exists.recordset[0].count === 0) {
        throw new Error("El proveedor no existe");
    }

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

module.exports = { getProveedores, getProveedorById, createProveedor, updateProveedor, deleteProveedor };
