const express = require('express');
const expressWs = require('express-ws');
const { handleChatWebSocket } = require('./service/chat.js');
const cors = require('cors');
const app = express();

expressWs(app); // 为 Express 启用 WebSocket 支持

// 启用 CORS 中间件
app.use(cors());
app.use(express.json());

// 处理WebSocket路由
app.ws('/chat', handleChatWebSocket);



app.listen(3000, () => {
    console.log('服务器运行在 http://localhost:3000');
    console.log(`WebSocket 对话地址：ws://localhost:3000/chat（使用模型：gemma3:4b`);
});
