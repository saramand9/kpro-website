export function lifecycleChapter({ code, terminal, output, note, table, link }) {
  return {
    slug: "08-lifecycle", title: "启动、检查与关闭服务", short: "运行与关闭", area: "app",
    outcome: "观察成功启动、端口冲突、依赖故障和主动停止，区分这些结果。",
    intro: "现在能完成业务操作了，但服务还需要回答：什么时候可以接流量？启动失败会留下什么？停止时数据库先关，还是请求先结束？",
    body: `
    <h2 id="observe">从一次正常启动开始</h2>
    <p>先停止前面自己启动的订单服务，然后在原工程目录运行。保持相同数据库路径，便于停止后验证旧订单仍存在。</p>
    ${terminal("终端 1 · 本章只需要 HTTP", "go run ./cmd/orders -db lesson.db")}
    ${output("关键启动日志 · 前面还会带日志时间", "listeners ready")}
    <p>这条日志不是 main 一进入就打印的。main 必须先打开存储、完成 app.New，再由 app.Run 启动并等到挂载端点就绪。在另一个终端检查两个探测路径，Windows 用 curl.exe：</p>
    ${terminal("终端 2 · 两种不同的检查", `curl -i http://127.0.0.1:8080/livez
curl -i http://127.0.0.1:8080/readyz`)}
    ${output("正常情况下的响应", `GET /livez  → 200，{"status":"alive"}
GET /readyz → 200，{"status":"ready"}`)}
    <p>两者现在都是 200，不代表它们做了相同的检查。下面先追启动过程，再区分它们。</p>

    <h2 id="start">Start、WaitReady 和 Wait 各等什么</h2>
    ${code("internal/app/app.go", "func Run(", '\tlog.Print("listeners ready")', ["runtime.Start(ctx)", "handle.WaitReady(readyCtx)", "stop()", "handle.Wait()"])}
    <p><code>Start</code> 开始本轮运行，返回管理这轮运行的 handle。它不是“所有监听都已成功”的同义词，所以随后用 <code>WaitReady</code> 等待启动结果，并为等待设置 5 秒上限。</p>
    <p>如果等不到就绪，先 stop 取消本轮运行，再 Wait 等它停止，最后把启动与停止错误汇总返回。这里不能只 return err，把尚在退出的端点留给 main 去关闭数据库。</p>
    ${code("internal/app/app.go", '\tlog.Print("listeners ready")', undefined, ["handle.Wait()", "parent.Err() != nil"])}
    <p>启动成功才打印 listeners ready；接下来 <code>Wait</code> 等整个运行结束。主动取消导致的正常终止被转换为 nil；其他错误继续交给 main 记录并以失败状态退出。wait 的对象不同，不能把 WaitReady 与 Wait 交换。</p>

    <h2 id="health">就绪日志不等于数据库永远健康</h2>
    ${code("internal/httpapi/api.go", '\tendpoint.Get("/livez"', '\tendpoint.Post("/orders"', ["ready(ctx)", "http.StatusServiceUnavailable"])}
    <p>/livez 不访问 Store，只说明请求能到达进程并获得响应。/readyz 每次请求都会调用 main 传入的 Ping，并给这次检查 1 秒预算；存储检查失败就返回 503。WaitReady 则只协调本轮受管理端点的启动结果，不替代这个持续检查。</p>
    <p>不用破坏数据库文件也能观察这一区别。测试为 Register 传入一个永远返回 offline 的检查函数，同时使用会失败的 Store：</p>
    ${code("internal/httpapi/api_test.go", "func TestInternalErrorIsNotExposed(", undefined, ["httpapi.Register", '"/readyz"', '"/livez"'])}
    ${terminal("验证依赖失败时的对外行为", "go test ./internal/httpapi -run '^TestInternalErrorIsNotExposed$' -v -count=1")}
    <p>预期 PASS：创建返回 500 且不泄露内部错误；/readyz 为 503，/livez 仍为 200。这里是受控注入的失败，不是声称已经模拟了真实磁盘损坏。真实部署应选择“接收业务所必需”的依赖做 readiness，并由部署层限制探测接口的暴露范围。</p>

    <h2 id="failure">让第二个进程撞上已占用的端口</h2>
    <p>保持终端 1 正常运行。在终端 2 执行下面命令；使用内存避免同时打开同一个练习库。这条命令<strong>预期失败</strong>，不要关闭第一个进程来“修复”它。</p>
    ${terminal("终端 2 · 故意申请同一个 8080", "go run ./cmd/orders -memory")}
    ${output("应观察到的行为 · 错误文字随操作系统不同", `第二个进程：报告 bind / address already in use / 地址占用，退出失败
第二个进程：没有 listeners ready
第一个进程：仍能响应 /readyz`)}
    <p>失败不是订单业务导致的。问题发生在监听端口阶段，因此应该检查启动地址和正在运行的进程，而不是给 Create 加重试或重新建表。</p>
    ${terminal("不依赖你的 8080 状态，运行自动化版本", "go test ./internal/app -run '^TestRunRejectsOccupiedPort$' -v -count=1")}
    <p>预期 PASS。${link("internal/app/app_test.go")} 的这个测试先占住一个临时本机端口，再让 app.Run 使用它，要求返回启动错误，且 runtime 已进入 Stopped。测试会自行释放临时端口，不会杀掉你的服务。</p>

    <h2 id="stop">按一次 Ctrl+C，追到数据库关闭</h2>
    <p>回到终端 1 按 Ctrl+C。正常结束时应看到 service stopped，命令行重新可输入。源码中的顺序是：</p>
    <ol class="request-trace">
      <li><div><strong>main 的信号 goroutine 调用 cancel</strong>${link("cmd/orders/main.go")}<p>把操作系统信号转成普通 context 取消。</p></div></li>
      <li><div><strong>Server 停止受管理端点，app.Run 等到结束</strong>${link("internal/app/app.go")}<p>在配置的预算内进行停止；Wait 返回后，外层 run 才能返回。</p></div></li>
      <li><div><strong>run 的 defer 关闭 SQLite</strong>${link("cmd/orders/main.go")}<p>不会在端点还正常处理请求时，就因为组装函数返回而提前关闭数据库。</p></div></li>
      <li><div><strong>main 打印 service stopped</strong><p>若 run 返回真实错误，则记录错误并退出失败，不打印这条成功停止日志。</p></div></li>
    </ol>
    <p>停止后再请求 /readyz，应连接失败，而不是期待一个已经退出的进程返回 503。再次用相同的 -db 路径启动，上一章记录的 ID 应仍可查询。这个实验验证正常停止和重开，不证明强制终止或断电时的行为。</p>

    <h2 id="budgets">把限制对应到实际处理的位置</h2>
    <p>超时不是一个总开关。一次请求经过不同阶段，各阶段的配置保护不同资源。以下都是 ${link("internal/app/app.go")} 和 handler 中的教学取值：</p>
    ${table(["位置", "本例设置", "它没有承诺什么"], [
      ["HTTP 请求体", "4 KiB", "不是整个进程的内存上限"],
      ["HTTP 读 / 写", "5 秒 / 5 秒", "不是业务一定能在 5 秒内完成"],
      ["业务调用 context", "2 秒", "不会强杀任意 goroutine；下层必须配合取消"],
      ["TCP 连接与单条数据体", "64 个连接 / 4 KiB", "不是整个服务的吞吐或可用性保证"],
      ["TCP 单会话出站队列", "16 条 / 64 KiB", "入队成功不等于对端业务确认"],
      ["Router MaxInflight", "256", "约束消息路由任务，不是 HTTP 并发上限"],
      ["停止预算", "5 秒", "不保证所有外部副作用可靠完成"]
    ])}
    <p>例如 JSON 能正确解码但数量为 0，应该修改请求而不是调大超时；请求体超限，则先判断是否符合接口契约。请先定位失败阶段，再决定是否调整配置。这些数值都不是生产推荐容量。</p>
    <p><code>runtime.Use(middleware.Recover())</code> 也有边界：它为受管理的 handler 调用提供 panic 恢复，不会补偿已经提交的事务或发出的邮件，也不会自动接住任意自建 goroutine 的 panic。</p>

    <h2 id="exercise">修复冲突，让两个进程各自运行</h2>
    <p>让使用 lesson.db 的第一个进程继续在 8080 运行；若刚才已停止，先按本章开头的命令重新启动。在另一个终端启动第二个进程，这次给它一个空闲的 8081 端口，并使用独立内存：</p>
    ${terminal("第二个进程 · 若 8081 已占用，换一个空闲端口", "go run ./cmd/orders -memory -http 127.0.0.1:8081")}
    <p>现在它也应打印 listeners ready。再开终端，请求 <code>http://127.0.0.1:8081/readyz</code>，应为 200；用第一个进程保存过的订单 ID 查询 8081，应为 404，而同一 ID 在 8080 仍为 200。</p>
    <details class="answer"><summary>为什么两个进程都就绪，数据却不同</summary><p>修改 -http 解决了监听冲突，并没有让第二个进程自动读取第一个进程的数据库。它选择了 -memory，拥有自己的空 Store；/readyz 为 200 只表示它的检查成功，不表示某笔订单存在。这个差别同时用到了第 4 章的组装、第 5 章的存储选择和本章的生命周期。</p></details>
    <p>练习结束后，在各自终端 Ctrl+C 停止这两个由你启动的进程。不要停止来源不明的进程，也不需要删除数据库。程序可启动、可探测、可正常退出，只是运行基础；上线还需要鉴权、TLS、创建幂等键、迁移与备份、日志指标、容量与故障验证，以及部署回滚方案。</p>
    ${terminal("提交自己的改动前，检查这个教学应用", `go test ./... -count=1
go test -race ./... -count=1
go vet ./...`)}
    <p>这些检查覆盖代码中表达的行为，不完成生产认证。KPro 仍是 pre-1.0，本例固定 v0.2.1；升级时保持依赖、CLI 和文档版本一致，并重新验证应用。下一章把这些检查用在一次真正的需求变更上。</p>
    `
  };
}
