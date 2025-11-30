// require("dotenv").config();
// const { Sequelize } = require("sequelize");
// const path = require("path");
// const log = require('../utils/logger'); 

import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const port = parseInt(process.env.DB_PORT ?? "", 10);

export const sequelize = new Sequelize(
  process.env.DB_DATABASE || 'otgtestdb',
  process.env.DB_USERNAME || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST,
    port: isNaN(port) ? 3306 : port,
    dialect: "mysql",
    logging: false,
  }
);

// sequelize
//   .authenticate()
//   .then(() => {
//     console.log("Connection has been established successfully.");
//   })
//   .catch((error) => {
//     console.error("Unable to connect to the database: ", error);
//   });

  export async function connectDB() {
    try {
      await sequelize.authenticate();
      console.log("Connection has been established successfully.");
    } catch (error: any) {
      console.error("Unable to connect to the database: ", error);
      if (error.original && error.original.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error("Sequelize parent error:", error.original);
      }
      console.error("Database connection error details:", error.message);
    }
  }

  // console.log(process.env.DB_PASSWORD);

// module.exports = sequelize;
