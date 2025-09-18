// src/routes/productos.js
const express = require("express");
const router = express.Router();

// GET todos los productos
router.get("/", (req, res) => {
    try {
        const productosPrueba = [
            { id: 1, nombre: "Camiseta Básica", precio: 25000, categoria: "Ropa" },
            { id: 2, nombre: "Hoodie Personalizada", precio: 45000, categoria: "Ropa" },
            { id: 3, nombre: "Taza Sublimada", precio: 15000, categoria: "Accesorios" }
        ];

        res.json({
            estado: true,
            mensaje: "Productos obtenidos exitosamente (datos de prueba)",
            datos: productosPrueba,
            cantidad: productosPrueba.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en GET /productos:", err);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de productos",
            error: err.message
        });
    }
});

// GET producto por ID
router.get("/:id", (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                estado: false,
                mensaje: "ID inválido. Debe ser un número positivo",
                idRecibido: req.params.id
            });
        }

        const productosPrueba = [
            { id: 1, nombre: "Camiseta Básica", precio: 25000, categoria: "Ropa" },
            { id: 2, nombre: "Hoodie Personalizada", precio: 45000, categoria: "Ropa" },
            { id: 3, nombre: "Taza Sublimada", precio: 15000, categoria: "Accesorios" }
        ];

        const producto = productosPrueba.find(p => p.id === id);
        
        if (!producto) {
            return res.status(404).json({
                estado: false,
                mensaje: `Producto con ID ${id} no encontrado`,
                sugerencia: "Usa IDs 1, 2 o 3 para datos de prueba"
            });
        }

        res.json({
            estado: true,
            mensaje: "Producto encontrado exitosamente",
            datos: producto,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en GET /productos/${req.params.id}:`, err);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta del producto",
            error: err.message
        });
    }
});

module.exports = router;