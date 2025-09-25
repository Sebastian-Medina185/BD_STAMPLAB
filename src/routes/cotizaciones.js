// routes/cotizaciones.js
const express = require("express");
const router = express.Router();
const { getCotizaciones, getCotizacionById, createCotizacion, updateCotizacion, deleteCotizacion } = require("../models/cotizaciones");

router.get("/", async (req, res) => {
    try {
        const cotizaciones = await getCotizaciones();
        res.json({
            estado: true,
            mensaje: "Cotizaciones obtenidas exitosamente",
            datos: cotizaciones,
            cantidad: cotizaciones.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en GET /cotizaciones:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de cotizaciones",
            error: err.message
        });
    }
});

router.get("/:cotizacionID", async (req, res) => {
    try {
        const cotizacionID = parseInt(req.params.cotizacionID);
        const cotizacion = await getCotizacionById(cotizacionID);

        if (!cotizacion) {
            return res.status(404).json({
                estado: false,
                mensaje: `Cotización con ID ${cotizacionID} no encontrada`
            });
        }

        res.json({
            estado: true,
            mensaje: "Cotización encontrada exitosamente",
            datos: cotizacion,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en GET /cotizaciones/${req.params.cotizacionID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de la cotización",
            error: err.message
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { DocumentoID, FechaCotizacion, ValorTotal, Estado } = req.body;

        if (!DocumentoID || !ValorTotal) {
            return res.status(400).json({
                estado: false,
                mensaje: "DocumentoID y ValorTotal son requeridos",
                camposRequeridos: ["DocumentoID", "ValorTotal"]
            });
        }

        const nuevaCotizacion = await createCotizacion({
            DocumentoID,
            FechaCotizacion,
            ValorTotal,
            Estado
        });

        res.status(201).json({
            estado: true,
            mensaje: "Cotización creada exitosamente",
            datos: nuevaCotizacion,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en POST /cotizaciones:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error al crear la cotización",
            error: err.message
        });
    }
});

router.put("/:cotizacionID", async (req, res) => {
    try {
        const cotizacionID = parseInt(req.params.cotizacionID);
        const { DocumentoID, FechaCotizacion, ValorTotal, Estado } = req.body;

        if (!DocumentoID || !ValorTotal) {
            return res.status(400).json({
                estado: false,
                mensaje: "DocumentoID y ValorTotal son requeridos"
            });
        }

        const cotizacionActualizada = await updateCotizacion(cotizacionID, { 
            DocumentoID, 
            FechaCotizacion, 
            ValorTotal,
            Estado
        });

        res.json({
            estado: true,
            mensaje: "Cotización actualizada exitosamente",
            datos: cotizacionActualizada,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en PUT /cotizaciones/${req.params.cotizacionID}:`, err.message);
        if (err.message.includes('no existe')) {
            return res.status(404).json({
                estado: false,
                mensaje: err.message
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar la cotización",
            error: err.message
        });
    }
});

router.delete("/:cotizacionID", async (req, res) => {
    try {
        const cotizacionID = parseInt(req.params.cotizacionID);
        const resultado = await deleteCotizacion(cotizacionID);

        res.json({
            estado: true,
            mensaje: "Cotización eliminada exitosamente",
            datosEliminados: resultado.cotizacion,
            filasAfectadas: resultado.rowsAffected,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en DELETE /cotizaciones/${req.params.cotizacionID}:`, err.message);
        if (err.message.includes('no existe')) {
            return res.status(404).json({
                estado: false,
                mensaje: err.message
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al eliminar la cotización",
            error: err.message
        });
    }
});

module.exports = router;
