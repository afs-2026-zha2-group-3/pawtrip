# Design

## Context

参见 [proposal.md](proposal.md) 的动机和范围，以及 [backend-amap-poi-search spec](specs/backend-amap-poi-search/spec.md) 的内部行为契约。

后端是 Spring Boot / Java 21 的同步 Spring MVC 应用，目前没有通用的外部地图集成层。项目架构规则要求依赖方向清晰并避免循环依赖。本次只接入高德 POI 2.0 关键词与周边搜索，不建立面向调用方的 Controller；高德路线规划 2.0 文档仅用于验证未来其他高德 API 可能具有不同参数和 HTTP 请求方式，路线规划不在本次实现范围内。

## Goals / Non-Goals

**Goals:**

- 把高德 POI 搜索作为供应用功能调用的内部能力，而不是 Pawtrip 的独立 HTTP API。
- 通过应用端口隔离应用层与高德基础设施，按文件/包层级组织代码，不建单独的 `poi` 包。
- 复用高德凭据、HTTP 传输和错误处理，同时为未来不同高德 API 保留独立协议适配点。
- 在内部搜索结果中保留原始 POI JSON 条目。

**Non-Goals:**

- 新增 Controller、`/api/pois/*` 路由、客户端契约或面向 HTTP 的成功/错误响应。
- 新增 POI 业务编排服务、路线规划 API、其他高德 API、数据库持久化或缓存。
- 建立可由业务层任意指定路径和参数的动态高德代理。

## Decisions

### 1. 按应用端口与基础设施分层，不建立 POI 功能包或 Controller

```text
com.pawtrip.server
├── application/
│   ├── model/maps/                    # 内部 PlaceSearch 结果及原始 POI 数据
│   └── port/maps/                     # 系统功能使用的 PlaceSearch 出站接口
└── infrastructure/
    └── amap/
        ├── config/                    # 服务端 Key、基础 URL 等配置
        ├── transport/                 # 共用同步 HTTP 传输
        └── api/                       # 高德 API 专用适配器；本次只有 POI 搜索适配器
```

依赖方向为 `application service -> application.port.maps`，`infrastructure.amap.api` 实现该端口，并依赖 `infrastructure.amap.transport` 与配置。应用层不依赖高德传输实现；外部适配器不依赖 Controller 或 HTTP 响应模型。

本次增加应用端口/结果类型和高德适配器，不新增没有实际系统用例的 `PoiSearchService`，也不增加 Controller。关键词和周边搜索作为同一地点搜索能力由适配器的方法提供；文件按层级归属，不创建 `controller/poi`、`service/poi` 或独立 `poi` 包。将来如路线规划 API 加入，应在相同高德基础设施下增加路线能力的应用端口和专用适配器，不把它塞入 POI 搜索接口。

### 2. 共用传输设施，API 协议由专用适配器处理

使用 Spring 同步 `RestClient` 作为内部共用 HTTP 传输设施，不新增第三方客户端依赖。`infrastructure.amap.transport` 负责高德 Web 服务基础 URL、URI 参数编码、请求超时、Key 注入和通用传输错误；POI 适配器分别将关键词和周边查询映射到 `/v5/place/text`、`/v5/place/around`，并检查高德 JSON 业务状态。

共用传输设施不定义 POI、路线等业务参数，也不对应用层暴露任意路径代理。后续适配器自行维护对应高德 API 的必填/可选参数、默认值、HTTP 方法和结果处理。路线规划 2.0 可能因参数长度使用 GET 或 POST，这也是传输层不应固化为“单一 GET 业务接口”的原因；本次 POI 调用仍只使用 GET，不实现路线请求。

参考文档：
- [高德 POI 2.0](https://lbs.amap.com/api/webservice/guide/api-advanced/newpoisearch)
- [高德路线规划 2.0（未来扩展参考）](https://lbs.amap.com/api/webservice/guide/api/newroute)
- [Spring Framework REST Clients](https://docs.spring.io/spring-framework/reference/integration/rest-clients.html)

### 3. 内部端口结果保留 POI 原始对象

应用端口接收地点关键词/周边搜索条件，并返回内部搜索结果，包括高德数量与分页元数据以及原始 POI JSON 条目。适配器只读取组织结果所需的上游外层字段，不将每个 POI 转换成 Pawtrip 字段 DTO；任意新增字段、嵌套结构和值均随原始对象保留。由于没有 Controller，本次不定义外部 HTTP 成功响应 envelope。

### 4. 按需调用内部能力，并在调用边界校验凭据

不增加 POI 功能开关。只有后端系统功能实际调用 POI 搜索能力时才发起对应的高德请求。高德 Key 使用环境变量 `AMAP_API_KEY` 提供；未配置 Key 不阻止应用启动，但调用时返回类型化的内部配置错误，且不发起网络请求。

高德 Web 服务要求 Key 放在请求查询参数中，因此不得记录完整 URL；日志、异常消息和指标不包含 Key 或原始坐标/关键词。上游 HTTP 或业务失败转换为内部集成错误，不在高德适配器中构造 Problem Details；未来的系统 HTTP API 应在其自身的边界映射错误。

### 5. 测试中以 stub/fixture 展示输入输出；本地运行使用真实高德请求

应用端口/结果模型通过单元测试验证其调用契约；每个高德 API 适配器都用本地 HTTP stub 和对应的响应 fixture 验证端到端映射。测试应清楚展示应用层输入如何映射为 HTTP 方法、路径及查询/请求参数，以及代表性上游响应如何转为内部结果。POI 关键词与周边搜索分别提供可读的响应 fixture，并断言分页等元数据及原始 POI JSON 保真；后续新增高德 API 时沿用这一约定，为每个 API 添加对应示例。fixture 使用非敏感的代表性数据，测试不访问真实高德服务，也不使用真实 API Key。

Stub 和 fixture 仅用于测试，不提供运行时 mock 实现或 mock 配置模式。本地启动服务调试时，系统功能经由真实高德适配器发起真实请求；须配置服务端 `AMAP_API_KEY`。缺少 Key 时应用仍可启动，但实际调用以类型化配置错误失败且不发起网络请求。

### 6. 从仓库根目录自动加载 `.env`

后端启动时通过 `ApplicationContextInitializer` 在应用上下文 refresh 前读取并加入 `AMAP_API_KEY` 配置；这是 Spring 提供的启动回调，可在 refresh 前修改上下文环境，不引入 dotenv 第三方依赖。进程环境变量保持更高优先级，`.env` 仅作为本地配置来源。文件缺失时不阻止启动，也不输出密钥值。

默认路径不使用 `user.dir`：从后端应用代码/产物所在位置向上查找同时包含根目录 `package.json` 和 `apps/server/pom.xml` 的仓库目录，再读取其 `.env`。若部署 JAR 位于仓库之外，可通过 `PAWTRIP_ENV_FILE` 指定 `.env` 绝对路径；此设置也不依赖启动工作目录。仓库根目录提供只含占位值的 `.env.example`，真实 `.env` 继续由 `.gitignore` 忽略。

### 7. 测试与使用说明

测试覆盖仓库根定位不依赖当前工作目录、进程环境变量优先、文件缺失仍可启动、外置绝对路径读取及密钥不进入日志。中文开发说明记录 `.env` 创建方式、启动行为和 `PAWTRIP_ENV_FILE` 用法；示例文件不得包含真实密钥。

## Risks / Trade-offs

- **内部原始 POI 数据仍与高德结构耦合** → 这是保留原始对象的明确要求；通过应用端口限制数据流向，不把字段映射扩散到业务功能。若未来要对外公开，再另行定义稳定 DTO。
- **缺少 Key 时功能调用失败** → 在集成入口产生类型化配置错误，并保持应用可启动；部署环境需配置 `AMAP_API_KEY` 才能实际调用高德。
- **高德 API 协议并不完全一致** → 共用层只处理传输共性，端点参数与 GET/POST 选择留在各 API 适配器；每个 API 的 stub/fixture 测试记录其具体输入输出，避免构造过于泛化的代理。
- **Key 和位置查询数据进入日志** → 禁止记录完整请求 URL 和原始搜索参数，并验证错误路径日志脱敏。

## Migration Plan

无需数据库迁移，也不改变现有 HTTP 路由或客户端。只有内部功能调用该能力时才产生高德请求；部署环境需提供 `AMAP_API_KEY`。回滚时移除新增端口/适配器和配置即可。
