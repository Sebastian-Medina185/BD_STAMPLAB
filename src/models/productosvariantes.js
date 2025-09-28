// ✅ Importaciones necesarias para definir el modelo
const { DataTypes } = require("sequelize");
const db = require('../db.js');
const Productos = require("./productos");
const Tallas = require("./tallas");
const Colores = require("./colores");

// ✅ Definición del modelo productos_variantes
const ProductosVariantes = db.define("productos_variantes", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Productos,
      key: "id"
    },
    onDelete: "CASCADE"
  },
  tallaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Tallas,
      key: "id"
    },
    onDelete: "CASCADE"
  },
  colorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Colores,
      key: "id"
    },
    onDelete: "CASCADE"
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: "productos_variantes",
  timestamps: true
});

// 🔗 Relaciones entre tablas
ProductosVariantes.belongsTo(Productos, { foreignKey: "productoId", as: "producto" });
ProductosVariantes.belongsTo(Tallas, { foreignKey: "tallaId", as: "talla" });
ProductosVariantes.belongsTo(Colores, { foreignKey: "colorId", as: "color" });

Productos.hasMany(ProductosVariantes, { foreignKey: "productoId", as: "variantes" });
Tallas.hasMany(ProductosVariantes, { foreignKey: "tallaId", as: "variantes" });
Colores.hasMany(ProductosVariantes, { foreignKey: "colorId", as: "variantes" });

module.exports = ProductosVariantes;
