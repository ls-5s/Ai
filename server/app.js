const express = require('express');
const expressWs = require('express-ws');
const cors = require('cors'); // 添加 CORS 模块
const app = express();
const wsInstance = expressWs(app);
const chatRouter = require('./router/chat');
// // 定义聊天历史文件的完整路径
// const CHAT_HISTORY_FILE = path.join(__dirname, './data.json');


// 配置 CORS，允许所有源（开发阶段方便测试，生产环境建议指定具体源）
app.use(cors());
// 解析 JSON 格式的请求体
app.use(express.json());

// 挂载路由
app.use('/chat', chatRouter);







app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        console.log('JWT验证失败:', err.message);
        return res.status(401).json({
            code: 401,
            message: 'Token验证失败',
            error: err.message
        });
    }
    console.log(err)
    res.status(500).json({
        code: 500,
        message: err.message,
        data: null
    })
})
// // 初始化数据库并启动服务器
// AppDataSource.initialize()
//     .then(() => {
//         console.log("数据库连接已建立");
app.listen(3000, '0.0.0.0', () => {

    console.log(' - 本机访问：http://localhost:3000');

});
// })
// .catch((error) => {
//     console.error("数据库连接错误:", error);
// });
