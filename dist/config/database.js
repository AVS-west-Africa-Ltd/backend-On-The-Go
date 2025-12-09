"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
exports.connectDB = connectDB;
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const port = parseInt(process.env.DB_PORT ?? "", 10);
exports.sequelize = new sequelize_1.Sequelize(process.env.DB_DATABASE || 'otgtestdb', process.env.DB_USERNAME || 'root', process.env.DB_PASSWORD || '', {
    host: process.env.DB_HOST,
    port: isNaN(port) ? 3306 : port,
    dialect: "mysql",
    logging: false,
});
async function connectDB() {
    try {
        await exports.sequelize.authenticate();
        console.log("Connection has been established successfully.");
        // take this out to avoid auto sync
        await exports.sequelize.query('SET unique_checks = 0;');
        await exports.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
        await exports.sequelize.sync();
        // await sequelize.sync({ alter: true });
        await exports.sequelize.query('SET unique_checks = 1;');
        await exports.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
        console.log("All models were synchronized successfully.");
    }
    catch (error) {
        console.error("Unable to connect to the database: ", error);
        if (error.original && error.original.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error("Sequelize parent error:", error.original);
        }
        console.error("Database connection error details:", error.message);
    }
}
