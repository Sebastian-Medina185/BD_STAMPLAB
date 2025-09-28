// models/disenos.js
const { sql, poolPromise } = require("../db");

async function getDisenos() {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM dbo.Diseños");
    return result.recordset;
}

async function getDisenoById(id) {
    const pool = await poolPromise;
    const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM dbo.Diseños WHERE DiseñoID = @id");
    return result.recordset[0];
}

module.exports = { getDisenos, getDisenoById };