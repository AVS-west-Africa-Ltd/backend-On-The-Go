require("dotenv").config();
const { Sequelize } = require("sequelize");
const path = require("path");
const log = require('../utils/logger'); 


const sequelize = new Sequelize(
  process.env.DB_DATABASE || 'otgtestdb',
  process.env.DB_USERNAME || 'root',
  process.env.DB_PASSWORD || '12345678',
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database: ", error);
  });

  console.log(process.env.DB_PASSWORD);

module.exports = sequelize;
