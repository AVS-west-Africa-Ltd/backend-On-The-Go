"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const db = {};
const basename = path_1.default.basename(__filename);
fs_1.default.readdirSync(__dirname)
    .filter((file) => file !== basename && (file.endsWith(".ts") || file.endsWith(".js")))
    .forEach((file) => {
    const modelPath = path_1.default.join(__dirname, file);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const modelModule = require(modelPath);
    const initModel = modelModule.default || modelModule;
    const model = initModel(database_1.sequelize);
    db[model.name] = model;
});
// Run associations
Object.keys(db).forEach((modelName) => {
    const model = db[modelName];
    if (model && typeof model.associate === "function") {
        model.associate(db);
    }
});
db.sequelize = database_1.sequelize;
db.Sequelize = sequelize_1.Sequelize;
exports.default = db;
