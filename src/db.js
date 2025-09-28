// db.js
const sql = require('mssql');

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASS || 'tu_contraseña',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'tu_base_de_datos',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// ✅ Crear y exportar la conexión
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Conectado a SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('❌ Error conectando a SQL Server:', err.message);
    throw err;
  });

module.exports = { sql, poolPromise };
