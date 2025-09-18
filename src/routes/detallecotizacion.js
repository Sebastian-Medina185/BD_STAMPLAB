// routes/detalleCotizacion.js
const express = require("express");
const router = express.Router();
const { getDetalleCotizacion, getDetalleCotizacionById } = require("../models/detallecotizacion");

router.get("/", async (req, res) => {
    try {
        const data = await getDetalleCotizacion();
        res.json(data);
    } catch (err) {
        console.error("❌ Error en /detalleCotizacion:", err);
        res.status(500).send("Error en la consulta");
    }
});

router.get("/:id", async (req, res) => {
    try {
        const detalle = await getDetalleCotizacionById(req.params.id);
        if (!detalle) return res.status(404).send("Detalle cotización no encontrado");
        res.json(detalle);
    } catch (err) {
        console.error("❌ Error en /detalleCotizacion/:id:", err);
        res.status(500).send("Error en la consulta");
    }
});

module.exports = router;