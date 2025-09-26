// src/routes/usuarios.js
const express = require("express");
const router = express.Router();
const { 
    getUsuarios, 
    getUsuarioById, 
    createUsuario, 
    updateUsuario, 
    deleteUsuario,
    getRoles
} = require("../models/usuarios");

// =================== LISTAR ===================

// GET: todos los usuarios
router.get("/", async (req, res) => {
    try {
        const usuarios = await getUsuarios();

        res.json({
            estado: true,
            mensaje: "Usuarios obtenidos exitosamente",
            datos: usuarios,
            cantidad: usuarios.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error("Error en GET /usuarios:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta de usuarios",
            error: err.message
        });
    }
});

// GET: usuario por DocumentoID
router.get("/:documentoID", async (req, res) => {
    try {
        const documentoID = req.params.documentoID;

        if (!documentoID || documentoID.trim() === "") {
            return res.status(400).json({
                estado: false,
                mensaje: "DocumentoID es requerido",
                documentoIDRecibido: documentoID
            });
        }

        const usuario = await getUsuarioById(documentoID);

        if (!usuario) {
            return res.status(404).json({
                estado: false,
                mensaje: `Usuario con DocumentoID ${documentoID} no encontrado`
            });
        }

        res.json({
            estado: true,
            mensaje: "Usuario encontrado exitosamente",
            datos: usuario,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`Error en GET /usuarios/${req.params.documentoID}:`, err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error en la consulta del usuario",
            error: err.message
        });
    }
});

// GET: obtener roles disponibles (para formularios)
router.get("/util/roles", async (req, res) => {
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
        console.error("Error en GET /usuarios/util/roles:", err.message);
        res.status(500).json({
            estado: false,
            mensaje: "Error al obtener roles",
            error: err.message
        });
    }
});

// =================== CREAR ===================

// POST: crear nuevo usuario
router.post("/", async (req, res) => {
    try {
        const { DocumentoID, Nombre, Correo, Direccion, Telefono, Contraseña, RolID } = req.body;

        // Validaciones básicas
        if (!DocumentoID || !Nombre || !Correo || !Direccion || !Telefono || !Contraseña || !RolID) {
            return res.status(400).json({
                estado: false,
                mensaje: "Todos los campos son requeridos",
                camposRequeridos: ["DocumentoID", "Nombre", "Correo", "Direccion", "Telefono", "Contraseña", "RolID"],
                datosRecibidos: req.body
            });
        }

        // Validar formato de correo básico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(Correo)) {
            return res.status(400).json({
                estado: false,
                mensaje: "Formato de correo electrónico inválido"
            });
        }

        // Validar longitudes
        if (DocumentoID.length > 15) {
            return res.status(400).json({
                estado: false,
                mensaje: "El DocumentoID no puede tener más de 15 caracteres"
            });
        }

        if (Nombre.length > 50) {
            return res.status(400).json({
                estado: false,
                mensaje: "El nombre no puede tener más de 50 caracteres"
            });
        }

        const nuevoUsuario = await createUsuario({
            DocumentoID,
            Nombre,
            Correo,
            Direccion,
            Telefono,
            Contraseña,
            RolID
        });

        res.status(201).json({
            estado: true,
            mensaje: "Usuario creado exitosamente",
            datos: nuevoUsuario,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error("Error en POST /usuarios:", err.message);
        
        // Manejar errores específicos
        if (err.message.includes('ya existe') || err.message.includes('El rol especificado')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }

        res.status(500).json({
            estado: false,
            mensaje: "Error al crear el usuario",
            error: err.message
        });
    }
});

// =================== EDITAR ===================

// PUT: actualizar usuario completo
router.put("/:documentoID", async (req, res) => {
    try {
        const documentoID = req.params.documentoID;
        const datosActualizacion = req.body;

        if (!documentoID || documentoID.trim() === "") {
            return res.status(400).json({
                estado: false,
                mensaje: "DocumentoID es requerido en la URL"
            });
        }

        // Validar que se envíen datos para actualizar
        if (Object.keys(datosActualizacion).length === 0) {
            return res.status(400).json({
                estado: false,
                mensaje: "Debe enviar al menos un campo para actualizar"
            });
        }

        // Validar formato de correo si se está actualizando
        if (datosActualizacion.Correo) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(datosActualizacion.Correo)) {
                return res.status(400).json({
                    estado: false,
                    mensaje: "Formato de correo electrónico inválido"
                });
            }
        }

        const usuarioActualizado = await updateUsuario(documentoID, datosActualizacion);

        res.json({
            estado: true,
            mensaje: "Usuario actualizado exitosamente",
            datos: usuarioActualizado,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error(`Error en PUT /usuarios/${req.params.documentoID}:`, err.message);
        
        if (err.message.includes('no existe') || err.message.includes('ya existe')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }

        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar el usuario",
            error: err.message
        });
    }
});

// PATCH: actualización parcial
router.patch("/:documentoID", async (req, res) => {
    try {
        const documentoID = req.params.documentoID;
        const datosActualizacion = req.body;

        if (!documentoID || documentoID.trim() === "") {
            return res.status(400).json({
                estado: false,
                mensaje: "DocumentoID es requerido en la URL"
            });
        }

        const usuarioActualizado = await updateUsuario(documentoID, datosActualizacion);

        res.json({
            estado: true,
            mensaje: "Usuario actualizado parcialmente",
            datos: usuarioActualizado,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error(`Error en PATCH /usuarios/${req.params.documentoID}:`, err.message);
        
        if (err.message.includes('no existe') || err.message.includes('ya existe')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }

        res.status(500).json({
            estado: false,
            mensaje: "Error al actualizar el usuario",
            error: err.message
        });
    }
});

// =================== ELIMINAR ===================

// DELETE: eliminar usuario
router.delete("/:documentoID", async (req, res) => {
    try {
        const documentoID = req.params.documentoID;

        if (!documentoID || documentoID.trim() === "") {
            return res.status(400).json({
                estado: false,
                mensaje: "DocumentoID es requerido"
            });
        }

        const resultado = await deleteUsuario(documentoID);

        res.json({
            estado: true,
            mensaje: "Usuario eliminado exitosamente",
            datosEliminados: resultado.user,
            filasAfectadas: resultado.rowsAffected,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error(`Error en DELETE /usuarios/${req.params.documentoID}:`, err.message);
        
        if (err.message.includes('no existe') || err.message.includes('tiene cotizaciones')) {
            return res.status(400).json({
                estado: false,
                mensaje: err.message,
                tipo: "error_validacion"
            });
        }

        res.status(500).json({
            estado: false,
            mensaje: "Error al eliminar el usuario",
            error: err.message
        });
    }
});

module.exports = router;