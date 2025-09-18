// src/models/productos.js
const sql = require("mssql");

// Obtener todos los productos
async function getAllProductos() {
    const result = await sql.query`SELECT * FROM Productos`;
    return result.recordset;
}

// Obtener producto por ID
async function getProductoById(id) {
    const result = await sql.query`SELECT * FROM Productos WHERE ProductoID = ${id}`;
    return result.recordset[0];
}

// Crear un nuevo producto
async function createProducto(producto) {
    const { nombre, precio, stock, categoria } = producto;
    const result = await sql.query`
    INSERT INTO Productos (Nombre, Precio, Stock, Categoria)
    VALUES (${nombre}, ${precio}, ${stock}, ${categoria});
    SELECT SCOPE_IDENTITY() as id;
  `;
    return result.recordset[0];
}

// Actualizar un producto
async function updateProducto(id, producto) {
    const { nombre, precio, stock, categoria } = producto;
    await sql.query`
    UPDATE Productos
    SET Nombre = ${nombre}, Precio = ${precio}, Stock = ${stock}, Categoria = ${categoria}
    WHERE ProductoID = ${id}
  `;
}

// Eliminar un producto
async function deleteProducto(id) {
    await sql.query`DELETE FROM Productos WHERE ProductoID = ${id}`;
}

module.exports = {
    getAllProductos,
    getProductoById,
    createProducto,
    updateProducto,
    deleteProducto,
};
