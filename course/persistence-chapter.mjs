export function persistenceChapter({ code, terminal, output, note, table, link }) {
  return {
    slug: "05-persistence", title: "将订单保存到 SQLite", short: "保存订单", area: "store",
    outcome: "亲自验证重启前后数据是否存在，追踪一笔订单怎样写入并读回文件。",
    intro: "我们已经把对象接好了，但内存里的订单会随进程消失。这次只换存储实现，用相同的 HTTP 请求验证数据真的留在了磁盘上。",
    body: `
    <h2 id="memory">先观察内存丢失的究竟是什么</h2>
    <p>停止现有订单服务，在工程根目录重新运行内存版。在另一个终端创建一笔新订单，记下它的完整 ID。Windows 使用 curl.exe；不要把 ORDER_ID 原样发送出去。</p>
    ${terminal("终端 1 · 内存版", "go run ./cmd/orders -memory")}
    ${terminal("终端 2 · 使用工程自带的请求文件", 'curl -i -X POST http://127.0.0.1:8080/orders -H "Content-Type: application/json" --data-binary "@requests/create.json"')}
    ${terminal("用本次创建的 ID 查询", "curl -i http://127.0.0.1:8080/orders/ORDER_ID")}
    <p>现在应为 200。Ctrl+C 停止终端 1，再用相同的 -memory 命令启动；不要重新创建，直接查询刚才的 ID。</p>
    ${output("重启后的关键响应", `HTTP/1.1 404 Not Found

{"error":"order_not_found"}`)}
    <p>代码并没有删除某笔订单，而是新进程重新执行 <code>memory.New()</code>，得到一个空 map。原进程的 map 已经不存在。ID 仍然有效地标识那次创建，只是当前存储里已经没有对应记录。</p>

    <h2 id="persist">把同一个实验换成 SQLite</h2>
    <p>停止内存版，在<strong>同一个工作目录</strong>执行下面的命令。<code>lesson.db</code> 是本章练习文件；若你已有同名重要文件，请换一个未使用的名字，并同步替换后续命令。不要删除已有数据库。</p>
    ${terminal("终端 1 · 省略 -memory，显式指定文件", "go run ./cmd/orders -db lesson.db")}
    <p>等到 listeners ready，再执行上一节的创建命令。这次要记下新响应的 ID，以及 SKU、quantity、status、created_at；不要继续用内存版的旧 ID。先查询一次，确认返回 200。</p>
    <p>然后停止服务，再执行完全相同的 <code>go run ./cmd/orders -db lesson.db</code>，查询这次的新 ID。</p>
    ${output("本次应得到的对照结果", `内存版：创建 → 201；重启前查询 → 200；重启后查询 → 404
SQLite：创建 → 201；重启前查询 → 200；重启后查询 → 200
SQLite 的两次查询：ID、SKU、数量、状态、创建时间均相同`)}
    <div class="checkpoint"><strong>不以“文件出现了”作为完成标准</strong><p>要确认保存成功，必须用重启前记录的同一个 ID 查回同一笔订单。重启后再创建一笔只能证明服务能工作，不能证明旧数据保留了。</p></div>

    <h2 id="open">从 -db 参数找到真实文件</h2>
    <p>上一章 main 中的 <code>sqlite.Open(ctx, *dbPath)</code> 把路径交到这里：</p>
    ${code("internal/sqlite/store.go", "func Open(", "func (s *Store) Close(", ["sql.Open", "db.SetMaxOpenConns(1)", "db.ExecContext(ctx, schema)"])}
    <p><code>lesson.db</code> 是相对路径，相对于你启动程序时的工作目录，不是相对于 store.go。换目录启动，即使参数文字一样，也可能打开另一个文件。查不到旧数据时，先检查这一点和是否误加了 -memory。</p>
    <p><code>sql.Open</code> 得到数据库连接池对象，后续执行 schema 才实际触发数据库操作；因此不能仅凭 Open 的名字就宣布数据库已准备好。此处任何一步失败，错误都返回给 main。初始化失败还会主动关闭已创建的 db。</p>
    <p>示例把连接数限制为 1，让同进程数据库操作排队使用它。这便于解释状态更新，但不是高吞吐数据库设计，也不保证多个进程之间不会发生竞争。</p>
    ${code("internal/sqlite/schema.sql")}
    <p>schema 通过 <code>//go:embed</code> 编进程序。第一次启动创建 orders 表：id 是主键，quantity 和 status 有约束，时间暂存为文本。<code>IF NOT EXISTS</code> 表示已有表就不再创建，<strong>并不表示比较结构后自动升级旧表。</strong></p>

    <h2 id="write">一笔订单怎样从 Go 值变成一行记录</h2>
    ${code("internal/sqlite/store.go", "func (s *Store) Create(", "func (s *Store) Get(", ["s.db.ExecContext", "o.ID, o.SKU, o.Quantity, o.Status"])}
    <p>还记得 Service.Create 最后调用 store.Create 吗？现在实际执行的是上面这个方法。Service 已经生成好五个字段；Store 不再另造 ID，而是按 SQL 列顺序把它们作为参数传入。问号是参数位置，不需要把 SKU 拼进 SQL 字符串。</p>
    <p>CreatedAt 在写入前格式化成 RFC3339Nano 文本。数据库执行失败，Create 返回 error，Service 随之返回 error，HTTP 入口再映射为失败响应；因此只有这条写入返回成功，上层才会发出 201。</p>
    ${note("为什么数据库也检查数量", "Service 的规则给所有业务调用者一致的错误；数据库 CHECK 保护落库的数据。两者职责不同，不能因为表有 CHECK 就删掉 Service 校验，否则非法请求可能变成数据库错误和 HTTP 500。第 9 章会一起修改两处边界。")}

    <h2 id="read">查询怎样把这一行还原成 Order</h2>
    ${code("internal/sqlite/store.go", "func (s *Store) Get(", "func (s *Store) UpdateStatus(")}
    ${code("internal/sqlite/store.go", "func scan(", undefined, ["row.Scan", "sql.ErrNoRows", "order.ErrNotFound", "time.Parse"])}
    <p>SELECT 的列顺序与 Scan 的接收顺序一一对应；这不是按字段名自动匹配。前四项填入 Order，时间文本先读到 created，再解析成 time.Time。这样上层得到的仍是 Order，不需要知道数据库如何表示时间。</p>
    <p>找不到记录时，数据库返回 <code>sql.ErrNoRows</code>。适配器把它转换成业务的 <code>order.ErrNotFound</code>；HTTP 只认识后者并返回 404，所以更换存储不会要求 HTTP handler 认识每个数据库驱动的错误。</p>

    <h2 id="test">把“关闭再打开”变成回归测试</h2>
    ${terminal("验证持久化和数据库数量约束", "go test ./internal/sqlite -run '^(TestPersistsAfterReopen|TestQuantityConstraint)$' -v -count=1")}
    <p>两项应为 PASS。${link("internal/sqlite/store_test.go")} 的 TestPersistsAfterReopen 在测试临时目录建库，创建并取消一笔订单，关闭数据库，再打开同一路径比对整笔订单。它不碰你的 lesson.db，也不只是查询同一个尚未关闭的对象。</p>
    ${code("internal/sqlite/store_test.go", "\tif err := db.Close();", "// Bypass Service", ["sqlite.Open(ctx, path)", "got != cancelled"])}
    <p>TestQuantityConstraint 则刻意绕过 Service，直接向 SQLite Store 传入 0、1、20、21，验证表本身的约束。这不是推荐业务绕过 Service，而是针对存储边界的测试。</p>

    <h2 id="exercise">换一个文件，解释为什么订单消失又出现</h2>
    <p>保留刚才的 ID。停止服务，用一个未使用过的文件名启动，例如 <code>go run ./cmd/orders -db lesson-alternate.db</code>。不创建订单，直接查询旧 ID，应为 404。再停止，改回 <code>-db lesson.db</code>，同一个 ID 应重新得到 200。</p>
    <p>这次数据没有被删掉或凭空恢复；你只是把同一个查询交给了两个不同的文件。练习后保持 lesson.db 运行，下一章用 TCP 查询这里的订单。</p>
    ${note("本章证明了什么", "证明了这个单进程示例能把订单写入文件，并在正常关闭重开后查回。它不证明断电恢复、备份可用、多实例一致性或生产容量。真实业务仍需迁移方案和备份恢复演练。")}
    `
  };
}
