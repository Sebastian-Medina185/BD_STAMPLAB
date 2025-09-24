// src/routes/tecnicas.js
const express = require("express");
const router = express.Router();
const { getTecnicas, getTecnicaById, createTecnica, updateTecnica, deleteTecnica } = require("../models/tecnicas");

router.get("/", async (req, res) => {
    try {
        const tecnicas = await getTecnicas();
        res.json({
            estado: true,
            mensaje: "Técnicas obtenidas exitosamente",
            datos: tecnicas,
            cantidad: tecnicas.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en GET /tecnicas:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de técnicas",
            error: err.message
        });
    }
});

router.get("/:tecnicaID", async (req, res) => {
    try {
        const tecnicaID = parseInt(req.params.tecnicaID);
        const tecnica = await getTecnicaById(tecnicaID);

        if (!tecnica) {
            return res.status(404).json({
                estado: false,
                mensaje: `Técnica con ID ${tecnicaID} no encontrada`
            });
        }

        res.json({
            estado: true,
            mensaje: "Técnica encontrada exitosamente",
            datos: tecnica,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en GET /tecnicas/${req.params.tecnicaID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de la técnica",
            error: err.message
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { Nombre, ImagenTecnica, Descripcion, Estado } = req.body;

        if (!Nombre || !ImagenTecnica || !Descripcion || Estado === undefined) {
            return res.status(400).json({
                estado: false,
                mensaje: "Todos los campos son requeridos",
                camposRequeridos: ["Nombre", "ImagenTecnica", "Descripcion", "Estado"]
            });
        }

        const nuevaTecnica = await createTecnica({ Nombre, ImagenTecnica, Descripcion, Estado });

        res.status(201).json({
            estado: true,
            mensaje: "Técnica creada exitosamente",
            datos: nuevaTecnica,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en POST /tecnicas:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error al crear la técnica",
            error: err.message
        });
    }
});

router.put("/:tecnicaID", async (req, res) => {
    try {
        const tecnicaID = parseInt(req.params.tecnicaID);
        const { Nombre, ImagenTecnica, Descripcion, Estado } = req.body;

        if (!Nombre || !ImagenTecnica || !Descripcion || Estado === undefined) {
            return res.status(400).json({
                estado: false,
                mensaje: "Todos los campos son requeridos"
            });
        }

        const tecnicaActualizada = await updateTecnica(tecnicaID, { Nombre, ImagenTecnica, Descripcion, Estado });

        res.json({
            estado: true,
            mensaje: "Técnica actualizada exitosamente",
            datos: tecnicaActualizada,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en PUT /tecnicas/${req.params.tecnicaID}:`, err.message);
        if (err.message.includes('no existe')) {
            return res.status(404).json({
                estado: false,
                mensaje: err.message
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar la técnica",
            error: err.message
        });
    }
});

router.delete("/:tecnicaID", async (req, res) => {
    try {
        const tecnicaID = parseInt(req.params.tecnicaID);
        const resultado = await deleteTecnica(tecnicaID);

        res.json({
            estado: true,
            mensaje: "Técnica eliminada exitosamente",
            datosEliminados: resultado.tecnica,
            filasAfectadas: resultado.rowsAffected
        });
    } catch (err) {
        console.error(`❌ Error en DELETE /tecnicas/${req.params.tecnicaID}:`, err.message);
        if (err.message.includes('no existe')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al eliminar la técnica",
            error: err.message
        });
    }
});

module.exports = router;
