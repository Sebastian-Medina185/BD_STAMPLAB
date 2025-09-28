const express = require('express');
const bodyparser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();


const app = express();

app.use(cors());
// capturar el body
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

// Función para cargar rutas de forma segura
function safeRequire(routePath, routeName) {
    try {
        // Siempre agregar extensión .js
        const fullPath = path.join(__dirname, `${routePath}.js`);

        if (fs.existsSync(fullPath)) {
            const route = require(fullPath);
            if (typeof route === 'function') {
                console.log(` Ruta cargada: ${routeName}`);
                return route;
            } else {
                console.log(`  Ruta ${routeName} no exporta una función válida`);
                return null;
            }
        } else {
            console.log(`  Archivo no encontrado: ${fullPath}`);
            return null;
        }
    } catch (error) {
        console.log(` Error cargando ruta ${routeName}:`, error.message);
        return null;
    }
}

// Lista de todas las rutas que queremos cargar
const routes = [
    { path: './src/routes/usuarios', name: 'usuarios', endpoint: '/usuarios' },
    { path: './src/routes/productos', name: 'productos', endpoint: '/productos' },
    { path: './src/routes/colores', name: 'colores', endpoint: '/colores' },
    { path: './src/routes/cotizaciones', name: 'cotizaciones', endpoint: '/cotizaciones' },
    { path: './src/routes/detallecotizacion', name: 'detalleCotizacion', endpoint: '/detalleCotizacion' },
    { path: './src/routes/detallediseños', name: 'detalleDiseno', endpoint: '/detalleDiseno' },
    { path: './src/routes/detallepedido', name: 'detallePedido', endpoint: '/detallePedido' },
    { path: './src/routes/diseños', name: 'disenos', endpoint: '/disenos' },
    { path: './src/routes/insumos', name: 'insumos', endpoint: '/insumos' },
    { path: './src/routes/partes', name: 'partes', endpoint: '/partes' },
    { path: './src/routes/pedidos', name: 'pedidos', endpoint: '/pedidos' },
    { path: './src/routes/productosvariantes', name: 'productosVariantes', endpoint: '/productosVariantes' },
    { path: './src/routes/proveedores', name: 'proveedores', endpoint: '/proveedores' },
    { path: './src/routes/roles', name: 'roles', endpoint: '/roles' },
    { path: './src/routes/tallas', name: 'tallas', endpoint: '/tallas' },
    { path: './src/routes/tecnicas', name: 'tecnicas', endpoint: '/tecnicas' },
    { path: './src/routes/telas', name: 'telas', endpoint: '/telas' }
];

// Cargar rutas de forma segura
console.log('\n Cargando rutas...');
const loadedRoutes = [];
const availableEndpoints = {};

routes.forEach(route => {
    const routeHandler = safeRequire(route.path, route.name);
    if (routeHandler) {
        app.use(route.endpoint, routeHandler);
        loadedRoutes.push(route.name);
        availableEndpoints[route.name] = route.endpoint;
    }
});

console.log(`\n Rutas cargadas exitosamente: ${loadedRoutes.length}/${routes.length}`);
console.log(` Rutas disponibles: ${loadedRoutes.join(', ')}`);

// Ruta principal
app.get('/', (req, res) => {
    res.json({
        estado: true,
        mensaje: 'Bienvenido a mi API StampLab ',
        version: '1.0.0',
        database: 'StampLab',
        rutasCargadas: loadedRoutes.length,
        totalRutas: routes.length,
        endpoints: availableEndpoints,
        instrucciones: {
            ejemplo: 'GET /usuarios para obtener todos los usuarios',
            ejemplo2: 'GET /usuarios/1 para obtener usuario con ID 1'
        }
    });
});

// Ruta para probar conexión a BD
app.get('/test-db', async (req, res) => {
    try {
        const { poolPromise } = require('./src/db');
        const pool = await poolPromise;
        
        if (!pool) {
            throw new Error('No hay conexión disponible');
        }
        
        const result = await pool.request().query('SELECT 1 as test, GETDATE() as fecha');
        
        res.json({
            estado: true,
            mensaje: 'Conexión a base de datos exitosa ',
            database: 'StampLab',
            resultado: result.recordset
        });
    } catch (error) {
        console.error('Error en /test-db:', error);
        res.status(500).json({
            estado: false,
            mensaje: 'Error conectando a la base de datos ',
            error: error.message,
            sugerencia: 'Verifica tu archivo .env y la conexión a SQL Server'
        });
    }
});

// Ruta 404
app.use((req, res) => {
    res.status(404).json({
        estado: false,
        mensaje: `Endpoint '${req.originalUrl}' no encontrado`,
        endpointsDisponibles: Object.keys(availableEndpoints).map(key => availableEndpoints[key]),
        sugerencia: "Crea los archivos de rutas en src/routes/ para habilitar más endpoints"
    });
});

// Manejo de errores global
app.use((error, req, res, next) => {
    console.error('Error global:', error);
    res.status(500).json({
        estado: false,
        mensaje: 'Error interno del servidor',
        error: error.message
    });
});

// iniciar el servidor
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => { 
    console.log(`\n Servidor corriendo en http://localhost:${PORT}`);
    console.log(` Base de datos: StampLab`);
    console.log(` Endpoints principales:`);
    console.log(`   - GET / (información de la API)`);
    console.log(`   - GET /test-db (prueba de conexión)`);
    
    if (loadedRoutes.length > 0) {
        console.log(` Endpoints de datos disponibles:`);
        Object.keys(availableEndpoints).forEach(key => {
            console.log(`   - GET ${availableEndpoints[key]}`);
            console.log(`   - GET ${availableEndpoints[key]}/:id`);
        });
    }
    
    console.log(`\n Para crear más rutas, agrega archivos en src/routes/`);
    console.log(` Total de rutas intentadas: ${routes.length}`);
    console.log(` Rutas cargadas exitosamente: ${loadedRoutes.length}`);
});
