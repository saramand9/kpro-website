// Representative lesson: one request, its concrete values, and observable checks.
export function httpChapter({ code, terminal, output, note, table, link }) {
  return {
    slug: "03-http", title: "创建和查询订单", short: "创建和查询订单", area: "httpapi",
    outcome: "跟随一笔真实订单，从 HTTP 请求追踪到保存，再用 ID 查回。",
    intro: "上一章的业务方法还只是普通 Go 函数。这一章把它接到 HTTP：提交两件 coffee，拿到订单号，再查回同一笔订单。每一步都回到实际运行的代码。",
    body: `
    <div class="lesson-goals"><p>这一章，你会弄清三件事</p><ul>
      <li>请求如何找到业务方法，JSON 在哪里变成 Go 值。</li>
      <li>订单在哪里保存，为什么保存失败就不能返回创建成功。</li>
      <li>修改一个 HTTP 行为时，哪些文件需要改，哪些不用动。</li>
    </ul></div>
    <h2 id="send">1. 创建订单，保存返回的 ID</h2>
    <p>请先停止上一章的 hello 或 orders 服务，避免两个程序同时占用 8080。在解压后的 <code>orders</code> 目录打开两个终端。这里使用内存存储，暂时不让数据库配置干扰请求流程。</p>
    ${terminal("终端 1 · 启动后保持运行", "go run ./cmd/orders -memory")}
    <p>看到 <code>listeners ready</code> 后，在终端 2 发出请求。Windows PowerShell 请把下面的 <code>curl</code> 写成 <code>curl.exe</code>；使用工程内的 JSON 文件，可以避开命令行引号差异。</p>
    ${code("requests/create.json")}
    ${terminal("终端 2 · 创建一笔订单", 'curl -i -H "Content-Type: application/json" --data-binary "@requests/create.json" http://127.0.0.1:8080/orders')}
    ${output("预期响应 · 为便于阅读已格式化；ID 和时间仅作示例", `HTTP/1.1 201 Created
Location: /orders/7b41d3e8275842c88dca6a591a3cbe20
Content-Type: application/json

{
  "id": "7b41d3e8275842c88dca6a591a3cbe20",
  "sku": "coffee",
  "quantity": 2,
  "status": "pending",
  "created_at": "2026-10-21T08:00:00Z"
}`)}
    <div class="checkpoint"><strong>现在检查</strong><p>状态码应是 201；sku 和 quantity 与输入相同；id、status、created_at 是服务端补上的。复制<strong>你自己响应里的完整 ID</strong>，下一步会用到它。不要使用本文的示例 ID。</p></div>
    <p>你拿到的工程已经包含完整实现。本章不是要求再粘贴一遍所有函数，而是先运行、再沿这次请求逐段拆解，最后独立修改一个行为。下面标注“节选”的代码均取自下载包；点击文件名可以查看上下文。</p>

    <h2 id="register">2. 找到请求进入项目的位置</h2>
    <p>打开 ${link("internal/httpapi/api.go")}。在 <code>Register</code> 中，API 对象记住传入的业务服务，然后把路径交给 HTTP 端点：</p>
    ${code("internal/httpapi/api.go", "type API struct", '\tendpoint.Get("/livez"', ['api := &API{orders: orders}'])}
    <p><code>orders</code> 是 API 对象持有的 Service。继续往下看同一个 Register 的订单路由部分；中间的健康检查路由留到第 8 章再讲：</p>
    ${code("internal/httpapi/api.go", '\tendpoint.Post("/orders"', "func (a *API) create(", ['endpoint.Post("/orders", api.create)', 'endpoint.Get("/orders/{id}", api.get)'])}
    <p><code>POST /orders</code> 对应 <code>api.create</code>，<code>GET /orders/{id}</code> 对应 <code>api.get</code>。注册时只保存对应关系；真正收到请求后，HTTP 端点才调用这个函数。</p>
    <p>这些业务对象并不是每个请求重新创建的。启动时，${link("internal/app/app.go")} 创建 Service 并调用 Register；服务运行期间，handler 一直使用保存在 <code>a.orders</code> 中的对象。第 4 章会完整拆开这段组装过程。</p>
    <ol class="request-trace" aria-label="创建订单经过的文件">
      <li><div><strong>HTTP 入口读懂请求</strong>${link("internal/httpapi/api.go")}<p>create 把请求体解码成 CreateInput，再调用业务方法。</p></div></li>
      <li><div><strong>业务方法决定能否创建</strong>${link("internal/order/service.go")}<p>Create 检查商品编号与数量，补上 ID、初始状态和时间。</p></div></li>
      <li><div><strong>存储实现保存这笔订单</strong>${link("internal/memory/store.go")}<p>本次启用了 -memory，因此 Store.Create 最终把订单放进 map。</p></div></li>
      <li><div><strong>结果沿调用路径返回</strong>${link("internal/httpapi/api.go")}<p>保存成功 → Service 返回 Order → create 写出 201 和 JSON。</p></div></li>
    </ol>
    <p>这四步发生在<strong>一个 Go 进程</strong>里，不是四个微服务。除客户端到 HTTP 端点的网络请求外，这里主要是普通函数调用。</p>

    <h2 id="decode">3. 把 JSON 交给业务方法</h2>
    <p>在 <code>create</code> 中，Content-Type 和请求体大小先被检查。通过后，下面这段把字节转换为上一章定义的 <code>order.CreateInput</code>：</p>
    ${code("internal/httpapi/api.go", "\tvar input order.CreateInput", "\tctx, cancel := context.WithTimeout(c.Context(), 2*time.Second)", ["decoder.Decode(&input)", "decoder.DisallowUnknownFields()"])}
    <p>第一次 Decode 成功后，<code>input</code> 的值等价于 <code>order.CreateInput{SKU: "coffee", Quantity: 2}</code>。此时还没有订单 ID，也没有写入任何存储。</p>
    <p><code>DisallowUnknownFields</code> 会拒绝拼错的字段，例如把 quantity 写成 quanity。第二次 Decode 要求读到 EOF，是为了拒绝在同一个请求体里连续发送两个 JSON 对象。它不是在创建第二笔订单。</p>
    <details class="answer"><summary>为什么还需要 Content-Type 和请求体检查？</summary>
      <p>入口层要先明确“怎样解释这些字节”和“最多接收多少”。非 JSON 内容返回 415；请求体超出本例的 4 KiB 限制返回 413。它们和“数量不能为 0”不是同一种错误：前者属于 HTTP 边界，后者属于业务规则。</p>
      ${code("internal/httpapi/api.go", "func (a *API) create(", "\tvar input order.CreateInput")}
    </details>
    <p>接着，handler 创建一个最长 2 秒的上下文，并把 <code>input</code> 传给 <code>a.orders.Create</code>。上下文会继续传到存储，供支持取消的操作使用；它不会强行终止任意 Go 代码。</p>

    <h2 id="save">4. 保存成功，才返回 201</h2>
    <p>现在跟到 ${link("internal/order/service.go")}。这就是上一章的 Create，不是一份专门为 HTTP 重新编写的业务：</p>
    ${code("internal/order/service.go", "func (s *Service) Create(", "func (s *Service) Get(", ["s.store.Create(ctx, o)", "return o, nil"])}
    <p>对于 coffee × 2，校验通过后得到完整的 <code>Order</code>。注意高亮的调用顺序：先保存，再返回。假如保存返回 error，业务方法立刻返回错误，后面的成功返回不会执行。</p>
    <p>这次的 Store 是内存实现。打开 ${link("internal/memory/store.go")}，你能找到订单真正进入共享状态的位置：</p>
    ${code("internal/memory/store.go", "func (s *Store) Create(", "func (s *Store) Get(", ["s.orders[o.ID] = o"])}
    <p>map 的键是 ID，值是 Order。多个 HTTP 请求可能同时访问它，所以这一段用锁保护；同一个进程后续的查询可以根据 ID 取回订单。<strong>内存保存不代表磁盘持久化</strong>，停止进程会丢失这些数据，第 5 章才替换成 SQLite。</p>
    <p>Store 返回 nil 后，Service 返回这笔 Order，程序回到 HTTP handler：</p>
    ${code("internal/httpapi/api.go", "\tctx, cancel := context.WithTimeout(c.Context(), 2*time.Second)", "func (a *API) get(", ["a.orders.Create(ctx, input)", 'c.Header().Set("Location"', "c.JSON(http.StatusCreated, o)"])}
    <p><code>Location</code> 告诉客户端可以去哪里读取新资源；<code>c.JSON</code> 将 Order 编码为 JSON，并设置 201。业务代码不需要知道这些 HTTP 细节。</p>
    <div class="checkpoint"><strong>把响应里的字段对回代码</strong><p>sku、quantity 来自输入；id、status、created_at 由 Service 填写；201 和 Location 由 HTTP handler 决定。Store 负责保存 Order，不负责选择状态码。</p></div>

    <h2 id="query">5. 用 ID 查回同一笔订单</h2>
    <p>保持终端 1 不退出，将下面的 ORDER_ID 换成第 1 步复制的完整 ID：</p>
    ${terminal("终端 2 · Windows 使用 curl.exe", "curl -i http://127.0.0.1:8080/orders/ORDER_ID")}
    <p>应当得到 <strong>200</strong>，响应的五个字段都与创建时一致。尤其 ID 和创建时间不应该变；如果它们变化，就可能是重新创建而不是查询。</p>
    <p>先试着回答：ID 从哪里取？应该调用哪个 Service 方法？找不到时谁决定返回 404？再展开实现对照。</p>
    <details class="answer"><summary>查看查询实现与调用关系</summary>
      ${code("internal/httpapi/api.go", "func (a *API) get(", "func (a *API) cancel(", ['a.orders.Get(ctx, c.Param("id"))'])}
      <p><code>c.Param("id")</code> 从匹配到的路径中取值。Service.Get 把 ID 传给 Store.Get；内存实现按 <code>orders[id]</code> 查找。成功就返回原来的 Order，失败则交给 respondError。</p>
      ${code("internal/order/service.go", "func (s *Service) Get(", "func (s *Service) Cancel(")}
      ${code("internal/memory/store.go", "func (s *Store) Get(", "func (s *Store) UpdateStatus(", ["o, ok := s.orders[id]", "order.ErrNotFound"])}
      <p>这里没有生成 ID，也没有创建时间。它们来自刚才保存的 Order，这正是“查回同一笔订单”的含义。</p>
    </details>
    <p>如果返回 404，先检查是否完整复制了 ID，以及中途是否重启过内存模式。不要仅凭一个 404 就改路由：路径不匹配和业务找不到记录都可能使用这个状态码，响应内容与注册代码可以帮助区分。</p>

    <h2 id="errors">6. 用失败请求检查分层</h2>
    <p>接下来故意发送数量为 0 的请求。工程已提供对应文件：</p>
    ${code("requests/invalid.json")}
    ${terminal("合法 JSON，不合法的业务输入", 'curl -i -H "Content-Type: application/json" --data-binary "@requests/invalid.json" http://127.0.0.1:8080/orders')}
    ${output("预期响应", 'HTTP/1.1 422 Unprocessable Entity\n\n{"error":"invalid_order"}')}
    <p>JSON 解码已经成功；Service.Create 拒绝数量，且在调用 Store 之前就返回了 ErrInvalid。HTTP 层的 respondError 再把这个 Go error 转成状态码和公共错误名称。</p>
    ${code("internal/httpapi/api.go", "func respondError(", undefined, ["order.ErrInvalid", "order.ErrNotFound", "http.StatusUnprocessableEntity", "http.StatusNotFound"])}
    <p>存储失败则是另一条路径：Service 将错误返回，HTTP 层给出 500 和 internal_error，详细原因只写服务端日志。它不能被包装成“用户数量填错了”，也不能泄露 SQL 或连接信息。</p>
    ${table(["尝试", "应得到", "在哪里拒绝"], [
      ['quantity 写成字符串 <code>"2"</code>', "400 · invalid_json", "HTTP JSON 解码"],
      ["quantity 写成数字 0", "422 · invalid_order", "Service 校验"],
      ["查询一个不存在的 ID", "404 · order_not_found", "Store 查找，HTTP 映射错误"],
      ["没有 JSON Content-Type", "415 · use_application_json", "HTTP 媒体类型检查"],
      ["请求体超过 4 KiB", "413 · body_too_large", "请求体限制"],
      ["存储写入失败", "500 · internal_error", "存储失败向上传递"]
    ])}
    <p>不必手动构造所有边界。下面的测试通过真正的 HTTP endpoint 检查创建、查询、取消与错误响应，使用测试内的内存存储，不会修改刚才启动的服务：</p>
    ${terminal("验证本章的接口行为", "go test ./internal/httpapi -v -count=1")}
    <p>应看到 <code>TestHTTPJourney</code>、<code>TestHTTPFailures</code> 和 <code>TestInternalErrorIsNotExposed</code> 通过。后者使用故意失败的 Store，验证存储错误确实返回 500，且不会把内部详情交给客户端。</p>

    <h2 id="exercise">7. 练习：只修改 HTTP 响应</h2>
    <p>一个新需求：查询订单的成功响应应带上 <code>Cache-Control: no-store</code>，告知遵守该指令的缓存不要保存这份响应。业务数据和 JSON 结构保持不变。</p>
    <ol>
      <li>先执行一次 <code>curl -i</code> 查询，确认当前没有这个响应头。</li>
      <li>找到处理查询响应的函数，添加响应头。不要把 HTTP header 放进 Order 或 Store。</li>
      <li>停止并重启服务。由于使用 -memory，先重新创建一笔订单，再用<strong>新的 ID</strong>查询。</li>
      <li>检查状态码仍为 200、订单字段正确，并出现 Cache-Control: no-store。最后重跑 HTTP 测试。</li>
    </ol>
    <details class="answer"><summary>查看修改位置与原因</summary>
      <p>只需修改 <code>internal/httpapi/api.go</code> 的 <code>get</code>：在成功的 <code>return c.JSON(http.StatusOK, o)</code> 之前加入 <code>c.Header().Set("Cache-Control", "no-store")</code>。</p>
      <p>放在处理 error 的分支之后、写响应之前，就只影响成功的查询响应。HTTP 头属于入口适配，Service、Store、app 和 TCP 入口都不用改。</p>
      <p>现有测试可以检查原行为有没有被破坏，但<strong>不会自动验证新增的缓存头</strong>。要把新需求留在测试里，可在 TestHTTPJourney 的 GET 成功分支中检查 <code>got.Header().Get("Cache-Control")</code> 是否等于 <code>"no-store"</code>。</p>
    </details>
    ${note("到这里，你应该能自己解释", "为什么 HTTP 类型错误是 400，而零数量是 422？为什么创建成功后，查询不需要再生成 ID？为什么添加响应头不改业务层？回答时请对应到刚才运行过的函数，而不是只记住文件夹名称。")}
    <p>现在请求路径已经清楚了，还剩一个问题：这些对象最初由谁创建，为什么不同请求拿到的是同一个 Store？下一章回到 main 与 app，把启动时的连接过程补完整。</p>
    `,
  };
}
