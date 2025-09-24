// src/routes/roles.js
const express = require("express");
const router = express.Router();
const { 
    getRoles, 
    getRolesActivos,
    getRolById, 
    createRol, 
    updateRol, 
    deleteRol,
    cambiarEstadoRol 
} = require("../models/roles");

// =================== LISTAR ===================
router.get("/", async (req, res) => {
    try {
        const roles = await getRoles();
        res.json({
            estado: true,
            mensaje: "Roles obtenidos exitosamente",
            datos: roles,
            cantidad: roles.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("Error en GET /roles:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de roles",
            error: err.message
        });
    }
});

router.get("/activos", async (req, res) => {
    try {
        const roles = await getRolesActivos();
        res.json({
            estado: true,
            mensaje: "Roles activos obtenidos exitosamente",
            datos: roles,
            cantidad: roles.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("Error en GET /roles/activos:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de roles activos",
            error: err.message
        });
    }
});

router.get("/:rolID", async (req, res) => {
    try {
        const rolID = req.params.rolID;
        const rol = await getRolById(rolID);

        if (!rol) {
            return res.status(404).json({
                estado: false,
                mensaje: `Rol con ID ${rolID} no encontrado`
            });
        }

        res.json({
            estado: true,
            mensaje: "Rol encontrado exitosamente",
            datos: rol,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`Error en GET /roles/${req.params.rolID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta del rol",
            error: err.message
        });
    }
});

// =================== CREAR ===================
router.post("/", async (req, res) => {
    console.log("✅ Se llamó POST /roles");
    console.log("Datos recibidos:", req.body);

    try {
        const { RolID, Nombre, Descripcion, Estado } = req.body;

        if (!RolID || !Nombre) {
            return res.status(400).json({ estado: false, mensaje: "RolID y Nombre requeridos" });
        }

        const nuevoRol = await createRol({
            RolID,
            Nombre,
            Descripcion,
            Estado: Estado !== undefined ? Estado : true,
        });

        res.status(201).json({ estado: true, mensaje: "Rol creado", datos: nuevoRol });
    } catch (err) {
        console.error("Error al crear rol:", err.message);
        res.status(500).json({ estado: false, mensaje: "Error al crear rol", error: err.message });
    }
});



// =================== EDITAR ===================
router.put("/:rolID", async (req, res) => {
    try {
        const rolID = req.params.rolID;
        const datosActualizacion = req.body;

        const rolActualizado = await updateRol(rolID, datosActualizacion);

        res.json({
            estado: true,
            mensaje: "Rol actualizado exitosamente",
            datos: rolActualizado,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error(`Error en PUT /roles/${req.params.rolID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar el rol",
            error: err.message
        });
    }
});

// =================== CAMBIAR ESTADO ===================
router.patch("/:rolID/estado", async (req, res) => {
    try {
        const rolID = req.params.rolID;
        const { Estado } = req.body;

        const rolActualizado = await cambiarEstadoRol(rolID, Estado);

        res.json({
            estado: true,
            mensaje: `Rol ${Estado ? 'activado' : 'desactivado'} exitosamente`,
            datos: rolActualizado,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error(`Error en PATCH /roles/${req.params.rolID}/estado:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error al cambiar el estado del rol",
            error: err.message
        });
    }
});

// =================== ELIMINAR ===================
router.delete("/:rolID", async (req, res) => {
    try {
        const rolID = req.params.rolID;
        const resultado = await deleteRol(rolID);

        res.json({
            estado: true,
            mensaje: "Rol eliminado exitosamente",
            datosEliminados: resultado.rol,
            filasAfectadas: resultado.rowsAffected,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error(`Error en DELETE /roles/${req.params.rolID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error al eliminar el rol",
            error: err.message
        });
    }
});

module.exports = router;