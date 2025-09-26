// models/detalleCotizacion.js
const { sql, poolPromise } = require("../../db");

async function getDetalleCotizacion() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request().query(`
        SELECT 
            dc.DetalleID,
            c.CotizacionID,
            p.Nombre as Producto,
            t.Nombre as Talla,
            col.Nombre as Color,
            tec.Nombre as Tecnica,
            dc.Cantidad,
            dc.PrendaDescripcion,
            CASE dc.TraePrenda 
                WHEN 1 THEN 'Sí'
                ELSE 'No'
            END as TraePrenda
        FROM dbo.DetalleCotizacion dc
        INNER JOIN dbo.Cotizaciones c ON dc.CotizacionID = c.CotizacionID
        INNER JOIN dbo.Productos p ON dc.ProductoID = p.ProductoID
        LEFT JOIN dbo.Tallas t ON dc.TallaID = t.TallaID
        LEFT JOIN dbo.Colores col ON dc.ColorID = col.ColorID
        LEFT JOIN dbo.Tecnicas tec ON dc.TecnicaID = tec.TecnicaID
        ORDER BY dc.DetalleID
    `);
    return result.recordset;
}

async function getDetalleCotizacionById(detalleID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request()
        .input("detalleID", sql.Int, detalleID)
        .query(`
            SELECT DetalleID, CotizacionID, ProductoID, TallaID, ColorID, TecnicaID, 
                   Cantidad, PrecioUnitario, Subtotal 
            FROM dbo.DetalleCotizacion 
            WHERE DetalleID = @detalleID
        `);
    
    return result.recordset[0];
}

async function createDetalleCotizacion(detalle) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar si existe la cotización
    const cotizacionExists = await pool.request()
        .input("cotizacionID", sql.Int, detalle.CotizacionID)
        .query("SELECT COUNT(*) as count FROM dbo.Cotizaciones WHERE CotizacionID = @cotizacionID");

    if (cotizacionExists.recordset[0].count === 0) {
        throw new Error(`No existe ninguna cotización con el ID ${detalle.CotizacionID}`);
    }

    // Verificar si existe el producto
    const productoExists = await pool.request()
        .input("productoID", sql.Int, detalle.ProductoID)
        .query("SELECT COUNT(*) as count FROM dbo.Productos WHERE ProductoID = @productoID");

    if (productoExists.recordset[0].count === 0) {
        throw new Error(`No existe ningún producto con el ID ${detalle.ProductoID}`);
    }

    const result = await pool.request()
        .input("cotizacionID", sql.Int, detalle.CotizacionID)
        .input("productoID", sql.Int, detalle.ProductoID)
        .input("tallaID", sql.Int, detalle.TallaID)
        .input("colorID", sql.Int, detalle.ColorID)
        .input("tecnicaID", sql.Int, detalle.TecnicaID)
        .input("cantidad", sql.Int, detalle.Cantidad)
        .input("prendaDescripcion", sql.VarChar(255), detalle.PrendaDescripcion)
        .input("traePrenda", sql.Bit, detalle.TraePrenda)
        .query(`
            INSERT INTO dbo.DetalleCotizacion (
                CotizacionID, ProductoID, TallaID, ColorID, TecnicaID, 
                Cantidad, PrendaDescripcion, TraePrenda
            )
            VALUES (
                @cotizacionID, @productoID, @tallaID, @colorID, @tecnicaID, 
                @cantidad, @prendaDescripcion, @traePrenda
            );
            
            SELECT 
                dc.DetalleID,
                c.CotizacionID,
                p.Nombre as Producto,
                t.Nombre as Talla,
                col.Nombre as Color,
                tec.Nombre as Tecnica,
                dc.Cantidad,
                dc.PrePreferida,
                CASE dc.TraePrenda 
                    WHEN 1 THEN 'Sí'
                    ELSE 'No'
                END as TraePrenda
            FROM dbo.DetalleCotizacion dc
            INNER JOIN dbo.Cotizaciones c ON dc.CotizacionID = c.CotizacionID
            INNER JOIN dbo.Productos p ON dc.ProductoID = p.ProductoID
            LEFT JOIN dbo.Tallas t ON dc.TallaID = t.TallaID
            LEFT JOIN dbo.Colores col ON dc.ColorID = col.ColorID
            LEFT JOIN dbo.Tecnicas tec ON dc.TecnicaID = tec.TecnicaID
            WHERE dc.DetalleID = SCOPE_IDENTITY();
        `);
    
    return result.recordset[0];
}

async function updateDetalleCotizacion(detalleID, detalle) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const exists = await pool.request()
        .input("detalleID", sql.Int, detalleID)
        .query("SELECT COUNT(*) as count FROM dbo.DetalleCotizacion WHERE DetalleID = @detalleID");
    
    if (exists.recordset[0].count === 0) {
        throw new Error('El detalle de cotización no existe');
    }

    // Verificar si existe la cotización
    if (detalle.CotizacionID) {
        const cotizacionExists = await pool.request()
            .input("cotizacionID", sql.Int, detalle.CotizacionID)
            .query("SELECT COUNT(*) as count FROM dbo.Cotizaciones WHERE CotizacionID = @cotizacionID");

        if (cotizacionExists.recordset[0].count === 0) {
            throw new Error(`No existe ninguna cotización con el ID ${detalle.CotizacionID}`);
        }
    }

    // Verificar si existe el producto
    if (detalle.ProductoID) {
        const productoExists = await pool.request()
            .input("productoID", sql.Int, detalle.ProductoID)
            .query("SELECT COUNT(*) as count FROM dbo.Productos WHERE ProductoID = @productoID");

        if (productoExists.recordset[0].count === 0) {
            throw new Error(`No existe ningún producto con el ID ${detalle.ProductoID}`);
        }
    }

    const result = await pool.request()
        .input("detalleID", sql.Int, detalleID)
        .input("cotizacionID", sql.Int, detalle.CotizacionID)
        .input("productoID", sql.Int, detalle.ProductoID)
        .input("tallaID", sql.Int, detalle.TallaID)
        .input("colorID", sql.Int, detalle.ColorID)
        .input("tecnicaID", sql.Int, detalle.TecnicaID)
        .input("cantidad", sql.Int, detalle.Cantidad)
        .input("precioUnitario", sql.Decimal(10, 2), detalle.PrecioUnitario)
        .input("subtotal", sql.Decimal(10, 2), detalle.PrecioUnitario * detalle.Cantidad)
        .query(`
            UPDATE dbo.DetalleCotizacion 
            SET CotizacionID = @cotizacionID,
                ProductoID = @productoID,
                TallaID = @tallaID,
                ColorID = @colorID,
                TecnicaID = @tecnicaID,
                Cantidad = @cantidad,
                PrecioUnitario = @precioUnitario,
                Subtotal = @subtotal
            WHERE DetalleID = @detalleID;
            SELECT * FROM dbo.DetalleCotizacion WHERE DetalleID = @detalleID;
        `);
    
    return result.recordset[0];
}

async function deleteDetalleCotizacion(detalleID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const exists = await pool.request()
        .input("detalleID", sql.Int, detalleID)
        .query("SELECT * FROM dbo.DetalleCotizacion WHERE DetalleID = @detalleID");
    
    if (exists.recordset.length === 0) {
        throw new Error('El detalle de cotización no existe');
    }

    const result = await pool.request()
        .input("detalleID", sql.Int, detalleID)
        .query("DELETE FROM dbo.DetalleCotizacion WHERE DetalleID = @detalleID");
    
    return { 
        deleted: true, 
        detalleCotizacion: exists.recordset[0],
        rowsAffected: result.rowsAffected[0] 
    };
}

module.exports = { 
    getDetalleCotizacion,
    getDetalleCotizacionById,
    createDetalleCotizacion,
    updateDetalleCotizacion,
    deleteDetalleCotizacion
};