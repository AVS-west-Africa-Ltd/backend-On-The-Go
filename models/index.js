const fs = require("fs");
const path = require("path");
const sequelize = require("../config/database");
const Sequelize = require("sequelize");

const db = {};

// Dynamically import each model and inject sequelize & DataTypes
fs.readdirSync(__dirname)
  .filter(file => file !== "index.js" && file.endsWith(".js"))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

  console.log(db);

// Run all associations AFTER all models are loaded
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;