// ===============================================
// MODELO DE INSUMOS ACTUALIZADO (AUTOINCREMENTAL)
// ===============================================
// src/models/insumos.js
const { sql, poolPromise } = require("../db");

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
        .input("insumoID", sql.Int, insumoID)
        .query("SELECT InsumoID, Nombre, Stock, Estado FROM dbo.Insumos WHERE InsumoID = @insumoID");
    
    return result.recordset[0];
}

// =================== CREAR ===================
async function createInsumo(insumo) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Validar que el nombre no esté duplicado
    const checkNombre = await pool.request()
        .input("nombre", sql.VarChar(50), insumo.Nombre)
        .query("SELECT COUNT(*) AS existe FROM dbo.Insumos WHERE LOWER(Nombre) = LOWER(@nombre)");

    if (checkNombre.recordset[0].existe > 0) {
        throw new Error(`El nombre "${insumo.Nombre}" ya existe.`);
    }

    // Validar que el nombre tenga al menos 4 caracteres
    if (!insumo.Nombre || insumo.Nombre.trim().length < 4) {
        throw new Error("El nombre debe tener al menos 4 caracteres.");
    }

    // Validar que no sea solo espacios
    if (insumo.Nombre.trim().length === 0) {
        throw new Error("El nombre no puede estar vacío o contener solo espacios.");
    }

    // Validar que no contenga solo caracteres especiales o números
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_]+$/.test(insumo.Nombre)) {
        throw new Error("El nombre solo puede contener letras, números, espacios, guiones y guiones bajos.");
    }

    // Validar que contenga al menos una letra
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(insumo.Nombre)) {
        throw new Error("El nombre debe contener al menos una letra.");
    }

    // Validar que el stock sea un número válido
    const stockValue = insumo.Stock !== undefined ? insumo.Stock : 0;
    
    // Validar que Stock no sea una cadena vacía
    if (insumo.Stock === "" || insumo.Stock === null) {
        throw new Error("El stock debe ser un número entero válido, no puede estar vacío.");
    }
    
    if (isNaN(stockValue) || stockValue < 0 || !Number.isInteger(Number(stockValue))) {
        throw new Error("El stock debe ser un número entero mayor o igual a 0.");
    }

    // Si el stock es 0, el estado se pone como Inactivo automáticamente
    const estadoFinal = stockValue === 0 ? 0 : (insumo.Estado !== undefined ? insumo.Estado : 1);

    const result = await pool.request()
        .input("nombre", sql.VarChar(50), insumo.Nombre)
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
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar que el insumo existas
    const insumoExists = await pool.request()
        .input("insumoID", sql.Int, insumoID)
        .query("SELECT * FROM dbo.Insumos WHERE InsumoID = @insumoID");
    
    if (insumoExists.recordset.length === 0) {
        throw new Error(`El insumo con ID ${insumoID} no existe.`);
    }

    // Validar nombre duplicado (si se envía)
    if (insumo.Nombre) {
        const checkNombre = await pool.request()
            .input("nombre", sql.VarChar(50), insumo.Nombre)
            .input("insumoID", sql.Int, insumoID)
            .query("SELECT COUNT(*) AS existe FROM dbo.Insumos WHERE LOWER(Nombre) = LOWER(@nombre) AND InsumoID <> @insumoID");

        if (checkNombre.recordset[0].existe > 0) {
            throw new Error(`El nombre "${insumo.Nombre}" ya está en uso.`);
        }

        // Validar que el nombre tenga al menos 2 caracteres
        if (insumo.Nombre.trim().length < 2) {
            throw new Error("El nombre debe tener al menos 2 caracteres.");
        }

        // Validar formato del nombre
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_]+$/.test(insumo.Nombre)) {
            throw new Error("El nombre solo puede contener letras, números, espacios, guiones y guiones bajos.");
        }

        if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(insumo.Nombre)) {
            throw new Error("El nombre debe contener al menos una letra.");
        }
    }

    // Validar stock
    if (insumo.Stock !== undefined) {
        // Validar que Stock no sea una cadena vacía
        if (insumo.Stock === "" || insumo.Stock === null) {
            throw new Error("El stock debe ser un número entero válido, no puede estar vacío.");
        }
        
        if (isNaN(insumo.Stock) || insumo.Stock < 0 || !Number.isInteger(Number(insumo.Stock))) {
            throw new Error("El stock debe ser un número entero mayor o igual a 0.");
        }
    }

    // Construir la consulta de actualización dinámicamente
    let updateFields = [];
    let request = pool.request().input("insumoID", sql.Int, insumoID);

    if (insumo.Nombre) {
        updateFields.push("Nombre = @nombre");
        request.input("nombre", sql.VarChar(50), insumo.Nombre);
    }
    if (insumo.Stock !== undefined) {
        updateFields.push("Stock = @stock");
        request.input("stock", sql.Int, insumo.Stock);
        
        // Si el stock es 0, el estado se pone como Inactivo automáticamente
        if (insumo.Stock === 0) {
            updateFields.push("Estado = @estado");
            request.input("estado", sql.Bit, 0);
        }
    }
    if (insumo.Estado !== undefined && insumo.Stock !== 0) {
        // Solo actualizar estado manualmente si stock no es 0
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

    // / Verificar que el insumo existe
    const insumoExists = await pool.request()
        .input("insumoID", sql.Int, insumoID)
        .query("SELECT * FROM dbo.Insumos WHERE InsumoID = @insumoID");
    
    if (insumoExists.recordset.length === 0) {
        throw new Error('El insumo no existe');
    }

    // / Verificar si tiene pedidos asociados
    const hasPedidos = await pool.request()
        .input("insumoID", sql.Int, insumoID)
        .query("SELECT COUNT(*) as count FROM dbo.DetallePedido WHERE InsumoID = @insumoID");
    
    if (hasPedidos.recordset[0].count > 0) {
        throw new Error('No se puede eliminar el insumo porque tiene pedidos asociados');
    }

    const result = await pool.request()
        .input("insumoID", sql.Int, insumoID)
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

    // / Obtener stock actual
    const insumoActual = await pool.request()
        .input("insumoID", sql.Int, insumoID)
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
        .input("insumoID", sql.Int, insumoID)
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