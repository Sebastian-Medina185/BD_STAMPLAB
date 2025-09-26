// routes/disenos.js
const express = require("express");
const router = express.Router();
const { getDisenos, getDisenoById } = require("../models/diseños");

router.get("/", async (req, res) => {
    try {
        const data = await getDisenos();
        res.json(data);
    } catch (err) {
        console.error("Error en /disenos:", err);
        res.status(500).send("Error en la consulta");
    }
});

router.get("/:id", async (req, res) => {
    try {
        const diseno = await getDisenoById(req.params.id);
        if (!diseno) return res.status(404).send("Diseño no encontrado");
        res.json(diseno);
    } catch (err) {
        console.error("Error en /disenos/:id:", err);
        res.status(500).send("Error en la consulta");
    }
});

module.exports = router;