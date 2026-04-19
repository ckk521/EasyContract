/**
 * Agent API - 智能体对话接口
 */
import { apiClient as client } from "./client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  confidence?: number;
  tool_calls?: Array<{
    tool: string;
    arguments: Record<string, any>;
  }>;
  timestamp: Date;
}

export interface Conversation {
  id: number;
  status: string;
  current_intent?: string;
  created_at: string;
  updated_at: string;
}

export interface SendMessageParams {
  conversation_id: number;
  message: string;
}

/**
 * 获取欢迎语
 */
export async function getWelcome(): Promise<{ message: string }> {
  const response = await client.get("/api/agent/welcome");
  return response.data;
}

/**
 * 创建新会话
 */
export async function createConversation(): Promise<{ conversation_id: number }> {
  const response = await client.post("/api/agent/conversations");
  return response.data;
}

/**
 * 获取会话列表
 */
export async function getConversations(page = 1, pageSize = 10) {
  const response = await client.get("/api/agent/conversations", {
    params: { page, page_size: pageSize },
  });
  return response.data;
}

/**
 * 获取消息历史
 */
export async function getMessages(conversationId: number, page = 1, pageSize = 20) {
  const response = await client.get(`/api/agent/conversations/${conversationId}/messages`, {
    params: { page, page_size: pageSize },
  });
  return response.data;
}

/**
 * 发送消息并获取 SSE 流式响应
 * 使用 fetch + ReadableStream 而非 EventSource（支持 POST）
 */
export function sendMessageStream(
  params: SendMessageParams,
  callbacks: {
    onIntent?: (data: { intent: string; confidence: number; sub_intent?: string }) => void;
    onContent?: (data: { content: string }) => void;
    onToolCalls?: (data: { tools: Array<{ tool: string; arguments: Record<string, any> }> }) => void;
    onReflection?: (data: any) => void;
    onDone?: (data: { needs_clarification: boolean }) => void;
    onError?: (error: string) => void;
  }
): () => void {
  const { conversation_id, message } = params;

  // 使用 Bearer token 认证
  const token = localStorage.getItem("token");

  let aborted = false;

  // 使用 fetch + ReadableStream 支持 POST
  fetch(`http://localhost:8080/api/agent/conversations/${conversation_id}/chat?message=${encodeURIComponent(message)}`, {
    method: "POST",
    headers: {
      "Accept": "text/event-stream",
      "Cache-Control": "no-cache",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
  }).then(async (response) => {
    if (!response.ok) {
      callbacks.onError?.(`请求失败: ${response.status}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError?.("无法读取响应");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        if (aborted) break;
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 按完整事件解析（事件以空行分隔）
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventBlock of events) {
          const lines = eventBlock.split("\n");
          let eventType = "";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataStr = line.slice(5).trim();
            }
          }

          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            switch (eventType) {
              case "intent":
                callbacks.onIntent?.(data);
                break;
              case "content":
                callbacks.onContent?.(data);
                break;
              case "tool":
                // Handle single tool result from backend
                callbacks.onToolCalls?.({ tools: [data] });
                break;
              case "tool_calls":
                callbacks.onToolCalls?.(data);
                break;
              case "reflection":
                callbacks.onReflection?.(data);
                break;
              case "done":
                callbacks.onDone?.(data);
                break;
              case "error":
                callbacks.onError?.(data.error || "未知错误");
                break;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    } catch (e) {
      if (!aborted) {
        callbacks.onError?.("连接中断");
      }
    }
  }).catch((error) => {
    if (!aborted) {
      callbacks.onError?.(`连接失败: ${error.message}`);
    }
  });

  // 返回取消函数
  return () => {
    aborted = true;
  };
}

/**
 * 删除会话
 */
export async function deleteConversation(conversationId: number) {
  const response = await client.delete(`/api/agent/conversations/${conversationId}`);
  return response.data;
}

export const agentApi = {
  getWelcome,
  createConversation,
  getConversations,
  getMessages,
  sendMessageStream,
  deleteConversation,
};
