<template>
  <div class="chat-container">
    <div class="chat-messages">
      <!-- 消息列表 -->
      <div v-for="(msg, index) in messages" :key="index" class="message" :class="msg.role">
        <div class="sender">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
        <div class="content" v-html="parseMarkdown(msg.content)"></div>
      </div>
      <!-- 加载状态 -->
      <div class="loading" v-if="isLoading">正在思考中...</div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <textarea v-model="userInput" placeholder="请输入消息..." @keydown.enter.exact="sendMessage"
        @keydown.enter.shift.prevent></textarea>
      <button @click="sendMessage" :disabled="!userInput.trim() || isLoading">
        发送
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted} from 'vue';
import markdownIt from 'markdown-it';

// 初始化markdown-it实例
const md = markdownIt({
  html: true,        // 允许解析HTML标签
  linkify: true,     // 自动将URL转换为链接
  typographer: true  // 自动替换某些特殊符号为排版符号
});

// 状态管理
const userInput = ref('');
const messages = ref([]);
const isLoading = ref(false);
const ws = ref(null);

// Markdown解析函数
const parseMarkdown = (text) => {
  if (!text) return '';
  return md.render(text);
};

// 初始化WebSocket连接
const initWebSocket = () => {
  // 关闭现有连接（如果存在）
  if (ws.value) {
    ws.value.close();
  }

  // 创建新连接
  ws.value = new WebSocket('ws://localhost:3000/chat');

  // 连接打开时的处理
  ws.value.onopen = () => {
    console.log('WebSocket连接已建立');
  };

  // 接收消息时的处理
  ws.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.done) {
        // 标记加载完成
        isLoading.value = false;
        console.log("对话结束");
      } else if (data.data?.content) {
        // 处理收到的消息
        const lastMessage = messages.value[messages.value.length - 1];

        if (lastMessage && lastMessage.role === 'assistant') {
          // 如果是AI的消息，继续拼接（处理流式响应）
          lastMessage.content += data.data.content;
        } else {
          // 新增AI消息
          messages.value.push({
            role: 'assistant',
            content: data.data.content
          });
        }
      }
    } catch (error) {
      console.error('解析消息失败:', error);
    }
  };

  // 连接关闭时的处理
  ws.value.onclose = (event) => {
    console.log('WebSocket连接已关闭', event);
    // 可以在这里实现自动重连逻辑
    if (event.wasClean) {
      console.log(`连接已关闭，代码: ${event.code}, 原因: ${event.reason}`);
    } else {
      console.error('连接意外关闭，尝试重连...');
      setTimeout(initWebSocket, 3000);
    }
  };

  // 连接错误时的处理
  ws.value.onerror = (error) => {
    console.error('WebSocket错误:', error);
    isLoading.value = false;
  };
};

// 发送消息
const sendMessage = () => {
  const content = userInput.value.trim();
  if (!content || !ws.value || ws.value.readyState !== WebSocket.OPEN || isLoading.value) {
    return;
  }

  // 添加用户消息到列表
  messages.value.push({
    role: 'user',
    content
  });

  // 发送消息到服务器
  ws.value.send(JSON.stringify({
    model: "llama3",
    messages: [{ role: "user", content }]
  }));

  // 清空输入框并标记加载状态
  userInput.value = '';
  isLoading.value = true;
};

// 组件挂载时初始化WebSocket
onMounted(() => {
  initWebSocket();
});

// 组件卸载时关闭WebSocket连接
onUnmounted(() => {
  if (ws.value) {
    ws.value.close(1000, '组件已卸载');
  }
});
</script>

<style scoped>
.chat-container {
  max-width: 800px;
  margin: 20px auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.chat-messages {
  height: 500px;
  overflow-y: auto;
  padding: 20px;
  background-color: #f9fafb;
}

.message {
  margin-bottom: 16px;
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 18px;
  line-height: 1.4;
}

.message.user {
  margin-left: auto;
  background-color: #0ea5e9;
  color: white;
}

.message.assistant {
  margin-right: auto;
  background-color: white;
  border: 1px solid #e5e7eb;
}

.sender {
  font-size: 12px;
  margin-bottom: 4px;
  opacity: 0.8;
}

.loading {
  color: #64748b;
  font-style: italic;
  padding: 10px;
  text-align: center;
}

.input-area {
  display: flex;
  padding: 16px;
  background-color: white;
  border-top: 1px solid #e5e7eb;
}

textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  resize: none;
  outline: none;
  font-size: 14px;
  min-height: 48px;
  max-height: 120px;
}

textarea:focus {
  border-color: #0ea5e9;
}

button {
  margin-left: 12px;
  padding: 0 20px;
  background-color: #0ea5e9;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #0284c7;
}

button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

/* Markdown 样式增强 */
.message .content {
  white-space: pre-wrap;
  word-break: break-word;
}

.message .content pre {
  background-color: #f3f4f6;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  margin: 8px 0;
}

.message .content code {
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
}

.message .content pre code {
  background-color: transparent;
  padding: 0;
}

.message .content h1, .message .content h2, .message .content h3 {
  margin-top: 12px;
  margin-bottom: 8px;
  font-weight: bold;
}

.message .content h1 {
  font-size: 1.5em;
}

.message .content h2 {
  font-size: 1.3em;
}

.message .content h3 {
  font-size: 1.1em;
}

.message .content ul, .message .content ol {
  padding-left: 20px;
  margin: 8px 0;
}

.message .content li {
  margin: 4px 0;
}

.message .content blockquote {
  border-left: 4px solid #0ea5e9;
  padding-left: 12px;
  margin: 8px 0;
  color: #64748b;
}

.message .content img {
  max-width: 100%;
  border-radius: 6px;
}

.message .content a {
  color: #0ea5e9;
  text-decoration: none;
}

.message .content a:hover {
  text-decoration: underline;
}

/* 用户消息的Markdown样式调整 */
.message.user .content pre, .message.user .content code {
  background-color: rgba(255, 255, 255, 0.2);
}

.message.user .content a {
  color: #bfdbfe;
}
</style>