export function firstRequestChapter({ code, terminal, output, note, table, link }) {
  return {
    slug: "01-first-request", title: "运行第一个 HTTP 服务", short: "第一个 HTTP 服务", area: "app",
    outcome: "运行、修改一条路由，分清启动时的配置与每次请求的处理。",
    intro: "先不用订单、数据库和项目分层。用一个可以改动的小程序，看清一条请求如何进入你的 Go 函数，又怎样回到客户端。",
    body: `
    <h2 id="run">先得到一个真正的响应</h2>
    <div class="checkpoint"><strong>开始前，准备好示例工程</strong><p>需要会基本 Go 语法、能在终端执行命令，并安装 <strong>Go 1.26.9 或更新版本</strong>。首次下载依赖需要网络。这一章先运行最小 HTTP 示例，后面再逐步理解完整订单服务。</p><p><a class="download" href="@@ROOT@@downloads/orders.zip" download>下载示例工程 <span>ZIP ↓</span></a><a href="@@ROOT@@learn.html#download">查看环境与运行说明 →</a></p></div>
    <p>解压后进入包含 <code>go.mod</code> 的 orders 目录。后面的命令都在这里运行，不要进入 cmd/hello 再执行。若已经启动了概览中的订单服务，先在它的终端按 Ctrl+C，释放 8080 端口。</p>
    ${terminal("终端 1 · 核对环境后启动，保持运行", "go version\ngo mod download\ngo run ./cmd/hello")}
    <p>Hello 程序启动成功时没有专门的提示，终端也不会返回命令行；这是它在等待请求，不是卡死。等首次编译结束，在另一个终端发请求。Windows PowerShell 请把本教程中的 <code>curl</code> 写成 <code>curl.exe</code>。</p>
    ${terminal("终端 2 · 请求刚启动的程序", "curl -i http://127.0.0.1:8080/hello")}
    ${output("应看到的关键响应 · 省略 Date 等响应头", `HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"message":"hello KPro"}`)}
    <p><code>-i</code> 让 curl 同时显示响应头和响应体。200 是 HTTP 状态码，下面的 JSON 是我们写的内容。再执行一次，你会得到同样的结果；服务不需要为每个请求重新启动。</p>
    <div class="checkpoint"><strong>先确认这一点</strong><p>终端 1 仍在运行，终端 2 可以连续两次得到 200。如果连接被拒绝，先检查编译是否结束、终端 1 是否报错；不要急着改 handler。</p></div>

    <h2 id="prepare">哪些代码在请求到来之前执行</h2>
    <p>打开 ${link("cmd/hello/main.go")}。先看 <code>run</code> 的前半段，暂时不看信号处理：</p>
    ${code("cmd/hello/main.go", "\tapp, err := server.NewChecked", "\tctx, cancel :=", ["server.NewChecked", "server.MountNativeChecked", 'endpoint.Get("/hello"'])}
    <p><code>server.NewChecked</code> 创建管理运行过程的 Server，并检查配置。它不是订单业务 Service，也还没有在监听端口。<code>httpx.New</code> 创建 HTTP 端点；<code>MountNativeChecked</code> 把它交给 Server 管理，并保留 HTTP 端点的具体类型，所以我们还能调用它的 <code>Get</code>。</p>
    <p><code>endpoint.Get</code> 登记一条规则：“GET /hello 交给这个函数”。<strong>注册函数不等于执行函数。</strong>就像先记下一张值班表，还没有人来办事。这段代码在进程启动时执行一次；它保存的 handler 可以在之后被调用很多次。</p>
    <p>两处 <code>if err != nil</code> 也不是装饰：配置检查或挂载失败，就返回错误，不继续使用一个无效的对象。文件最后的 main 会记录错误并以失败状态退出。</p>

    <h2 id="request">请求到来时，只执行哪一部分</h2>
    <ol class="request-trace">
      <li><div><strong>curl 连接 127.0.0.1:8080</strong><p>地址确定要访问的进程。路径 /hello 不是文件名，不需要磁盘上存在 hello 文件。</p></div></li>
      <li><div><strong>HTTP 端点匹配 GET 与 /hello</strong><p>端点处理 HTTP 读写，并调用刚才注册的匿名函数。改用其他路径就不会匹配这条路由。</p></div></li>
      <li><div><strong>handler 收到本次请求的 Context</strong><p><code>*httpx.Context</code> 提供读取请求、设置响应头和写响应的方法。它属于这一次请求，不是整台服务器。</p></div></li>
      <li><div><strong>c.JSON 写回 200 和 JSON</strong><p>传入的 Go map 被编码成 JSON。函数返回的是写响应时可能发生的 error，不是一个等待 KPro 自动序列化的业务对象。</p></div></li>
    </ol>
    <p>因此，返回内容由你的函数决定，监听、协议解析和路由匹配由 HTTP 端点处理。这个入口使用原生 HTTP handler，不需要二进制消息 ID，也不需要先了解 TCP 编解码。</p>

    <h2 id="lifetime">为什么程序一直不退出</h2>
    ${code("cmd/hello/main.go", "\terr = app.Run(ctx)", "func main(", ["app.Run(ctx)", "server.IsContextTermination(err)"])}
    <p>真正开始运行挂载端点的是 <code>app.Run(ctx)</code>。它会等待服务结束，所以 run 不会立刻返回。这段代码上方的 <code>signal.Notify</code> 把 Ctrl+C / SIGTERM 转成信号，等待信号的 goroutine 随后调用 <code>cancel()</code>。</p>
    <p>取消上下文后，Server 进入有时间预算的停止流程；Run 返回，程序才能退出。这里用 <code>IsContextTermination</code> 区分主动结束与真正的错误。现在先记住“创建、挂载、注册是准备；Run 才运行”，第 8 章再观察完整订单服务的就绪与停机。</p>

    <h2 id="exercise">动手改一条路由，再验证旧路径失效</h2>
    <p>在同一个文件中，把 <code>endpoint.Get</code> 的路径改为 <code>"/welcome"</code>，把 map 中的 message 改为 <code>"welcome to my service"</code>。保存后，先不重启，仍请求 /hello：你应该看到旧响应，因为正在运行的是之前编译的程序。</p>
    <p>然后在终端 1 按 Ctrl+C，再执行 <code>go run ./cmd/hello</code>。在终端 2 检查两条路径：</p>
    ${terminal("验证改动 · 两条命令都执行", `curl -i http://127.0.0.1:8080/hello
curl -i http://127.0.0.1:8080/welcome`)}
    ${output("应观察到的变化", `GET /hello   → 404
GET /welcome → 200，响应体为 {"message":"welcome to my service"}`)}
    <details class="answer"><summary>结果不同，应该从哪里查</summary><p>两条路径都连接失败：先确认进程还活着以及端口。旧路径仍为 200、新路径为 404：通常没有重启，或运行的不是你修改的目录。新路径成功但文字没变：检查你改的是 map 的值，而不是注释。<code>go run</code> 不会自动热更新。</p></details>
    <p>验证后把路径和文字恢复成原值，并停止 Hello 服务。这样后面的 orders 程序可以继续使用 8080，下载包的初始状态也与正文一致。</p>

    <h2 id="next">把这一页放回整个项目</h2>
    ${table(["刚认识的部分", "完整订单项目中的位置"], [
      ["创建 Server、挂载端点", `${link("internal/app/app.go")}：app.New`],
      ["注册路径、编写 handler", `${link("internal/httpapi/api.go")}：Register 与 create/get/cancel`],
      ["响应中的业务内容", `${link("internal/order/service.go")}：下一章开始定义订单与规则`],
      ["接收退出信号", `${link("cmd/orders/main.go")}：run`]
    ])}
    <p>这些部分不是多出来的框架仪式，而是这个单文件程序随着业务增多后拆开的职责。下一章先把“返回 hello”换成一件有规则的事：接受商品和数量，生成一笔合法订单。</p>
    `
  };
}
