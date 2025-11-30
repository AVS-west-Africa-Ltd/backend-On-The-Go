"use strict";
// const fs = require("fs");
// const path = require("path");
// const sequelize = require("../config/database");
// const Sequelize = require("sequelize");
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../config/database");
const db = {};
const basename = path_1.default.basename(__filename);
fs_1.default.readdirSync(__dirname)
    .filter((file) => file !== basename &&
    file.endsWith(".model.ts") // enforce model naming convention
)
    .forEach((file) => {
    const modelModule = require(path_1.default.join(__dirname, file));
    const model = modelModule.default(database_1.sequelize);
    db[model.name] = model;
});
// Run associations
Object.keys(db).forEach((modelName) => {
    const model = db[modelName];
    if (model.associate) {
        model.associate(db);
    }
});
exports.default = db;
// Dynamically import each model and inject sequelize & DataTypes
// fs.readdirSync(__dirname)
//   .filter(file => file !== "index.js" && file.endsWith(".js"))
//   .forEach(file => {
//     const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
//     db[model.name] = model;
// });
// // Run all associations AFTER all models are loaded
// Object.keys(db).forEach(modelName => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });
// db.sequelize = sequelize;
// db.Sequelize = Sequelize;
// module.exports = db;
