import db from "./models/index";

const run_synce = async ()=>{
await db.sequelize.query('SET unique_checks = 0;');
await db.sequelize.query('SET foreign_key_checks = 0;');
await db.sequelize.sync({ force: true })
  .then(async () => {
    await db.sequelize.query('SET unique_checks = 1;');
    await db.sequelize.query('SET foreign_key_checks = 1;');
    console.log("Database synced!");
  })
  .catch((err: any) => {
    console.error("Error syncing database:", err);
  });
}

run_synce();

