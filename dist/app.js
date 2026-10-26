const translations = {
  "en": {
    "navHome": "Overview",
    "navLearn": "Learn",
    "navSource": "Example source",
    "navArchitecture": "How it fits",
    "navTransports": "Protocols",
    "navStart": "Quick start",
    "navReadiness": "Release status",
    "heroEyebrow": "Open source · Go · pre-1.0",
    "heroTitle": "Multi-protocol<br><span>services in Go.</span>",
    "heroLede": "Serve HTTP, TCP, WebSocket, QUIC, gRPC and other protocols in one Go application. KPro provides component assembly, message routing and lifecycle management.",
    "heroPrimary": "Start learning",
    "heroSecondary": "Run locally",
    "heroDocs": "Framework reference",
    "heroLearningNote": "A runnable project in 9 chapters · Tutorial in Chinese",
    "proofOne": "Queue and concurrency limits",
    "proofTwo": "Shared business logic",
    "proofThree": "Startup, readiness and shutdown",
    "exampleLabel": "Service assembly example",
    "statementKicker": "When KPro is useful",
    "statementTitle": "Several entry points, one application",
    "statementBody": "KPro is useful when different clients need different protocols, while your business rules and service lifecycle belong together.",
    "architectureKicker": "How to build your application",
    "architectureTitle": "Separate protocol handling from business rules",
    "architectureBody": "In the order project, adapters translate requests, the service applies business rules, and the store saves state. These are application modules with explicit connections.",
    "transportKicker": "Choose from your client needs",
    "transportTitle": "Start with the entry points your product needs",
    "transportBody": "Start with a common combination, then adjust it for your clients. See what each protocol is used for and which handlers and request contracts you need to write.",
    "compositionLabel": "SELECTED ENTRY POINTS",
    "selectedLabel": "protocols",
    "sharedLabel": "SHARED LIFECYCLE",
    "sharedItems": "Startup · Endpoint readiness · Shutdown",
    "kindMessage": "Message routing",
    "kindNative": "Native interface",
    "operationsKicker": "Running the application",
    "operationsTitle": "Know when it is ready, and how it stops",
    "operationsBody": "A successful listener is only the start. Configure capacity for the relevant components, observe failures, and give shutdown a defined deadline.",
    "operationsLink": "Read the operations reference",
    "startKicker": "Quick start",
    "startTitle": "Install the CLI and create an HTTP service",
    "startBody": "Use the CLI to start a new HTTP project, then add your own routes and business logic. The order tutorial below is a separate, already implemented application.",
    "startRequirements": "Requires <strong>Go 1.26.9+</strong>. Run the three steps in order in your local terminal.",
    "expectedOutput": "How to verify this step",
    "startTutorial": "Want a complete example? Run and verify the order-service tutorial (Chinese) →",
    "tabInstall": "Install",
    "tabCreate": "Create",
    "tabRun": "Run",
    "copyButton": "Copy",
    "pinNote": "KPro is pre-1.0. Pin an exact version and use the documentation for that release.",
    "readinessKicker": "Version and adoption",
    "readinessTitle": "This site targets KPro v0.2.1",
    "readinessBody": "KPro is pre-1.0 and its APIs are not frozen. Pin the release and use matching documentation. Before adopting it in a deployed service, test your actual protocol combination, workload and shutdown behavior.",
    "apiStability": "API stability",
    "productionChecklist": "Production checklist",
    "roadmap": "Production v1 roadmap",
    "footerText": "KPro · Open-source Go framework for multi-protocol applications.",
    "learnLink": "Start learning (Chinese) →",
    "navScenarios": "Use cases",
    "navExample": "Working example",
    "navOperations": "Operations",
    "scenarioTcpTitle": "HTTP APIs and a TCP client",
    "scenarioTcpBody": "Expose HTTP endpoints for ordinary requests and a TCP message interface for a dedicated client. Both adapters can call the same business service, with listeners started and stopped together.",
    "scenarioBrowserTitle": "HTTP APIs and browser connections",
    "scenarioBrowserBody": "Keep regular HTTP APIs alongside WebSocket connections. Reuse business services while defining the messages and connection behavior your application needs.",
    "scenarioFit": "For a simple HTTP-only service, first consider whether you need component assembly and shared lifecycle management. Start with one protocol and add another when the product needs it.",
    "exampleKicker": "A result you can verify",
    "exampleTitle": "Create over HTTP. Read the same order over TCP.",
    "exampleBody": "The downloadable teaching project connects two protocol adapters to one order service and one store. Follow a single order through a state change.",
    "exampleCreateTitle": "Create an order",
    "exampleCreateBody": "Send the JSON below. A successful request returns HTTP 201 and an order with its own id and pending status.",
    "exampleReadTitle": "Query through TCP",
    "exampleReadBody": "Pass the returned id to the example client. It sends a framed query message and prints the same order in pending state.",
    "exampleCancelTitle": "Cancel over HTTP",
    "exampleCancelBody": "Use the same id in the cancellation URL. The HTTP response returns the order with status changed to cancelled.",
    "exampleReadAgainTitle": "Query again",
    "exampleReadAgainBody": "Run the TCP client again with that id. It now reads cancelled from the same business service and store.",
    "exampleSetup": "Start the downloaded project with its TCP listener enabled:",
    "exampleSummary": "Replace <code>ORDER_ID</code> with the id returned in step 1. Each TCP query reads the current state of that same order.",
    "exampleLessonLink": "Walk through the HTTP + TCP example",
    "exampleSourceLink": "See how the objects are wired",
    "exampleDownload": "Download the runnable project",
    "layerEntryTitle": "1. Protocol adapters",
    "layerEntryBody": "Parse HTTP JSON or a TCP message, call the service, then translate its result into the response expected by that client.",
    "layerBusinessTitle": "2. Business service",
    "layerBusinessBody": "Validate order input and control state changes. The service does not need to know which protocol delivered the request.",
    "layerStoreTitle": "3. Storage contract",
    "layerStoreBody": "The application defines <code>order.Store</code>. Its memory and SQLite implementations provide the same operations for saving and reading orders.",
    "architectureNote": "The composition root creates one service and passes it to both adapters. Adding a protocol entry point does not require a second copy of the order business.",
    "assemblySourceLink": "Read internal/app/app.go",
    "frameworkOwnsTitle": "KPro manages the mounted components",
    "frameworkOwnsBody": "Validate configuration and coordinate startup, readiness and shutdown. Message protocols can also use Router dispatch and configured queue and concurrency limits.",
    "applicationOwnsTitle": "Your application defines the product behavior",
    "applicationOwnsBody": "Define request and message contracts, business rules, authentication, authorization and idempotency. Choose the storage implementation and manage the resources it owns.",
    "storageTitle": "Change storage through an application interface",
    "storageMemoryTitle": "Memory: start with temporary data",
    "storageMemoryBody": "The example stores orders in a process-local map. It is useful for early experiments and tests; stopping the process removes those orders.",
    "storageSqliteTitle": "SQLite: keep data in a local file",
    "storageSqliteBody": "The example uses a SQLite file. Restart with the same database path to read previous orders. This teaching implementation uses one process and one database connection.",
    "storageNote": "Both implementations satisfy the same application contract, so the business service stays unchanged. To add another database, implement and test that contract.",
    "storageLessonLink": "Follow the persistence chapter",
    "presetHttp": "HTTP API",
    "presetOrders": "HTTP + TCP",
    "presetBrowser": "HTTP + WebSocket",
    "useTcp": "Dedicated clients",
    "useQuic": "Stream-based clients",
    "useWebSocket": "Browser connections",
    "useHttp2": "HTTP APIs",
    "useHttp3": "HTTP over QUIC",
    "useSse": "Server-to-browser events",
    "useGrpc": "RPC services",
    "useUdp": "Datagram messages",
    "composerNote": "Use the guidance below to understand the adapter work and request contracts needed for your selected protocols.",
    "operationsLessonLink": "Trace the runnable lifecycle example",
    "lifecycleStartTitle": "Validate, then start",
    "lifecycleStartBody": "Check configuration when creating and mounting components, then wait for managed endpoints to become ready. A return from <code>Start</code> alone does not confirm that every listener started successfully.",
    "lifecycleReadyTitle": "Check the dependencies you actually need",
    "lifecycleReadyBody": "In the teaching app, <code>/livez</code> confirms an HTTP response, while <code>/readyz</code> calls the store health check and returns 200 or 503. The application implements these routes; <code>WaitReady</code> coordinates endpoint startup.",
    "lifecycleCapacityTitle": "Set and observe capacity limits",
    "lifecycleCapacityBody": "Configure message-router queues and concurrency, plus the connection and pending-send limits supported by the chosen transport. Use component metrics and errors to see where requests are waiting or being rejected.",
    "lifecycleStopTitle": "Wait for shutdown before closing storage",
    "lifecycleStopBody": "Cancellation triggers bounded shutdown and drain work. In the example, <code>Wait</code> completes before the application closes SQLite. Storage cleanup belongs to the application; draining a send queue is not a business-delivery guarantee.",
    "tryProjectTitle": "Prefer to explore a complete project first?",
    "tryProjectBody": "The order project already implements create, query and cancel operations, plus memory and SQLite storage. Download it to verify state changes and persistence before reading how it is assembled.",
    "tryProjectDownload": "Download the order project",
    "faqSingleTitle": "Do I have to use several protocols?",
    "faqSingleBody": "No. Start with the HTTP entry point you need today. Mount another component when a client requirement justifies it, and decide which business services should be shared.",
    "faqReplaceTitle": "Does KPro replace routing and storage code?",
    "faqReplaceBody": "KPro provides protocol components and dispatch mechanisms. You still register routes or messages, implement request contracts and business behavior, and choose and wire storage. It does not automatically turn an HTTP route into a TCP API.",
    "faqProductTitle": "Is the order example a finished business product?",
    "faqProductBody": "It is a runnable teaching application, with explicit limits. It does not include accounts, payments, inventory or subscriptions. Use it to understand the structure, then design and test the requirements of your own product.",
    "protocolDefaultHttp": "Register HTTP routes, parse request data and call your business service.",
    "protocolDefaultTcp": "Define message IDs and payloads, select a frame codec and call the same business service from the TCP adapter."
  },
  "zh": {
    "navHome": "概览",
    "navLearn": "学习",
    "navSource": "示例源码",
    "navArchitecture": "开发方式",
    "navTransports": "协议",
    "navStart": "快速开始",
    "navReadiness": "版本说明",
    "heroEyebrow": "开源 · Go · pre-1.0",
    "heroTitle": "Go 多协议<br><span>应用框架</span>",
    "heroLede": "在同一个 Go 应用中提供 HTTP、TCP、WebSocket、QUIC 和 gRPC 等服务。KPro 负责组件组装、消息路由和服务生命周期管理。",
    "heroPrimary": "开始项目教程",
    "heroSecondary": "本机快速运行",
    "heroDocs": "框架参考文档",
    "heroLearningNote": "9 个章节，跟着一个完整项目学会使用 KPro",
    "proofOne": "队列与并发限制",
    "proofTwo": "复用同一套业务",
    "proofThree": "启动、检查与停机",
    "exampleLabel": "服务组装示例",
    "statementKicker": "适合哪些场景",
    "statementTitle": "多个入口，接入同一个应用",
    "statementBody": "当不同客户端需要不同协议，而业务规则和服务运行又需要统一管理时，可以把这些入口组织到一个 KPro 应用中。",
    "architectureKicker": "你需要编写哪些代码",
    "architectureTitle": "入口处理协议，业务保持独立",
    "architectureBody": "在订单工程中，入口翻译请求，Service 执行业务规则，Store 保存状态。这些是职责明确、由应用连接起来的模块。",
    "transportKicker": "按客户端需求选择",
    "transportTitle": "先选择产品真正需要的入口",
    "transportBody": "先选择一种常见组合，再按客户端需求调整。查看每种协议的用途，以及接入时需要编写的处理函数和请求契约。",
    "compositionLabel": "已选入口",
    "selectedLabel": "种协议",
    "sharedLabel": "统一管理的运行过程",
    "sharedItems": "启动 · 端点就绪 · 关闭",
    "kindMessage": "消息路由",
    "kindNative": "原生接口",
    "operationsKicker": "从启动到停止",
    "operationsTitle": "确认何时就绪，也安排如何停止",
    "operationsBody": "监听成功只是开始。还需要为相关组件配置容量、观察运行中的失败，并为停止过程设置明确的时间边界。",
    "operationsLink": "查阅运行管理参考",
    "startKicker": "快速开始",
    "startTitle": "安装 CLI 并创建 HTTP 服务",
    "startBody": "用 CLI 创建一个新的 HTTP 工程，再编写自己的路由和业务逻辑。下方订单教程则是一份已经实现好的独立应用。",
    "startRequirements": "需要 <strong>Go 1.26.9+</strong>，请在本机终端按顺序执行下面三个步骤。",
    "expectedOutput": "执行后如何确认",
    "startTutorial": "想跟着完整示例操作？运行并验证订单服务 →",
    "tabInstall": "安装",
    "tabCreate": "创建",
    "tabRun": "运行",
    "copyButton": "复制",
    "pinNote": "KPro 仍处于 pre-1.0。请固定精确版本，并使用对应版本的文档。",
    "readinessKicker": "版本与采用",
    "readinessTitle": "本站内容对应 KPro v0.2.1",
    "readinessBody": "KPro 仍处于 pre-1.0，API 尚未冻结。请固定版本并使用对应文档；接入实际服务前，验证自己的协议组合、业务负载和停止过程。",
    "apiStability": "API 稳定性",
    "productionChecklist": "生产准备清单",
    "roadmap": "生产级 v1 路线图",
    "footerText": "KPro · 开源 Go 多协议应用框架",
    "learnLink": "开始学习 →",
    "navScenarios": "适用场景",
    "navExample": "业务示例",
    "navOperations": "运行管理",
    "scenarioTcpTitle": "HTTP 接口与 TCP 客户端",
    "scenarioTcpBody": "普通请求使用 HTTP 接口，专用客户端通过 TCP 消息交互。两个入口分别处理协议细节，调用同一个业务服务，并统一管理监听的启动与关闭。",
    "scenarioBrowserTitle": "HTTP 接口与浏览器长连接",
    "scenarioBrowserBody": "保留普通 HTTP API，同时通过 WebSocket 与浏览器保持连接。复用业务服务，消息含义、交互流程和连接策略由应用按需求定义。",
    "scenarioFit": "如果只是简单的 HTTP 服务，先衡量是否需要组件组装和统一运行管理。可以从一个协议开始，在产品需要时再增加其他入口。",
    "exampleKicker": "用真实结果理解",
    "exampleTitle": "HTTP 创建的订单，TCP 也能查到",
    "exampleBody": "下载包中的教学工程把两个协议入口接到一个订单服务和一个 Store。用一笔订单的状态变化，可以验证它们确实调用同一套业务。",
    "exampleCreateTitle": "创建订单",
    "exampleCreateBody": "发送下面的 JSON。成功后返回 HTTP 201，以及包含实际 id、状态为 pending 的订单。",
    "exampleReadTitle": "通过 TCP 查询",
    "exampleReadBody": "把响应中的 id 交给示例客户端。客户端按消息帧协议发送查询，并打印同一笔 pending 状态的订单。",
    "exampleCancelTitle": "通过 HTTP 取消",
    "exampleCancelBody": "在取消地址中使用同一个 id。HTTP 响应返回这笔订单，状态已变为 cancelled。",
    "exampleReadAgainTitle": "再次查询",
    "exampleReadAgainBody": "再次用这个 id 运行 TCP 客户端。从同一个业务服务和 Store 中，读取到的状态现在是 cancelled。",
    "exampleSetup": "先启动下载的订单工程，并启用 TCP 监听：",
    "exampleSummary": "示意中的 <code>ORDER_ID</code> 都要替换为第 1 步响应里的实际 id。每次 TCP 查询都会读取这笔订单的当前状态。",
    "exampleLessonLink": "阅读 HTTP + TCP 实战章节",
    "exampleSourceLink": "查看对象组装源码",
    "exampleDownload": "下载可运行工程",
    "layerEntryTitle": "1. 协议入口",
    "layerEntryBody": "读取 HTTP JSON 或 TCP 消息，调用业务服务，再把结果转换成对应客户端需要的响应。",
    "layerBusinessTitle": "2. 业务服务",
    "layerBusinessBody": "校验订单参数、控制状态变化。业务服务不需要知道请求来自 HTTP 还是 TCP。",
    "layerStoreTitle": "3. 存储接口",
    "layerStoreBody": "应用定义 <code>order.Store</code>，内存和 SQLite 分别实现同一组保存、读取订单的操作。",
    "architectureNote": "组装入口只创建一个业务服务，再把它交给两个协议适配层。增加协议入口，不需要再复制一套订单业务。",
    "assemblySourceLink": "阅读 internal/app/app.go",
    "frameworkOwnsTitle": "KPro 管理挂载组件的运行",
    "frameworkOwnsBody": "校验配置，协调组件启动、就绪和关闭。消息协议还可以使用 Router 分发，以及配置的队列和并发限制。",
    "applicationOwnsTitle": "应用决定具体业务行为",
    "applicationOwnsBody": "定义请求与消息契约、业务规则、认证权限和幂等策略；选择存储实现，并管理应用自身持有的资源。",
    "storageTitle": "通过应用接口切换存储",
    "storageMemoryTitle": "内存：先跑通临时数据",
    "storageMemoryBody": "示例把订单保存在当前进程的 map 中，适合初步练习与测试。进程停止后，这些订单不会保留。",
    "storageSqliteTitle": "SQLite：把数据保存在本地文件",
    "storageSqliteBody": "示例使用本地 SQLite 文件；重启时使用同一个数据库路径，仍能查询原有订单。这个教学实现采用单进程、单数据库连接。",
    "storageNote": "两种实现遵守同一个应用接口，业务服务保持不变。接入其他数据库时，实现并测试这一接口即可接到现有业务上。",
    "storageLessonLink": "学习如何接入持久化存储",
    "presetHttp": "HTTP 接口",
    "presetOrders": "HTTP + TCP",
    "presetBrowser": "HTTP + WebSocket",
    "useTcp": "专用客户端",
    "useQuic": "流式传输客户端",
    "useWebSocket": "浏览器长连接",
    "useHttp2": "HTTP API",
    "useHttp3": "基于 QUIC 的 HTTP",
    "useSse": "服务端到浏览器事件",
    "useGrpc": "RPC 服务",
    "useUdp": "数据报消息",
    "composerNote": "结合下面的接入说明，确认所选协议需要哪些适配代码和请求契约。",
    "operationsLessonLink": "跟着示例验证完整生命周期",
    "lifecycleStartTitle": "先校验，再启动",
    "lifecycleStartBody": "在创建、挂载组件时校验配置，启动后再等待受管理端点就绪。一次 <code>Start</code> 返回，不代表所有监听都已启动成功。",
    "lifecycleReadyTitle": "检查业务真正依赖的资源",
    "lifecycleReadyBody": "教学应用的 <code>/livez</code> 确认 HTTP 能响应，<code>/readyz</code> 调用存储检查并返回 200 或 503。这些路由由应用实现；<code>WaitReady</code> 协调的是端点启动结果。",
    "lifecycleCapacityTitle": "设置容量，并观察压力",
    "lifecycleCapacityBody": "为消息路由配置队列和并发上限，并设置所选传输支持的连接数、待发送数据限制。结合组件指标和错误，区分请求在哪里排队或被拒绝。",
    "lifecycleStopTitle": "先等待停止，再释放存储",
    "lifecycleStopBody": "取消信号触发有时间上限的关闭与排空。示例先等待 <code>Wait</code> 完成，再由应用关闭 SQLite；存储清理由应用负责，发送队列排空也不等于业务送达保证。",
    "tryProjectTitle": "想先运行一个完整项目？",
    "tryProjectBody": "订单工程已经实现创建、查询、取消，以及内存和 SQLite 两种存储。下载后可以先验证状态变化和持久化，再逐步理解这些模块如何组装。",
    "tryProjectDownload": "下载订单示例工程",
    "faqSingleTitle": "必须同时使用多个协议吗？",
    "faqSingleBody": "不需要。可以先使用当前需要的 HTTP 入口，等客户端需求出现时再挂载其他组件，并决定它们复用哪些业务服务。",
    "faqReplaceTitle": "KPro 会替代业务路由和存储代码吗？",
    "faqReplaceBody": "KPro 提供协议组件与分发机制。路由或消息注册、请求契约、业务处理，以及存储的选择和组装仍由应用完成；它不会自动把一个 HTTP 路由转换成 TCP API。",
    "faqProductTitle": "订单示例可以直接当业务成品吗？",
    "faqProductBody": "它是有明确边界的可运行教学应用，没有账号、支付、库存或订阅功能。用它理解结构之后，还需要为自己的产品设计并验证业务要求。",
    "protocolDefaultHttp": "注册 HTTP 路由，解析请求数据，再调用业务服务。",
    "protocolDefaultTcp": "定义消息编号与数据格式、选择消息帧编解码器，再从 TCP 适配层调用同一个业务服务。"
  }
};

let language = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
try {
  const saved = localStorage.getItem("kpro-language");
  if (saved === "zh" || saved === "en") language = saved;
} catch { /* Browser language remains the fallback. */ }
const languageButton = document.querySelector("[data-language]");

function applyLanguage() {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const value = translations[language][node.dataset.i18n];
    if (value) node.innerHTML = value;
  });
  languageButton.textContent = language === "zh" ? "EN" : "中文";
  languageButton.setAttribute("aria-label", language === "zh" ? "Switch to English" : "切换为中文");
  document.dispatchEvent(new Event("kpro:languagechange"));
  updateComposition();
  updateQuickStart();
  resetCopyStatus();
}

languageButton.addEventListener("click", () => {
  language = language === "en" ? "zh" : "en";
  try { localStorage.setItem("kpro-language", language); } catch { /* Optional preference. */ }
  applyLanguage();
});

const protocolButtons = [...document.querySelectorAll("[data-protocol]")];
const selectedList = document.querySelector("[data-selected-list]");
const selectedCount = document.querySelector("[data-selected-count]");
const compositionCopy = document.querySelector("[data-composition-copy]");
const protocolGuidance = document.querySelector("[data-protocol-guidance]");
const presetButtons = [...document.querySelectorAll("[data-preset]")];
const protocolPresets = {
  http: ["HTTP/2"],
  orders: ["HTTP/2", "TCP"],
  browser: ["HTTP/2", "WebSocket"]
};
const protocolDetails = {
  TCP: {
    zh: ["已有 TCP 客户端通过长连接收发业务消息。", "配置监听地址和编解码，按消息 ID 注册处理函数。"],
    en: ["TCP clients exchange application messages over persistent connections.", "Configure a listener and codec, then register handlers by message ID."]
  },
  QUIC: {
    zh: ["QUIC 客户端通过双向流收发 KPro 消息。", "配置 TLS 和流编解码，按消息 ID 注册处理函数。"],
    en: ["QUIC clients exchange KPro messages over bidirectional streams.", "Configure TLS and a stream codec, then register handlers by message ID."]
  },
  WebSocket: {
    zh: ["浏览器或 WebSocket 客户端双向收发约定格式的消息。", "配置连接路径、来源策略和包编解码，再注册消息处理函数。"],
    en: ["Browsers and WebSocket clients exchange messages in an agreed format.", "Configure the path, origin policy and packet codec, then register message handlers."]
  },
  "HTTP/2": {
    zh: ["浏览器和 API 客户端发起普通 HTTP 请求，也可通过 HTTPS 协商 HTTP/2。", "用 httpx 注册 HTTP 方法和路径，需要 HTTPS 时配置 TLS。"],
    en: ["Browsers and API clients make ordinary HTTP requests, with HTTP/2 available over HTTPS.", "Register method-and-path handlers with httpx; configure TLS when HTTPS is needed."]
  },
  "HTTP/3": {
    zh: ["支持 HTTP/3 的客户端通过 QUIC 发送 HTTP 请求。", "配置 TLS，并按 HTTP 方法和路径注册处理函数。"],
    en: ["HTTP/3 clients send HTTP requests over QUIC.", "Configure TLS and register handlers by HTTP method and path."]
  },
  SSE: {
    zh: ["浏览器或 HTTP 客户端持续接收服务端发送的事件。", "注册事件流处理函数，并在连接结束时停止发送。"],
    en: ["Browsers and HTTP clients receive a stream of server-sent events.", "Register a stream handler and stop sending when the connection ends."]
  },
  gRPC: {
    zh: ["客户端按 Protobuf 服务契约调用一元或流式 RPC。", "实现服务方法，并注册对应的 gRPC 服务绑定。"],
    en: ["Clients call unary or streaming RPCs defined by a Protobuf service contract.", "Implement the service methods and register the corresponding gRPC bindings."]
  },
  UDP: {
    zh: ["UDP 客户端按数据报交换应用消息。", "配置包编解码与大小上限，再按消息 ID 注册处理函数。"],
    en: ["UDP clients exchange application messages as datagrams.", "Configure a packet codec and size limit, then register handlers by message ID."]
  }
};
const protocolLabel = name => name === "HTTP/2" ? "HTTP / HTTP/2" : name;

function updateComposition() {
  const active = protocolButtons.filter((button) => button.classList.contains("active"));
  selectedCount.textContent = active.length;
  selectedList.innerHTML = active.map((button) => `<span>${protocolLabel(button.dataset.protocol)}</span>`).join("");
  presetButtons.forEach(button => {
    const preset = protocolPresets[button.dataset.preset];
    button.setAttribute("aria-pressed", preset.length === active.length && active.every(item => preset.includes(item.dataset.protocol)));
  });
  protocolGuidance.innerHTML = active.length ? active.map(button => {
    const name = button.dataset.protocol;
    const [client, developer] = protocolDetails[name][language];
    return `<article><h3>${protocolLabel(name)}</h3><p>${client}</p><p>${developer}</p></article>`;
  }).join("") : `<p>${language === "zh" ? "选择一个协议或上方的常见组合，查看客户端用途与接入方式。" : "Choose a protocol or a common combination above to see client use and integration work."}</p>`;
  compositionCopy.textContent = !active.length ? "" : language === "zh"
    ? "各入口的处理函数可以调用同一个业务 Service。请求格式、消息定义和业务规则由你的应用决定。"
    : "Handlers at each entry point can call the same business service. Your application defines request formats, messages and business rules.";
}

presetButtons.forEach(button => button.addEventListener("click", () => {
  const preset = protocolPresets[button.dataset.preset];
  protocolButtons.forEach(protocol => {
    const active = preset.includes(protocol.dataset.protocol);
    if (active) protocol.classList.add("active"); else protocol.classList.remove("active");
    protocol.setAttribute("aria-pressed", active);
  });
  updateComposition();
}));

protocolButtons.forEach((button) => {
  button.setAttribute("aria-pressed", button.classList.contains("active"));
  button.addEventListener("click", () => {
    button.classList.toggle("active");
    button.setAttribute("aria-pressed", button.classList.contains("active"));
    updateComposition();
  });
});

const commands = {
  install: {
    command: "go install github.com/saramand9/kpro/cmd/kpro@v0.2.1",
    output: {
      zh: '命令成功退出后，运行 <code>kpro version</code> 查看 CLI 构建信息。若提示找不到命令，请将 Go 的可执行文件安装目录加入 PATH。',
      en: 'After installation succeeds, run <code>kpro version</code> to view CLI build information. If the command is not found, add the Go executable installation directory to PATH.'
    }
  },
  create: {
    command: "kpro new hello-kpro --module example.com/hello-kpro --name hello-kpro --profile service --api http",
    output: {
      zh: '确认生成 <code>hello-kpro</code> 目录及 <code>cmd/hello-kpro/main.go</code>，再按生成工程的 README 配置与运行服务。',
      en: 'Check for the new <code>hello-kpro</code> directory and <code>cmd/hello-kpro/main.go</code>, then follow the generated README to configure and run the service.'
    }
  },
  run: {
    command: "cd hello-kpro\ngo mod tidy\ngo run ./cmd/hello-kpro",
    output: {
      zh: '服务运行时终端会保持占用。按生成工程 README 中的监听地址和请求示例验证响应；按 Ctrl+C 停止服务。',
      en: 'The terminal stays occupied while the service runs. Verify a response using the address and request example in the generated README; press Ctrl+C to stop.'
    }
  }
};
const commandNode = document.querySelector("[data-command]");
const outputNode = document.querySelector("[data-terminal-output]");
const copyButton = document.querySelector("[data-copy]");
let currentStep = "install";
function updateQuickStart() {
  commandNode.textContent = commands[currentStep].command;
  outputNode.innerHTML = commands[currentStep].output[language];
}
let copyTimeout;
let copyRevision = 0;
function resetCopyStatus() {
  copyRevision++;
  clearTimeout(copyTimeout);
  copyButton.textContent = translations[language].copyButton;
}
const stepTabs = [...document.querySelectorAll("[data-step]")];
stepTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    resetCopyStatus();
    stepTabs.forEach((item) => { item.classList.remove("active"); item.setAttribute("aria-selected", "false"); item.tabIndex = -1; });
    tab.classList.add("active"); tab.setAttribute("aria-selected", "true"); tab.tabIndex = 0;
    document.querySelector("#start-panel").setAttribute("aria-labelledby", tab.id);
    currentStep = tab.dataset.step;
    updateQuickStart();
  });
  tab.addEventListener("keydown", event => {
    const target = { ArrowRight: (index + 1) % stepTabs.length, ArrowLeft: (index + stepTabs.length - 1) % stepTabs.length, Home: 0, End: stepTabs.length - 1 }[event.key];
    if (target == null) return;
    event.preventDefault();
    stepTabs[target].click();
    stepTabs[target].focus();
  });
});

copyButton.addEventListener("click", async () => {
  const revision = ++copyRevision;
  const command = commandNode.textContent;
  clearTimeout(copyTimeout);
  try {
    await navigator.clipboard.writeText(command);
    if (revision !== copyRevision) return;
    copyButton.textContent = language === "zh" ? "已复制" : "Copied";
  } catch {
    if (revision !== copyRevision) return;
    const range = document.createRange();
    range.selectNodeContents(commandNode);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    copyButton.textContent = language === "zh" ? "按 Ctrl+C / ⌘C" : "Press Ctrl+C / ⌘C";
  }
  copyTimeout = setTimeout(() => {
    if (revision === copyRevision) copyButton.textContent = translations[language].copyButton;
  }, 1800);
});

applyLanguage();

// Keep the overview's current section visible, including in the narrow-screen rail.
const sectionNav = document.querySelector(".section-nav");
if (sectionNav) {
  const header = document.querySelector(".site-header");
  const links = [...sectionNav.querySelectorAll('a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.getAttribute("href")));
  let current = -1;
  let scheduled = false;
  function updateSectionNav() {
    scheduled = false;
    const headerHeight = header.getBoundingClientRect().height;
    document.body.style.setProperty("--home-header-height", `${headerHeight}px`);
    const threshold = headerHeight + sectionNav.getBoundingClientRect().height + 40;
    let next = -1;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= threshold) next = index;
    });
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) next = links.length - 1;
    if (current !== next) {
      current = next;
      links.forEach((link, index) => {
        if (index === current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
    const active = links[current];
    if (active) {
      const rail = sectionNav.getBoundingClientRect();
      const item = active.getBoundingClientRect();
      if (item.left < rail.left + 20) sectionNav.scrollLeft += item.left - rail.left - 20;
      else if (item.right > rail.right - 20) sectionNav.scrollLeft += item.right - rail.right + 20;
    }
  }
  function scheduleSectionNav() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateSectionNav);
    }
  }
  window.addEventListener("scroll", scheduleSectionNav, { passive: true });
  window.addEventListener("resize", scheduleSectionNav);
  window.addEventListener("hashchange", scheduleSectionNav);
  document.addEventListener("kpro:languagechange", scheduleSectionNav);
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(scheduleSectionNav);
    observer.observe(header);
    sections.forEach(section => observer.observe(section));
  }
  updateSectionNav();
}
