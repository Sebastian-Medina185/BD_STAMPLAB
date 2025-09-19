// db.js
const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASS || 'tu_contraseña', // <- usar DB_PASS
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'tu_base_de_datos',
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
  encrypt: false,
  trustServerCertificate: true,
  enableArithAbort: true,
},

    connectionTimeout: 30000,
    requestTimeout: 30000
};

console.log('Intentando conectar a la base de datos...');
console.log('Servidor:', config.server);
console.log('Base de datos:', config.database);

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Conectado a SQL Server exitosamente');
        return pool;
    })
    .catch(err => {
        console.error('Error conectando a la base de datos:', err.message);
        return null;
    });

module.exports = { sql, poolPromise };
