// models/productosVariantes.js
const { sql, poolPromise } = require("../../db");

async function getProductosVariantes() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request().query(`
        SELECT 
            pv.VarianteID,
            p.Nombre as Producto,
            c.Nombre as Color,
            t.Nombre as Talla,
            pv.Stock,
            pv.Imagen,
            pv.Precio,
            CASE pv.Estado 
                WHEN 1 THEN 'Disponible'
                ELSE 'No disponible'
            END as Estado
        FROM dbo.ProductosVariantes pv
        INNER JOIN dbo.Productos p ON pv.ProductoID = p.ProductoID
        INNER JOIN dbo.Colores c ON pv.ColorID = c.ColorID
        INNER JOIN dbo.Tallas t ON pv.TallaID = t.TallaID
        ORDER BY pv.VarianteID
    `);
    return result.recordset;
}

async function getProductoVarianteById(id) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            SELECT 
                pv.VarianteID,
                p.Nombre as Producto,
                c.Nombre as Color,
                t.Nombre as Talla,
                pv.Stock,
                pv.Imagen,
                pv.Precio,
                CASE pv.Estado 
                    WHEN 1 THEN 'Disponible'
                    ELSE 'No disponible'
                END as Estado
            FROM dbo.ProductosVariantes pv
            INNER JOIN dbo.Productos p ON pv.ProductoID = p.ProductoID
            INNER JOIN dbo.Colores c ON pv.ColorID = c.ColorID
            INNER JOIN dbo.Tallas t ON pv.TallaID = t.TallaID
            WHERE pv.VarianteID = @id
        `);
    
    return result.recordset[0];
}

async function createProductoVariante(variante) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar si existe el producto
    const productoExists = await pool.request()
        .input("productoID", sql.Int, variante.ProductoID)
        .query("SELECT COUNT(*) as count FROM dbo.Productos WHERE ProductoID = @productoID");

    if (productoExists.recordset[0].count === 0) {
        throw new Error(`No existe ningún producto con el ID ${variante.ProductoID}`);
    }

    // Verificar si existe el color
    const colorExists = await pool.request()
        .input("colorID", sql.Int, variante.ColorID)
        .query("SELECT COUNT(*) as count FROM dbo.Colores WHERE ColorID = @colorID");

    if (colorExists.recordset[0].count === 0) {
        throw new Error(`No existe ningún color con el ID ${variante.ColorID}`);
    }

    // Verificar si existe la talla
    const tallaExists = await pool.request()
        .input("tallaID", sql.Int, variante.TallaID)
        .query("SELECT COUNT(*) as count FROM dbo.Tallas WHERE TallaID = @tallaID");

    if (tallaExists.recordset[0].count === 0) {
        throw new Error(`No existe ninguna talla con el ID ${variante.TallaID}`);
    }

    const result = await pool.request()
        .input("productoID", sql.Int, variante.ProductoID)
        .input("colorID", sql.Int, variante.ColorID)
        .input("tallaID", sql.Int, variante.TallaID)
        .input("stock", sql.Int, variante.Stock)
        .input("imagen", sql.VarChar(255), variante.Imagen)
        .input("precio", sql.Decimal(10,2), variante.Precio)
        .input("estado", sql.Bit, variante.Estado)
        .query(`
            INSERT INTO dbo.ProductosVariantes 
            (ProductoID, ColorID, TallaID, Stock, Imagen, Precio, Estado)
            VALUES 
            (@productoID, @colorID, @tallaID, @stock, @imagen, @precio, @estado);
            
            SELECT 
                pv.VarianteID,
                p.Nombre as Producto,
                c.Nombre as Color,
                t.Nombre as Talla,
                pv.Stock,
                pv.Imagen,
                pv.Precio,
                CASE pv.Estado 
                    WHEN 1 THEN 'Disponible'
                    ELSE 'No disponible'
                END as Estado
            FROM dbo.ProductosVariantes pv
            INNER JOIN dbo.Productos p ON pv.ProductoID = p.ProductoID
            INNER JOIN dbo.Colores c ON pv.ColorID = c.ColorID
            INNER JOIN dbo.Tallas t ON pv.TallaID = t.TallaID
            WHERE pv.VarianteID = SCOPE_IDENTITY();
        `);

    return result.recordset[0];
}

async function updateProductoVariante(id, variante) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const exists = await pool.request()
        .input("id", sql.Int, id)
        .query("SELECT COUNT(*) as count FROM dbo.ProductosVariantes WHERE VarianteID = @id");

    if (exists.recordset[0].count === 0) {
        throw new Error('La variante no existe');
    }

    const result = await pool.request()
        .input("id", sql.Int, id)
        .input("productoID", sql.Int, variante.ProductoID)
        .input("colorID", sql.Int, variante.ColorID)
        .input("tallaID", sql.Int, variante.TallaID)
        .input("stock", sql.Int, variante.Stock)
        .input("imagen", sql.VarChar(255), variante.Imagen)
        .input("precio", sql.Decimal(10,2), variante.Precio)
        .input("estado", sql.Bit, variante.Estado)
        .query(`
            UPDATE dbo.ProductosVariantes 
            SET ProductoID = @productoID,
                ColorID = @colorID,
                TallaID = @tallaID,
                Stock = @stock,
                Imagen = @imagen,
                Precio = @precio,
                Estado = @estado
            WHERE VarianteID = @id;
            
            SELECT 
                pv.VarianteID,
                p.Nombre as Producto,
                c.Nombre as Color,
                t.Nombre as Talla,
                pv.Stock,
                pv.Imagen,
                pv.Precio,
                CASE pv.Estado 
                    WHEN 1 THEN 'Disponible'
                    ELSE 'No disponible'
                END as Estado
            FROM dbo.ProductosVariantes pv
            INNER JOIN dbo.Productos p ON pv.ProductoID = p.ProductoID
            INNER JOIN dbo.Colores c ON pv.ColorID = c.ColorID
            INNER JOIN dbo.Tallas t ON pv.TallaID = t.TallaID
            WHERE pv.VarianteID = @id;
        `);

    return result.recordset[0];
}

async function deleteProductoVariante(id) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const exists = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            SELECT 
                pv.VarianteID,
                p.Nombre as Producto,
                c.Nombre as Color,
                t.Nombre as Talla,
                pv.Stock,
                pv.Imagen,
                pv.Precio,
                CASE pv.Estado 
                    WHEN 1 THEN 'Disponible'
                    ELSE 'No disponible'
                END as Estado
            FROM dbo.ProductosVariantes pv
            INNER JOIN dbo.Productos p ON pv.ProductoID = p.ProductoID
            INNER JOIN dbo.Colores c ON pv.ColorID = c.ColorID
            INNER JOIN dbo.Tallas t ON pv.TallaID = t.TallaID
            WHERE pv.VarianteID = @id
        `);

    if (exists.recordset.length === 0) {
        throw new Error('La variante no existe');
    }

    const result = await pool.request()
        .input("id", sql.Int, id)
        .query("DELETE FROM dbo.ProductosVariantes WHERE VarianteID = @id");

    return {
        deleted: true,
        variante: exists.recordset[0],
        rowsAffected: result.rowsAffected[0]
    };
}

module.exports = { 
    getProductosVariantes, 
    getProductoVarianteById,
    createProductoVariante,
    updateProductoVariante,
    deleteProductoVariante
};