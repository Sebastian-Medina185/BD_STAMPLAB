// models/cotizaciones.js
const { sql, poolPromise } = require("../../db");

async function getCotizaciones() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request().query(`
        SELECT CotizacionID, DocumentoID, FechaCotizacion, ValorTotal, Estado 
        FROM dbo.Cotizaciones 
        ORDER BY CotizacionID
    `);
    return result.recordset;
}

async function getCotizacionById(cotizacionID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');
    
    const result = await pool.request()
        .input("cotizacionID", sql.Int, cotizacionID)
        .query("SELECT CotizacionID, DocumentoID, FechaCotizacion, ValorTotal, Estado FROM dbo.Cotizaciones WHERE CotizacionID = @cotizacionID");
    
    return result.recordset[0];
}

async function createCotizacion(cotizacion) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request()
        .input("documentoID", sql.VarChar(15), cotizacion.DocumentoID)
        .input("fechaCotizacion", sql.Date, cotizacion.FechaCotizacion || new Date())
        .input("valorTotal", sql.Decimal(10, 2), cotizacion.ValorTotal)
        .input("estado", sql.VarChar(30), cotizacion.Estado || 'Pendiente')
        .query(`
            INSERT INTO dbo.Cotizaciones (DocumentoID, FechaCotizacion, ValorTotal, Estado)
            VALUES (@documentoID, @fechaCotizacion, @valorTotal, @estado);
            SELECT * FROM dbo.Cotizaciones WHERE CotizacionID = SCOPE_IDENTITY();
        `);
    
    return result.recordset[0];
}

async function updateCotizacion(cotizacionID, cotizacion) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const exists = await pool.request()
        .input("cotizacionID", sql.Int, cotizacionID)
        .query("SELECT COUNT(*) as count FROM dbo.Cotizaciones WHERE CotizacionID = @cotizacionID");
    
    if (exists.recordset[0].count === 0) {
        throw new Error('La cotización no existe');
    }

    const result = await pool.request()
        .input("cotizacionID", sql.Int, cotizacionID)
        .input("documentoID", sql.VarChar(15), cotizacion.DocumentoID)
        .input("fechaCotizacion", sql.Date, cotizacion.FechaCotizacion)
        .input("valorTotal", sql.Decimal(10, 2), cotizacion.ValorTotal)
        .input("estado", sql.VarChar(30), cotizacion.Estado)
        .query(`
            UPDATE dbo.Cotizaciones 
            SET DocumentoID = @documentoID, 
                FechaCotizacion = @fechaCotizacion, 
                ValorTotal = @valorTotal,
                Estado = @estado
            WHERE CotizacionID = @cotizacionID;
            SELECT * FROM dbo.Cotizaciones WHERE CotizacionID = @cotizacionID;
        `);
    
    return result.recordset[0];
}

async function deleteCotizacion(cotizacionID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const exists = await pool.request()
        .input("cotizacionID", sql.Int, cotizacionID)
        .query("SELECT * FROM dbo.Cotizaciones WHERE CotizacionID = @cotizacionID");
    
    if (exists.recordset.length === 0) {
        throw new Error('La cotización no existe');
    }

    const result = await pool.request()
        .input("cotizacionID", sql.Int, cotizacionID)
        .query("DELETE FROM dbo.Cotizaciones WHERE CotizacionID = @cotizacionID");
    
    return { 
        deleted: true, 
        cotizacion: exists.recordset[0],
        rowsAffected: result.rowsAffected[0] 
    };
}

module.exports = { 
    getCotizaciones,
    getCotizacionById,
    createCotizacion,
    updateCotizacion,
    deleteCotizacion
};