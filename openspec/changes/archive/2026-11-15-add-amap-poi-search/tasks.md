# Tasks

## 1. 内部能力边界与共用配置

- [x] 1.1 在 `application/port/maps` 定义内部地点搜索端口，并在 `application/model/maps` 定义包含分页元数据和原始 POI JSON 条目的结果模型；验证模型不依赖 Controller、HTTP 响应类型或高德传输实现。
- [x] 1.2 在 `infrastructure/amap/config` 与 `infrastructure/amap/transport` 建立服务端 `AMAP_API_KEY` 配置和可复用同步 HTTP 客户端；配置测试验证应用在缺少 Key 时仍可启动，实际调用时 Key 缺失会产生类型化内部错误且不发起出站请求。
- [x] 1.3 更新 `docs/knowledge/architecture/README.md` 记录 application port 与 `infrastructure/amap` 的包层级/依赖方向，并更新 `docs/knowledge/external/README.md` 登记高德 POI、路线规划 2.0（未来扩展参考）和 Spring REST 客户端文档；核对文档明确本次无 Controller 且无独立 `poi` 包。

## 2. 高德 POI 内部适配器

- [x] 2.1 在 `infrastructure/amap/api` 实现地点搜索端口的高德适配器，为关键词和周边操作分别映射 `/v5/place/text` 与 `/v5/place/around`；为每个 API 编写本地 HTTP stub 测试，明确断言应用层输入到 HTTP 方法、路径及参数的映射，并覆盖分页默认值、周边默认类型/半径和高德业务错误识别。
- [x] 2.2 为关键词与周边搜索分别提供可读的高德响应 fixture，并断言 fixture 响应映射到的内部结果；保留 `pois` 中任意字段、嵌套结构、字段类型和值，同时组织数量/分页元数据。fixture 应使后续开发者能从测试中看清输入、上游响应和内部输出，且不得包含敏感数据。
- [x] 2.3 覆盖参数校验、缺少 API Key、超时/连接/HTTP 错误转换及日志脱敏；验证这些路径不发起多余请求、不泄露 API Key 或原始坐标/关键词。

## 3. 集成验证

- [x] 3.1 验证应用层只依赖地点搜索端口，高德适配器依赖共用传输设施，且新增实现未创建 Controller、`/api/pois/*` 路由或单独 `poi` 包；确认 stub/fixture 仅用于测试，本地运行仍通过真实适配器请求高德；通过依赖方向审查或对应结构测试确认。
- [x] 3.2 在 `apps/server` 执行 `./mvnw test`，确认后端全套测试通过；确认无数据库迁移、POI 缓存或路线规划 API 实现。

## 4. 本地环境文件自动加载

- [x] 4.1 在后端启动期间自动从仓库根目录加载 `.env` 中的 `AMAP_API_KEY`，通过应用产物位置定位仓库而非当前工作目录；支持 `PAWTRIP_ENV_FILE` 绝对路径覆盖，保证进程环境变量优先、文件缺失不阻止启动，并覆盖这些行为及密钥日志脱敏的测试。
- [x] 4.2 添加不含真实密钥的根目录 `.env.example`，更新中文开发说明记录配置和启动方式；在 `apps/server` 执行 `./mvnw clean test` 验证后端测试。
