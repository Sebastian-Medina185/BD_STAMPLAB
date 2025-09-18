// routes/productosVariantes.js
const express = require("express");
const router = express.Router();
const { getProductosVariantes, getProductoVarianteById } = require("../models/productosvariantes");

router.get("/", async (req, res) => {
    try {
        const data = await getProductosVariantes();
        res.json(data);
    } catch (err) {
        console.error("❌ Error en /productosVariantes:", err);
        res.status(500).send("Error en la consulta");
    }
});

router.get("/:id", async (req, res) => {
    try {
        const variante = await getProductoVarianteById(req.params.id);
        if (!variante) return res.status(404).send("Producto variante no encontrado");
        res.json(variante);
    } catch (err) {
        console.error("❌ Error en /productosVariantes/:id:", err);
        res.status(500).send("Error en la consulta");
    }
});

module.exports = router;