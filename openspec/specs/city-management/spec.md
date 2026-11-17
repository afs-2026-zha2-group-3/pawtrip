# city-management Specification

## Purpose

TBD

## Requirements

### Requirement: 管理员城市管理页面
系统 SHALL 为管理员提供 `/admin/cities` 城市政策管理页面，页面包含省份、级别与关键词筛选、服务端分页表格以及政策编辑弹窗；非管理员 MUST NOT 看到该页面内容。

#### Scenario: 管理员打开城市管理页面
- **GIVEN** 当前用户是已认证的管理员
- **WHEN** 用户打开城市管理路由
- **THEN** 页面显示省份、级别与关键词筛选控件
- **AND** 页面显示分页的城市表格和每行的编辑入口

#### Scenario: 普通用户访问城市管理页面
- **GIVEN** 当前用户已认证但不是管理员
- **WHEN** 用户打开城市管理路由
- **THEN** 城市管理页面不显示
- **AND** 用户返回普通受保护页面

### Requirement: 城市列表口径
城市列表 SHALL 包含全部城市级（`level='city'`）行政区记录，以及没有市级子节点的省级（`level='province'`）记录；MUST NOT 包含存在市级子节点的省级记录。列表数据 MUST 仅来自系统数据库，MUST NOT 调用高德 API。

#### Scenario: 城市级记录全部出现
- **GIVEN** 数据库存在城市级行政区
- **WHEN** 管理员查询城市列表
- **THEN** 所有城市级行政区均按名称排序进入列表

#### Scenario: 省级叶节点出现
- **GIVEN** 北京、上海、天津、重庆或港澳台等省级记录没有市级子节点
- **WHEN** 管理员查询城市列表
- **THEN** 这些省级记录作为可编辑行出现在列表中

#### Scenario: 有子节点的省份不出现
- **GIVEN** 某省级记录存在市级子节点
- **WHEN** 管理员查询城市列表
- **THEN** 该省级父记录不出现在列表中

#### Scenario: 城市列表不调用高德
- **GIVEN** 管理员打开城市管理页面或翻页
- **WHEN** 前端读取列表数据
- **THEN** 后端只查询系统数据库
- **AND** 不向高德发起任何请求

### Requirement: 城市筛选与分页
城市列表 SHALL 支持按省份、级别和名称关键词筛选，并 SHALL 提供以城市为单位的服务端分页。关键词 MUST 去除首尾空白后按名称包含匹配；筛选条件变化时 MUST 回到第一页。

#### Scenario: 按省份筛选
- **WHEN** 管理员选择一个省份
- **THEN** 列表只显示该省份下的城市级记录及其省级叶节点记录

#### Scenario: 按级别筛选
- **WHEN** 管理员选择“城市级”或“省级叶节点”
- **THEN** 列表只显示对应级别的记录

#### Scenario: 按关键词筛选
- **WHEN** 管理员输入城市名称的一部分
- **THEN** 列表只显示名称包含该关键词的记录

#### Scenario: 翻阅下一页
- **GIVEN** 当前筛选结果超过一页
- **WHEN** 管理员选择下一页
- **THEN** 前端请求相同筛选条件下的下一页
- **AND** 表格显示对应页结果及正确分页状态

### Requirement: 城市政策编辑弹窗
系统 SHALL 在城市列表的编辑弹窗中提供 8 项标量政策与允许饲养犬种名单的编辑能力，并 MUST 回填当前已保存值。8 项标量政策为允许宠物类型、每位游客最多携带宠物数、单只宠物最大体重、单只宠物最大肩高、牵引绳要求、疫苗证明要求、额外费用和预约要求。清空任一标量字段 MUST 保存为 `NULL`；数值 `0` MUST 表示明确的零值；布尔字段 MUST 区分 `NULL`、`true`、`false`。

#### Scenario: 打开弹窗并回填
- **GIVEN** 某城市已保存部分政策
- **WHEN** 管理员点击该城市的编辑入口
- **THEN** 弹窗展示 8 项标量政策和已选犬种名单
- **AND** 每个已配置字段显示已保存值

#### Scenario: 保存后重新打开
- **GIVEN** 管理员修改了城市政策
- **WHEN** 保存成功并重新打开编辑弹窗
- **THEN** 弹窗显示修改后的值

#### Scenario: 清回未配置
- **WHEN** 管理员清空某项已配置标量政策并保存
- **THEN** 该字段在数据库中保存为 `NULL`
- **AND** 重新打开弹窗时该字段为空

#### Scenario: 允许宠物类型
- **WHEN** 管理员为允许宠物类型选择“未配置 / 仅猫 / 仅狗 / 猫和狗”
- **THEN** 分别保存为 `NULL` / `CAT` / `DOG` / `CAT,DOG`
- **AND** 重新打开弹窗时选中对应选项

#### Scenario: 费用单位换算
- **WHEN** 管理员在额外费用输入框填写 `10.5` 元
- **THEN** 请求与持久化值为 `1050` 分
- **AND** 重新打开弹窗时显示 `10.5`

#### Scenario: 非法政策值被拒绝
- **WHEN** 管理员填写负数、非整数数量、超过两位小数的体重/肩高/费用，或非法的允许宠物类型
- **THEN** 界面显示可读错误且不发起保存请求
- **AND** 直接向管理 API 提交非法值时返回 400，且不产生部分写入

### Requirement: 城市允许犬种名单
城市编辑弹窗 SHALL 支持从系统犬种参考数据中选择允许饲养的犬种。未选择任何犬种 MUST 表示未配置/不限制；保存时 MUST 以请求内容整体替换名单；重复犬种 ID MUST 按一个保存；不存在的犬种 ID MUST 被拒绝。

#### Scenario: 选择并保存犬种
- **GIVEN** 犬种参考数据包含若干犬种
- **WHEN** 管理员选择多个犬种并保存
- **THEN** 城市详情返回相同的犬种 ID 集合

#### Scenario: 未选择表示不限制
- **WHEN** 管理员清空犬种名单并保存
- **THEN** 该城市保存为空名单
- **AND** 界面将其解释为未限制犬种

#### Scenario: 未知犬种被拒绝
- **WHEN** 更新请求包含不存在的犬种 ID
- **THEN** 返回 400 错误
- **AND** 城市政策和犬种名单均不发生写入

#### Scenario: 重复犬种去重
- **WHEN** 更新请求包含重复的犬种 ID
- **THEN** 该犬种只保存一次

### Requirement: 城市管理 API
系统 SHALL 提供管理员城市列表、详情和更新接口：`GET /api/admin/cities`、`GET /api/admin/cities/{adcode}`、`PATCH /api/admin/cities/{adcode}`。更新请求 SHALL 接受可选的 `petPolicies` 对象和可选的 `allowedDogBreedIds` 数组；未提供的部分 MUST 保持不变，提供的部分 MUST 整体替换，`petPolicies` 中为 `null` 的字段 MUST 清空。非省级叶节点的省级记录 MUST NOT 通过更新接口修改。所有接口 MUST 要求 `ADMIN` 角色。

#### Scenario: 读取城市详情
- **GIVEN** 管理员请求一个城市级或省级叶节点记录
- **WHEN** 后端返回详情
- **THEN** 响应包含 `adcode`、`name`、`level`、所属省份、8 项 `petPolicies` 和 `allowedDogBreedIds`

#### Scenario: 更新时缺省部分保持不变
- **GIVEN** 城市已有政策和犬种名单
- **WHEN** PATCH 请求不包含 `petPolicies` 或 `allowedDogBreedIds`
- **THEN** 对应部分保持原值

#### Scenario: 提供部分整体替换
- **GIVEN** 城市已有 8 项政策和犬种名单
- **WHEN** PATCH 请求包含 `petPolicies` 和 `allowedDogBreedIds`
- **THEN** 8 项政策以请求内容整体替换，名单也以请求内容整体替换
- **AND** `petPolicies` 中为 `null` 的字段保存为未配置

#### Scenario: 拒绝非叶省份记录
- **GIVEN** 目标省级记录存在市级子节点
- **WHEN** 管理员尝试更新其政策
- **THEN** 返回 400 错误
- **AND** 不产生任何写入

#### Scenario: 未认证或非管理员被拒绝
- **WHEN** 未认证用户或普通用户请求城市管理接口
- **THEN** 返回认证或权限错误
- **AND** 不返回城市政策数据
