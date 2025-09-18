// routes/cotizaciones.js
const express = require("express");
const router = express.Router();
const { getCotizaciones, getCotizacionById } = require("../models/cotizaciones");

router.get("/", async (req, res) => {
    try {
        const data = await getCotizaciones();
        res.json(data);
    } catch (err) {
        console.error("❌ Error en /cotizaciones:", err);
        res.status(500).send("Error en la consulta");
    }
});

router.get("/:id", async (req, res) => {
    try {
        const cotizacion = await getCotizacionById(req.params.id);
        if (!cotizacion) return res.status(404).send("Cotización no encontrada");
        res.json(cotizacion);
    } catch (err) {
        console.error("❌ Error en /cotizaciones/:id:", err);
        res.status(500).send("Error en la consulta");
    }
});

module.exports = router;
