export function tcpChapter({ code, terminal, output, note, table, link }) {
  return {
    slug: "06-second-protocol", title: "通过 TCP 查询同一笔订单", short: "增加 TCP 查询", area: "messageapi",
    outcome: "用两个客户端读取同一笔订单，区分协议翻译、消息编解码和业务复用。",
    intro: "假设设备端已有二进制消息连接，需要按 ID 查询订单。我们为它加一个入口，但不复制订单规则，也不再建一份数据库。",
    body: `
    <h2 id="try">先验证两个入口真的连着同一份数据</h2>
    <p>停止上一章的服务，在原工作目录重新启动，保留同一个 lesson.db。新增参数只开启 TCP，不改变 HTTP 地址或存储选择。</p>
    ${terminal("终端 1 · 同一个进程开启两个入口", "go run ./cmd/orders -db lesson.db -tcp 127.0.0.1:8088")}
    <p>另一个终端先通过 HTTP 创建一笔新订单，记下完整 ID。这样就不依赖你是否完成过上一章，且能确认这笔订单初始为 pending。Windows 请用 curl.exe。</p>
    ${terminal("终端 2 · 先创建", 'curl -i -X POST http://127.0.0.1:8080/orders -H "Content-Type: application/json" --data-binary "@requests/create.json"')}
    <p>把下面的 ORDER_ID 替换成刚才返回的完整 ID，再执行两种查询：</p>
    ${terminal("查询同一 ID", `curl -i http://127.0.0.1:8080/orders/ORDER_ID
go run ./cmd/ordercli -id ORDER_ID`)}
    <p>HTTP 查询返回 200 和订单 JSON；ordercli 不打印 HTTP 状态码，只打印解码后的订单。</p>
    ${output("两次查询要比较的内容", `id         相同，都是 HTTP 刚创建的 ID
sku        coffee
quantity   2
status     pending
created_at 相同，不是 TCP 查询时重新生成的时间`)}
    <p>这里没有 HTTP 服务把数据同步给另一台 TCP 服务。只有一个进程、一个订单 Service、一个 Store，两个入口调用的是同一份业务。</p>

    <h2 id="wire">新增的入口接在项目哪里</h2>
    ${code("internal/app/app.go", '\tif cfg.TCPAddr != ""', "\treturn runtime, nil", ["runtime.MountChecked", "Codec: codec.KProV1()", "messageapi.Register(messageEndpoint, orders)"])}
    <p>HTTP 注册完成后，app.New 检查 TCPAddr 是否为空。非空才挂载 TCP 端点，最后把<strong>之前已经创建的 orders</strong>传给 messageapi.Register。这里没有第二次 order.New，更没有再调用 sqlite.Open。</p>
    <div class="flow" aria-label="TCP 查询经过的组件"><div><b>ordercli</b><span>编码并发送请求</span></div><i>→</i><div><b>TCP / codec</b><span>收齐并解码消息</span></div><i>→</i><div class="focus"><b>messageapi</b><span>调用 orders.Get</span></div><i>→</i><div><b>原来的 Store</b><span>查询 lesson.db</span></div></div>
    <p>业务规则没有新分支。与 HTTP 相比，变化的是“怎样把客户端输入变成 Get 的参数，以及怎样把结果发回去”。</p>

    <h2 id="contract">先约定消息含义，再读 handler</h2>
    ${code("internal/messageapi/api.go", "const GetOrderID", "func Register(")}
    ${table(["字段", "本例含义", "不要混淆"], [
      ["消息 ID：1001", "执行查询订单这个操作", "相当于选择哪条路由；不是订单号"],
      ["请求体 id", "要查的订单 ID", "就是 HTTP 创建返回的 32 位字符串"],
      ["Seq：1", "本次请求与响应的关联序号", "本例一条连接只发一个请求，暂时固定为 1"],
      ["响应体 order / error", "成功放订单，失败放应用错误码", "这是本应用的约定，不是所有 KPro 服务的统一响应格式"]
    ])}
    <p>TCP 本身不知道“查询订单”是什么，KPro 也没有预定义订单消息 1001。编号、JSON 字段和错误码由客户端与服务端共同约定。这里让二进制帧承载 JSON，二进制协议不意味着业务数据必须自己按字节编码。</p>

    <h2 id="handler">入口翻译请求，但不重新实现查询</h2>
    ${code("internal/messageapi/api.go", "func Register(", "\t\tctx, cancel :=", ["endpoint.HandleChecked(GetOrderID", "json.Unmarshal", "invalid_request"])}
    <p>HandleChecked 把消息 1001 绑定到 handler。进入这里时，<code>c.Message().Data</code> 已经是 codec 取出的数据体，不包含外层帧头。handler 再把 JSON 解成 GetRequest，拒绝无效 JSON 或空 ID。</p>
    ${code("internal/messageapi/api.go", "\t\tctx, cancel :=", "func reply(", ["orders.Get(ctx, req.ID)", "order.ErrNotFound", "Response{Order: &o}"])}
    <p>中间真正的业务调用仍只有 <code>orders.Get(ctx, req.ID)</code>。它与 HTTP 的 get handler 调用相同方法；存储返回 ErrNotFound 时，这里翻译成消息体中的 order_not_found，而 HTTP 翻译成 404。</p>
    <p>这里的 <code>core.Context</code> 与 HTTP 的 <code>*httpx.Context</code> 不同。前者提供消息、会话和 Reply；后者提供 HTTP 请求、响应头与 JSON 响应。KPro 统一组装和生命周期，并不要求协议入口强行使用相同形状。</p>
    ${code("internal/messageapi/api.go", "func reply(", undefined, ["json.Marshal(response)", "c.Reply(GetOrderID, data)"])}
    <p>业务失败也可以成功发送一个 error 响应；发送失败才是 Reply 返回的 error。Reply 成功表示回复被接受发送，不证明对端业务已经处理完成。这两层“成功”不能混为一谈。</p>

    <h2 id="client">客户端怎样知道一条消息读完了</h2>
    <p>${link("cmd/ordercli/main.go")} 解析 -addr 与 -id，然后调用 ${link("internal/tcpclient/client.go")} 的 Get。Get 建立 TCP 连接，设置 3 秒截止时间，再执行：</p>
    ${code("internal/tcpclient/client.go", "\tbody, err :=", "\tvar response messageapi.Response", ["codec.KProV1().Encode", "io.Copy", "codec.KProV1().Read", "result.Message.Seq != 1"])}
    <p>TCP 是字节流，不保留每次 Write 的消息边界；所以客户端不能把一次 Read 直接当成完整 JSON。两端都使用 KProV1 codec，由它编码和读取帧，再把帧内 Data 交给 JSON 解码器。<code>io.Copy</code> 负责把已编码的完整帧写出，Read 负责收齐一条符合该格式的消息。</p>
    <p>回复沿用请求的 Seq，客户端同时检查消息 ID 和 Seq，防止误认不相关响应。随后它把 Response.Order 取出交给命令行打印——所以你看到的输出没有外层 <code>{"order": ...}</code>，不意味着线上协议没有这层封装。</p>
    <p>本例每次查询新建连接，只发一次请求后关闭。若要复用长连接、多请求并发或断线重试，需要另行设计序号分配、等待表和失败处理；这里没有实现这些功能。</p>

    <h2 id="verify">观察业务失败，并让测试检查跨协议一致性</h2>
    ${terminal("一个不存在的订单 · 这条命令预期以失败结束", "go run ./cmd/ordercli -id missing")}
    ${output("关键错误 · 日志时间因运行而异", "server: order_not_found")}
    <p>这说明连接、编解码和路由都已工作，只是订单不存在。若是 connection refused，应先查服务有没有启用 -tcp、地址是否正确；不要改 Service.Get 的业务逻辑。</p>
    ${terminal("运行真实监听端口的集成测试", "go test ./internal/app -run '^TestHTTPAndTCPShareOrders$' -v -count=1")}
    <p>预期 PASS。测试使用临时本机端口和独立内存存储，先经 HTTP 创建、再经 TCP 比较所有字段；然后经 HTTP 取消，再用 TCP 确认状态变为 cancelled，最后停止 runtime。它检查的不只是两个端口都能打开，而是两条路径确实碰到了同一笔数据。</p>
    ${code("internal/app/app_test.go", "\tgot, err := tcpclient.Get", "\tcancelResp, err :=", ["got != created"])}

    <h2 id="exercise">只改 TCP 地址，不改业务</h2>
    <p>停止自己的订单进程，把启动参数中的 TCP 端口改为一个空闲的 8089：<code>go run ./cmd/orders -db lesson.db -tcp 127.0.0.1:8089</code>。再使用客户端的 -addr 参数：</p>
    ${terminal("客户端与服务端约定新的连接地址", "go run ./cmd/ordercli -addr 127.0.0.1:8089 -id ORDER_ID")}
    <p>仍应查到同一订单，HTTP 的 8080 查询也应继续成功。这个变更不需要修改消息 ID、Service.Get 或 SQL；地址决定去哪里连接，消息 ID 决定连上后执行什么。练习结束后把 TCP 端口恢复为 8088，方便后续命令沿用默认值。</p>
    <div class="checkpoint"><strong>本章的项目视图</strong><p>新增的是 TCP 端点、消息适配和客户端；复用的是业务对象、存储和运行生命周期。没有引入同步数据的任务，也没有实现推送、订阅或离线投递。产品只需要 HTTP 时，可以一直不启用 TCP。</p></div>
    `
  };
}
