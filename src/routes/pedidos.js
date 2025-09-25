const express = require("express");
const router = express.Router();
const { getPedidos, getPedidoById, createPedido, updatePedido, deletePedido } = require("../models/pedidos");

router.get("/", async (req, res) => {
    try {
        const pedidos = await getPedidos();
        res.json({
            estado: true,
            mensaje: "Pedidos obtenidos exitosamente",
            datos: pedidos,
            cantidad: pedidos.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en GET /pedidos:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de pedidos",
            error: err.message
        });
    }
});

router.get("/:pedidoID", async (req, res) => {
    try {
        const pedidoID = parseInt(req.params.pedidoID);
        const pedido = await getPedidoById(pedidoID);

        if (!pedido) {
            return res.status(404).json({
                estado: false,
                mensaje: `Pedido con ID ${pedidoID} no encontrado`
            });
        }

        res.json({
            estado: true,
            mensaje: "Pedido encontrado exitosamente",
            datos: pedido,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en GET /pedidos/${req.params.pedidoID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta del pedido",
            error: err.message
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { Nit, FechaPedido, Estado } = req.body;

        if (!Nit || !FechaPedido) {
            return res.status(400).json({
                estado: false,
                mensaje: "Faltan campos requeridos",
                camposRequeridos: ["Nit", "FechaPedido"]
            });
        }

        // Validar que el Estado sea uno de los valores permitidos
        const estadosPermitidos = ['Pendiente', 'En Proceso', 'Completado', 'Cancelado'];
        if (Estado && !estadosPermitidos.includes(Estado)) {
            return res.status(400).json({
                estado: false,
                mensaje: "Estado no válido",
                estadosPermitidos
            });
        }

        const nuevoPedido = await createPedido({
            Nit,
            FechaPedido,
            Estado: Estado || 'Pendiente' // Valor por defecto
        });

        res.status(201).json({
            estado: true,
            mensaje: "Pedido creado exitosamente",
            datos: nuevoPedido,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en POST /pedidos:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error al crear el pedido",
            error: err.message
        });
    }
});

router.put("/:pedidoID", async (req, res) => {
    try {
        const pedidoID = parseInt(req.params.pedidoID);
        const { Nit, FechaPedido, Estado } = req.body;

        if (!Nit || !FechaPedido || Estado === undefined) {
            return res.status(400).json({
                estado: false,
                mensaje: "Todos los campos son requeridos"
            });
        }

        const pedidoActualizado = await updatePedido(pedidoID, { Nit, FechaPedido, Estado });

        res.json({
            estado: true,
            mensaje: "Pedido actualizado exitosamente",
            datos: pedidoActualizado,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en PUT /pedidos/${req.params.pedidoID}:`, err.message);
        if (err.message.includes('no existe')) {
            return res.status(404).json({
                estado: false,
                mensaje: err.message
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar el pedido",
            error: err.message
        });
    }
});

router.delete("/:pedidoID", async (req, res) => {
    try {
        const pedidoID = parseInt(req.params.pedidoID);
        const resultado = await deletePedido(pedidoID);

        res.json({
            estado: true,
            mensaje: "Pedido eliminado exitosamente",
            datosEliminados: resultado.pedido,
            filasAfectadas: resultado.rowsAffected,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en DELETE /pedidos/${req.params.pedidoID}:`, err.message);
        if (err.message.includes('no existe') || err.message.includes('detalles asociados')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al eliminar el pedido",
            error: err.message
        });
    }
});

module.exports = router;