// src/routes/tallas.js
const express = require("express");
const router = express.Router();
const { getTallas, getTallaById, createTalla, updateTalla, deleteTalla } = require("../models/tallas");

// =================== LISTAR ===================
router.get("/", async (req, res) => {
    try {
        const tallas = await getTallas();
        res.json({
            estado: true,
            mensaje: "Tallas obtenidas exitosamente",
            datos: tallas,
            cantidad: tallas.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en GET /tallas:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de tallas",
            error: err.message
        });
    }
});

router.get("/:tallaID", async (req, res) => {
    try {
        const tallaID = parseInt(req.params.tallaID);
        const talla = await getTallaById(tallaID);

        if (!talla) {
            return res.status(404).json({
                estado: false,
                mensaje: `Talla con ID ${tallaID} no encontrada`
            });
        }

        res.json({
            estado: true,
            mensaje: "Talla encontrada exitosamente",
            datos: talla,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en GET /tallas/${req.params.tallaID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de la talla",
            error: err.message
        });
    }
});

// =================== CREAR ===================
router.post("/", async (req, res) => {
    try {
        const { Nombre } = req.body;

        if (!Nombre) {
            return res.status(400).json({
                estado: false,
                mensaje: "Nombre es requerido",
                camposRequeridos: ["Nombre"]
            });
        }

        if (Nombre.length > 4) {
            return res.status(400).json({
                estado: false,
                mensaje: "Nombre máximo 4 caracteres"
            });
        }

        const nuevaTalla = await createTalla({ Nombre });

        res.status(201).json({
            estado: true,
            mensaje: "Talla creada exitosamente",
            datos: nuevaTalla,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en POST /tallas:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error al crear la talla",
            error: err.message
        });
    }
});

// =================== EDITAR ===================
router.put("/:tallaID", async (req, res) => {
    try {
        const tallaID = parseInt(req.params.tallaID);
        const { Nombre } = req.body;

        if (!Nombre) {
            return res.status(400).json({
                estado: false,
                mensaje: "Nombre es requerido"
            });
        }

        const tallaActualizada = await updateTalla(tallaID, { Nombre });

        res.json({
            estado: true,
            mensaje: "Talla actualizada exitosamente",
            datos: tallaActualizada,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en PUT /tallas/${req.params.tallaID}:`, err.message);
        if (err.message.includes('no existe')) {
            return res.status(404).json({
                estado: false,
                mensaje: err.message
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar la talla",
            error: err.message
        });
    }
});

// =================== ELIMINAR ===================
router.delete("/:tallaID", async (req, res) => {
    try {
        const tallaID = parseInt(req.params.tallaID);
        const resultado = await deleteTalla(tallaID);

        res.json({
            estado: true,
            mensaje: "Talla eliminada exitosamente",
            datosEliminados: resultado.talla,
            filasAfectadas: resultado.rowsAffected
        });
    } catch (err) {
        console.error(`❌ Error en DELETE /tallas/${req.params.tallaID}:`, err.message);
        if (err.message.includes('no existe') || err.message.includes('productos variantes')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al eliminar la talla",
            error: err.message
        });
    }
});

module.exports = router;