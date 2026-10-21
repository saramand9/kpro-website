export function businessChapter({ code, terminal, output, note, table, link }) {
  return {
    slug: "02-business", title: "定义订单与校验规则", short: "订单与校验", area: "order",
    outcome: "追踪输入怎样变成已保存的订单，并用测试观察一条规则失效。",
    intro: "店员提交商品编号和数量，系统才生成订单号、状态与时间。这一章直接调用 Go 方法，不经过 HTTP，先把订单本身的规则弄清楚。",
    body: `
    <h2 id="observe">不启动服务器，也能创建订单</h2>
    <p>在 orders 工程根目录运行下面的测试。它不连接上一章的进程，也不占用 8080；测试会自己创建内存存储和业务对象。</p>
    ${terminal("先验证现成的业务行为", "go test ./internal/order -run '^(TestCreate|TestRejectInvalidOrder|TestQuantityBoundary)$' -v -count=1")}
    ${output("关键结果 · 省略用时和包路径", `--- PASS: TestCreate
--- PASS: TestRejectInvalidOrder
--- PASS: TestQuantityBoundary
PASS`)}
    <p>测试通过意味着：合法输入被保存，非法输入被拒绝，数量 1 和 20 都能接受。下面沿着 <code>TestCreate</code> 传入的 <code>SKU: " coffee ", Quantity: 2</code>，看清这个过程。</p>

    <h2 id="model">输入不是已经创建的订单</h2>
    ${code("internal/order/service.go", "const (", "// Store describes")}
    <p><code>CreateInput</code> 只有两个字段，因为客户端只能决定买什么、买多少。<code>Order</code> 多出来的 ID、Status、CreatedAt，由服务端生成。不能直接拿 Order 当创建参数，否则就混淆了“客户端的请求”与“系统接受请求后的结果”。</p>
    ${table(["这个例子中的值", "谁决定", "规则"], [
      ['SKU：<code>" coffee "</code> → <code>"coffee"</code>', "客户端输入，业务层整理", "去掉两端空白后为 1–64 个 Unicode 码点"],
      ["Quantity：2", "客户端输入", "整数，范围 1–20"],
      ["ID：32 位十六进制字符串", "Service 生成", "由 16 个随机字节编码而来"],
      ["Status：pending", "Service 决定", "新订单不能由客户端指定为 cancelled"],
      ["CreatedAt：本次创建时间", "Service 生成", "使用 UTC 时间"]
    ])}
    <p>字段上的 <code>json:</code> 标签规定序列化名称，不会自动执行校验。Go 的 <code>int</code> 允许 0 和负数；“数量必须大于 0”是我们自己要写的业务规则。</p>

    <h2 id="create">沿着一份输入读完 Create</h2>
    ${code("internal/order/service.go", "func (s *Service) Create(", "func (s *Service) Get(", ["strings.TrimSpace", "return Order{}, ErrInvalid", "s.store.Create(ctx, o)", "return o, nil"])}
    <p>先看前四行：去掉 SKU 两端空白，再检查长度和数量。这里按 <code>[]rune</code> 计数，不是 UTF-8 字节数；它也不是完整的“用户可见字符”计数算法。空白 SKU 会变为空字符串而被拒绝。若数量为 0，此处立即返回 ErrInvalid，下面的 ID 生成和保存都不会执行。</p>
    <p>输入通过后，函数生成 ID，组装出 pending 订单。此时 <code>o</code> 只是函数中的一个 Go 值，还不代表以后能查到它。接下来调用 <code>s.store.Create(ctx, o)</code> 保存；如果保存失败，返回错误。<strong>只有保存成功，最后的 return 才把订单交给调用者。</strong></p>
    <p>所以方法的两个返回值有明确约定：成功是“订单 + nil”，失败是“零值订单 + error”。调用方必须先判断 error，不能把失败时的空 ID 当作一次成功创建。</p>

    <h2 id="store">Service 为什么能保存，又不知道数据库是什么</h2>
    ${code("internal/order/service.go", "// Store describes", "func (s *Service) Create(", ["type Store interface", "type Service struct", "func New(store Store)"])}
    <p><code>Store</code> 列出订单业务需要的三种能力：创建、查询、原子修改状态。Service 内部只记住这个接口；<code>New(store)</code> 把外面传进来的对象保存起来。这就是此处“依赖注入”的具体动作，没有自动查找实现的容器。</p>
    <p>本章测试传入 <code>memory.New()</code>，第 5 章运行程序时会传入 SQLite 对象。两者都实现这些方法，所以 Create 中的业务规则不用重写。此时暂时不必理解 UpdateStatus 的回调，第 7 章会用取消订单解释为什么它需要是一个整体。</p>
    ${note("业务层刻意不知道的事", "Service 没有 HTTP 路径、状态码、c.JSON，也没有 SQL 语句。它接收 Go 值，返回 Go 值和 error。因此单元测试能直接调用它，未来另一个协议入口也能调用它。")}

    <h2 id="test">一条测试怎样证明订单真的保存了</h2>
    ${code("internal/order/service_test.go", "func TestCreate(", "func TestRejectInvalidOrder(", ["service.Create", 'o.SKU != "coffee"', "service.Get", "got != o"])}
    <p>测试先建立自己的空 Store。它检查返回订单中的 SKU 已去空白、数量仍为 2、状态为 pending、ID 与时间不为空。然后用生成的 ID 再查一次，并比较整笔订单。后半段很重要：如果 Create 只生成一个看起来正确的对象却没有保存，查询就会失败。</p>
    <p>另一个测试 ${link("internal/order/service_test.go")} 中的 <code>TestRejectInvalidOrder</code> 用空 SKU、纯空白、过长 SKU、负数、0 和 21 验证拒绝路径。它使用 <code>errors.Is(err, order.ErrInvalid)</code> 判断错误类别，不依赖一整句可能调整的提示文本。</p>
    <div class="checkpoint"><strong>现在回看第一次 PASS</strong><p>你应能指出：哪个断言证明输入被整理，哪个断言证明订单被保存。仅检查 err == nil，还不足以证明这两件事。</p></div>

    <h2 id="exercise">让一个规则失效，观察测试为什么变红</h2>
    <p>临时把 Service.Create 的 <code>input.SKU = strings.TrimSpace(input.SKU)</code> 改为 <code>input.SKU = strings.TrimSuffix(input.SKU, "")</code>。TrimSuffix 去掉空后缀时会保持原样；这样 strings 包仍被使用，编译能通过，但去空白规则不再生效。</p>
    ${terminal("只运行会受影响的两个测试", "go test ./internal/order -run '^(TestCreate|TestRejectInvalidOrder)$' -v -count=1")}
    ${output("应观察到的失败 · 不是编译错误", `TestCreate：SKU 仍是 " coffee "，触发 unexpected order
TestRejectInvalidOrder：纯空白 SKU 被接受，得到 nil 而不是 ErrInvalid
FAIL`)}
    <p>这两个失败解释了同一行代码的两种作用：整理有效输入、阻止无效输入钻过长度检查。把该行恢复为 <code>strings.TrimSpace</code>，重跑上述命令，应恢复 PASS。继续下一章前请恢复，后面的示例仍以原规则为准。</p>
    <details class="answer"><summary>为什么不把去空白放在 HTTP handler 里就好</summary><p>那样 HTTP 请求可能正常，但本章直接调用 Service 的测试仍会失败；以后新增其他入口还要记得复制这条规则。把规则放在所有入口共同调用的 Service，才是由一处定义同一件业务。</p></details>

    <h2 id="next">下一步：把业务接回 HTTP</h2>
    <p>本章传入的是已经具有正确 Go 类型的 CreateInput。HTTP 发来的却是一段字节：<code>quantity: "2"</code> 不能解码进 int，是输入格式问题；<code>quantity: 0</code> 可以解码，但会被业务拒绝。下一章让入口层负责前一种情况，再把后一种情况交给刚才的 Service。</p>
    `
  };
}
