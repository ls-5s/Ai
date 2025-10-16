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
                const { messages } = JSON.parse(data);
                console.log("使用模型：", DEFAULT_MODEL);
                console.log("输入消息：", messages);

                // 开启流式对话
                const stream = await ollama.chat({
                    model: DEFAULT_MODEL,
                    messages,
                    stream: true
                });

                // 逐块推送内容
                for await (const chunk of stream.itr) {
                    const content = chunk?.message?.content || chunk?.content || "";
                    if (content && ws.readyState === ws.OPEN) {
                        ws.send(JSON.stringify({
                            code: 200,
                            data: { content },
                            done: false
                        }));
                    }
                }

                // 发送完成通知
                if (ws.readyState === ws.OPEN) {
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
