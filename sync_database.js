const db = require("./models");
const run_synce = async ()=>{
await db.sequelize.query('SET unique_checks = 0;');
await db.sequelize.query('SET foreign_key_checks = 0;');
db.Activity.sync({ alter: true })
  .then(async () => {
    await db.sequelize.query('SET unique_checks = 1;');
    await db.sequelize.query('SET foreign_key_checks = 1;');
    console.log("Database synced!");
  })
  .catch((err) => {
    console.error("Error syncing database:", err);
  });
}

run_synce();

