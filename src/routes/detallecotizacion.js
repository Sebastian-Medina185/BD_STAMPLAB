// routes/detallecotizacion.js
const express = require("express");
const router = express.Router();
const { 
    getDetalleCotizacion, 
    getDetalleCotizacionById, 
    createDetalleCotizacion, 
    updateDetalleCotizacion, 
    deleteDetalleCotizacion 
} = require("../models/detallecotizacion");

// ✅ Obtener todos los detalles
router.get("/", async (req, res) => {
    try {
        const detalles = await getDetalleCotizacion();
        res.json({
            estado: true,
            mensaje: "Detalles de cotización obtenidos exitosamente",
            datos: detalles,
            cantidad: detalles.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(" Error en GET /detallecotizacion:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error al obtener los detalles de cotización",
            error: err.message
        });
    }
});

// ✅ Obtener un detalle por ID
router.get("/:detalleID", async (req, res) => {
    try {
        const detalleID = parseInt(req.params.detalleID);
        const detalle = await getDetalleCotizacionById(detalleID);

        if (!detalle) {
            return res.status(404).json({
                estado: false,
                mensaje: `Detalle con ID ${detalleID} no encontrado`
            });
        }

        res.json({
            estado: true,
            mensaje: "Detalle encontrado exitosamente",
            datos: detalle,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(` Error en GET /detallecotizacion/${req.params.detalleID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error al obtener el detalle",
            error: err.message
        });
    }
});

// ✅ Crear un nuevo detalle
router.post("/", async (req, res) => {
    try {
        const { CotizacionID, VarianteID, Cantidad, PrendaDescripcion, TraePrenda } = req.body;

        if (!CotizacionID || !Cantidad) {
            return res.status(400).json({
                estado: false,
                mensaje: "CotizacionID y Cantidad son requeridos",
                camposRequeridos: ["CotizacionID", "Cantidad"]
            });
        }

        const nuevoDetalle = await createDetalleCotizacion({
            CotizacionID,
            VarianteID,
            Cantidad,
            PrendaDescripcion,
            TraePrenda: TraePrenda || false
        });

        res.status(201).json({
            estado: true,
            mensaje: "Detalle de cotización creado exitosamente",
            datos: nuevoDetalle,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(" Error en POST /detallecotizacion:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error al crear el detalle de cotización",
            error: err.message
        });
    }
});

// ✅ Actualizar un detalle existente
router.put("/:detalleID", async (req, res) => {
    try {
        const detalleID = parseInt(req.params.detalleID);
        const { CotizacionID, VarianteID, Cantidad, PrendaDescripcion, TraePrenda } = req.body;

        if (!CotizacionID || !Cantidad) {
            return res.status(400).json({
                estado: false,
                mensaje: "CotizacionID y Cantidad son requeridos"
            });
        }

        const detalleActualizado = await updateDetalleCotizacion(detalleID, {
            CotizacionID,
            VarianteID,
            Cantidad,
            PrendaDescripcion,
            TraePrenda
        });

        res.json({
            estado: true,
            mensaje: "Detalle de cotización actualizado exitosamente",
            datos: detalleActualizado,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(` Error en PUT /detallecotizacion/${req.params.detalleID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar el detalle de cotización",
            error: err.message
        });
    }
});

// ✅ Eliminar un detalle
router.delete("/:detalleID", async (req, res) => {
    try {
        const detalleID = parseInt(req.params.detalleID);
        const resultado = await deleteDetalleCotizacion(detalleID);

        res.json({
            estado: true,
            mensaje: "Detalle de cotización eliminado exitosamente",
            datosEliminados: resultado.detalleCotizacion,
            filasAfectadas: resultado.rowsAffected,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(` Error en DELETE /detallecotizacion/${req.params.detalleID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error al eliminar el detalle",
            error: err.message
        });
    }
});

module.exports = router;
