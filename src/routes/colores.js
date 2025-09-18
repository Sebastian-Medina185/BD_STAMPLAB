// src/routes/colores.js
const express = require("express");
const router = express.Router();
const { getColores, getColorById, createColor, updateColor, deleteColor } = require("../models/colores");

// =================== LISTAR ===================
router.get("/", async (req, res) => {
    try {
        const colores = await getColores();
        res.json({
            estado: true,
            mensaje: "Colores obtenidos exitosamente",
            datos: colores,
            cantidad: colores.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("❌ Error en GET /colores:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de colores",
            error: err.message
        });
    }
});

router.get("/:colorID", async (req, res) => {
    try {
        const colorID = req.params.colorID;
        const color = await getColorById(colorID);

        if (!color) {
            return res.status(404).json({
                estado: false,
                mensaje: `Color con ID ${colorID} no encontrado`
            });
        }

        res.json({
            estado: true,
            mensaje: "Color encontrado exitosamente",
            datos: color,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`❌ Error en GET /colores/${req.params.colorID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta del color",
            error: err.message
        });
    }
});

// =================== CREAR ===================
router.post("/", async (req, res) => {
    try {
        const { ColorID, Nombre } = req.body;

        if (!ColorID || !Nombre) {
            return res.status(400).json({
                estado: false,
                mensaje: "ColorID y Nombre son requeridos",
                camposRequeridos: ["ColorID", "Nombre"]
            });
        }

        if (ColorID.length > 3 || Nombre.length > 30) {
            return res.status(400).json({
                estado: false,
                mensaje: "ColorID máximo 3 caracteres, Nombre máximo 30 caracteres"
            });
        }

        const nuevoColor = await createColor({ ColorID, Nombre });

        res.status(201).json({
            estado: true,
            mensaje: "Color creado exitosamente",
            datos: nuevoColor,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error("❌ Error en POST /colores:", err.message);
        if (err.message.includes('Ya existe')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al crear el color",
            error: err.message
        });
    }
});

// =================== EDITAR ===================
router.put("/:colorID", async (req, res) => {
    try {
        const colorID = req.params.colorID;
        const { Nombre } = req.body;

        if (!Nombre) {
            return res.status(400).json({
                estado: false,
                mensaje: "Nombre es requerido"
            });
        }

        const colorActualizado = await updateColor(colorID, { Nombre });

        res.json({
            estado: true,
            mensaje: "Color actualizado exitosamente",
            datos: colorActualizado,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error(`❌ Error en PUT /colores/${req.params.colorID}:`, err.message);
        if (err.message.includes('no existe')) {
            return res.status(404).json({
                estado: false,
                mensaje: err.message
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar el color",
            error: err.message
        });
    }
});

// =================== ELIMINAR ===================
router.delete("/:colorID", async (req, res) => {
    try {
        const colorID = req.params.colorID;
        const resultado = await deleteColor(colorID);

        res.json({
            estado: true,
            mensaje: "Color eliminado exitosamente",
            datosEliminados: resultado.color,
            filasAfectadas: resultado.rowsAffected,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error(`❌ Error en DELETE /colores/${req.params.colorID}:`, err.message);
        if (err.message.includes('no existe') || err.message.includes('productos variantes')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }
        res.status(500).json({
            estado: false,
            mensaje: "Error al eliminar el color",
            error: err.message
        });
    }
});

module.exports = router;