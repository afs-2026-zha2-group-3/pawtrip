# backend-amap-poi-search Specification

## Purpose

为 Pawtrip 应用层系统功能提供内部高德 POI 2.0 关键词与周边搜索能力，并保留每个高德 POI 的原始 JSON 结构，而不直接暴露独立 HTTP API。

## Requirements

### Requirement: POI 搜索作为内部能力提供
后端 SHALL 通过应用层定义的内部能力提供高德 POI 关键词和周边搜索；本次 MUST NOT 新增 POI Controller 或公开 POI HTTP 路由。

#### Scenario: POI 搜索不暴露 HTTP 路由
- **GIVEN** 后端应用已启动
- **WHEN** 检查 HTTP 路由映射
- **THEN** 不存在本次 POI 关键词或周边搜索的 HTTP 路由

#### Scenario: 应用功能调用 POI 搜索
- **GIVEN** 调用方是后端应用功能
- **WHEN** 调用 POI 关键词或周边搜索能力
- **THEN** 请求通过内部应用能力交给高德集成实现
- **AND** 不需要经过 HTTP Controller

### Requirement: POI 关键词搜索
内部搜索能力 SHALL 根据关键词调用高德 POI 2.0 关键词搜索，并返回包含数量、分页信息和原始 POI 条目的内部结果。

#### Scenario: 关键词搜索成功
- **GIVEN** `keywords` 为 1 至 80 个字符的非空字符串
- **WHEN** 应用功能调用关键词搜索
- **THEN** 高德集成请求 `/v5/place/text`
- **AND** 返回内部搜索结果及高德提供的 POI 条目

#### Scenario: 关键词无效
- **GIVEN** `keywords` 为空或超过 80 个字符
- **WHEN** 应用功能调用关键词搜索
- **THEN** 调用以类型化的参数校验错误失败
- **AND** 不发起高德网络请求

### Requirement: POI 周边搜索
内部搜索能力 SHALL 根据中心点及可选搜索条件调用高德 POI 2.0 周边搜索。

#### Scenario: 周边搜索包含筛选条件
- **GIVEN** 请求包含有效中心点，可选包含 `keywords` 或 `types`
- **WHEN** 应用功能调用周边搜索
- **THEN** 高德集成请求 `/v5/place/around`
- **AND** 返回内部搜索结果及高德提供的 POI 条目

#### Scenario: 周边搜索未提供关键词和类型
- **GIVEN** 请求包含有效中心点，且未提供 `keywords` 和 `types`
- **WHEN** 应用功能调用周边搜索
- **THEN** 高德周边搜索的默认类型范围生效：餐饮、生活服务和商务住宅

#### Scenario: 未指定周边搜索半径
- **GIVEN** 请求包含有效中心点且未指定 `radius`
- **WHEN** 内部能力执行周边搜索
- **THEN** 高德默认搜索半径 5000 米生效

#### Scenario: 周边搜索参数无效
- **GIVEN** 中心点无效、坐标精度超过小数点后 6 位，或 `radius` 不在 0 至 50000 米范围内
- **WHEN** 应用功能调用周边搜索
- **THEN** 调用以类型化的参数校验错误失败
- **AND** 不发起高德网络请求

### Requirement: 分页搜索结果
内部 POI 搜索能力 SHALL 支持高德分页参数；缺省 `page_num` SHALL 为 1，缺省 `page_size` SHALL 为 10，每页条数 SHALL 在 1 至 25 之间，并遵守高德同一查询最多获取 200 条 POI 的限制。

#### Scenario: 使用默认分页
- **GIVEN** 请求未指定 `page_num` 和 `page_size`
- **WHEN** 内部能力执行任一 POI 搜索
- **THEN** 高德请求使用 `page_num=1`、`page_size=10`
- **AND** 内部结果包含对应分页信息

#### Scenario: 使用指定分页
- **GIVEN** 请求指定正整数 `page_num` 和 1 至 25 的 `page_size`
- **WHEN** 内部能力执行 POI 搜索
- **THEN** 高德请求使用指定分页参数
- **AND** 内部结果包含对应分页信息和数量

#### Scenario: 每页条数超出范围
- **GIVEN** `page_size` 小于 1 或大于 25
- **WHEN** 应用功能调用任一 POI 搜索
- **THEN** 调用以类型化的参数校验错误失败
- **AND** 不发起高德网络请求

### Requirement: POI 条目保留上游原始结构
内部搜索结果 SHALL 保留每个高德 POI 条目的原始 JSON 字段、嵌套结构、类型和值；集成能力 MUST NOT 将 POI 条目映射为 Pawtrip 字段模型。

#### Scenario: 保留任意 POI 字段
- **GIVEN** 高德响应包含基础字段、可选字段或未知的嵌套字段
- **WHEN** 内部搜索能力返回结果
- **THEN** 对应 POI 条目的 JSON 结构和值保持与高德响应一致
- **AND** 数量及分页元数据由内部结果模型承载

### Requirement: 高德凭据与上游错误在内部边界处理
高德 API Key SHALL 仅由服务端配置。缺少凭据、上游业务失败或网络/HTTP 调用失败 SHALL 转换为类型化的内部集成错误；错误和日志 MUST NOT 暴露 API Key、完整凭据 URL 或敏感搜索请求数据。

#### Scenario: 未配置高德凭据
- **GIVEN** 服务端没有配置高德 API Key
- **WHEN** 应用功能调用 POI 搜索
- **THEN** 调用以类型化的配置错误失败
- **AND** 不发起高德网络请求

#### Scenario: 高德返回业务或传输错误
- **GIVEN** 高德返回失败状态/`infocode`，或请求发生超时、连接失败及非成功 HTTP 状态
- **WHEN** 内部 POI 搜索处理该响应
- **THEN** 调用以类型化的上游集成错误失败
- **AND** 错误与日志不包含凭据、完整请求 URL 或原始敏感查询参数

### Requirement: 后端自动加载本地环境文件
后端 SHALL 在启动时自动读取仓库根目录的 `.env` 中的 `AMAP_API_KEY`，且不得依赖进程当前工作目录。进程环境变量中的 `AMAP_API_KEY` SHALL 优先于文件值。`.env` 不存在时应用 SHALL 仍可启动；实际调用 POI 搜索时仍按“未配置高德凭据”的既有要求失败。部署产物位于仓库之外时，SHALL 支持通过 `PAWTRIP_ENV_FILE` 指定 `.env` 的绝对路径。加载过程 MUST NOT 记录密钥值。

#### Scenario: 从不同工作目录启动
- **GIVEN** 后端应用产物位于仓库内，且仓库根目录存在 `.env`
- **WHEN** 从任意当前工作目录启动后端
- **THEN** 后端从仓库根目录读取 `AMAP_API_KEY`
- **AND** 定位 `.env` 不依赖当前工作目录

#### Scenario: 进程环境变量覆盖文件值
- **GIVEN** 仓库根目录 `.env` 与进程环境均设置了 `AMAP_API_KEY`
- **WHEN** 后端启动并读取高德配置
- **THEN** 使用进程环境变量中的值

#### Scenario: 本地环境文件不存在
- **GIVEN** 仓库根目录不存在 `.env`，且没有设置 `PAWTRIP_ENV_FILE`
- **WHEN** 后端启动
- **THEN** 应用仍可正常启动
- **AND** 未配置 Key 时，实际 POI 搜索按既有要求以类型化配置错误失败且不发起上游请求

#### Scenario: 从仓库外指定环境文件
- **GIVEN** 后端产物位于仓库之外，且 `PAWTRIP_ENV_FILE` 指向一个 `.env` 绝对路径
- **WHEN** 后端启动
- **THEN** 后端从指定文件读取 `AMAP_API_KEY`

### Requirement: POI 搜索支持类型与行政区域
后端内部 POI 搜索 SHALL 支持只按一个或多个 `types` typecode 搜索，并可按高德支持的行政区编码限定查询范围；分页请求 SHALL 沿用高德 POI 搜索的分页限制。

#### Scenario: 按地点类型与城市筛选
- **GIVEN** 搜索请求包含一个或多个有效 typecode，以及可选的城市或省级行政区编码
- **WHEN** 后端调用高德 POI 关键词搜索接口
- **THEN** 请求通过 `types` 传递 typecode
- **AND** 有行政区筛选时通过 `region` 与严格区域限制参数限定范围
- **AND** 按请求页码与每页条数返回原始 POI 结果

#### Scenario: 不提供关键词但提供类型
- **GIVEN** 搜索请求只提供有效 typecode
- **WHEN** 后端执行高德 POI 搜索
- **THEN** 请求以 `types` 作为搜索条件
- **AND** 不要求额外关键词

### Requirement: 按 POI ID 获取扩展详情
后端内部 POI 集成 SHALL 支持按 POI ID 获取详情，并请求 `business`、`photos` 可选字段；详情结果 SHALL 保留高德返回的原始 POI JSON 结构和值。

#### Scenario: 获取地点商业与照片数据
- **GIVEN** 应用功能提供有效 POI ID
- **WHEN** 后端调用高德 POI ID 详情 API 并请求 `show_fields=business,photos`
- **THEN** 返回 POI 基础字段与高德提供的 `business`、`photos` 完整字段
- **AND** 未知或可选的嵌套字段和值不被丢弃

#### Scenario: POI 详情上游失败
- **GIVEN** 高德详情请求发生传输失败或返回业务失败
- **WHEN** 后端处理该响应
- **THEN** 调用以类型化的高德集成错误失败
- **AND** 错误与日志不暴露 API Key、完整凭据 URL 或敏感请求数据
