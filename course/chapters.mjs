// Prose is authored in chapter modules; excerpts come from the tested Go project.
import { firstRequestChapter } from "./first-request-chapter.mjs";
import { businessChapter } from "./business-chapter.mjs";
import { httpChapter } from "./http-chapter.mjs";
import { assemblyChapter } from "./assembly-chapter.mjs";
import { persistenceChapter } from "./persistence-chapter.mjs";
import { tcpChapter } from "./tcp-chapter.mjs";
import { stateChapter } from "./state-chapter.mjs";
import { lifecycleChapter } from "./lifecycle-chapter.mjs";
import { changeChapter } from "./change-chapter.mjs";

export function chapters(helpers) {
  const { code, terminal, output, note, table, link } = helpers;
  return [
    {
      slug: "overview", title: "构建一个订单服务", short: "项目概览", area: "all",
      intro: "从第一个 HTTP 请求开始，理解业务代码如何连接到数据库，再为同一份业务接入 TCP。通过一个可以运行、测试和修改的 Go 项目，学会使用 KPro。",
      body: `
      <h2 id="result">我们会做出什么</h2>
      <p>一家小店需要记录订单。提交商品编号和数量后，服务生成订单号；店员可以查回订单，也可以取消。下面就是创建一笔订单时，客户端和服务之间发生的事情。</p>
      <div class="project-preview" aria-label="订单创建请求与响应示例">
        <div class="preview-heading"><span><i class="preview-dot" aria-hidden="true"></i>订单服务 · 接口示例</span><code>127.0.0.1:8080</code></div>
        <div class="preview-columns">
          <div><div class="preview-label">客户端提交</div><div class="request-line"><span>POST</span> /orders</div><pre><code>{
  "sku": "coffee",
  "quantity": 2
}</code></pre></div>
          <div><div class="preview-label">服务端返回</div><div class="request-line"><span>201</span> Created</div><pre><code>{
  "id": "a17c…8e42",
  "sku": "coffee",
  "quantity": 2,
  "status": "pending",
  "created_at": "2026-10-21T08:00:00Z"
}</code></pre></div>
        </div>
        <div class="preview-caption">展示的是接口内容，不是在线运行的服务。ID 已缩写，实际 ID 和时间由每次请求生成。</div>
      </div>
      <ol class="project-results">
        <li><b>创建、查询与取消</b><span>用真实请求理解路由、参数校验和业务规则。</span></li>
        <li><b>重启后仍能查到</b><span>将内存存储换成 SQLite，验证订单确实保存。</span></li>
        <li><b>两个入口，同一笔订单</b><span>让 HTTP 和 TCP 调用同一个业务服务。</span></li>
      </ol>
      ${note("教程的范围", "这是教学应用，不是完整电商系统：没有账号、支付、库存和订阅。创建请求重试会新增订单；重复取消才是幂等的。入口默认只绑定本机。")}
      <h2 id="download">先在本机运行成品</h2>
      <p>需要会基本 Go 语法、能在终端执行命令。Go 版本至少为 <strong>1.26.9</strong>，这是本例固定依赖的 KPro v0.2.1 的要求。第一次下载依赖需要网络；之后不需要安装数据库服务器，SQLite 数据库就是一个本地文件。</p>
      <p><a class="download" href="@@ROOT@@downloads/orders.zip" download>下载完整 orders 工程 <span>ZIP ↓</span></a> <a href="@@ROOT@@learn/source.html">在网页中阅读全部源码 →</a></p>
      <p>解压后进入包含 <code>go.mod</code> 的 <code>orders</code> 目录。以下命令都在这个目录执行。如果你拿的是官网源码，位置是 <code>examples/orders</code>。</p>
      ${terminal("终端 1 · 启动服务", `go version
go mod download
go run ./cmd/orders`)}
      <p>看到 <code>listeners ready</code> 后保持这个终端运行。当前目录会出现 <code>orders.db</code>，它存放稍后创建的订单。另开一个终端，进入同一目录：</p>
      ${terminal("终端 2 · 实际操作一笔订单", "go run ./cmd/check")}
      <p>检查工具向你的服务发送真实 HTTP 请求，会打印每次响应的完整 JSON。按顺序应当得到下面这些状态码：</p>
      ${output("预期结果 · id 和时间由本次运行生成", `GET /readyz                         → 200
POST /orders                        → 201
GET /orders/本次生成的ID              → 200
POST /orders（quantity 为 0）         → 422
POST /orders/本次生成的ID/cancel       → 200
POST /orders/本次生成的ID/cancel       → 200`)}
      <p>工具最后打印订单 ID，请记下来。此时订单的状态已经是 <code>cancelled</code>。停止终端 1，再执行相同启动命令，用这个 ID 查询，仍应该得到同一笔订单。不要换一个工作目录，否则默认数据库路径也会改变。</p>
      ${terminal("手动查询 · 把 ORDER_ID 替换成刚才的 ID", "curl -i http://127.0.0.1:8080/orders/ORDER_ID")}
      <p>Windows PowerShell 中请用 <code>curl.exe</code> 代替 <code>curl</code>，避免某些版本把它当作 PowerShell 命令别名。更复杂的 JSON 请求都使用工程内的文件，避免命令行引号差异。</p>
      <h2 id="whole">一笔订单会经过哪里</h2>
      <div class="flow" aria-label="请求与组装关系"><div><b>HTTP 客户端</b><span>POST /orders</span></div><i>→</i><div><b>httpapi</b><span>读 JSON，写响应</span></div><i>→</i><div class="focus"><b>order.Service</b><span>校验，执行业务规则</span></div><i>→</i><div><b>Store</b><span>memory 或 sqlite</span></div></div>
      <p><code>main</code> 先选择存储，<code>app.New</code> 再把图里的对象连起来。请求到来时，main 不会重新执行；已经注册的 HTTP handler 调用已经创建的 Service，Service 再调用那个存储对象。</p>
      ${table(["你在工程中寻找的东西", "实际文件", "它不负责什么"], [
        ["程序入口、参数、退出信号", link("cmd/orders/main.go"), "不解析每个订单请求"],
        ["把组件接在一起", link("internal/app/app.go"), "不判断订单是否合法"],
        ["HTTP 路由与 JSON", link("internal/httpapi/api.go"), "不写 SQL"],
        ["订单、校验、取消规则", link("internal/order/service.go"), "不知道请求来自 HTTP 还是 TCP"],
        ["临时存储 / 持久化", `${link("internal/memory/store.go")}<br>${link("internal/sqlite/store.go")}`, "不决定 HTTP 状态码"],
        ["TCP 消息入口", link("internal/messageapi/api.go"), "不创建第二套订单业务"],
        ["可运行的客户端", `${link("cmd/check/main.go")}<br>${link("internal/tcpclient/client.go")}`, "不代替服务端校验"]
      ])}
      <h2 id="read">怎样使用这份教程</h2>
      <p>我们采用<strong>先使用成品，再逐段读懂并修改它</strong>的方式。下载包一开始就包含完整工程；正文会标出正在阅读的文件和函数。第 1 章另有一个独立的单文件起点，后面再逐步看完整服务。</p>
      <p>先完成第 1–4 章，你应该能追踪一次创建请求；第 5–7 章解释存储、第二种协议和并发状态变化；第 8–9 章练习运行维护与需求修改。源码可以直接在本站阅读，核心逻辑都在正文讲解，不需要先把框架仓库翻一遍。</p>
      ${note("如果第一步没有成功", "连接被拒绝：先看终端 1 是否还在运行，以及有没有报端口占用。Go 版本错误：核对 go version。依赖下载错误：先解决本机 Go 模块网络访问。数据库打不开：检查工作目录是否可写。先让这一步成功，再继续。")}
      `
    },
    firstRequestChapter(helpers),
    businessChapter(helpers),
    httpChapter(helpers),
    assemblyChapter(helpers),
    persistenceChapter(helpers),
    tcpChapter(helpers),
    stateChapter(helpers),
    lifecycleChapter(helpers),
    changeChapter(helpers),
  ];
}
