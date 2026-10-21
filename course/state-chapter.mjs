export function stateChapter({ code, terminal, output, note, table, link }) {
  return {
    slug: "07-state-and-tests", title: "取消订单与处理并发", short: "取消与并发", area: "order",
    outcome: "用重复取消和存储测试，理解业务规则为什么需要一个原子的修改边界。",
    intro: "创建和查询之后，订单开始发生变化。用户可能连点两次取消，多个请求也可能同时到达。我们先说清想要的结果，再看代码如何守住这个约定。",
    body: `
    <h2 id="observe">先取消一笔新订单，再取消一次</h2>
    <p>使用上一章的服务即可；如果没有运行，在工程目录执行 <code>go run ./cmd/orders -db lesson.db -tcp 127.0.0.1:8088</code>。在另一个终端创建一笔新订单，确认返回的状态是 pending。Windows 请使用 curl.exe。</p>
    ${terminal("创建一笔供本章使用的订单", 'curl -i -X POST http://127.0.0.1:8080/orders -H "Content-Type: application/json" --data-binary "@requests/create.json"')}
    <p>把下面的 ORDER_ID 换成刚才返回的完整 ID。连续执行两次取消，最后查回：</p>
    ${terminal("重复的是同一笔订单的取消，不是重复创建", `curl -i -X POST http://127.0.0.1:8080/orders/ORDER_ID/cancel
curl -i -X POST http://127.0.0.1:8080/orders/ORDER_ID/cancel
curl -i http://127.0.0.1:8080/orders/ORDER_ID`)}
    ${output("要核对的结果", `第一次取消 → 200，status 从 pending 变为 cancelled
第二次取消 → 200，订单内容与第一次完全相同
再次查询   → 200，status 仍为 cancelled
ID、SKU、数量、created_at 都没有因取消而改变`)}
    <p>重复取消得到相同结果，叫做取消操作的幂等性。这是我们为这项操作制定的约定，不是使用 POST 或使用 KPro 自动得到的保证。<strong>本例重复创建仍会生成两笔不同订单。</strong></p>

    <h2 id="rule">把产品约定写成状态变化</h2>
    ${table(["当前情况", "取消操作的结果"], [
      ["pending", "保存 cancelled，返回修改后的订单"],
      ["cancelled", "保持 cancelled，仍返回订单"],
      ["没有这个 ID", "ErrNotFound，HTTP 入口返回 404"],
      ["其他状态", "ErrConflict；当前正常流程不会创建这样的状态"]
    ])}
    ${code("internal/order/service.go", "func (s *Service) Cancel(", undefined, ["s.store.UpdateStatus", "case Pending:", "case Cancelled:", 'return "", ErrConflict'])}
    <p>Service 传给 Store 一个函数：“你拿到当前状态后，按这些规则计算新状态。”Store 接收函数却不定义规则，这样状态判断仍在 order 包里；内存与 SQLite 不必各写一次 pending 能否取消。</p>
    <p>代码里的 default 是防御未知状态，不表示本例已经实现付款、确认或发货。添加一个新状态时，还需要同时定义新的转换和测试，不能只增加一个字符串常量。</p>

    <h2 id="atomic">为什么不先 Get，再调用 Save</h2>
    <p>考虑一个<strong>尚未实现</strong>的“确认订单”需求。若取消和确认都分成先读取、后保存，可能出现：</p>
    ${table(["顺序", "取消请求 A", "确认请求 B"], [
      ["1", "读到 pending", ""],
      ["2", "", "也读到 pending"],
      ["3", "", "允许确认，写入 confirmed"],
      ["4", "仍按旧的 pending 判断，写入 cancelled", "刚才的确认被覆盖"]
    ])}
    <p>即使 Get 和 Save 各自加锁，两个调用之间仍有空隙。需要保护的不是某一行赋值，而是<strong>读取当前状态 → 判断是否允许变化 → 保存结果</strong>这个整体。因此 Store 接口提供 UpdateStatus，而不是让业务在外面拼接读写。</p>
    ${code("internal/memory/store.go", "func (s *Store) UpdateStatus(", "func (s *Store) Ping(", ["s.mu.Lock()", "defer s.mu.Unlock()", "change(o.Status)", "s.orders[id] = o"])}
    <p>在内存实现中，同一把锁从读取前一直持有到写回后。其他使用同一 Store 的操作不能插进这段过程。如果 change 返回错误，函数先退出，不会执行写回。</p>
    <p>回调在保护范围内执行，因此必须短小，不做网络请求，也不再次调用 Store。否则可能长时间阻塞其他操作，甚至因重新获取同一把锁而死锁。</p>

    <h2 id="transaction">SQLite 用事务包住同一段工作</h2>
    ${code("internal/sqlite/store.go", "func (s *Store) UpdateStatus(", "func scan(", ["s.db.BeginTx", "defer tx.Rollback()", "change(current.Status)", "tx.Commit()"])}
    <p>BeginTx 开始事务，SELECT 读取当前行，回调判断，UPDATE 写入新状态，最后 Commit 提交。回调拒绝、SQL 失败或提交失败时都不返回成功订单。defer Rollback 负责提前退出的清理；事务已经提交成功时，它不会再把提交撤销。</p>
    <p>本教学应用还限定同一 Store 只有一个数据库连接，因此同进程的数据库操作会排队。换数据库、增加连接或启用多个实例时，要重新验证事务隔离和冲突处理；不能看到这里有 SELECT 和 UPDATE，就认为任何引擎照搬都安全。</p>
    <p>只更新 status 也很重要。SKU、数量和创建时间没有被客户端传回覆盖，所以取消前后其他字段保持不变，正好对应本章开始观察的结果。</p>

    <h2 id="contract">用同一份测试约束两个存储实现</h2>
    <p>${link("internal/storetest/contract.go")} 接收一个 Store，memory 与 sqlite 的测试都调用它。其中这段专门验证“回调拒绝时不保存”：</p>
    ${code("internal/storetest/contract.go", '\tt.Run("rollback"', '\tt.Run("cancelled_context"', ["return order.Cancelled, rejected", "got != o"])}
    <p>回调故意同时返回 cancelled 和 error。如果 Store 错误地忽略 error，或先写再报错，后面比较整笔订单的断言就会失败。这比只检查“方法返回了错误”更严格。</p>
    ${code("internal/storetest/contract.go", '\tt.Run("concurrent_cancel"', '\tt.Run("not_found"')}
    <p>这里启动 20 个 goroutine 同时取消，要求每次都成功并得到 cancelled。它验证当前“重复取消无害”的约定，<strong>不能证明未来所有状态转换都正确</strong>。只有取消这种操作时，最终值可能碰巧相同；新增确认等互斥操作，还需要能复现对应交错的测试。</p>
    ${terminal("分别验证两个实现，再检查数据竞争", `go test ./internal/memory ./internal/sqlite -run '^TestStoreContract$' -v -count=1
go test -race ./... -count=1`)}
    <p>第一条中 duplicate、rollback、cancelled_context、concurrent_cancel、not_found 都应通过。race 检查的是内存数据竞争，不是业务规则证明；不支持 -race 的平台需在受支持的开发环境或 CI 补跑。</p>

    <h2 id="exercise">让重复取消报错，看看哪项约定被破坏</h2>
    <p>临时把 Service.Cancel 中 <code>case Cancelled:</code> 分支的返回改成 <code>return "", ErrConflict</code>，不要改 pending 分支。</p>
    ${terminal("先看业务测试，再看 HTTP 契约", `go test ./internal/order -run '^TestCancelTwice$' -v -count=1
go test ./internal/httpapi -run '^TestHTTPJourney$' -v -count=1`)}
    ${output("预期失败的原因", `TestCancelTwice：第一次成功，第二次得到 ErrConflict
TestHTTPJourney：第二次取消变成 409，不再是约定的 200
两项都 FAIL`)}
    <p>一个业务改动影响到了 HTTP，但 HTTP handler 本身不需要变化，因为它已经认识 ErrConflict。测试将两层约定连在了一起。练习后恢复 Cancelled 分支为 <code>return Cancelled, nil</code>，重跑两项都应 PASS。</p>
    <div class="checkpoint"><strong>这一章需要带走的判断</strong><p>Service 定义允许怎样变化；Store 保证判断与写入处在同一个受保护的操作中；协议入口只翻译结果。少了任意一环，都不能仅凭一个 mutex 或一个事务声称业务并发正确。</p></div>
    `
  };
}
