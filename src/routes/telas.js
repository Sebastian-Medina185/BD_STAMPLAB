const express = require("express");
const router = express.Router();
const { getTelas, getTelaById, createTela, updateTela, deleteTela } = require("../models/telas.js");

// =================== LISTAR ===================
router.get("/", async (req, res) => {
    try {
        const telas = await getTelas();
        res.json({
            estado: true,
            mensaje: "Telas obtenidas exitosamente",
            datos: telas,
            cantidad: telas.length,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error("Error en GET /telas:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de telas",
            error: err.message,
        });
    }
});

// =================== OBTENER POR ID ===================
router.get("/:telaID", async (req, res) => {
    try {
        const telaID = parseInt(req.params.telaID);
        if (isNaN(telaID)) {
            return res.status(400).json({
                estado: false,
                mensaje: "El ID de la tela debe ser un número válido",
            });
        }

        const tela = await getTelaById(telaID);
        if (!tela) {
            return res.status(404).json({
                estado: false,
                mensaje: `Tela con ID ${telaID} no encontrada,`
            });
        }

        res.json({
            estado: true,
            mensaje: "Tela encontrada exitosamente",
            datos: tela,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error(`Error en GET /telas/${req.params.telaID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de la tela",
            error: err.message,
        });
    }
});

// =================== CREAR ===================
router.post("/", async (req, res) => {
    try {
        const { Nombre } = req.body;
        const nuevaTela = await createTela({ Nombre });

        res.status(201).json({
            estado: true,
            mensaje: "Tela creada exitosamente",
            datos: nuevaTela,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error("Error en POST /telas:", err.message);
        res.status(400).json({
            estado: false,
            mensaje: err.message,
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
                mensaje: "El ID de la tela debe ser un número válido",
            });
        }

        const telaActualizada = await updateTela(telaID, { Nombre });

        res.json({
            estado: true,
            mensaje: "Tela actualizada exitosamente",
            datos: telaActualizada,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error(`Error en PUT /telas/${req.params.telaID}:`, err.message);
        res.status(400).json({
            estado: false,
            mensaje: err.message,
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
                mensaje: "El ID de la tela debe ser un número válido",
            });
        }

        const resultado = await deleteTela(telaID);

        res.json({
            estado: true,
            mensaje: "Tela eliminada exitosamente",
            datosEliminados: resultado.tela,
            filasAfectadas: resultado.rowsAffected,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error(`Error en DELETE /telas/${req.params.telaID}:`, err.message);
        res.status(400).json({
            estado: false,
            mensaje: err.message,
        });
    }
});

module.exports = router;