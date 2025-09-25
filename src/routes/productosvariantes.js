// routes/productosVariantes.js
const express = require("express");
const router = express.Router();
const { 
    getProductosVariantes, 
    getProductoVarianteById,
    createProductoVariante,
    updateProductoVariante,
    deleteProductoVariante 
} = require("../models/productosvariantes");

router.get("/", async (req, res) => {
    try {
        const variantes = await getProductosVariantes();
        res.json({
            estado: true,
            mensaje: "Variantes obtenidas exitosamente",
            datos: variantes,
            cantidad: variantes.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en GET /productosVariantes:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de variantes",
            error: err.message
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const variante = await getProductoVarianteById(id);
        
        if (!variante) {
            return res.status(404).json({
                estado: false,
                mensaje: `Variante con ID ${id} no encontrada`
            });
        }

        res.json({
            estado: true,
            mensaje: "Variante encontrada exitosamente",
            datos: variante,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en GET /productosVariantes/${req.params.id}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de la variante",
            error: err.message
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { ProductoID, ColorID, TallaID, Stock, Imagen, Precio, Estado } = req.body;

        if (!ProductoID || !ColorID || !TallaID || Stock === undefined || !Precio) {
            return res.status(400).json({
                estado: false,
                mensaje: "Faltan campos requeridos",
                camposRequeridos: ["ProductoID", "ColorID", "TallaID", "Stock", "Precio"]
            });
        }

        const nuevaVariante = await createProductoVariante({
            ProductoID,
            ColorID,
            TallaID,
            Stock,
            Imagen,
            Precio,
            Estado: Estado !== undefined ? Estado : true
        });

        res.status(201).json({
            estado: true,
            mensaje: "Variante creada exitosamente",
            datos: nuevaVariante,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en POST /productosVariantes:", err.message);
        if (err.message.includes('No existe')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al crear la variante",
            error: err.message
        });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { ProductoID, ColorID, TallaID, Stock, Imagen, Precio, Estado } = req.body;

        if (!ProductoID || !ColorID || !TallaID || Stock === undefined || !Precio) {
            return res.status(400).json({
                estado: false,
                mensaje: "Todos los campos son requeridos"
            });
        }

        const varianteActualizada = await updateProductoVariante(id, {
            ProductoID,
            ColorID,
            TallaID,
            Stock,
            Imagen,
            Precio,
            Estado
        });

        res.json({
            estado: true,
            mensaje: "Variante actualizada exitosamente",
            datos: varianteActualizada,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en PUT /productosVariantes/${req.params.id}:`, err.message);
        if (err.message.includes('no existe')) {
            return res.status(404).json({
                estado: false,
                mensaje: err.message
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar la variante",
            error: err.message
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const resultado = await deleteProductoVariante(id);

        res.json({
            estado: true,
            mensaje: "Variante eliminada exitosamente",
            datosEliminados: resultado.variante,
            filasAfectadas: resultado.rowsAffected,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en DELETE /productosVariantes/${req.params.id}:`, err.message);
        if (err.message.includes('no existe')) {
            return res.status(404).json({
                estado: false,
                mensaje: err.message
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al eliminar la variante",
            error: err.message
        });
    }
});

module.exports = router;