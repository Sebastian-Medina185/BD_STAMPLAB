const { poolPromise, sql } = require("../db");

// 📌 Crear producto
async function createProducto({ Nombre, Descripcion, TelaID }) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    const result = await pool.request()
        .input("Nombre", sql.VarChar(50), Nombre)
        .input("Descripcion", sql.VarChar(200), Descripcion)
        .input("TelaID", sql.Int, TelaID)
        .query(`
            INSERT INTO dbo.Productos (Nombre, Descripcion, TelaID)
            VALUES (@Nombre, @Descripcion, @TelaID);
            SELECT SCOPE_IDENTITY() AS ProductoID;
        `);

    return result.recordset[0];
}

// 📌 Obtener todos los productos
async function getProductos() {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    const result = await pool.request().query(`
        SELECT p.ProductoID, p.Nombre, p.Descripcion, t.Nombre AS Tela
        FROM dbo.Productos p
        INNER JOIN dbo.Telas t ON p.TelaID = t.TelaID
    `);

    return result.recordset;
}

// 📌 Obtener producto por ID
async function getProductoById(productoID) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    const result = await pool.request()
        .input("productoID", sql.Int, productoID)
        .query(`
            SELECT ProductoID, Nombre, Descripcion, TelaID
            FROM dbo.Productos WHERE ProductoID = @productoID
        `);

    return result.recordset[0];
}

// 📌 NUEVO: Obtener producto con variantes asociadas (maestro-detalle)
async function getProductoConVariantes(productoID) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    const producto = await getProductoById(productoID);
    if (!producto) return null;

    const variantes = await pool.request()
        .input("productoID", sql.Int, productoID)
        .query(`
            SELECT pv.VarianteID, pv.ProductoID, c.Nombre AS Color, t.Nombre AS Talla, 
                   pv.Stock, pv.Imagen, pv.Precio, pv.Estado
            FROM dbo.ProductosVariantes pv
            INNER JOIN dbo.Colores c ON pv.ColorID = c.ColorID
            INNER JOIN dbo.Tallas t ON pv.TallaID = t.TallaID
            WHERE pv.ProductoID = @productoID
        `);

    return { ...producto, Variantes: variantes.recordset };
}

// 📌 Actualizar producto
async function updateProducto(productoID, { Nombre, Descripcion, TelaID }) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    await pool.request()
        .input("productoID", sql.Int, productoID)
        .input("Nombre", sql.VarChar(50), Nombre)
        .input("Descripcion", sql.VarChar(200), Descripcion)
        .input("TelaID", sql.Int, TelaID)
        .query(`
            UPDATE dbo.Productos
            SET Nombre = @Nombre, Descripcion = @Descripcion, TelaID = @TelaID
            WHERE ProductoID = @productoID
        `);
}

// 📌 Eliminar producto
async function deleteProducto(productoID) {
    const pool = await poolPromise;
    if (!pool) throw new Error("No hay conexión disponible a la base de datos");

    await pool.request()
        .input("productoID", sql.Int, productoID)
        .query(`DELETE FROM dbo.Productos WHERE ProductoID = @productoID`);
}

module.exports = {
    createProducto,
    getProductos,
    getProductoById,
    getProductoConVariantes, // 👈 nuevo
    updateProducto,
    deleteProducto
};
