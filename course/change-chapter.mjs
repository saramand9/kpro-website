export function changeChapter({ code, terminal, output, note, table, link }) {
  return {
    slug: "09-make-it-yours", title: "独立修改一个业务需求", short: "独立修改需求", area: "all",
    outcome: "先写失败的边界测试，再修改业务与数据库约束，用完整流程验收需求。",
    intro: "店家现在要求每笔最多买 5 件。只改一个数字很容易；这一章要证明，你能找到完整影响范围，并解释哪些层为什么不用改。",
    body: `
    <h2 id="requirement">先定义什么才算改完</h2>
    <p>在工程副本中完成本章，保留原始版便于对照。新规则只改变数量上限，不改变输入输出结构：</p>
    <ul><li>数量 1 和 5 可以创建；0 和 6 不可以。</li><li>HTTP 提交 6 返回 422，而不是 201 或数据库导致的 500。</li><li>内存与新建 SQLite 数据库都遵守该规则。</li><li>原来的查询、取消、TCP 查询仍正常，响应字段不改变。</li></ul>
    <p>先确认前面临时破坏规则的练习已经恢复，再运行基线测试。若这里失败，先修复基线，否则无法判断后面失败是不是由新需求引起。</p>
    ${terminal("工程根目录 · 修改前应全部通过", "go test ./... -count=1")}
    ${output("本次验收边界", `数量   旧规则   新规则
0      拒绝     拒绝
1      接受     接受
5      接受     接受
6      接受     拒绝
20     接受     拒绝`)}
    <p>其中 6 是最有用的反例：它在旧系统合法，在新系统非法。只测试 0 和 100，即使什么都不改，也可能全部通过。</p>

    <h2 id="scope">先判断修改会经过哪些文件</h2>
    <p>先自己找一遍，再展开对照。问题不是“哪里出现了数字 20”，而是“哪里定义或验证了数量规则”。不要全局替换：并发测试也有 20，它代表 goroutine 数量，不是购买上限。</p>
    <details class="answer"><summary>查看修改范围与不应改动的部分</summary>
    ${table(["需要改动", "原因"], [
      [link("internal/order/service.go"), "业务判断与 ErrInvalid 提示定义上限"],
      [link("internal/order/service_test.go"), "直接业务调用的接受 / 拒绝边界"],
      [link("internal/httpapi/api_test.go"), "HTTP 入口应返回 201 还是 422"],
      [link("internal/sqlite/schema.sql"), "新数据库的落库约束"],
      [link("internal/sqlite/store_test.go"), "绕过 Service 时，数据库本身的边界"]
    ])}
    <p>HTTP handler 已把 ErrInvalid 映射为 422，所以不用新增 quantity 判断。app 仍连接相同对象，Store 接口仍是创建/查询/改状态，TCP 仍查询已存在的订单，因此这些部分都不用改。</p>
    </details>

    <h2 id="red">先改测试，让旧实现明确失败</h2>
    <p>先只修改三个测试文件，暂时不改业务和 SQL。测试也属于需求的一部分，不是实现改完以后再随手把断言改绿。</p>
    ${table(["测试文件 / 测试名", "确切改动"], [
      ["service_test.go · TestQuantityBoundary", "接受列表从 {1, 20} 改为 {1, 5}"],
      ["service_test.go · TestRejectInvalidOrder", "非法输入中的 Quantity: 21 改为 Quantity: 6；保留空 SKU、0 等其他场景"],
      ["api_test.go · TestHTTPQuantityBoundary", "成功请求的 quantity:20 改为 quantity:5，仍期望 201"],
      ["api_test.go · TestHTTPFailures", "large quantity 场景从 21 改为 6，仍期望 422"],
      ["store_test.go · TestQuantityConstraint", "表格从 {0,false},{1,true},{20,true},{21,false} 改为 {0,false},{1,true},{5,true},{6,false}"]
    ])}
    <p>例如业务接受边界原本是下面这段，只改变列表里的上边界即可：</p>
    ${code("internal/order/service_test.go", "func TestQuantityBoundary(", "func TestCancelTwice(", ["[]int{1, 20}"])}
    ${terminal("旧实现必须暴露与新约定的冲突", "go test ./internal/order ./internal/httpapi ./internal/sqlite -count=1")}
    ${output("应失败的关键项 · 省略时间与完整日志", `TestRejectInvalidOrder：quantity=6 被接受，预期 ErrInvalid
TestHTTPFailures/large_quantity：得到 201，预期 422
TestQuantityConstraint：quantity=6 落库成功，预期拒绝
FAIL`)}
    <p>1 和 5 的成功测试此时仍通过，这是正常的。失败必须指向“6 被错误接受”，而不是编译错误、端口占用或文件路径错误。如果全部 PASS，检查是不是只改了合法边界，却没有加入 6 这个反例。</p>

    <h2 id="green">先改业务，再收紧新数据库的约束</h2>
    <p>现在修改 ${link("internal/order/service.go")}：校验条件中的 <code>input.Quantity &gt; 20</code> 改为 <code>input.Quantity &gt; 5</code>，ErrInvalid 说明中的 <code>quantity must be 1..20</code> 改为 <code>quantity must be 1..5</code>。不要改变 ID 生成、时间或保存顺序。</p>
    ${terminal("先验证业务和入口层", "go test ./internal/order ./internal/httpapi -count=1")}
    <p>现在这两个包应通过；但 SQLite 约束测试仍会失败，因为它刻意绕过 Service，表还允许 6。修改 ${link("internal/sqlite/schema.sql")} 的 <code>quantity BETWEEN 1 AND 20</code> 为 <code>quantity BETWEEN 1 AND 5</code>，再运行：</p>
    ${terminal("验证新建数据库，再回归整个项目", `go test ./internal/sqlite -count=1
go test ./... -count=1`)}
    ${output("完成实现后的预期结果", `order、httpapi、sqlite：数量边界测试 PASS
memory / sqlite：共享存储契约 PASS
app：HTTP 创建、TCP 查询、取消后再查询、停止与启动失败检查 PASS`)}
    <p>测试每次用临时目录创建新数据库，因此会使用修改后的内嵌 schema。至此实现与测试一致，但还要用运行中的程序验证一次，防止只改了副本却启动了旧目录。</p>

    <h2 id="exercise">用真实请求验收，不靠测试结果猜测</h2>
    <p>先停止旧服务。在修改后的工程根目录，使用一个<strong>未使用过</strong>的练习文件名；若 quantity-five.db 已存在，请另取新名。不要删除或覆盖 lesson.db。</p>
    ${terminal("终端 1 · 新规则、新练习库", "go run ./cmd/orders -db quantity-five.db -tcp 127.0.0.1:8088")}
    <p>在编辑器里把 <code>requests/create.json</code> 的 quantity 临时改成 5，保留 sku 为 coffee。保存后发请求，Windows 使用 curl.exe：</p>
    ${terminal("终端 2 · 先提交 5", 'curl -i -X POST http://127.0.0.1:8080/orders -H "Content-Type: application/json" --data-binary "@requests/create.json"')}
    <p>应返回 201、quantity 为 5。记下这笔订单 ID，然后把文件中的 quantity 改为 6，再执行同一条请求命令，应返回 422 与 invalid_order。这个 422 应来自 Service 校验，而不是把 SQLite 的 CHECK 错误当作业务提示。</p>
    ${terminal("用数量为 5 的成功订单继续验收", `curl -i http://127.0.0.1:8080/orders/ORDER_ID
go run ./cmd/ordercli -id ORDER_ID
curl -i -X POST http://127.0.0.1:8080/orders/ORDER_ID/cancel
go run ./cmd/ordercli -id ORDER_ID`)}
    ${output("运行中的验收清单", `创建 5 → 201；创建 6 → 422
HTTP 和 TCP 查询 → 同一 ID，quantity 都为 5
取消后再用 TCP 查询 → 同一 ID，status 为 cancelled
重启同一数据库后查询 → 仍为同一笔订单`)}
    <p>停止服务，重启同一数据库验证最后一项。再停止并改用 <code>-memory</code> 启动，把请求文件中的 quantity 依次设为 5、6，重复两次创建，证明规则不依赖 SQLite。全部验证后，把 requests/create.json 恢复为 quantity 2，避免通用示例请求一直处于拒绝状态；业务上限保留为 5。</p>

    <h2 id="existing">为什么这还不是一次旧库迁移</h2>
    <p>本次实验使用新数据库。如果把程序指向原 lesson.db，<code>CREATE TABLE IF NOT EXISTS</code> 不会把旧表的 CHECK 从 20 改为 5；正常 Service 新建仍会拒绝 6，但数据库本身仍是旧约束。两件事必须分开验证。</p>
    <p>真实旧库可能已经有数量 6–20 的历史订单。产品需要先回答：新上限是否只管新订单？历史订单是否仍应可查询和取消？若需要保留它们，简单给全表加上限 5 可能与历史数据冲突。这里不能通过删库“解决”，需要带版本、可验证、可回退的迁移方案。</p>
    <div class="checkpoint"><strong>这次改动的完整因果链</strong><p>新反例 6 使旧测试失败 → Service 拒绝并返回 ErrInvalid → HTTP 沿用现有映射返回 422 → 新表约束也拒绝越界写入 → 查询和取消不变。这条链比“改了五个文件”更重要。</p></div>

    <h2 id="transfer">换成自己的需求，从一个可验收操作开始</h2>
    <p>假设你的项目是房间服务，第一项需求不是“搭一套分层架构”，而是“输入房间名和容量，创建房间并能查回；空名字、容量越界时拒绝”。先写这些输入与结果，再把它们放到已经认识的位置：</p>
    ${table(["房间服务要解决的问题", "沿用本项目的哪种做法"], [
      ["什么输入合法，初始状态是什么", "room.Service 定义规则，可直接做单元测试"],
      ["用什么地址或消息查询", "HTTP / message 入口翻译参数与错误"],
      ["重启后房间是否保留", "Store 实现持久化，并做关闭重开测试"],
      ["加入房间不能超过容量", "重新设计原子操作与并发测试，不能直接复制 UpdateStatus"],
      ["多个入口是否访问同一份房间", "app 共享对象，并做跨入口集成测试"],
      ["什么条件下可以接流量和退出", "main 管资源，app 管运行，按实际依赖检查"]
    ])}
    <p>接着先完成一条从创建到查询的完整路径，再增加加入、离开等变化。不要先复制所有文件夹；当一个职责确实出现时，再找到它的位置。鉴权、支付、库存等未实现能力仍需应用或网关另外设计。</p>
    <p>需要脚手架和契约生成时，可继续看 <a href="https://github.com/saramand9/kpro/blob/v0.2.1/docs/golden-path.md">同版本的 Golden Path</a>。你现在应该能判断：生成工具替代的是哪些重复的组装或协议代码，哪些业务决策必须自己写。本例没有宣称已经接入 OpenAPI 生成。</p>

    <h2 id="self-check">用一条链检查是否真正理解整个项目</h2>
    <p>合上教程，从 POST /orders 开始，自己画到 Service.Create、Store.Create，再画回 201；在旁边补上“main 选 Store，app 创建并传递对象”。然后回答下面三问，并去源码确认：</p>
    <ol><li>数据库写失败时，哪个函数最先知道？谁决定 HTTP 500，谁记录内部详情？</li><li>新增一种协议时，哪些业务测试应一行不改？怎样证明它访问了同一份数据？</li><li>把数量上限改成另一个值时，能否自己补一个先失败、后通过的边界测试？</li></ol>
    <p>能运行、追踪、修改并验证这一条链，你就不只是在认识函数用法，而是在用这些组件完成一个项目。</p>
    `
  };
}
