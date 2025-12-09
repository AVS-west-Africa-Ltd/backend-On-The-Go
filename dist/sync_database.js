"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./models/index"));
const run_synce = async () => {
    await index_1.default.sequelize.query('SET unique_checks = 0;');
    await index_1.default.sequelize.query('SET foreign_key_checks = 0;');
    await index_1.default.sequelize.sync({ force: true })
        .then(async () => {
        await index_1.default.sequelize.query('SET unique_checks = 1;');
        await index_1.default.sequelize.query('SET foreign_key_checks = 1;');
        console.log("Database synced!");
    })
        .catch((err) => {
        console.error("Error syncing database:", err);
    });
};
run_synce();
