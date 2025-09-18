// src/routes/proveedores.js
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

// CREAR
router.post("/", async (req, res) => {
    try {
        const { Nit, Nombre, Correo, Telefono, Direccion, Estado } = req.body;
        if (!Nit || !Nombre || !Correo || !Telefono || !Direccion || Estado === undefined) {
            return res.status(400).json({ estado: false, mensaje: "Todos los campos son requeridos" });
        }
        const nuevo = await createProveedor({ Nit, Nombre, Correo, Telefono, Direccion, Estado });
        res.status(201).json({ estado: true, mensaje: "Proveedor creado", datos: nuevo });
    } catch (err) {
        res.status(500).json({ estado: false, mensaje: "Error creando proveedor", error: err.message });
    }
});

// EDITAR
router.put("/:nit", async (req, res) => {
    try {
        const actualizado = await updateProveedor(req.params.nit, req.body);
        res.json({ estado: true, mensaje: "Proveedor actualizado", datos: actualizado });
    } catch (err) {
        res.status(500).json({ estado: false, mensaje: "Error actualizando proveedor", error: err.message });
    }
});

// ELIMINAR
router.delete("/:nit", async (req, res) => {
    try {
        const resultado = await deleteProveedor(req.params.nit);
        res.json({ estado: true, mensaje: "Proveedor eliminado", datosEliminados: resultado.proveedor });
    } catch (err) {
        res.status(500).json({ estado: false, mensaje: "Error eliminando proveedor", error: err.message });
    }
});

module.exports = router;
