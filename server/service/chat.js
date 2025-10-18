const { Ollama } = require('ollama');

// 初始化Ollama客户端
const ollama = new Ollama();
const DEFAULT_MODEL = 'gemma3:4b';

// 处理WebSocket连接的核心函数
const handleChatWebSocket = async (ws, req) => {
    try {
        // 监听客户端消息
        ws.on('message', async (data) => {
            try {
                // 解析客户端发送的JSON数据
                const { messages } = JSON.parse(data);
                console.log("使用模型：", DEFAULT_MODEL);
                console.log("输入消息：", messages);

                // 开启流式对话
                const stream = await ollama.chat({
                    model: DEFAULT_MODEL,// 模型名称
                    messages,
                    // 消息列表 {
                    // role: 'user', content: 'Hello!' 
                    //}
                    stream: true// 开启流式响应
                });

                // 逐块推送内容
                for await (const chunk of stream.itr) {
                    const content = chunk?.message?.content || chunk?.content || "";
                    if (content && ws.readyState === ws.OPEN) {
                        ws.send(JSON.stringify({
                            code: 200,
                            data: { content },
                            done: false//表示不是最后一块数据,后面还有数据
                        }));
                    }
                }


                // 发送完成通知
                // ws.CONNECTING = 0（连接正在建立中）
                // ws.OPEN = 1（连接已打开，可正常通信）
                // ws.CLOSING = 2（连接正在关闭过程中）
                // ws.CLOSED = 3（连接已完全关闭）
                if (ws.readyState === ws.OPEN) {
                    // 发送完成通知ws.open 是1
                    ws.send(JSON.stringify({
                        code: 201,
                        message: "对话完成",
                        done: true
                    }));
                }
            } catch (err) {
                console.error("处理消息出错：", err);
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({
                        code: 500,
                        error: err.message || "处理消息失败"
                    }));
                }
            }
        });

        // 处理连接关闭
        ws.on('close', () => {
            console.log('客户端WebSocket连接已关闭');
        });

        // 处理错误
        ws.on('error', (err) => {
            console.error('WebSocket错误：', err);
        });

    } catch (err) {
        console.error("WebSocket初始化出错：", err);
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({
                code: 500,
                error: err.message || "连接初始化失败"
            }));
        }
    }
};

module.exports = { handleChatWebSocket };
