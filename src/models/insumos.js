// src/models/insumos.js
const { sql, poolPromise } = require("../../db");

// =================== LISTAR ===================
async function getInsumos() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request().query(`
        SELECT InsumoID, Nombre, Stock, Estado 
        FROM dbo.Insumos 
        ORDER BY InsumoID
    `);
    return result.recordset;
}

async function getInsumosActivos() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
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
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request()
        .input("insumoID", sql.VarChar(3), insumoID)
        .query("SELECT InsumoID, Nombre, Stock, Estado FROM dbo.Insumos WHERE InsumoID = @insumoID");
    
    return result.recordset[0];
}

// =================== CREAR ===================
async function createInsumo(insumo) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que el InsumoID no existe
    const insumoExists = await pool.request()
        .input("insumoID", sql.VarChar(3), insumo.InsumoID)
        .query("SELECT COUNT(*) as count FROM dbo.Insumos WHERE InsumoID = @insumoID");
    
    if (insumoExists.recordset[0].count > 0) {
        throw new Error('Ya existe un insumo con este ID');
    }

    const result = await pool.request()
        .input("insumoID", sql.VarChar(3), insumo.InsumoID)
        .input("nombre", sql.VarChar(50), insumo.Nombre)
        .input("stock", sql.Int, insumo.Stock || 0)
        .input("estado", sql.Bit, insumo.Estado !== undefined ? insumo.Estado : true)
        .query(`
            INSERT INTO dbo.Insumos (InsumoID, Nombre, Stock, Estado)
            VALUES (@insumoID, @nombre, @stock, @estado);
            SELECT * FROM dbo.Insumos WHERE InsumoID = @insumoID;
        `);
    
    return result.recordset[0];
}

// =================== EDITAR ===================
async function updateInsumo(insumoID, insumo) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que el insumo existe
    const insumoExists = await pool.request()
        .input("insumoID", sql.VarChar(3), insumoID)
        .query("SELECT COUNT(*) as count FROM dbo.Insumos WHERE InsumoID = @insumoID");
    
    if (insumoExists.recordset[0].count === 0) {
        throw new Error('El insumo no existe');
    }

    // Construir la consulta de actualización dinámicamente
    let updateFields = [];
    let request = pool.request().input("insumoID", sql.VarChar(3), insumoID);

    if (insumo.Nombre) {
        updateFields.push("Nombre = @nombre");
        request.input("nombre", sql.VarChar(50), insumo.Nombre);
    }
    if (insumo.Stock !== undefined) {
        updateFields.push("Stock = @stock");
        request.input("stock", sql.Int, insumo.Stock);
    }
    if (insumo.Estado !== undefined) {
        updateFields.push("Estado = @estado");
        request.input("estado", sql.Bit, insumo.Estado);
    }

    if (updateFields.length === 0) {
        throw new Error('No se proporcionaron campos para actualizar');
    }

    const result = await request.query(`
        UPDATE dbo.Insumos 
        SET ${updateFields.join(', ')}
        WHERE InsumoID = @insumoID;
        SELECT * FROM dbo.Insumos WHERE InsumoID = @insumoID;
    `);
    
    return result.recordset[0];
}

// =================== ELIMINAR ===================
async function deleteInsumo(insumoID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que el insumo existe
    const insumoExists = await pool.request()
        .input("insumoID", sql.VarChar(3), insumoID)
        .query("SELECT * FROM dbo.Insumos WHERE InsumoID = @insumoID");
    
    if (insumoExists.recordset.length === 0) {
        throw new Error('El insumo no existe');
    }

    // Verificar si tiene pedidos asociados
    const hasPedidos = await pool.request()
        .input("insumoID", sql.VarChar(3), insumoID)
        .query("SELECT COUNT(*) as count FROM dbo.DetallePedido WHERE InsumoID = @insumoID");
    
    if (hasPedidos.recordset[0].count > 0) {
        throw new Error('No se puede eliminar el insumo porque tiene pedidos asociados');
    }

    const result = await pool.request()
        .input("insumoID", sql.VarChar(3), insumoID)
        .query("DELETE FROM dbo.Insumos WHERE InsumoID = @insumoID");
    
    return { 
        deleted: true, 
        insumo: insumoExists.recordset[0],
        rowsAffected: result.rowsAffected[0] 
    };
}

// =================== GESTIÓN DE STOCK ===================
async function actualizarStock(insumoID, cantidadCambio, tipo = 'incremento') {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Obtener stock actual
    const insumoActual = await pool.request()
        .input("insumoID", sql.VarChar(3), insumoID)
        .query("SELECT Stock FROM dbo.Insumos WHERE InsumoID = @insumoID");
    
    if (insumoActual.recordset.length === 0) {
        throw new Error('El insumo no existe');
    }

    const stockActual = insumoActual.recordset[0].Stock;
    let nuevoStock;

    if (tipo === 'incremento') {
        nuevoStock = stockActual + cantidadCambio;
    } else if (tipo === 'decremento') {
        nuevoStock = stockActual - cantidadCambio;
        if (nuevoStock < 0) {
            throw new Error('No hay suficiente stock disponible');
        }
    } else {
        throw new Error('Tipo de operación inválido. Use "incremento" o "decremento"');
    }

    const result = await pool.request()
        .input("insumoID", sql.VarChar(3), insumoID)
        .input("nuevoStock", sql.Int, nuevoStock)
        .query(`
            UPDATE dbo.Insumos 
            SET Stock = @nuevoStock
            WHERE InsumoID = @insumoID;
            SELECT * FROM dbo.Insumos WHERE InsumoID = @insumoID;
        `);
    
    return {
        stockAnterior: stockActual,
        stockNuevo: nuevoStock,
        cambio: cantidadCambio,
        tipo: tipo,
        insumo: result.recordset[0]
    };
}

module.exports = { 
    getInsumos, 
    getInsumosActivos,
    getInsumoById, 
    createInsumo, 
    updateInsumo, 
    deleteInsumo,
    actualizarStock
};