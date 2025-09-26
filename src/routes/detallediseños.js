// routes/detalleDiseno.js
const express = require("express");
const router = express.Router();
const { getDetalleDiseno, getDetalleDisenoById } = require("../models/detallediseños");

router.get("/", async (req, res) => {
    try {
        const data = await getDetalleDiseno();
        res.json(data);
    } catch (err) {
        console.error("Error en /detalleDiseno:", err);
        res.status(500).send("Error en la consulta");
    }
});

router.get("/:id", async (req, res) => {
    try {
        const detalle = await getDetalleDisenoById(req.params.id);
        if (!detalle) return res.status(404).send("Detalle diseño no encontrado");
        res.json(detalle);
    } catch (err) {
        console.error("Error en /detalleDiseno/:id:", err);
        res.status(500).send("Error en la consulta");
    }
});

module.exports = router;