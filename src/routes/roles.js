const express = require("express");
const router = express.Router();
const {
    getRoles,
    getRolById,
    createRol,
    updateRol,
    deleteRol
} = require("../models/roles");


// =================== LISTAR ===================
router.get("/", async (req, res) => {
    try {
        const roles = await getRoles();
        res.json({
            estado: true,
            mensaje: "Roles obtenidos correctamente.",
            datos: roles
        });
    } catch (err) {
        res.status(500).json({
            estado: false,
            mensaje: "Error al listar los roles.",
            error: err.message
        });
    }
});

// =================== CREAR ===================
router.post("/", async (req, res) => {
    try {
        const { Nombre, Descripcion, Estado } = req.body;
        const nuevo = await createRol({ Nombre, Descripcion, Estado });
        res.status(201).json({
            estado: true,
            mensaje: "Rol creado exitosamente.",
            datos: nuevo
        });
    } catch (err) {
        res.status(400).json({
            estado: false,
            mensaje: "Error al crear el rol.",
            error: err.message
        });
    }
});

// =================== EDITAR ===================
router.put("/:rolID", async (req, res) => {
    try {
        const rolID = parseInt(req.params.rolID);
        const { Nombre, Descripcion, Estado } = req.body;
        const actualizado = await updateRol(rolID, { Nombre, Descripcion, Estado });
        res.json({
            estado: true,
            mensaje: "Rol actualizado exitosamente.",
            datos: actualizado
        });
    } catch (err) {
        res.status(400).json({
            estado: false,
            mensaje: "Error al actualizar el rol.",
            error: err.message
        });
    }
});

// =================== ELIMINAR ===================
router.delete("/:rolID", async (req, res) => {
    try {
        const rolID = parseInt(req.params.rolID);
        const eliminado = await deleteRol(rolID);
        res.json({
            estado: true,
            mensaje: "Rol eliminado correctamente.",
            datos: eliminado
        });
    } catch (err) {
        res.status(400).json({
            estado: false,
            mensaje: "Error al eliminar el rol.",
            error: err.message
        });
    }
});

module.exports = router;