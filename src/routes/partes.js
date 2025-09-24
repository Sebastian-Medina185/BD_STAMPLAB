// src/routes/partes.js
const express = require("express");
const router = express.Router();
const { getPartes, getParteById, createParte, updateParte, deleteParte } = require("../models/partes");

// =================== LISTAR ===================
router.get("/", async (req, res) => {
    try {
        const partes = await getPartes();
        res.json({
            estado: true,
            mensaje: "Partes obtenidas exitosamente",
            datos: partes,
            cantidad: partes.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en GET /partes:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de partes",
            error: err.message
        });
    }
});

router.get("/:parteID", async (req, res) => {
    try {
        const parteID = parseInt(req.params.parteID);
        const parte = await getParteById(parteID);

        if (!parte) {
            return res.status(404).json({
                estado: false,
                mensaje: `Parte con ID ${parteID} no encontrada`
            });
        }

        res.json({
            estado: true,
            mensaje: "Parte encontrada exitosamente",
            datos: parte,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en GET /partes/${req.params.parteID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de la parte",
            error: err.message
        });
    }
});

// =================== CREAR ===================
router.post("/", async (req, res) => {
    try {
        const { Nombre, Observaciones } = req.body;

        if (!Nombre) {
            return res.status(400).json({
                estado: false,
                mensaje: "Nombre es requerido",
                camposRequeridos: ["Nombre"]
            });
        }

        if (Nombre.length > 20) {
            return res.status(400).json({
                estado: false,
                mensaje: "Nombre máximo 20 caracteres"
            });
        }

        if (Observaciones && Observaciones.length > 80) {
            return res.status(400).json({
                estado: false,
                mensaje: "Observaciones máximo 80 caracteres"
            });
        }

        const nuevaParte = await createParte({ Nombre, Observaciones });

        res.status(201).json({
            estado: true,
            mensaje: "Parte creada exitosamente",
            datos: nuevaParte,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en POST /partes:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error al crear la parte",
            error: err.message
        });
    }
});

// =================== EDITAR ===================
router.put("/:parteID", async (req, res) => {
    try {
        const parteID = parseInt(req.params.parteID);
        const { Nombre, Observaciones } = req.body;

        if (!Nombre) {
            return res.status(400).json({
                estado: false,
                mensaje: "Nombre es requerido"
            });
        }

        const parteActualizada = await updateParte(parteID, { Nombre, Observaciones });

        res.json({
            estado: true,
            mensaje: "Parte actualizada exitosamente",
            datos: parteActualizada,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en PUT /partes/${req.params.parteID}:`, err.message);
        if (err.message.includes('no existe')) {
            return res.status(404).json({
                estado: false,
                mensaje: err.message
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar la parte",
            error: err.message
        });
    }
});

// =================== ELIMINAR ===================
router.delete("/:parteID", async (req, res) => {
    try {
        const parteID = parseInt(req.params.parteID);
        const resultado = await deleteParte(parteID);

        res.json({
            estado: true,
            mensaje: "Parte eliminada exitosamente",
            datosEliminados: resultado.parte,
            filasAfectadas: resultado.rowsAffected,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en DELETE /partes/${req.params.parteID}:`, err.message);
        if (err.message.includes('no existe') || err.message.includes('diseños asociados')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al eliminar la parte",
            error: err.message
        });
    }
});

module.exports = router;