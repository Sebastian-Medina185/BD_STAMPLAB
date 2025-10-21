const express = require("express");
const router = express.Router();
const { getProveedores, getProveedorById, createProveedor, updateProveedor, deleteProveedor } = require("../models/proveedores");

// LISTAR
router.get("/", async (req, res) => {
    try {
        const proveedores = await getProveedores();
        res.json({ estado: true, mensaje: "Proveedores obtenidos", datos: proveedores, cantidad: proveedores.length });
    } catch (err) {
        res.status(500).json({ estado: false, mensaje: "Error consultando proveedores", error: err.message });
    }
});

// GET por ID
router.get("/:nit", async (req, res) => {
    try {
        const proveedor = await getProveedorById(req.params.nit);
        if (!proveedor) return res.status(404).json({ estado: false, mensaje: "Proveedor no encontrado" });
        res.json({ estado: true, mensaje: "Proveedor encontrado", datos: proveedor });
    } catch (err) {
        res.status(500).json({ estado: false, mensaje: "Error consultando proveedor", error: err.message });
    }
});

// CREAR - CORREGIDO: Normalizar nombres de propiedades
router.post("/", async (req, res) => {
    try {
        // Normalizar propiedades a mayúsculas (como espera el modelo)
        const proveedorData = {
            Nit: req.body.nit || req.body.Nit,
            Nombre: req.body.nombre || req.body.Nombre,
            Correo: req.body.correo || req.body.Correo,
            Telefono: req.body.telefono || req.body.Telefono,
            Direccion: req.body.direccion || req.body.Direccion,
            Estado: req.body.estado !== undefined ? req.body.estado : (req.body.Estado !== undefined ? req.body.Estado : true)
        };

        // Validar campos requeridos
        if (!proveedorData.Nit || !proveedorData.Nombre || !proveedorData.Correo || !proveedorData.Telefono || !proveedorData.Direccion) {
            return res.status(400).json({ 
                estado: false, 
                mensaje: "Todos los campos son requeridos" 
            });
        }

        const nuevo = await createProveedor(proveedorData);
        res.status(201).json({ estado: true, mensaje: "Proveedor creado exitosamente", datos: nuevo });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ 
            estado: false, 
            mensaje: err.message || "Error creando proveedor"
        });
    }
});

// EDITAR - CORREGIDO: Normalizar nombres de propiedades
router.put("/:nit", async (req, res) => {
    try {
        // Normalizar propiedades a mayúsculas
        const proveedorData = {
            Nit: req.body.nit || req.body.Nit,
            Nombre: req.body.nombre || req.body.Nombre,
            Correo: req.body.correo || req.body.Correo,
            Telefono: req.body.telefono || req.body.Telefono,
            Direccion: req.body.direccion || req.body.Direccion,
            Estado: req.body.estado !== undefined ? req.body.estado : req.body.Estado
        };

        const actualizado = await updateProveedor(req.params.nit, proveedorData);
        res.json({ estado: true, mensaje: "Proveedor actualizado exitosamente", datos: actualizado });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ 
            estado: false, 
            mensaje: err.message || "Error actualizando proveedor"
        });
    }
});

// ELIMINAR
router.delete("/:nit", async (req, res) => {
    try {
        const resultado = await deleteProveedor(req.params.nit);
        res.json({ estado: true, mensaje: "Proveedor eliminado exitosamente", datosEliminados: resultado.proveedor });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ 
            estado: false, 
            mensaje: err.message || "Error eliminando proveedor"
        });
    }
});

module.exports = router;