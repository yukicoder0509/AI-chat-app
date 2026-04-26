# System Architecture Diagram

```mermaid
flowchart TD
    subgraph UI["UI Layer (src/components/)"]
        direction TB
        Sidebar["Sidebar · ConversationList"]
        ChatInterface["ChatInterface · MessageList · InputBox · ToolCallBlock"]
        SettingsPanel["SettingsPanel · API · Model · Routing · MCP"]
        MemoryPanel["MemoryPanel"]
    end

    App["App.tsx — orchestrates hooks · routes tool calls · manages modals"]

    subgraph Hooks["Hooks (src/hooks/)"]
        direction TB
        useChat["useChat — send · stream · tool dispatch · attachments"]
        useMemory["useMemory — inject memories · extract facts · CRUD"]
        useTools["useTools — MCP lifecycle · connect · execute"]
        useRouting["useRouting — auto model selection · task classify"]
        useModels["useModels — fetch /v1/models"]
        useSettings["useSettings — settings mutations"]
    end

    subgraph State["Zustand Stores (src/app/store/)"]
        direction TB
        ChatStore["useChatStore — conversations · messages · streaming state"]
        AppStore["useAppStore — settings · apiConfig · error"]
    end

    subgraph Svc["Services (src/services/)"]
        direction TB
        OpenAIClient["OpenAIClient — streamChatCompletion() · fetchModels()"]
        streamChat["streamChat — SSE parse · tool call accumulation · callbacks"]
        McpClient["McpClient — JSON-RPC 2.0 · initialize · listTools · callTool"]
        MemExtractor["memoryExtractor — extractFacts() · LLM call · dedup"]
        TaskRouter["taskRouter — classifyTask() · inferCapabilities() · selectModel()"]
        ImageProcessor["imageProcessor — validate · resize · compress · base64"]
    end

    subgraph Persist["Persistence (localStorage)"]
        direction TB
        LS1["ai-chatroom-conversations"]
        LS2["ai-chatroom-settings · app-store"]
        LS3["ai-chatroom-memories"]
        LS4["ai-chatroom-mcp-servers"]
        LS5["ai-chatroom-routing-config"]
    end

    subgraph Ext["External Services"]
        direction TB
        LLM["OpenAI-Compatible API"]
        MCPSrv["MCP Servers — HTTP endpoints"]
    end

    UI --> App
    App --> Hooks
    Hooks --> State
    Hooks --> Svc
    State --> Persist
    Svc --> Persist
    OpenAIClient -->|REST · SSE| LLM
    MemExtractor -->|LLM call| LLM
    McpClient -->|JSON-RPC 2.0| MCPSrv

    classDef ui fill:#dbeafe,stroke:#3b82f6,color:#3b82f6
    classDef hook fill:#dcfce7,stroke:#16a34a,color:#16a34a
    classDef store fill:#fef9c3,stroke:#ca8a04,color:#ca8a04
    classDef svc fill:#fce7f3,stroke:#db2777,color:#db2777
    classDef ls fill:#f3e8ff,stroke:#9333ea,color:#9333ea
    classDef ext fill:#ffedd5,stroke:#ea580c,color:#ea580c

    class Sidebar,ChatInterface,SettingsPanel,MemoryPanel ui
    class useChat,useMemory,useTools,useRouting,useModels,useSettings hook
    class ChatStore,AppStore store
    class OpenAIClient,streamChat,McpClient,MemExtractor,TaskRouter,ImageProcessor svc
    class LS1,LS2,LS3,LS4,LS5 ls
    class LLM,MCPSrv ext
```

## Layer Reference

| Layer                     | Color          | Role                                        |
| ------------------------- | -------------- | ------------------------------------------- |
| **UI** (blue)             | Components     | Render-only, no business logic              |
| **Hooks** (green)         | Orchestration  | Connect UI to stores & services             |
| **Stores** (yellow)       | State          | Zustand global state + persistence triggers |
| **Services** (pink)       | Business logic | API clients, storage CRUD, algorithms       |
| **localStorage** (purple) | Persistence    | Five namespaced keys, all JSON              |
| **External** (orange)     | I/O            | OpenAI-compatible LLM API + MCP servers     |

## Message Send Flow (7 steps)

1. User input + attachment arrives at `InputBox`
2. Image resized/compressed via `imageProcessor` (max 1920px, JPEG 80%)
3. Model resolved — if `"auto"`, `taskRouter` classifies task and picks model
4. API messages built with conversation history + injected memories (last 10 facts)
5. Streamed to LLM via SSE; chunks dispatched to `useChatStore`
6. On `finish_reason: "tool_calls"`, tools executed (MCP servers or memory tools)
7. After completion, `memoryExtractor` fires async LLM call to extract and store new facts
