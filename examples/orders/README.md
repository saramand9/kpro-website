# KPro orders — 教学工程

配套教程：官网 `learn.html`。这是可以独立运行的 Go module，固定使用
KPro **v0.2.1**，没有指向开发者电脑的 `replace`。

需要 Go **1.26.9 或更新的兼容版本**（KPro v0.2.1 的要求）。
第一次 `go mod download` 需要访问 Go 模块下载源。SQLite 使用纯 Go 驱动，
不需要安装数据库服务器或 C 编译器。`-race` 检查另有平台工具链要求。

## 先运行成品

在本目录打开终端：

```sh
go mod download
go run ./cmd/orders
```

另开一个终端，仍在本目录：

```sh
go run ./cmd/check
```

检查工具会实际创建订单，查询、发送非法数量、取消并重复取消，打印每个 HTTP
状态码及 JSON。默认只监听本机 `127.0.0.1:8080`，不要直接暴露到公网。
订单存到当前工作目录的 `orders.db`。Ctrl+C 停止服务后重新启动，原订单仍可查询。

也可以手动请求（Windows PowerShell 请将 `curl` 写成 `curl.exe`）：

```sh
curl -i -H "Content-Type: application/json" --data-binary "@requests/create.json" http://127.0.0.1:8080/orders
```

记下返回的 `id`，将下面的 `ORDER_ID` 换成它：

```sh
curl -i http://127.0.0.1:8080/orders/ORDER_ID
curl -i -X POST http://127.0.0.1:8080/orders/ORDER_ID/cancel
```

## 三个可运行的观察点

各命令默认占用同一个 HTTP 端口；切换前先 Ctrl+C 停止上一个进程。

```sh
# 只有一个 /hello 路由：完整源码在 cmd/hello/main.go。
go run ./cmd/hello

# 完整业务，暂时不持久化；重启后数据消失。
go run ./cmd/orders -memory

# SQLite 持久化，并打开 TCP 查询入口。
go run ./cmd/orders -tcp 127.0.0.1:8088
```

TCP 客户端读取同一个服务内、由 HTTP 创建的订单：

```sh
go run ./cmd/ordercli -id ORDER_ID
```

TCP 只实现查询（消息 ID 1001），不包含订阅、事件推送或客户端重连机制。

## 文件与职责

| 文件 | 职责 |
| --- | --- |
| `cmd/hello/main.go` | 第一个独立可运行的最小观察点 |
| `cmd/orders/main.go` | 参数、选择存储、信号、最后关闭数据库 |
| `internal/app/app.go` | 将同一个 Service 接入 HTTP/TCP；启动与等待停机 |
| `internal/httpapi/api.go` | HTTP JSON、路由和错误状态码 |
| `internal/order/service.go` | 模型、业务校验、状态规则、存储接口 |
| `internal/memory/store.go` | map 与互斥锁；用于先理解流程 |
| `internal/sqlite/store.go` | SQL、事务、数据库错误转换 |
| `internal/sqlite/schema.sql` | 初始建表；不是版本化迁移系统 |
| `internal/messageapi/api.go` | 消息 ID 1001 的解码、业务调用、响应 |
| `internal/tcpclient/client.go` | 编码、TCP 读写、响应关联 |
| `cmd/check/main.go` | 对运行中的本地 HTTP 服务执行完整操作 |
| `cmd/ordercli/main.go` | TCP 查询命令行入口 |
| `internal/storetest/contract.go` | 两个存储实现共用的行为测试 |

## 验证

```sh
go test ./... -count=1
go test -race ./... -count=1
go vet ./...
```

覆盖业务校验、数量边界、共享与独立存储、重复取消、两种存储行为、并发取消、
失败回滚、SQLite 重开后数据保持与表约束、HTTP 错误响应、跨 HTTP/TCP 读写、
正常停止与端口占用时的启动失败收尾。测试使用临时数据库，
不会读取或删除你运行示例时的 `orders.db`。

## 有意保留的边界

这是教学应用，不是电商或生产模板。没有用户、鉴权、支付、库存、计价、分页、
创建请求幂等键、消息订阅、监控系统和多实例部署。重复创建会产生两笔订单；
只有重复取消是幂等的。SKU 是字符串，数量范围为 1–20。

SQLite 实现使用单连接串行化本进程的数据库操作，方便理解事务，不能作为吞吐
或多实例承诺。接入 PostgreSQL 时需要真正实现和验证行锁/条件更新、迁移、
连接池、备份恢复，并重新跑存储行为测试。鉴权仍属于应用或网关，KPro 不代做。

建表脚本中的 `CREATE TABLE IF NOT EXISTS` 不会升级已有表结构。
修改 schema 后请使用一个新的**测试数据库路径**，或实现受控的版本迁移；
不要删除已有业务数据库。
