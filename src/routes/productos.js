const express = require("express");
const router = express.Router();

// Importamos funciones del modelo de productos
const {
  createProducto,
  getProductos,
  getProductoById,
  getProductoConVariantes,
  updateProducto,
  deleteProducto,
} = require("../models/productos");

/**
 * POST /api/productos
 * Crear un nuevo producto
 */
router.post("/", async (req, res) => {
  try {
    const { Nombre, Descripcion, TelaID } = req.body;

    if (!Nombre || !Descripcion || !TelaID) {
      return res.status(400).json({
        estado: false,
        mensaje: "Todos los campos son obligatorios",
      });
    }

    const nuevoProducto = await createProducto({ Nombre, Descripcion, TelaID });
    res.status(201).json({
      estado: true,
      mensaje: "Producto creado correctamente",
      datos: nuevoProducto,
    });
  } catch (error) {
    res.status(500).json({
      estado: false,
      mensaje: "Error al crear el producto",
      error: error.message,
    });
  }
});

/**
 * GET /api/productos
 * Obtener todos los productos
 */
router.get("/", async (req, res) => {
  try {
    const productos = await getProductos();
    res.json({
      estado: true,
      mensaje: "Lista de productos obtenida correctamente",
      datos: productos,
    });
  } catch (error) {
    res.status(500).json({
      estado: false,
      mensaje: "Error al obtener los productos",
      error: error.message,
    });
  }
});

/**
 * GET /api/productos/:productoID
 * Obtener un producto por su ID
 */
router.get("/:productoID", async (req, res) => {
  try {
    const productoID = parseInt(req.params.productoID);

    const producto = await getProductoById(productoID);
    if (!producto) {
      return res.status(404).json({
        estado: false,
        mensaje: "Producto no encontrado",
      });
    }

    res.json({
      estado: true,
      mensaje: "Producto obtenido correctamente",
      datos: producto,
    });
  } catch (error) {
    res.status(500).json({
      estado: false,
      mensaje: "Error al obtener el producto",
      error: error.message,
    });
  }
});

/**
 * GET /api/productos/:productoID/detalle
 * Obtener un producto con sus variantes (maestro-detalle)
 */
router.get("/:productoID/detalle", async (req, res) => {
  try {
    const productoID = parseInt(req.params.productoID);

    const producto = await getProductoConVariantes(productoID);
    if (!producto) {
      return res.status(404).json({
        estado: false,
        mensaje: "Producto no encontrado",
      });
    }

    res.json({
      estado: true,
      mensaje: "Producto con variantes obtenido correctamente",
      datos: producto,
    });
  } catch (error) {
    res.status(500).json({
      estado: false,
      mensaje: "Error al obtener el detalle del producto",
      error: error.message,
    });
  }
});

/**
 * PUT /api/productos/:productoID
 * Actualizar un producto existente
 */
router.put("/:productoID", async (req, res) => {
  try {
    const productoID = parseInt(req.params.productoID);
    const { Nombre, Descripcion, TelaID } = req.body;

    if (!Nombre || !Descripcion || !TelaID) {
      return res.status(400).json({
        estado: false,
        mensaje: "Todos los campos son obligatorios",
      });
    }

    await updateProducto(productoID, { Nombre, Descripcion, TelaID });

    res.json({
      estado: true,
      mensaje: "Producto actualizado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      estado: false,
      mensaje: "Error al actualizar el producto",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/productos/:productoID
 * Eliminar un producto
 */
router.delete("/:productoID", async (req, res) => {
  try {
    const productoID = parseInt(req.params.productoID);

    await deleteProducto(productoID);

    res.json({
      estado: true,
      mensaje: "Producto eliminado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      estado: false,
      mensaje: "Error al eliminar el producto",
      error: error.message,
    });
  }
});

module.exports = router;
