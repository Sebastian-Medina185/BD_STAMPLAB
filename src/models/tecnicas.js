const { sql, poolPromise } = require("../db");

// =================== LISTAR ===================
async function getTecnicas() {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request().query(`
        SELECT TecnicaID, Nombre, ImagenTecnica, Descripcion, Estado 
        FROM dbo.Tecnicas 
        ORDER BY TecnicaID
    `);
    return result.recordset;
}

async function getTecnicaById(tecnicaID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const result = await pool.request()
        .input("tecnicaID", sql.Int, tecnicaID)
        .query("SELECT TecnicaID, Nombre, ImagenTecnica, Descripcion, Estado FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID");

    return result.recordset[0];
}

// Función auxiliar para validar imagen
function validarImagenTecnica(imagenTecnica) {
    if (!imagenTecnica || imagenTecnica.trim().length === 0) {
        throw new Error("La imagen es obligatoria y no puede estar vacía.");
    }

    const imagenTrim = imagenTecnica.trim();

    // Rechazar imágenes Base64 (son demasiado largas para VARCHAR(255))
    if (imagenTrim.startsWith('data:image')) {
        throw new Error("No se permiten imágenes Base64. Por favor, sube la imagen a un servidor y proporciona la URL.");
    }

    // Validar longitud máxima
    if (imagenTrim.length > 255) {
        throw new Error("La ruta de la imagen no puede tener más de 255 caracteres.");
    }

    // Validar que no contenga caracteres peligrosos
    if (/[<>"|;`\\]/.test(imagenTrim)) {
        throw new Error("La ruta de la imagen contiene caracteres no permitidos.");
    }

    // Dominios conocidos de servicios de imágenes (no requieren extensión)
    const dominiosConfiables = [
        'imgur.com',
        'googleusercontent.com',
        'gstatic.com',
        'cloudinary.com',
        'amazonaws.com',
        'cloudfront.net',
        'dropbox.com',
        'unsplash.com',
        'pexels.com',
        'pixabay.com'
    ];

    // Verificar si es de un dominio confiable
    const esDominioConfiable = dominiosConfiables.some(dominio => 
        imagenTrim.toLowerCase().includes(dominio)
    );

    if (esDominioConfiable) {
        return imagenTrim; // URLs de servicios conocidos son válidas
    }

    // Para URLs/rutas normales, validar extensión
    const extensionesValidas = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const tieneExtensionValida = extensionesValidas.some(ext => {
        const lower = imagenTrim.toLowerCase();
        // Buscar extensión en cualquier parte de la URL
        return lower.includes(ext);
    });

    if (!tieneExtensionValida) {
        throw new Error(`La imagen debe contener una extensión válida (${extensionesValidas.join(', ')}) o ser de un servicio de imágenes reconocido.`);
    }

    return imagenTrim;
}

// =================== CREAR ===================
async function createTecnica(tecnica) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const nombre = tecnica.Nombre ? tecnica.Nombre.trim() : "";
    const descripcion = tecnica.Descripcion ? tecnica.Descripcion.trim() : "";

    // ============ VALIDACIONES DE NOMBRE ============
    if (!nombre || nombre.trim().length === 0) {
        throw new Error("El nombre es obligatorio y no puede estar vacío.");
    }
    if (nombre.length < 4) {
        throw new Error("El nombre debe tener al menos 4 caracteres.");
    }
    if (nombre.length > 20) {
        throw new Error("El nombre no puede tener más de 20 caracteres.");
    }
    // Solo letras (sin números ni caracteres especiales)
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) {
        throw new Error("El nombre solo puede contener letras y espacios (sin números ni caracteres especiales).");
    }

    // Validar nombre duplicado (insensible a mayúsculas/minúsculas)
    const nombreExiste = await pool.request()
        .input("nombre", sql.VarChar(20), nombre)
        .query("SELECT COUNT(*) AS count FROM dbo.Tecnicas WHERE LOWER(Nombre) = LOWER(@nombre)");

    if (nombreExiste.recordset[0].count > 0) {
        throw new Error(`La técnica "${nombre}" ya existe.`);
    }

    // ============ VALIDACIONES DE IMAGEN ============
    const imagenTecnica = validarImagenTecnica(tecnica.ImagenTecnica);

    // ============ VALIDACIONES DE DESCRIPCIÓN ============
    if (!descripcion || descripcion.trim().length === 0) {
        throw new Error("La descripción es obligatoria y no puede estar vacía.");
    }
    if (descripcion.length < 10) {
        throw new Error("La descripción debe tener al menos 10 caracteres.");
    }
    if (descripcion.length > 255) {
        throw new Error("La descripción no puede tener más de 255 caracteres.");
    }
    // Solo letras, números y espacios
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]+$/.test(descripcion)) {
        throw new Error("La descripción solo puede contener letras, números y espacios (sin caracteres especiales).");
    }

    // ============ VALIDACIÓN DE ESTADO ============
    if (tecnica.Estado === undefined || tecnica.Estado === null) {
        throw new Error("El estado es obligatorio.");
    }
    if (typeof tecnica.Estado !== 'boolean' && tecnica.Estado !== 0 && tecnica.Estado !== 1) {
        throw new Error("El estado debe ser un valor booleano (true/false o 0/1).");
    }

    // Insertar la nueva técnica
    const result = await pool.request()
        .input("nombre", sql.VarChar(20), nombre)
        .input("imagen", sql.VarChar(255), imagenTecnica)
        .input("descripcion", sql.VarChar(255), descripcion)
        .input("estado", sql.Bit, tecnica.Estado)
        .query(`
            INSERT INTO dbo.Tecnicas (Nombre, ImagenTecnica, Descripcion, Estado)
            VALUES (@nombre, @imagen, @descripcion, @estado);
            SELECT * FROM dbo.Tecnicas WHERE TecnicaID = SCOPE_IDENTITY();
        `);

    return result.recordset[0];
}

// =================== EDITAR ===================
async function updateTecnica(tecnicaID, tecnica) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    // Verificar existencia
    const tecnicaExists = await pool.request()
        .input("tecnicaID", sql.Int, tecnicaID)
        .query("SELECT COUNT(*) as count FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID");

    if (tecnicaExists.recordset[0].count === 0) {
        throw new Error('La técnica no existe');
    }

    const nombre = tecnica.Nombre ? tecnica.Nombre.trim() : "";
    const descripcion = tecnica.Descripcion ? tecnica.Descripcion.trim() : "";

    // ============ VALIDACIONES DE NOMBRE ============
    if (!nombre || nombre.trim().length === 0) {
        throw new Error("El nombre es obligatorio y no puede estar vacío.");
    }
    if (nombre.length < 4) {
        throw new Error("El nombre debe tener al menos 4 caracteres.");
    }
    if (nombre.length > 20) {
        throw new Error("El nombre no puede tener más de 20 caracteres.");
    }
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) {
        throw new Error("El nombre solo puede contener letras y espacios (sin números ni caracteres especiales).");
    }

    // Evitar duplicados al actualizar (excluyendo el registro actual)
    const nombreDuplicado = await pool.request()
        .input("nombre", sql.VarChar(20), nombre)
        .input("tecnicaID", sql.Int, tecnicaID)
        .query(`
            SELECT COUNT(*) AS count 
            FROM dbo.Tecnicas 
            WHERE LOWER(Nombre) = LOWER(@nombre)
            AND TecnicaID <> @tecnicaID
        `);

    if (nombreDuplicado.recordset[0].count > 0) {
        throw new Error(`Ya existe otra técnica con el nombre "${nombre}".`);
    }

    // ============ VALIDACIONES DE IMAGEN ============
    const imagenTecnica = validarImagenTecnica(tecnica.ImagenTecnica);

    // ============ VALIDACIONES DE DESCRIPCIÓN ============
    if (!descripcion || descripcion.trim().length === 0) {
        throw new Error("La descripción es obligatoria y no puede estar vacía.");
    }
    if (descripcion.length < 10) {
        throw new Error("La descripción debe tener al menos 10 caracteres.");
    }
    if (descripcion.length > 255) {
        throw new Error("La descripción no puede tener más de 255 caracteres.");
    }
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]+$/.test(descripcion)) {
        throw new Error("La descripción solo puede contener letras, números y espacios (sin caracteres especiales).");
    }

    // ============ VALIDACIÓN DE ESTADO ============
    if (tecnica.Estado === undefined || tecnica.Estado === null) {
        throw new Error("El estado es obligatorio.");
    }
    if (typeof tecnica.Estado !== 'boolean' && tecnica.Estado !== 0 && tecnica.Estado !== 1) {
        throw new Error("El estado debe ser un valor booleano (true/false o 0/1).");
    }

    // Actualizar la técnica
    const result = await pool.request()
        .input("tecnicaID", sql.Int, tecnicaID)
        .input("nombre", sql.VarChar(20), nombre)
        .input("imagen", sql.VarChar(255), imagenTecnica)
        .input("descripcion", sql.VarChar(255), descripcion)
        .input("estado", sql.Bit, tecnica.Estado)
        .query(`
            UPDATE dbo.Tecnicas 
            SET Nombre = @nombre, ImagenTecnica = @imagen, 
                Descripcion = @descripcion, Estado = @estado
            WHERE TecnicaID = @tecnicaID;
            SELECT * FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID;
        `);

    return result.recordset[0];
}

// =================== ELIMINAR ===================
async function deleteTecnica(tecnicaID) {
    const pool = await poolPromise;
    if (!pool) throw new Error('No hay conexión disponible a la base de datos');

    const tecnicaExists = await pool.request()
        .input("tecnicaID", sql.Int, tecnicaID)
        .query("SELECT * FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID");

    if (tecnicaExists.recordset.length === 0) {
        throw new Error('La técnica no existe');
    }

    const result = await pool.request()
        .input("tecnicaID", sql.Int, tecnicaID)
        .query("DELETE FROM dbo.Tecnicas WHERE TecnicaID = @tecnicaID");

    return {
        deleted: true,
        tecnica: tecnicaExists.recordset[0],
        rowsAffected: result.rowsAffected[0]
    };
}

module.exports = {
    getTecnicas,
    getTecnicaById,
    createTecnica,
    updateTecnica,
    deleteTecnica
};