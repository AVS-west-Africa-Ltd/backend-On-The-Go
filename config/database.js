require("dotenv").config();
const { Sequelize } = require("sequelize");
const path = require("path");

const env = process.env.NODE_ENV || "development";
// const config = require(path.join(__dirname, '../config/config.js'))[env];
const config = require("./config");

// const sequelize = new Sequelize(config.database, config.username, config.password, {
//   host: process.env.DB_HOST || 'localhost',
//   port: process.env.DB_PORT || 3306,
//   dialect: 'mysql',
// });

// const sequelize = new Sequelize(
//   config.development.database,
//   config.development.username,
//   config.development.password,
//   {
//     host: config.development.host,
//     port: config.development.port,
//     dialect: "mysql",
//   }
// );

const sequelize = new Sequelize(
  config.production.database,
  config.production.username,
  config.production.password,
  {
    host: config.production.host,
    port: config.production.port,
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

module.exports = sequelize;
