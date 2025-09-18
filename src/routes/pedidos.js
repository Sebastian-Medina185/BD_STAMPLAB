// routes/pedidos.js
const express = require("express");
const router = express.Router();
const { getPedidos, getPedidoById } = require("../models/pedidos");

router.get("/", async (req, res) => {
    try {
        const data = await getPedidos();
        res.json(data);
    } catch (err) {
        console.error("❌ Error en /pedidos:", err);
        res.status(500).send("Error en la consulta");
    }
});

router.get("/:id", async (req, res) => {
    try {
        const pedido = await getPedidoById(req.params.id);
        if (!pedido) return res.status(404).send("Pedido no encontrado");
        res.json(pedido);
    } catch (err) {
        console.error("❌ Error en /pedidos/:id:", err);
        res.status(500).send("Error en la consulta");
    }
});

module.exports = router;