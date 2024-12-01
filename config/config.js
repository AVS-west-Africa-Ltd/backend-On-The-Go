
module.exports = {
    development: {
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE_DEV || 'default_dev_db',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
    },
    test: {
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE_TEST || 'default_dev_db',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
    },
    production: {
        username: process.env.DB_USERNAME_PROD || 'root',
        password: process.env.DB_PASSWORD_PROD || '',
        database: process.env.DB_DATABASE_PROD || 'default_prod_db',
        host: process.env.DB_HOST_PROD || 'localhost',
        port: process.env.DB_PORT_PROD || 3306,
        dialect: 'mysql',
    },
};
