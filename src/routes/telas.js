// src/routes/telas.js
const express = require("express");
const router = express.Router();
const { getTelas, getTelaById, createTela, updateTela, deleteTela } = require("../models/telas");

// =================== LISTAR ===================
router.get("/", async (req, res) => {
    try {
        const telas = await getTelas();
        res.json({
            estado: true,
            mensaje: "Telas obtenidas exitosamente",
            datos: telas,
            cantidad: telas.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("Error en GET /telas:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de telas",
            error: err.message
        });
    }
});

router.get("/:telaID", async (req, res) => {
    try {
        const telaID = parseInt(req.params.telaID);
        
        if (isNaN(telaID)) {
            return res.status(400).json({
                estado: false,
                mensaje: "El ID de la tela debe ser un número válido"
            });
        }

        const tela = await getTelaById(telaID);

        if (!tela) {
            return res.status(404).json({
                estado: false,
                mensaje: `Tela con ID ${telaID} no encontrada`
            });
        }

        res.json({
            estado: true,
            mensaje: "Tela encontrada exitosamente",
            datos: tela,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`Error en GET /telas/${req.params.telaID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de la tela",
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

        if (Nombre.length > 40) {
            return res.status(400).json({
                estado: false,
                mensaje: "Nombre máximo 40 caracteres"
            });
        }

        const nuevaTela = await createTela({ Nombre });

        res.status(201).json({
            estado: true,
            mensaje: "Tela creada exitosamente",
            datos: nuevaTela,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error("Error en POST /telas:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error al crear la tela",
            error: err.message
        });
    }
});

// =================== EDITAR ===================
router.put("/:telaID", async (req, res) => {
    try {
        const telaID = parseInt(req.params.telaID);
        const { Nombre } = req.body;

        if (isNaN(telaID)) {
            return res.status(400).json({
                estado: false,
                mensaje: "El ID de la tela debe ser un número válido"
            });
        }

        if (!Nombre) {
            return res.status(400).json({
                estado: false,
                mensaje: "Nombre es requerido"
            });
        }

        if (Nombre.length > 40) {
            return res.status(400).json({
                estado: false,
                mensaje: "Nombre máximo 40 caracteres"
            });
        }

        const telaActualizada = await updateTela(telaID, { Nombre });

        res.json({
            estado: true,
            mensaje: "Tela actualizada exitosamente",
            datos: telaActualizada,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error(`Error en PUT /telas/${req.params.telaID}:`, err.message);
        if (err.message.includes('no existe')) {
            return res.status(404).json({
                estado: false,
                mensaje: err.message
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar la tela",
            error: err.message
        });
    }
});

// =================== ELIMINAR ===================
router.delete("/:telaID", async (req, res) => {
    try {
        const telaID = parseInt(req.params.telaID);

        if (isNaN(telaID)) {
            return res.status(400).json({
                estado: false,
                mensaje: "El ID de la tela debe ser un número válido"
            });
        }

        const resultado = await deleteTela(telaID);

        res.json({
            estado: true,
            mensaje: "Tela eliminada exitosamente",
            datosEliminados: resultado.tela,
            filasAfectadas: resultado.rowsAffected,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error(`Error en DELETE /telas/${req.params.telaID}:`, err.message);
        if (err.message.includes('no existe') || err.message.includes('productos asociados')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al eliminar la tela",
            error: err.message
        });
    }
});

module.exports = router;