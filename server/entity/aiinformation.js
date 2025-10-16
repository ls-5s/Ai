const { EntitySchema } = require("typeorm");

const Article = new EntitySchema({
    name: "Article",
    tableName: "articles",
    columns: {
        // 主键（自增整数示例，根据需求选 UUID）
        id: {
            primary: true,
            type: "int",
            generated: "increment"
        },
        title: {
            type: "varchar",
            length: 255,
            nullable: false,
            unique: false
        },
        type: {
            type: "varchar",
            length: 255,
            nullable: false
        },
        content: {
            type: "text",
            nullable: false
        },
        markdownContent: {
            type: "text",
            nullable: false
        },
        createTime: {
            type: "varchar",
            length: 255,
            nullable: false
        }
    },
   
});

module.exports = { Article };