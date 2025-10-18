const { Ollama } = require('ollama');

// 初始化Ollama客户端
const ollama = new Ollama();
const DEFAULT_MODEL = 'gemma3:4b';

// 历史消息的存储
const messageHistory = [];

// 处理WebSocket连接的核心函数
const handleChatWebSocket = async (ws, req) => {
    try {
        // 监听客户端消息
        ws.on('message', async (data) => {
            try {
                // 解析客户端发送的JSON数据
                const parsedData = JSON.parse(data);
                console.log("使用模型：", DEFAULT_MODEL);
                console.log("输入消息：", parsedData);

                // 确保消息格式正确，提取字符串内容
                // 这里假设客户端发送的消息是 { messages: [{ role: 'user', content: 'xxx' }] } 格式
                if (Array.isArray(parsedData.messages) && parsedData.messages.length > 0) {
                    // 获取用户消息内容
                    const userMessage = parsedData.messages[0];
                    // 确保content是字符串类型
                    const content = typeof userMessage.content === 'string' ? userMessage.content : String(userMessage.content);
                    // 存储用户消息
                    messageHistory.push({ role: 'user', content });
              
                    
                    // 开启流式对话
                    const stream = await ollama.chat({
                        model: DEFAULT_MODEL,// 模型名称
                        messages: messageHistory,
                        stream: true// 开启流式响应
                    });
                    // console.log("当前消息历史：", messageHistory);
                    // 存储模型的响应
                    let assistantFullContent = ''; // 存储AI的完整回复

                    // 逐块推送内容
                    for await (const chunk of stream.itr) {
                        const chunkContent = chunk?.message?.content || chunk?.content || "";
                        if (chunkContent && ws.readyState === ws.OPEN) {
                            assistantFullContent += chunkContent; // 累加AI的回复内容
                            ws.send(JSON.stringify({
                                code: 200,
                                data: { content: chunkContent },
                                done: false//表示不是最后一块数据,后面还有数据
                            }));
                        }
                    }

                    // 发送完成通知
                    if (ws.readyState === ws.OPEN) {
                        // 存储模型的响应
                        messageHistory.push({ role: 'assistant', content: assistantFullContent });
                        // 发送完成通知
                        ws.send(JSON.stringify({
                            code: 201,
                            message: "对话完成",
                            done: true
                        }));
                    }
                // } else {
                //     // 如果消息格式不正确，返回错误
                //     if (ws.readyState === ws.OPEN) {
                //         ws.send(JSON.stringify({
                //             code: 400,
                //             error: "消息格式不正确，需要包含messages数组"
                //         }));
                //     }
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