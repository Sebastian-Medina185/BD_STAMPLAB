// routes/detalleCotizacion.js
const express = require("express");
const router = express.Router();
const { 
    getDetalleCotizacion, 
    getDetalleCotizacionById, 
    createDetalleCotizacion, 
    updateDetalleCotizacion, 
    deleteDetalleCotizacion 
} = require("../models/detallecotizacion");

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
        console.error(" Error en GET /detalleCotizacion:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de detalles de cotización",
            error: err.message
        });
    }
});

router.get("/:detalleID", async (req, res) => {
    try {
        const detalleID = parseInt(req.params.detalleID);
        const detalle = await getDetalleCotizacionById(detalleID);

        if (!detalle) {
            return res.status(404).json({
                estado: false,
                mensaje: `Detalle de cotización con ID ${detalleID} no encontrado`
            });
        }

        res.json({
            estado: true,
            mensaje: "Detalle de cotización encontrado exitosamente",
            datos: detalle,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(` Error en GET /detalleCotizacion/${req.params.detalleID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta del detalle de cotización",
            error: err.message
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { 
            CotizacionID, 
            ProductoID, 
            TallaID, 
            ColorID, 
            TecnicaID, 
            Cantidad,
            PrendaDescripcion,
            TraePrenda
        } = req.body;

        if (!CotizacionID || !ProductoID || !Cantidad) {
            return res.status(400).json({
                estado: false,
                mensaje: "CotizacionID, ProductoID y Cantidad son requeridos",
                camposRequeridos: ["CotizacionID", "ProductoID", "Cantidad"]
            });
        }

        const nuevoDetalle = await createDetalleCotizacion({
            CotizacionID,
            ProductoID,
            TallaID,
            ColorID,
            TecnicaID,
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
        console.error("Error en POST /detalleCotizacion:", err.message);
        if (err.message.includes('No existe')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al crear el detalle de cotización",
            error: err.message
        });
    }
});

router.put("/:detalleID", async (req, res) => {
    try {
        const detalleID = parseInt(req.params.detalleID);
        const { 
            CotizacionID, 
            ProductoID, 
            TallaID, 
            ColorID, 
            TecnicaID, 
            Cantidad, 
            PrecioUnitario 
        } = req.body;

        if (!CotizacionID || !ProductoID || !Cantidad || !PrecioUnitario) {
            return res.status(400).json({
                estado: false,
                mensaje: "CotizacionID, ProductoID, Cantidad y PrecioUnitario son requeridos"
            });
        }

        const detalleActualizado = await updateDetalleCotizacion(detalleID, {
            CotizacionID,
            ProductoID,
            TallaID,
            ColorID,
            TecnicaID,
            Cantidad,
            PrecioUnitario
        });

        res.json({
            estado: true,
            mensaje: "Detalle de cotización actualizado exitosamente",
            datos: detalleActualizado,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(` Error en PUT /detalleCotizacion/${req.params.detalleID}:`, err.message);
        if (err.message.includes('no existe')) {
            return res.status(404).json({
                estado: false,
                mensaje: err.message
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar el detalle de cotización",
            error: err.message
        });
    }
});

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
        console.error(` Error en DELETE /detalleCotizacion/${req.params.detalleID}:`, err.message);
        if (err.message.includes('no existe')) {
            return res.status(404).json({
                estado: false,
                mensaje: err.message
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al eliminar el detalle de cotización",
            error: err.message
        });
    }
});

module.exports = router;