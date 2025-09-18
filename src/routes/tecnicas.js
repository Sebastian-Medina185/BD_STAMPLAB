// src/routes/tecnicas.js
const express = require("express");
const router = express.Router();
const { getTecnicas, getTecnicaById, createTecnica, updateTecnica, deleteTecnica } = require("../models/tecnicas");

// LISTAR
router.get("/", async (req, res) => {
    try {
        const tecnicas = await getTecnicas();
        res.json({ estado: true, mensaje: "Técnicas obtenidas", datos: tecnicas, cantidad: tecnicas.length });
    } catch (err) {
        res.status(500).json({ estado: false, mensaje: "Error consultando técnicas", error: err.message });
    }
});

// GET por ID
router.get("/:tecnicaID", async (req, res) => {
    try {
        const tecnica = await getTecnicaById(req.params.tecnicaID);
        if (!tecnica) return res.status(404).json({ estado: false, mensaje: "Técnica no encontrada" });
        res.json({ estado: true, mensaje: "Técnica encontrada", datos: tecnica });
    } catch (err) {
        res.status(500).json({ estado: false, mensaje: "Error consultando técnica", error: err.message });
    }
});

// CREAR
router.post("/", async (req, res) => {
    try {
        const { TecnicaID, Nombre, ImagenTecnica, Descripcion, Estado } = req.body;
        if (!TecnicaID || !Nombre || !ImagenTecnica || !Descripcion || Estado === undefined) {
            return res.status(400).json({ estado: false, mensaje: "Todos los campos son requeridos" });
        }
        const nueva = await createTecnica({ TecnicaID, Nombre, ImagenTecnica, Descripcion, Estado });
        res.status(201).json({ estado: true, mensaje: "Técnica creada", datos: nueva });
    } catch (err) {
        res.status(500).json({ estado: false, mensaje: "Error creando técnica", error: err.message });
    }
});

// EDITAR
router.put("/:tecnicaID", async (req, res) => {
    try {
        const actualizada = await updateTecnica(req.params.tecnicaID, req.body);
        res.json({ estado: true, mensaje: "Técnica actualizada", datos: actualizada });
    } catch (err) {
        res.status(500).json({ estado: false, mensaje: "Error actualizando técnica", error: err.message });
    }
});

// ELIMINAR
router.delete("/:tecnicaID", async (req, res) => {
    try {
        const resultado = await deleteTecnica(req.params.tecnicaID);
        res.json({ estado: true, mensaje: "Técnica eliminada", datosEliminados: resultado.tecnica });
    } catch (err) {
        res.status(500).json({ estado: false, mensaje: "Error eliminando técnica", error: err.message });
    }
});

module.exports = router;
