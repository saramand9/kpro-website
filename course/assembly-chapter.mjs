export function assemblyChapter({ code, terminal, output, note, table, link }) {
  return {
    slug: "04-assembly", title: "连接路由、业务与存储", short: "连接应用组件", area: "app",
    outcome: "从 main 找到每个对象的创建位置，验证同一份数据究竟由谁共享。",
    intro: "上一章跟着请求走了一遍。现在把时间拨回请求到来之前：端点、Service、Store 是谁创建的，又怎样交到彼此手里？",
    body: `
    <h2 id="map">先把文件变成一张能用的项目地图</h2>
    <p>第 3 章的请求走的是 <code>httpapi → order.Service → Store</code>。下面这两个文件不在每次请求的处理链上，却负责在启动时把链条接好：${link("cmd/orders/main.go")} 和 ${link("internal/app/app.go")}。</p>
    ${output("只看服务端的主要文件 · 不是需要新建的目录", `cmd/orders/main.go          读取参数，选择存储，接收退出信号
internal/app/app.go          创建 Server 和 Service，挂载并注册入口
internal/httpapi/api.go      HTTP ↔ Go 参数和结果
internal/order/service.go    订单规则，调用 Store 接口
internal/memory/store.go     Store 的内存实现
internal/sqlite/store.go     Store 的 SQLite 实现
internal/messageapi/api.go   TCP 消息 ↔ 同一个 Service`)}
    <p>不要先记文件夹。先回答三个问题：启动失败看哪里？请求格式不对看哪里？规则或数据保存不对看哪里？下面按进程启动的实际顺序回答。</p>

    <h2 id="entry">main 先选择运行参数和存储</h2>
    ${code("cmd/orders/main.go", "\thttpAddr :=", "\tvar store")}
    <p>在工程目录运行下面的命令。若前面的服务仍在运行，先 Ctrl+C 停止它。</p>
    ${terminal("本章继续使用内存", "go run ./cmd/orders -memory")}
    <p>这里 <code>-http</code> 不写就是 127.0.0.1:8080；<code>-tcp</code> 默认为空，表示不开 TCP；<code>-memory</code> 则使下面的 if 选择内存。此时虽然也有 db 参数，它不会被使用。</p>
    ${code("cmd/orders/main.go", "\tvar store order.Store", "\truntime, err :=", ["store, ready = m, m.Ping", "sqlite.Open(ctx, *dbPath)", "defer db.Close()", "store, ready = db, db.Ping"])}
    <p><code>store</code> 是一个接口变量，这次装着 <code>*memory.Store</code>，不用 -memory 时则装着 <code>*sqlite.Store</code>。两者实现相同的业务方法；main 根据配置选择，后面的代码只使用接口。</p>
    <p><code>ready</code> 保存的是所选对象的 Ping 方法，用来检查存储是否可访问。它不是订单查询方法，也不是一个备用 Store。选了哪个存储，就把哪个存储的检查函数一起传下去。</p>

    <h2 id="wire">app.New 把同一个对象传给需要它的地方</h2>
    ${code("cmd/orders/main.go", "\truntime, err := app.New", "\tctx, cancel :=")}
    <p>打开 app.New，先略过顶部 Router 的容量配置，找到这一段：</p>
    ${code("internal/app/app.go", "\torders := order.New(store)", '\tif cfg.TCPAddr != ""', ["orders := order.New(store)", "server.MountNativeChecked", "httpapi.Register(httpEndpoint, orders, ready)"])}
    <p>第一行创建一个业务 Service，内部保存 main 传来的 store。随后创建 HTTP 端点并交给 runtime；最后 <code>httpapi.Register</code> 收到端点和这个 Service，创建持有它的 API 对象，再注册 create/get/cancel handler。</p>
    <div class="flow" aria-label="启动时对象之间的持有关系"><div><b>main</b><span>创建一个 Store</span></div><i>→</i><div class="focus"><b>app.New</b><span>order.New(store)</span></div><i>→</i><div><b>httpapi.Register</b><span>API 记住 orders</span></div><i>→</i><div><b>handler</b><span>请求时调用 orders</span></div></div>
    <p>图中箭头表示启动时传对象；上一章的箭头表示请求时调用方法。两者不要混在一起：<strong>请求到来时不再执行 main，不重新选数据库，也不会重新创建这一套组件。</strong></p>
    <p>app.New 返回的是管理端点的 <code>*server.Server</code>，不是业务 <code>*order.Service</code>。变量名 runtime 与 orders 就是为了区分这两个容易混淆的“服务”。</p>

    <h2 id="share">“共享”不是使用了同一个类型名</h2>
    <p>先运行一个不监听端口的实验：</p>
    ${terminal("验证共享对象与独立对象的差别", "go test ./internal/order -run '^TestServicesShareStore$' -v -count=1")}
    ${code("internal/order/service_test.go", "func TestServicesShareStore(", undefined, ["writer := order.New(store)", "reader := order.New(store)", "isolated := order.New(memory.New())", "reader.Get", "isolated.Get"])}
    <p>writer 和 reader 是两个 Service，但它们持有同一个 Store，所以 writer 写入的订单，reader 能读到。isolated 也使用 memory.Store 这个类型，却持有另一个新建的空 map，因此查不到。这说明<strong>数据是否共享，取决于实际传入的存储对象，不取决于包名或结构体名字相同。</strong></p>
    <p>实际应用更简单：app.New 只创建一个 orders。第 6 章启用 TCP 时，会把这个 orders 再传给 messageapi，而不是另建一套订单业务。</p>

    <h2 id="ownership">谁创建资源，谁负责结束它</h2>
    ${table(["对象或资源", "由谁创建", "在本项目中何时结束"], [
      ["SQLite Store", "main 中的 run", "app.Run 返回后，run 的 defer 关闭数据库"],
      ["order.Service / API", "app.New / httpapi.Register", "由入口持有；没有单独需要关闭的网络资源"],
      ["HTTP / 可选 TCP 端点", "app.New，挂载给 Server", "由 Server 的停止流程管理"],
      ["一次业务操作的 context", "HTTP 或消息 handler", "操作返回时取消；每次请求独立"]
    ])}
    <p>注意数据库的 <code>defer db.Close()</code> 在 main 的 run 里，不在 app.New 中。如果放到一个马上返回的组装函数里，服务开始接请求时数据库可能已经关闭。启动时打开、运行时复用、停机后关闭，才与它的使用时间一致。</p>
    <p>main 负责把进程信号转换成取消；app.Run 等待 runtime 停止后才返回。第 8 章会进一步核对这个顺序，以及端口被占用时是否也能收尾。</p>

    <h2 id="exercise">改错一次接线，用测试定位它</h2>
    <p>只修改刚才测试里的这一行：把 <code>reader := order.New(store)</code> 改成 <code>reader := order.New(memory.New())</code>，其他行不变。重新运行同一条测试命令。</p>
    ${output("应观察到的失败", `TestServicesShareStore → FAIL
shared store: … order not found …`)}
    <p>创建逻辑没有变，ID 也没有变，但查询换了一份空存储。修复点是传参，不是重新生成 ID，也不是给 Get 添加特殊判断。把 reader 恢复为接收 store，测试重新 PASS。</p>
    <div class="checkpoint"><strong>合上这页再试着说明</strong><p>从 -memory 参数开始，指出哪个语句创建 map、哪个语句把它交给 Service、哪个语句把 Service 交给 HTTP。能在文件中连起来，才算看懂了组装，而不只是记住分层名称。</p></div>
    <p>下一章不改路由和 Service，只改变 main 传入的 Store，让订单在进程退出后仍然存在。</p>
    `
  };
}
