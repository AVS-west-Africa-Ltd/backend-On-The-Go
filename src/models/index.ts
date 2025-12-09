import fs from "fs";
import path from "path";
import { Sequelize, Model, ModelStatic } from "sequelize";
import { sequelize } from "../config/database";

export interface DB {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
   [modelName: string]: ModelStatic<Model<any, any>> | any;
}

const db = {} as DB;

const basename = path.basename(__filename);

fs.readdirSync(__dirname)
  .filter((file) => file !== basename && (file.endsWith(".ts") || file.endsWith(".js")))
  .forEach((file) => {
    const modelPath = path.join(__dirname, file);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const modelModule = require(modelPath);
    const initModel = modelModule.default || modelModule;

const model = initModel(sequelize);
db[model.name] = model;
  });

// Run associations
Object.keys(db).forEach((modelName) => {
  const model = db[modelName] as any;
  if (model && typeof model.associate === "function") {
    model.associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;