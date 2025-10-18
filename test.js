const {Ollama } = require('ollama');
// 通过 new Ollama() 创建一个 Ollama 客户端实例，后续可以通过这个实例调用各种 API 方法
const ollama = new Ollama();
const DEFAULT_MODEL = 'gemma3:4b';
const chat = async (ws,req) => {
    // 处理客户端发送的消息
  ws.on('message',async (msg) => {
    const messages = JSON.parse(msg);
    console.log("使用模型：", DEFAULT_MODEL);
    console.log("输入消息：", messages);

    const stream = await ollama.chat({
        // 模型名称
        model: DEFAULT_MODEL,
        // 消息列表 {
       // role: 'user', content: 'Hello!' 
        //}
        messages,
        // 开启流式响应
        stream: true
    })
    
    // 处理流式响应
    for await (const part of stream.itr) {
        const content = part?.message?.content || part?.content || "";
        if (content && ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({
                code: 200,
                data: { content },
                done: false// 表示不是最后一块数据,后面还有数据
            }));
        }
    }
  })
}

module.exports = {
    chat
}
