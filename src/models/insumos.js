// ===============================================
// MODELO DE INSUMOS (LIMPIO Y ORGANIZADO)
// ===============================================
const { sql, poolPromise } = require("../db");

// =================== LISTAR ===================
async function getInsumos() {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    const result = await pool.request().query(`
        SELECT InsumoID, Nombre, Stock, Estado 
        FROM dbo.Insumos 
        ORDER BY InsumoID
    `);
    return result.recordset;
}

async function getInsumosActivos() {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    const result = await pool.request().query(`
        SELECT InsumoID, Nombre, Stock 
        FROM dbo.Insumos 
        WHERE Estado = 1
        ORDER BY Nombre
    `);
    return result.recordset;
}

async function getInsumoById(insumoID) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    const result = await pool.request()
        .input("insumoID", sql.Int, insumoID)
        .query(`
            SELECT InsumoID, Nombre, Stock, Estado 
            FROM dbo.Insumos 
            WHERE InsumoID = @insumoID
        `);
    
    return result.recordset[0];
}

// =================== VALIDACIONES ===================
function validarNombre(nombre) {
    if (!nombre || !nombre.trim()) throw new Error("El nombre es obligatorio");
    if (nombre.trim().length < 4) throw new Error("El nombre debe tener al menos 4 caracteres");
    if (nombre.length > 50) throw new Error("El nombre no puede exceder 50 caracteres");
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_]+$/.test(nombre))
        throw new Error("El nombre solo puede contener letras, números, espacios, guiones y guiones bajos");
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(nombre))
        throw new Error("El nombre debe contener al menos una letra");
}

function validarStock(stock) {
    if (stock === "" || stock === null || stock === undefined)
        throw new Error("El stock es obligatorio");
    if (isNaN(stock) || !Number.isInteger(Number(stock)) || stock < 0)
        throw new Error("El stock debe ser un número entero mayor o igual a 0");
}

// =================== CREAR ===================
async function createInsumo(insumo) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    // 🔹 Validaciones
    validarNombre(insumo.Nombre);
    const stockValue = insumo.Stock !== undefined ? Number(insumo.Stock) : 0;
    validarStock(stockValue);

    // 🔹 Verificar nombre duplicado
    const checkNombre = await pool.request()
        .input("nombre", sql.VarChar(50), insumo.Nombre)
        .query("SELECT COUNT(*) AS existe FROM dbo.Insumos WHERE LOWER(Nombre) = LOWER(@nombre)");
    
    if (checkNombre.recordset[0].existe > 0)
        throw new Error(`El nombre "${insumo.Nombre}" ya existe.`);

    // 🔹 Estado automático
    const estadoFinal = stockValue === 0 ? 0 : (insumo.Estado ?? 1);

    // 🔹 Insertar
    const result = await pool.request()
        .input("nombre", sql.VarChar(50), insumo.Nombre.trim())
        .input("stock", sql.Int, stockValue)
        .input("estado", sql.Bit, estadoFinal)
        .query(`
            INSERT INTO dbo.Insumos (Nombre, Stock, Estado)
            VALUES (@nombre, @stock, @estado);
            SELECT * FROM dbo.Insumos WHERE InsumoID = SCOPE_IDENTITY();
        `);
    
    return result.recordset[0];
}

// =================== EDITAR ===================
async function updateInsumo(insumoID, insumo) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    // Verificar existencia
    const existe = await pool.request()
        .input("insumoID", sql.Int, insumoID)
        .query("SELECT * FROM dbo.Insumos WHERE InsumoID = @insumoID");
    if (existe.recordset.length === 0)
        throw new Error(`El insumo con ID ${insumoID} no existe.`);

    // Validar y limpiar campos
    if (insumo.Nombre) validarNombre(insumo.Nombre);
    if (insumo.Stock !== undefined) validarStock(insumo.Stock);

    // Validar duplicado si cambia nombre
    if (insumo.Nombre) {
        const checkNombre = await pool.request()
            .input("nombre", sql.VarChar(50), insumo.Nombre)
            .input("insumoID", sql.Int, insumoID)
            .query("SELECT COUNT(*) AS existe FROM dbo.Insumos WHERE LOWER(Nombre)=LOWER(@nombre) AND InsumoID <> @insumoID");
        if (checkNombre.recordset[0].existe > 0)
            throw new Error(`El nombre "${insumo.Nombre}" ya está en uso.`);
    }

    // Construcción dinámica
    let querySet = [];
    let request = pool.request().input("insumoID", sql.Int, insumoID);

    if (insumo.Nombre) {
        querySet.push("Nombre = @nombre");
        request.input("nombre", sql.VarChar(50), insumo.Nombre.trim());
    }

    if (insumo.Stock !== undefined) {
        querySet.push("Stock = @stock");
        request.input("stock", sql.Int, insumo.Stock);
        if (insumo.Stock === 0) {
            querySet.push("Estado = @estado");
            request.input("estado", sql.Bit, 0);
        }
    }

    if (insumo.Estado !== undefined && insumo.Stock !== 0) {
        querySet.push("Estado = @estado");
        request.input("estado", sql.Bit, insumo.Estado);
    }

    if (querySet.length === 0)
        throw new Error("No se proporcionaron campos para actualizar");

    const result = await request.query(`
        UPDATE dbo.Insumos SET ${querySet.join(", ")} WHERE InsumoID = @insumoID;
        SELECT * FROM dbo.Insumos WHERE InsumoID = @insumoID;
    `);

    return result.recordset[0];
}

// =================== ELIMINAR ===================
async function deleteInsumo(insumoID) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    // Verificar existencia
    const insumo = await pool.request()
        .input("insumoID", sql.Int, insumoID)
        .query("SELECT * FROM dbo.Insumos WHERE InsumoID = @insumoID");
    if (insumo.recordset.length === 0)
        throw new Error("El insumo no existe");

    // Verificar relación con pedidos
    const pedidos = await pool.request()
        .input("insumoID", sql.Int, insumoID)
        .query("SELECT COUNT(*) AS count FROM dbo.DetallePedido WHERE InsumoID = @insumoID");
    if (pedidos.recordset[0].count > 0)
        throw new Error("No se puede eliminar el insumo porque tiene pedidos asociados");

    await pool.request()
        .input("insumoID", sql.Int, insumoID)
        .query("DELETE FROM dbo.Insumos WHERE InsumoID = @insumoID");

    return { eliminado: true, insumo: insumo.recordset[0] };
}

// =================== GESTIÓN DE STOCK ===================
async function actualizarStock(insumoID, cantidad, tipo = "incremento") {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    const actual = await pool.request()
        .input("insumoID", sql.Int, insumoID)
        .query("SELECT Stock FROM dbo.Insumos WHERE InsumoID = @insumoID");

    if (actual.recordset.length === 0)
        throw new Error("El insumo no existe");

    const stockActual = actual.recordset[0].Stock;
    let nuevoStock = tipo === "incremento" ? stockActual + cantidad : stockActual - cantidad;

    if (nuevoStock < 0)
        throw new Error("No hay suficiente stock disponible");

    const result = await pool.request()
        .input("insumoID", sql.Int, insumoID)
        .input("nuevoStock", sql.Int, nuevoStock)
        .query(`
            UPDATE dbo.Insumos SET Stock = @nuevoStock WHERE InsumoID = @insumoID;
            SELECT * FROM dbo.Insumos WHERE InsumoID = @insumoID;
        `);

    return {
        stockAnterior: stockActual,
        stockNuevo: nuevoStock,
        cambio: cantidad,
        tipo,
        insumo: result.recordset[0],
    };
}

module.exports = {
    getInsumos,
    getInsumosActivos,
    getInsumoById,
    createInsumo,
    updateInsumo,
    deleteInsumo,
    actualizarStock,
};
