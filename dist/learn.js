const learnCopy = {
  en: {
    main: ["cmd/orders/main.go", "Own process assembly", "Create dependencies, register middleware, mount transports, wait for readiness, and translate process signals into cancellation.", "Keep business decisions out of main."],
    service: ["internal/order/service.go", "Own business behavior", "Validate commands, enforce order state transitions, and coordinate application-owned repository and event ports.", "No HTTP status codes, connection IDs, or transport payloads."],
    http: ["internal/transport/http.go", "Translate HTTP at the edge", "Decode requests, call the order service, and map classified outcomes to protocol-safe responses.", "Handlers adapt; the service decides."],
    message: ["internal/transport/message.go", "Preserve message semantics", "Register synchronous handlers when per-session order matters, then translate Message / Context into application commands.", "Choose asynchronous dispatch only when ordering is unnecessary."],
    store: ["internal/platform/store.go", "Implement application ports", "Keep concrete GORM or database types behind the narrow repository contract owned by the order module.", "Infrastructure depends on the application contract."],
    test: ["tests/integration/orders_test.go", "Prove real boundaries", "Exercise framing, cancellation, error mapping and shutdown with loopback transports and the target database.", "Repository tests do not replace workload validation."]
  },
  zh: {
    main: ["cmd/orders/main.go", "负责进程组装", "创建依赖、注册中间件、挂载传输、等待就绪，并把进程信号转换为取消。", "不要在 main 中放业务决策。"],
    service: ["internal/order/service.go", "负责业务行为", "校验命令、执行订单状态转换，并协调应用自有的仓储与事件端口。", "不包含 HTTP 状态码、连接 ID 或传输载荷。"],
    http: ["internal/transport/http.go", "在边缘转换 HTTP", "解码请求、调用订单服务，并将分类后的结果映射为协议安全响应。", "Handler 负责适配，Service 负责决策。"],
    message: ["internal/transport/message.go", "保留消息语义", "需要会话内顺序时注册同步处理器，再将 Message / Context 转换为应用命令。", "只有不需要顺序时才选择异步调度。"],
    store: ["internal/platform/store.go", "实现应用端口", "将具体 GORM 或数据库类型隐藏在订单模块自有的窄仓储契约之后。", "基础设施依赖应用契约。"],
    test: ["tests/integration/orders_test.go", "证明真实边界", "使用回环传输和目标数据库验证帧、取消、错误映射与停机。", "仓库测试不能替代业务负载验证。"]
  }
};

const edgeCopy = {
  http: {
    code: `func registerOrderHTTP(e *httpx.Endpoint, svc *order.Service) {
    e.Post("/orders", func(ctx *httpx.Context) error {
        var cmd order.CreateCommand
        if err := ctx.JSONBody(&cmd); err != nil {
            return err
        }

        created, err := svc.Create(ctx.Context(), cmd)
        if err != nil {
            return classifyHTTP(err)
        }
        return ctx.JSON(http.StatusCreated, created)
    })
}`,
    en: "The HTTP adapter owns decoding and response mapping. It does not implement order rules or expose internal errors.",
    zh: "HTTP 适配器负责解码与响应映射，不实现订单规则，也不暴露内部错误。"
  },
  message: {
    code: `func registerOrderMessages(e *server.Endpoint, svc *order.Service) {
    e.HandleSync(msgid.SubscribeOrder, func(ctx core.Context) error {
        req, err := decodeSubscription(ctx.Message())
        if err != nil {
            return err
        }

        return svc.Subscribe(core.ContextOf(ctx), req, func(event order.Event) error {
            return ctx.Session().Send(encodeEvent(event))
        })
    })
}`,
    en: "Start with HandleSync when operations share session state or responses must stay ordered. Application acknowledgements remain your protocol's job.",
    zh: "当操作共享会话状态或响应必须有序时，从 HandleSync 开始。业务确认仍由你的协议负责。"
  },
  assembly: {
    code: `app, err := server.NewChecked(server.Config{
    Name:            "orders",
    ShutdownTimeout: 10 * time.Second,
})
if err != nil { return err }

httpAPI := server.MountNative(app, httpx.New(httpx.Config{
    Addr: ":8080", MaxBodyBytes: 1 << 20,
}))
messages := app.Mount(tcp.New(tcp.Config{
    Addr: ":9000", Codec: codec.KProV1(),
}))

registerOrderHTTP(httpAPI, orderService)
registerOrderMessages(messages, orderService)`,
    en: "Composition code knows concrete transports. The order service does not. Mount both edges once before the server lifecycle is claimed.",
    zh: "组装代码知道具体传输，订单服务不知道。在服务器生命周期被占用前，一次性挂载全部边缘。"
  }
};

let language = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
let currentFile = "main";
let currentEdge = "http";
const languageButton = document.querySelector("[data-learn-language]");

function applyLanguage() {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.body.dataset.lang = language;
  document.querySelectorAll("[data-en][data-zh]").forEach((node) => { node.innerHTML = node.dataset[language]; });
  languageButton.textContent = language === "zh" ? "EN" : "中文";
  languageButton.setAttribute("aria-label", language === "zh" ? "Switch to English" : "切换为中文");
  renderFile();
  renderEdge();
}

function renderFile() {
  const [path, title, body, rule] = learnCopy[language][currentFile];
  document.querySelector("[data-file-path]").textContent = path;
  document.querySelector("[data-file-title]").textContent = title;
  document.querySelector("[data-file-body]").textContent = body;
  document.querySelector("[data-file-rule]").textContent = rule;
}

function renderEdge() {
  const edge = edgeCopy[currentEdge];
  document.querySelector("[data-edge-code]").textContent = edge.code;
  document.querySelector("[data-edge-note]").textContent = edge[language];
}

languageButton.addEventListener("click", () => { language = language === "en" ? "zh" : "en"; applyLanguage(); });

document.querySelectorAll("[data-file]").forEach((button) => {
  button.addEventListener("click", () => {
    currentFile = button.dataset.file;
    document.querySelectorAll("[data-file]").forEach((item) => { item.classList.remove("active"); item.setAttribute("aria-selected", "false"); });
    button.classList.add("active"); button.setAttribute("aria-selected", "true"); renderFile();
  });
});

document.querySelectorAll("[data-edge]").forEach((button) => {
  button.addEventListener("click", () => {
    currentEdge = button.dataset.edge;
    document.querySelectorAll("[data-edge]").forEach((item) => { item.classList.remove("active"); item.setAttribute("aria-selected", "false"); });
    button.classList.add("active"); button.setAttribute("aria-selected", "true"); renderEdge();
  });
});

applyLanguage();
