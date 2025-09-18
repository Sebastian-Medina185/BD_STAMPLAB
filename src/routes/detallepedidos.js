// routes/detallePedido.js
const express = require("express");
const router = express.Router();
const { getDetallePedido, getDetallePedidoById } = require("../models/detallepedidos");

router.get("/", async (req, res) => {
    try {
        const data = await getDetallePedido();
        res.json(data);
    } catch (err) {
        console.error("❌ Error en /detallePedido:", err);
        res.status(500).send("Error en la consulta");
    }
});

router.get("/:id", async (req, res) => {
    try {
        const detalle = await getDetallePedidoById(req.params.id);
        if (!detalle) return res.status(404).send("Detalle pedido no encontrado");
        res.json(detalle);
    } catch (err) {
        console.error("❌ Error en /detallePedido/:id:", err);
        res.status(500).send("Error en la consulta");
    }
});

module.exports = router;
