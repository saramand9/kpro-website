const translations = {
  "en": {
    "navHome": "Overview",
    "navLearn": "Learn",
    "navSource": "Source",
    "navArchitecture": "Architecture",
    "navTransports": "Protocols",
    "navStart": "Quick start",
    "navReadiness": "Release status",
    "heroEyebrow": "Open source · Go · pre-1.0",
    "heroTitle": "Multi-protocol<br><span>services in Go.</span>",
    "heroLede": "Serve HTTP, TCP, WebSocket, QUIC, gRPC and other protocols in one Go application. KPro provides component assembly, message routing and lifecycle management.",
    "heroPrimary": "Quick start",
    "heroSecondary": "Read the docs",
    "proofOne": "Queue and concurrency limits",
    "proofTwo": "Protocol-native handlers",
    "proofThree": "Startup, readiness and shutdown",
    "exampleLabel": "Service assembly example",
    "statementKicker": "Protocol handlers",
    "statementTitle": "Use native HTTP and gRPC handlers",
    "statementBody": "HTTP and gRPC keep their own handler interfaces. Message protocols such as TCP and WebSocket share Message / Context and message routing. One server manages startup, readiness and shutdown for all mounted components.",
    "architectureKicker": "Service structure",
    "architectureTitle": "Connect your handlers to one server",
    "architectureBody": "Create a server, mount the protocol components you need, and register handlers and routes. The diagram shows how the application, shared runtime and protocol components fit together.",
    "mapApplication": "APPLICATION",
    "mapNative": "Native handlers",
    "mapEdge": "PROTOCOLS",
    "principleOneTitle": "Startup and shutdown",
    "principleOneBody": "Validate configuration and wait for components to become ready. During shutdown, close components in order and wait for outbound queues to drain within the configured timeout.",
    "principleTwoTitle": "Queues and concurrency",
    "principleTwoBody": "Configure Router queue capacity and in-flight limits, plus message-count and byte limits for transport outbound queues.",
    "principleThreeTitle": "Application responsibilities",
    "principleThreeBody": "Implement authentication, authorization, business idempotency and delivery requirements in your application. Configure and validate deployment capacity for your workload.",
    "transportKicker": "Protocol selection",
    "transportTitle": "Choose protocols for your service",
    "transportBody": "Select protocols below to see how they combine, which components use message routing and which keep their own interfaces.",
    "compositionLabel": "SELECTED PROTOCOLS",
    "selectedLabel": "protocols",
    "sharedLabel": "SERVER FEATURES",
    "sharedItems": "Lifecycle · Backpressure · Health checks · Telemetry · Shutdown",
    "kindMessage": "Message routing",
    "kindNative": "Native interface",
    "operationsKicker": "Operations",
    "operationsTitle": "Set connection and queue limits.<br>Monitor service status.",
    "operationsBody": "Configure connection limits, queue capacity and concurrency limits. Observe the service through health checks and metrics. During shutdown, wait for outbound queues to drain within the configured timeout.",
    "operationsLink": "Read the operations guide",
    "telemetryState": "Example",
    "telemetryNote": "Example metrics. These values illustrate the fields; your service supplies the actual data.",
    "startKicker": "Quick start",
    "startTitle": "Install the CLI and create an HTTP service",
    "startBody": "Install a specific release, generate a project and run it locally.",
    "tabInstall": "Install",
    "tabCreate": "Create",
    "tabRun": "Run",
    "copyButton": "Copy",
    "pinNote": "KPro is pre-1.0. Pin an exact version and use the documentation for that release.",
    "readinessKicker": "Version and usage",
    "readinessTitle": "KPro is currently pre-1.0",
    "readinessBody": "The current release includes configuration validation, resource limits, shutdown handling and observability support, with repository tests and benchmark budget checks. APIs are not frozen. Before deployment, validate your protocol combination, workload and deployment environment.",
    "apiStability": "API stability",
    "productionChecklist": "Production checklist",
    "roadmap": "Production v1 roadmap",
    "footerText": "KPro · Open-source Go framework for multi-protocol applications.",
    "learnLink": "Start learning →"
  },
  "zh": {
    "navHome": "概览",
    "navLearn": "学习",
    "navSource": "示例源码",
    "navArchitecture": "架构",
    "navTransports": "协议",
    "navStart": "快速开始",
    "navReadiness": "版本说明",
    "heroEyebrow": "开源 · Go · pre-1.0",
    "heroTitle": "Go 多协议<br><span>应用框架</span>",
    "heroLede": "在同一个 Go 应用中提供 HTTP、TCP、WebSocket、QUIC 和 gRPC 等服务。KPro 负责组件组装、消息路由和服务生命周期管理。",
    "heroPrimary": "快速开始",
    "heroSecondary": "阅读文档",
    "proofOne": "队列与并发限制",
    "proofTwo": "协议原生接口",
    "proofThree": "启动、检查与停机",
    "exampleLabel": "服务组装示例",
    "statementKicker": "协议处理方式",
    "statementTitle": "HTTP 和 gRPC 使用原生接口",
    "statementBody": "HTTP 和 gRPC 沿用各自的处理接口；TCP、WebSocket 等消息协议共用 Message / Context 和消息路由。所有挂载的组件由同一个服务管理启动、就绪检查和关闭。",
    "architectureKicker": "服务结构",
    "architectureTitle": "将业务处理器接入同一个服务",
    "architectureBody": "创建服务，挂载需要的协议组件，再注册处理器和路由。下图展示应用、共享运行时与各协议组件之间的关系。",
    "mapApplication": "应用层",
    "mapNative": "原生处理器",
    "mapEdge": "协议组件",
    "principleOneTitle": "启动与关闭",
    "principleOneBody": "启动时校验配置并等待组件就绪。停止时按顺序关闭组件，并在配置的超时时间内等待出站队列排空。",
    "principleTwoTitle": "队列与并发限制",
    "principleTwoBody": "通过配置限制 Router 队列容量、在途任务数，以及传输出站队列的消息数和字节数。",
    "principleThreeTitle": "应用需要负责什么",
    "principleThreeBody": "认证授权、业务幂等和业务交付要求由应用实现。部署容量需要结合业务负载进行配置与验证。",
    "transportKicker": "协议选择",
    "transportTitle": "按需选择服务协议",
    "transportBody": "选择下面的协议，查看它们如何组合，以及哪些组件使用消息路由、哪些保留各自接口。",
    "compositionLabel": "已选协议",
    "selectedLabel": "种协议",
    "sharedLabel": "服务管理功能",
    "sharedItems": "生命周期 · 背压 · 健康检查 · 遥测 · 停机",
    "kindMessage": "消息路由",
    "kindNative": "原生接口",
    "operationsKicker": "运行与维护",
    "operationsTitle": "配置连接与队列上限<br>查看服务运行状态",
    "operationsBody": "配置连接数、队列容量和并发上限，通过健康检查和指标观察运行状态。关闭服务时，在配置的超时时间内等待出站队列排空。",
    "operationsLink": "查看运行与维护文档",
    "telemetryState": "示例",
    "telemetryNote": "运行指标示例。数值用于说明字段，实际数据来自你的服务。",
    "startKicker": "快速开始",
    "startTitle": "安装 CLI 并创建 HTTP 服务",
    "startBody": "安装指定版本，生成工程，然后在本机运行服务。",
    "tabInstall": "安装",
    "tabCreate": "创建",
    "tabRun": "运行",
    "copyButton": "复制",
    "pinNote": "KPro 仍处于 pre-1.0。请固定精确版本，并使用对应版本的文档。",
    "readinessKicker": "版本与使用范围",
    "readinessTitle": "KPro 目前处于 pre-1.0",
    "readinessBody": "当前版本提供配置校验、资源限制、停机处理和可观测性支持，并有仓库测试及性能预算检查。API 尚未冻结；实际部署前，需要按你的协议组合、业务负载和部署环境进行验证。",
    "apiStability": "API 稳定性",
    "productionChecklist": "生产准备清单",
    "roadmap": "生产级 v1 路线图",
    "footerText": "KPro · 开源 Go 多协议应用框架",
    "learnLink": "开始学习 →"
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

function updateComposition() {
  const active = protocolButtons.filter((button) => button.classList.contains("active"));
  selectedCount.textContent = active.length;
  selectedList.innerHTML = active.map((button) => `<span>${button.dataset.protocol}</span>`).join("");
  const messages = active.filter((button) => button.dataset.kind === "message").length;
  const native = active.length - messages;
  compositionCopy.textContent = language === "zh"
    ? `${messages} 种协议使用 Message / Context 消息路由，${native} 种协议使用各自的原生接口。服务负责启动和关闭所有选中的组件。`
    : `${messages} protocol${messages === 1 ? "" : "s"} use Message / Context routing; ${native} protocol${native === 1 ? "" : "s"} use their own interfaces. The server starts and stops all selected components.`;
}

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
    output: 'go: downloading github.com/saramand9/kpro v0.2.1<br><span>✓ kpro installed</span>'
  },
  create: {
    command: "kpro new hello-kpro --module example.com/hello-kpro --name hello-kpro --profile service --api http",
    output: 'create  hello-kpro/cmd/hello-kpro/main.go<br><span>✓ service scaffold ready</span>'
  },
  run: {
    command: "cd hello-kpro && go run ./cmd/hello-kpro",
    output: 'kpro: component http is ready on :8080<br><span>✓ application ready</span>'
  }
};
const commandNode = document.querySelector("[data-command]");
const outputNode = document.querySelector("[data-terminal-output]");
const stepTabs = [...document.querySelectorAll("[data-step]")];
stepTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    stepTabs.forEach((item) => { item.classList.remove("active"); item.setAttribute("aria-selected", "false"); item.tabIndex = -1; });
    tab.classList.add("active"); tab.setAttribute("aria-selected", "true"); tab.tabIndex = 0;
    document.querySelector("#start-panel").setAttribute("aria-labelledby", tab.id);
    const step = commands[tab.dataset.step]; commandNode.textContent = step.command; outputNode.innerHTML = step.output;
  });
  tab.addEventListener("keydown", event => {
    const target = { ArrowRight: (index + 1) % stepTabs.length, ArrowLeft: (index + stepTabs.length - 1) % stepTabs.length, Home: 0, End: stepTabs.length - 1 }[event.key];
    if (target == null) return;
    event.preventDefault();
    stepTabs[target].click();
    stepTabs[target].focus();
  });
});

let copyTimeout;
document.querySelector("[data-copy]").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  clearTimeout(copyTimeout);
  try {
    await navigator.clipboard.writeText(commandNode.textContent);
    button.textContent = language === "zh" ? "已复制" : "Copied";
  } catch {
    const range = document.createRange();
    range.selectNodeContents(commandNode);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    button.textContent = language === "zh" ? "按 Ctrl+C / ⌘C" : "Press Ctrl+C / ⌘C";
  }
  copyTimeout = setTimeout(() => { button.textContent = translations[language].copyButton; }, 1800);
});

applyLanguage();
