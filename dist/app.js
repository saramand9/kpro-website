const translations = {
  en: {
    navArchitecture: "Architecture", navTransports: "Transports", navStart: "Quick start", navReadiness: "Readiness",
    heroEyebrow: "Open-source · Go · pre-1.0", heroTitle: "One runtime.<br><span>Native protocols.</span>",
    heroLede: "Build TCP, QUIC, WebSocket, HTTP, SSE and gRPC services with one lifecycle—without flattening every protocol into the same abstraction.",
    heroPrimary: "Start in 10 minutes", heroSecondary: "Read the docs", proofOne: "Bounded by design", proofTwo: "Protocol-native APIs", proofThree: "Operationally explicit",
    statementKicker: "THE DESIGN LINE", statementTitle: "Unified where it helps.<br><span>Native where it matters.</span>", statementBody: "KPro standardizes the hard runtime work—startup, shutdown, backpressure, readiness and telemetry—while HTTP remains HTTP, gRPC remains gRPC, and message transports share a focused Message / Context model.",
    architectureKicker: "ONE PROCESS, CLEAR OWNERSHIP", architectureTitle: "The runtime you would otherwise build twice.", architectureBody: "Compose independent transports behind a dependency-neutral server. Each layer owns one job, and every boundary stays visible.", mapApplication: "APPLICATION", mapNative: "Native handlers", mapEdge: "NETWORK EDGE",
    principleOneTitle: "One lifecycle", principleOneBody: "Checked construction, readiness, failure propagation and bounded shutdown across mounted components.", principleTwoTitle: "Bounded work", principleTwoBody: "Router admission, in-flight limits and outbound queues make overload behavior explicit.", principleThreeTitle: "Visible boundaries", principleThreeBody: "Authentication, durable delivery and deployment sizing remain deliberate application responsibilities.",
    transportKicker: "RUNTIME COMPOSER", transportTitle: "Pick the edges your service needs.", transportBody: "Select transports to see how KPro keeps the process model shared while preserving the right handler shape.", compositionLabel: "YOUR COMPOSITION", selectedLabel: "transports", sharedLabel: "SHARED RUNTIME", sharedItems: "Lifecycle · Backpressure · Health · Telemetry · Shutdown",
    operationsKicker: "BUILT FOR THE UNGLAMOROUS PART", operationsTitle: "Fast is useful.<br>Predictable is deployable.", operationsBody: "KPro treats limits and failure behavior as part of the API, not production cleanup work.", operationsLink: "Explore operations & capacity", telemetryNote: "Illustrative dashboard — tune every limit to your workload.",
    startKicker: "FROM ZERO TO A RUNNING SERVICE", startTitle: "Start with the paved path.", startBody: "Pin the release, scaffold a service, and keep generated code under review.", tabInstall: "Install", tabCreate: "Create", tabRun: "Run", copyButton: "Copy", pinNote: "KPro is pre-1.0. Pin an exact version and read the matching release documentation.",
    readinessKicker: "HONEST BY DEFAULT", readinessTitle: "Engineered for trials.<br>Validated by your workload.", readinessBody: "KPro has repository-level tests, race-sensitive coverage, transport conformance helpers and benchmark budgets. It does not claim your production capacity, availability or compatibility before you measure them.", apiStability: "API stability", productionChecklist: "Production checklist", roadmap: "Production v1 roadmap",
    ctaTitle: "Build the service.<br><span>Keep the edges clear.</span>", ctaGithub: "Explore on GitHub", ctaQuickstart: "Open quick start", footerText: "Open-source Go infrastructure. Pre-1.0, built in the open."
  },
  zh: {
    navArchitecture: "架构", navTransports: "协议", navStart: "快速开始", navReadiness: "成熟度",
    heroEyebrow: "开源 · Go · pre-1.0", heroTitle: "一个运行时。<br><span>多种原生协议。</span>",
    heroLede: "用一套生命周期构建 TCP、QUIC、WebSocket、HTTP、SSE 与 gRPC 服务，同时保留每种协议最合适的开发方式。",
    heroPrimary: "10 分钟开始", heroSecondary: "阅读文档", proofOne: "资源边界明确", proofTwo: "协议原生接口", proofThree: "运维行为显式",
    statementKicker: "设计边界", statementTitle: "该统一的地方统一。<br><span>该原生的地方原生。</span>", statementBody: "KPro 统一启动、停机、背压、就绪与可观测性；HTTP 仍是 HTTP，gRPC 仍是 gRPC，消息型传输则共享专注的 Message / Context 模型。",
    architectureKicker: "一个进程，清晰归属", architectureTitle: "不必再为每种协议重建运行时。", architectureBody: "在依赖中立的服务器后组装独立传输组件。每一层只负责一件事，每条边界都保持可见。", mapApplication: "应用层", mapNative: "原生处理器", mapEdge: "网络边缘",
    principleOneTitle: "统一生命周期", principleOneBody: "跨组件的配置校验、就绪、失败传播与有界停机。", principleTwoTitle: "有界工作量", principleTwoBody: "Router 准入、在途限制和出站队列让过载行为清晰可控。", principleThreeTitle: "边界保持可见", principleThreeBody: "认证、持久交付和部署容量仍由应用明确负责。",
    transportKicker: "运行时组装器", transportTitle: "选择服务真正需要的边缘。", transportBody: "选择传输协议，查看 KPro 如何共享进程模型，同时保留正确的处理器形态。", compositionLabel: "你的组合", selectedLabel: "种传输", sharedLabel: "共享运行时", sharedItems: "生命周期 · 背压 · 健康检查 · 遥测 · 停机",
    operationsKicker: "为那些不光鲜却重要的部分而建", operationsTitle: "快很有用。<br>可预测才能部署。", operationsBody: "KPro 将限制和故障行为视为 API 的一部分，而不是上线后的补救工作。", operationsLink: "查看运维与容量规划", telemetryNote: "示意面板——所有限制都应按你的负载进行配置。",
    startKicker: "从零到运行中的服务", startTitle: "从推荐路径开始。", startBody: "固定精确版本，生成服务骨架，并持续审查生成代码。", tabInstall: "安装", tabCreate: "创建", tabRun: "运行", copyButton: "复制", pinNote: "KPro 仍处于 pre-1.0。请固定精确版本，并阅读对应版本的文档。",
    readinessKicker: "默认诚实", readinessTitle: "为受控试点而工程化。<br>由你的负载来验证。", readinessBody: "KPro 已具备仓库级测试、race 敏感覆盖、传输契约辅助工具和性能预算。但在实际测量前，它不会声称满足你的生产容量、可用性或兼容性要求。", apiStability: "API 稳定性", productionChecklist: "生产准备清单", roadmap: "生产级 v1 路线图",
    ctaTitle: "构建服务。<br><span>让边界保持清晰。</span>", ctaGithub: "在 GitHub 探索", ctaQuickstart: "打开快速开始", footerText: "开源 Go 基础设施。Pre-1.0，在公开协作中持续构建。"
  }
};

let language = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
const languageButton = document.querySelector("[data-language]");

function applyLanguage() {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const value = translations[language][node.dataset.i18n];
    if (value) node.innerHTML = value;
  });
  languageButton.textContent = language === "zh" ? "EN" : "中文";
  languageButton.setAttribute("aria-label", language === "zh" ? "Switch to English" : "切换为中文");
  updateComposition();
}

languageButton.addEventListener("click", () => {
  language = language === "en" ? "zh" : "en";
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
    ? `${messages} 种消息型传输共享 Message / Context 路由；${native} 种原生传输保留各自接口。所有组件由同一服务生命周期管理。`
    : `${messages} message transport${messages === 1 ? "" : "s"} share Message / Context routing; ${native} native transport${native === 1 ? "" : "s"} keep their own APIs. One server lifecycle owns them all.`;
}

protocolButtons.forEach((button) => {
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
document.querySelectorAll("[data-step]").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[data-step]").forEach((item) => { item.classList.remove("active"); item.setAttribute("aria-selected", "false"); });
    tab.classList.add("active"); tab.setAttribute("aria-selected", "true");
    const step = commands[tab.dataset.step]; commandNode.textContent = step.command; outputNode.innerHTML = step.output;
  });
});

document.querySelector("[data-copy]").addEventListener("click", async (event) => {
  try {
    await navigator.clipboard.writeText(commandNode.textContent);
    event.currentTarget.textContent = language === "zh" ? "已复制" : "Copied";
    setTimeout(() => { event.currentTarget.textContent = translations[language].copyButton; }, 1300);
  } catch {
    event.currentTarget.textContent = language === "zh" ? "请选择复制" : "Select to copy";
  }
});

const header = document.querySelector("[data-header]");
window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 20), { passive: true });

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); } });
}, { threshold: .12 });
document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));

applyLanguage();
updateComposition();
