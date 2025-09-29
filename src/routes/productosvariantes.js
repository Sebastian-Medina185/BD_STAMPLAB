  const express = require('express');
  const router = express.Router();
  const db = require('../db'); // conexión a SQL Server

  
  router.post('/', async (req, res) => {
    const { ProductoID, ColorID, TallaID, Stock, Imagen, Precio, Estado } = req.body;

    if (!ProductoID || !ColorID || !TallaID || !Stock || !Imagen || !Precio || Estado === undefined) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
      const pool = await db.poolPromise;
      await pool.request()
        .input('ProductoID', db.sql.Int, ProductoID)
        .input('ColorID', db.sql.Int, ColorID)
        .input('TallaID', db.sql.Int, TallaID)
        .input('Stock', db.sql.Int, Stock)
        .input('Imagen', db.sql.VarChar, Imagen)
        .input('Precio', db.sql.Decimal(10, 2), Precio)
        .input('Estado', db.sql.Bit, Estado)
        .query(`
          INSERT INTO dbo.ProductosVariantes 
          (ProductoID, ColorID, TallaID, Stock, Imagen, Precio, Estado)
          VALUES (@ProductoID, @ColorID, @TallaID, @Stock, @Imagen, @Precio, @Estado)
        `);

      res.status(201).json({ message: 'Variante creada exitosamente.' });
    } catch (error) {
      console.error(' Error al crear variante:', error);
      res.status(500).json({ message: 'Error del servidor.' });
    }
  });

  
  router.get('/', async (req, res) => {
    try {
      const pool = await db.poolPromise;
      const result = await pool.request().query(`
        SELECT 
          v.VarianteID, 
          p.Nombre AS Producto, 
          c.Nombre AS Color, 
          t.Nombre AS Talla, 
          v.Stock, 
          v.Imagen, 
          v.Precio, 
          v.Estado
        FROM dbo.ProductosVariantes v
        JOIN dbo.Productos p ON v.ProductoID = p.ProductoID
        JOIN dbo.Colores c ON v.ColorID = c.ColorID
        JOIN dbo.Tallas t ON v.TallaID = t.TallaID
        ORDER BY v.VarianteID DESC
      `);

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error('Error al obtener variantes:', error);
      res.status(500).json({ message: 'Error del servidor.' });
    }
  });

  // Obtener variantes por producto
  router.get('/producto/:ProductoID', async (req, res) => {
    const { ProductoID } = req.params;

    try {
      const pool = await db.poolPromise;
      const result = await pool.request()
        .input('ProductoID', db.sql.Int, ProductoID)
        .query(`SELECT * FROM dbo.ProductosVariantes WHERE ProductoID = @ProductoID`);

      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'No se encontraron variantes para este producto.' });
      }

      res.status(200).json(result.recordset);
    } catch (error) {
      console.error(' Error al obtener variantes por producto:', error);
      res.status(500).json({ message: 'Error del servidor.' });
    }
  });

  // Actualizar variante
  router.put('/:VarianteID', async (req, res) => {
    const { VarianteID } = req.params;
    const { ColorID, TallaID, Stock, Imagen, Precio, Estado } = req.body;

    try {
      const pool = await db.poolPromise;
      const result = await pool.request()
        .input('ColorID', db.sql.Int, ColorID)
        .input('TallaID', db.sql.Int, TallaID)
        .input('Stock', db.sql.Int, Stock)
        .input('Imagen', db.sql.VarChar, Imagen)
        .input('Precio', db.sql.Decimal(10, 2), Precio)
        .input('Estado', db.sql.Bit, Estado)
        .input('VarianteID', db.sql.Int, VarianteID)
        .query(`
          UPDATE dbo.ProductosVariantes 
          SET ColorID = @ColorID, 
              TallaID = @TallaID, 
              Stock = @Stock, 
              Imagen = @Imagen, 
              Precio = @Precio, 
              Estado = @Estado
          WHERE VarianteID = @VarianteID
        `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: 'Variante no encontrada.' });
      }

      res.status(200).json({ message: 'Variante actualizada correctamente.' });
    } catch (error) {
      console.error(' Error al actualizar variante:', error);
      res.status(500).json({ message: 'Error del servidor.' });
    }
  });

  // Eliminar variante
  router.delete('/:VarianteID', async (req, res) => {
    const { VarianteID } = req.params;

    try {
      const pool = await db.poolPromise;
      const result = await pool.request()
        .input('VarianteID', db.sql.Int, VarianteID)
        .query(`DELETE FROM dbo.ProductosVariantes WHERE VarianteID = @VarianteID`);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: 'Variante no encontrada.' });
      }

      res.status(200).json({ message: 'Variante eliminada correctamente.' });
    } catch (error) {
      console.error(' Error al eliminar variante:', error);
      res.status(500).json({ message: 'Error del servidor.' });
    }
  });

  module.exports = router;
