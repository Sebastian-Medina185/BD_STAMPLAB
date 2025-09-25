// src/routes/productos.js
const express = require("express");
const router = express.Router();
const { getProductos, getProductoById, createProducto, updateProducto, deleteProducto } = require("../models/productos");

router.get("/", async (req, res) => {
    try {
        const productos = await getProductos();
        res.json({
            estado: true,
            mensaje: "Productos obtenidos exitosamente",
            datos: productos,
            cantidad: productos.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en GET /productos:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de productos",
            error: err.message
        });
    }
});

router.get("/:productoID", async (req, res) => {
    try {
        const productoID = parseInt(req.params.productoID);
        const producto = await getProductoById(productoID);

        if (!producto) {
            return res.status(404).json({
                estado: false,
                mensaje: `Producto con ID ${productoID} no encontrado`
            });
        }

        res.json({
            estado: true,
            mensaje: "Producto encontrado exitosamente",
            datos: producto,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en GET /productos/${req.params.productoID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta del producto",
            error: err.message
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { Nombre, Descripcion, TelaID } = req.body;

        if (!Nombre || !TelaID) {
            return res.status(400).json({
                estado: false,
                mensaje: "Nombre y TelaID son requeridos",
                camposRequeridos: ["Nombre", "TelaID"]
            });
        }

        const nuevoProducto = await createProducto({
            Nombre,
            Descripcion,
            TelaID
        });

        res.status(201).json({
            estado: true,
            mensaje: "Producto creado exitosamente",
            datos: nuevoProducto,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en POST /productos:", err.message);
        if (err.message.includes('No existe ninguna tela')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al crear el producto",
            error: err.message
        });
    }
});

router.put("/:productoID", async (req, res) => {
    try {
        const productoID = parseInt(req.params.productoID);
        const { Nombre, Descripcion, TelaID } = req.body;

        if (!Nombre || !TelaID) {
            return res.status(400).json({
                estado: false,
                mensaje: "Nombre y TelaID son requeridos"
            });
        }

        const productoActualizado = await updateProducto(productoID, { 
            Nombre, 
            Descripcion, 
            TelaID 
        });

        res.json({
            estado: true,
            mensaje: "Producto actualizado exitosamente",
            datos: productoActualizado,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en PUT /productos/${req.params.productoID}:`, err.message);
        if (err.message.includes('no existe')) {
            return res.status(404).json({
                estado: false,
                mensaje: err.message
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar el producto",
            error: err.message
        });
    }
});

router.delete("/:productoID", async (req, res) => {
    try {
        const productoID = parseInt(req.params.productoID);
        const resultado = await deleteProducto(productoID);

        res.json({
            estado: true,
            mensaje: "Producto eliminado exitosamente",
            datosEliminados: resultado.producto,
            filasAfectadas: resultado.rowsAffected,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en DELETE /productos/${req.params.productoID}:`, err.message);
        if (err.message.includes('no existe')) {
            return res.status(404).json({
                estado: false,
                mensaje: err.message
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al eliminar el producto",
            error: err.message
        });
    }
});

module.exports = router;