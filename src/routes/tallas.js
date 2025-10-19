// src/routes/tallas.js
const express = require("express");
const router = express.Router();
const {
    getTallas,
    getTallaById,
    createTalla,
    updateTalla,
    deleteTalla
} = require("../models/tallas");

// =================== FUNCIONES DE VALIDACIÓN ===================
function validarNombre(nombre) {
    if (typeof nombre !== "string") return "El nombre debe ser texto";
    const limpio = nombre.trim();

    if (limpio.length === 0) return "El nombre no puede estar vacío o contener solo espacios";
    if (limpio.length < 1) return "El nombre debe tener al menos 1 carácter";
    if (limpio.length > 10) return "El nombre no puede tener más de 10 caracteres";
    if (!/^[A-Za-z]+$/.test(limpio)) return "El nombre solo puede contener letras sin espacios ni caracteres especiales";

    return null; // válido
}

// =================== LISTAR ===================
router.get("/", async (req, res) => {
    try {
        const tallas = await getTallas();
        res.json({
            estado: true,
            mensaje: "Tallas obtenidas exitosamente",
            datos: tallas,
            cantidad: tallas.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("Error en GET /tallas:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de tallas",
            error: err.message
        });
    }
});

router.get("/:tallaID", async (req, res) => {
    try {
        const tallaID = parseInt(req.params.tallaID);
        const talla = await getTallaById(tallaID);

        if (!talla) {
            return res.status(404).json({
                estado: false,
                mensaje: `Talla con ID ${tallaID} no encontrada`
            });
        }

        res.json({
            estado: true,
            mensaje: "Talla encontrada exitosamente",
            datos: talla,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`Error en GET /tallas/${req.params.tallaID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de la talla",
            error: err.message
        });
    }
});

// =================== CREAR ===================
router.post("/", async (req, res) => {
    try {
        const { Nombre } = req.body;
        const error = validarNombre(Nombre);
        if (error) {
            return res.status(400).json({ estado: false, mensaje: error });
        }

        const nuevaTalla = await createTalla({ Nombre });

        res.status(201).json({
            estado: true,
            mensaje: "Talla creada exitosamente",
            datos: nuevaTalla,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("Error en POST /tallas:", err.message);
        const status = err.message.includes("ya existe") ? 400 : 500;
        res.status(status).json({
            estado: false,
            mensaje: err.message
        });
    }
});

// =================== EDITAR ===================
router.put("/:tallaID", async (req, res) => {
    try {
        const tallaID = parseInt(req.params.tallaID);
        const { Nombre } = req.body;

        const error = validarNombre(Nombre);
        if (error) {
            return res.status(400).json({ estado: false, mensaje: error });
        }

        const tallaActualizada = await updateTalla(tallaID, { Nombre });

        res.json({
            estado: true,
            mensaje: "Talla actualizada exitosamente",
            datos: tallaActualizada,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`Error en PUT /tallas/${req.params.tallaID}:`, err.message);
        const status = err.message.includes("no existe") || err.message.includes("ya existe") ? 400 : 500;
        res.status(status).json({
            estado: false,
            mensaje: err.message
        });
    }
});

// =================== ELIMINAR ===================
router.delete("/:tallaID", async (req, res) => {
    try {
        const tallaID = parseInt(req.params.tallaID);
        const resultado = await deleteTalla(tallaID);

        res.json({
            estado: true,
            mensaje: "Talla eliminada exitosamente",
            datosEliminados: resultado.talla,
            filasAfectadas: resultado.rowsAffected
        });
    } catch (err) {
        console.error(`Error en DELETE /tallas/${req.params.tallaID}:`, err.message);
        const status = err.message.includes("no existe") || err.message.includes("productos variantes") ? 400 : 500;
        res.status(status).json({
            estado: false,
            mensaje: err.message
        });
    }
});

module.exports = router;
