require("reflect-metadata");
const { DataSource } = require("typeorm");
const { User } = require("./entity/User.js");
const { Article } = require("./entity/Article.js");

require('dotenv').config()

const AppDataSource = new DataSource({
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: false,
    logging: false,
    entities: [User, Article],
    migrations: [],
    subscribers: [],
    cli: {
        migrationsDir: "src/migrations" // 用于 CLI 生成迁移的目录
    }
})
module.exports = { AppDataSource };