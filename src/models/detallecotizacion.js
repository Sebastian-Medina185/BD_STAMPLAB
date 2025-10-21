const { sql, poolPromise } = require("../db");

async function getDetalleCotizacion() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request().query(`
        SELECT 
            dc.DetalleID,
            dc.CotizacionID,
            dc.VarianteID,
            dc.Cantidad,
            dc.TraePrenda,
            dc.PrendaDescripcion
        FROM dbo.DetalleCotizacion dc
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
            SELECT DetalleID, CotizacionID, VarianteID, Cantidad, TraePrenda, PrendaDescripcion
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

    // Verificar si existe la variante
    if (detalle.VarianteID) {
        const varianteExists = await pool.request()
            .input("varianteID", sql.Int, detalle.VarianteID)
            .query("SELECT COUNT(*) as count FROM dbo.ProductosVariantes WHERE VarianteID = @varianteID");

        if (varianteExists.recordset[0].count === 0) {
            throw new Error(`No existe ninguna variante con el ID ${detalle.VarianteID}`);
        }
    }

    const result = await pool.request()
        .input("cotizacionID", sql.Int, detalle.CotizacionID)
        .input("varianteID", sql.Int, detalle.VarianteID)
        .input("cantidad", sql.Int, detalle.Cantidad)
        .input("prendaDescripcion", sql.VarChar(255), detalle.PrendaDescripcion)
        .input("traePrenda", sql.Bit, detalle.TraePrenda)
        .query(`
            INSERT INTO dbo.DetalleCotizacion (
                CotizacionID, VarianteID, Cantidad, PrendaDescripcion, TraePrenda
            )
            VALUES (
                @cotizacionID, @varianteID, @cantidad, @prendaDescripcion, @traePrenda
            );
            SELECT * FROM dbo.DetalleCotizacion WHERE DetalleID = SCOPE_IDENTITY();
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

    const result = await pool.request()
        .input("detalleID", sql.Int, detalleID)
        .input("cotizacionID", sql.Int, detalle.CotizacionID)
        .input("varianteID", sql.Int, detalle.VarianteID)
        .input("cantidad", sql.Int, detalle.Cantidad)
        .input("prendaDescripcion", sql.VarChar(255), detalle.PrendaDescripcion)
        .input("traePrenda", sql.Bit, detalle.TraePrenda)
        .query(`
            UPDATE dbo.DetalleCotizacion 
            SET CotizacionID = @cotizacionID,
                VarianteID = @varianteID,
                Cantidad = @cantidad,
                PrendaDescripcion = @prendaDescripcion,
                TraePrenda = @traePrenda
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