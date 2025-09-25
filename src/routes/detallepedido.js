const express = require("express");
const router = express.Router();
const { 
    getDetallePedido, 
    getDetallePedidoById,
    createDetallePedido 
} = require("../models/detallepedido");

router.get("/", async (req, res) => {
    try {
        const detalles = await getDetallePedido();
        res.json({
            estado: true,
            mensaje: "Detalles de pedido obtenidos exitosamente",
            datos: detalles,
            cantidad: detalles.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en GET /detallePedido:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de detalles de pedido",
            error: err.message
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const detalle = await getDetallePedidoById(id);

        if (!detalle) {
            return res.status(404).json({
                estado: false,
                mensaje: `Detalle de pedido con ID ${id} no encontrado`
            });
        }

        res.json({
            estado: true,
            mensaje: "Detalle de pedido encontrado exitosamente",
            datos: detalle,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en GET /detallePedido/${req.params.id}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta del detalle de pedido",
            error: err.message
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { PedidoID, InsumoID, Cantidad } = req.body;

        if (!PedidoID || !InsumoID || !Cantidad) {
            return res.status(400).json({
                estado: false,
                mensaje: "Todos los campos son requeridos",
                camposRequeridos: ["PedidoID", "InsumoID", "Cantidad"]
            });
        }

        const nuevoDetalle = await createDetallePedido({
            PedidoID,
            InsumoID,
            Cantidad
        });

        res.status(201).json({
            estado: true,
            mensaje: "Detalle de pedido creado exitosamente",
            datos: nuevoDetalle,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en POST /detallePedido:", err.message);
        if (err.message.includes('No existe')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al crear el detalle de pedido",
            error: err.message
        });
    }
});

module.exports = router;