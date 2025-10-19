// src/routes/insumos.js
const express = require("express");
const router = express.Router();
const { 
    getInsumos, 
    getInsumosActivos,
    getInsumoById, 
    createInsumo, 
    updateInsumo, 
    deleteInsumo,
    actualizarStock 
} = require("../models/insumos");

// =================== LISTAR ===================
router.get("/", async (req, res) => {
    try {
        const insumos = await getInsumos();
        res.json({
            estado: true,
            mensaje: "Insumos obtenidos exitosamente",
            datos: insumos,
            cantidad: insumos.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("Error en GET /insumos:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de insumos",
            error: err.message
        });
    }
});

router.get("/activos", async (req, res) => {
    try {
        const insumos = await getInsumosActivos();
        res.json({
            estado: true,
            mensaje: "Insumos activos obtenidos exitosamente",
            datos: insumos,
            cantidad: insumos.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("Error en GET /insumos/activos:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de insumos activos",
            error: err.message
        });
    }
});

router.get("/:insumoID", async (req, res) => {
    try {
        const insumoID = parseInt(req.params.insumoID);
        
        if (isNaN(insumoID)) {
            return res.status(400).json({
                estado: false,
                mensaje: "El ID del insumo debe ser un número válido"
            });
        }

        const insumo = await getInsumoById(insumoID);

        if (!insumo) {
            return res.status(404).json({
                estado: false,
                mensaje: `Insumo con ID ${insumoID} no encontrado`
            });
        }

        res.json({
            estado: true,
            mensaje: "Insumo encontrado exitosamente",
            datos: insumo,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`Error en GET /insumos/${req.params.insumoID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta del insumo",
            error: err.message
        });
    }
});

// =================== CREAR ===================
router.post("/", async (req, res) => {
    try {
        const { Nombre, Stock, Estado } = req.body;

        // 🔍 Validación: Nombre es requerido
        if (!Nombre) {
            return res.status(400).json({
                estado: false,
                mensaje: "Nombre es requerido",
                camposRequeridos: ["Nombre"]
            });
        }

        // 🔍 Validación: Nombre debe tener al menos 4 caracteres
        if (Nombre.trim().length < 4) {
            return res.status(400).json({
                estado: false,
                mensaje: "El nombre debe tener al menos 4 caracteres"
            });
        }

        // 🔍 Validación: Nombre máximo 50 caracteres
        if (Nombre.length > 50) {
            return res.status(400).json({
                estado: false,
                mensaje: "Nombre máximo 50 caracteres"
            });
        }

        // 🔍 Validación: Stock no puede estar vacío
        if (Stock === "" || Stock === null) {
            return res.status(400).json({
                estado: false,
                mensaje: "El stock debe ser un número entero válido, no puede estar vacío"
            });
        }

        // 🔍 Validación: Stock debe ser entero mayor o igual a 0
        if (Stock !== undefined && (Stock < 0 || !Number.isInteger(Number(Stock)))) {
            return res.status(400).json({
                estado: false,
                mensaje: "El stock debe ser un número entero mayor o igual a 0"
            });
        }

        const nuevoInsumo = await createInsumo({ 
            Nombre, 
            Stock: Stock !== undefined ? Stock : 0, 
            Estado: Estado !== undefined ? Estado : true 
        });

        res.status(201).json({
            estado: true,
            mensaje: "Insumo creado exitosamente",
            datos: nuevoInsumo,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error("Error en POST /insumos:", err.message);
        
        // Manejo específico de errores del modelo
        if (err.message.includes('ya existe') || 
            err.message.includes('al menos') || 
            err.message.includes('solo puede contener') ||
            err.message.includes('debe contener al menos una letra') ||
            err.message.includes('no puede estar vacío')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message
            });
        }
        
        res.status(500).json({
            estado: false,
            mensaje: "Error al crear el insumo",
            error: err.message
        });
    }
});

// =================== EDITAR ===================
router.put("/:insumoID", async (req, res) => {
    try {
        const insumoID = parseInt(req.params.insumoID);
        const datosActualizacion = req.body;

        // 🔍 Validación: ID debe ser un número válido
        if (isNaN(insumoID)) {
            return res.status(400).json({
                estado: false,
                mensaje: "El ID del insumo debe ser un número válido"
            });
        }

        // 🔍 Validación: Debe enviar al menos un campo
        if (Object.keys(datosActualizacion).length === 0) {
            return res.status(400).json({
                estado: false,
                mensaje: "Debe enviar al menos un campo para actualizar"
            });
        }

        // 🔍 Validación: Nombre debe tener al menos 2 caracteres
        if (datosActualizacion.Nombre && datosActualizacion.Nombre.trim().length < 2) {
            return res.status(400).json({
                estado: false,
                mensaje: "El nombre debe tener al menos 2 caracteres"
            });
        }

        // 🔍 Validación: Nombre máximo 50 caracteres
        if (datosActualizacion.Nombre && datosActualizacion.Nombre.length > 50) {
            return res.status(400).json({
                estado: false,
                mensaje: "Nombre máximo 50 caracteres"
            });
        }

        // 🔍 Validación: Stock no puede estar vacío
        if (datosActualizacion.Stock === "" || datosActualizacion.Stock === null) {
            return res.status(400).json({
                estado: false,
                mensaje: "El stock debe ser un número entero válido, no puede estar vacío"
            });
        }

        // 🔍 Validación: Stock debe ser entero mayor o igual a 0
        if (datosActualizacion.Stock !== undefined && (datosActualizacion.Stock < 0 || !Number.isInteger(Number(datosActualizacion.Stock)))) {
            return res.status(400).json({
                estado: false,
                mensaje: "El stock debe ser un número entero mayor o igual a 0"
            });
        }

        const insumoActualizado = await updateInsumo(insumoID, datosActualizacion);

        res.json({
            estado: true,
            mensaje: "Insumo actualizado exitosamente",
            datos: insumoActualizado,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error(`Error en PUT /insumos/${req.params.insumoID}:`, err.message);
        
        // Manejo específico de errores
        if (err.message.includes('no existe')) {
            return res.status(404).json({
                estado: false,
                mensaje: err.message
            });
        }
        
        if (err.message.includes('ya está en uso') || 
            err.message.includes('al menos') ||
            err.message.includes('solo puede contener') ||
            err.message.includes('debe contener al menos una letra') ||
            err.message.includes('no puede estar vacío')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message
            });
        }
        
        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar el insumo",
            error: err.message
        });
    }
});

// =================== GESTIÓN DE STOCK ===================
router.patch("/:insumoID/stock", async (req, res) => {
    try {
        const insumoID = parseInt(req.params.insumoID);
        const { cantidad, tipo } = req.body;

        // 🔍 Validación: ID debe ser un número válido
        if (isNaN(insumoID)) {
            return res.status(400).json({
                estado: false,
                mensaje: "El ID del insumo debe ser un número válido"
            });
        }

        // 🔍 Validación: Cantidad y tipo son requeridos
        if (!cantidad || !tipo) {
            return res.status(400).json({
                estado: false,
                mensaje: "Cantidad y tipo son requeridos",
                camposRequeridos: ["cantidad", "tipo"],
                tiposPermitidos: ["incremento", "decremento"]
            });
        }

        // 🔍 Validación: Cantidad debe ser un número entero positivo
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
            return res.status(400).json({
                estado: false,
                mensaje: "La cantidad debe ser un número entero positivo"
            });
        }

        // 🔍 Validación: Tipo debe ser 'incremento' o 'decremento'
        if (!['incremento', 'decremento'].includes(tipo)) {
            return res.status(400).json({
                estado: false,
                mensaje: "Tipo debe ser 'incremento' o 'decremento'"
            });
        }

        const resultado = await actualizarStock(insumoID, cantidad, tipo);

        res.json({
            estado: true,
            mensaje: `Stock ${tipo === 'incremento' ? 'incrementado' : 'decrementado'} exitosamente`,
            datos: resultado,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error(`Error en PATCH /insumos/${req.params.insumoID}/stock:`, err.message);
        
        if (err.message.includes('no existe') || err.message.includes('No hay suficiente stock')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }
        
        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar el stock",
            error: err.message
        });
    }
});

// =================== ELIMINAR ===================
router.delete("/:insumoID", async (req, res) => {
    try {
        const insumoID = parseInt(req.params.insumoID);

        // 🔍 Validación: ID debe ser un número válido
        if (isNaN(insumoID)) {
            return res.status(400).json({
                estado: false,
                mensaje: "El ID del insumo debe ser un número válido"
            });
        }

        const resultado = await deleteInsumo(insumoID);

        res.json({
            estado: true,
            mensaje: "Insumo eliminado exitosamente",
            datosEliminados: resultado.insumo,
            filasAfectadas: resultado.rowsAffected,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error(`Error en DELETE /insumos/${req.params.insumoID}:`, err.message);
        
        if (err.message.includes('no existe') || err.message.includes('pedidos asociados')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }
        
        res.status(500).json({
            estado: false,
            mensaje: "Error al eliminar el insumo",
            error: err.message
        });
    }
});

module.exports = router;