// const fs = require("fs");
// const path = require("path");
// const sequelize = require("../config/database");
// const Sequelize = require("sequelize");

import fs from "fs";
import path from "path";
import { Sequelize, Model, ModelStatic } from "sequelize";
import { sequelize } from "../config/database";

export interface DB {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
   [modelName: string]: ModelStatic<Model<any, any>> | any;
}

const db: any = {};

const basename = path.basename(__filename);

fs.readdirSync(__dirname)
  .filter(
    (file) =>
      file !== basename &&
      file.endsWith(".model.ts") // enforce model naming convention
  )
  .forEach((file) => {
    const modelModule = require(path.join(__dirname, file));
    const model = modelModule.default(sequelize);
    db[model.name] = model;
  });

// Run associations
Object.keys(db).forEach((modelName) => {
  const model = db[modelName] as any;
  if (model.associate) {
    model.associate(db);
  }
});

export default db;

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