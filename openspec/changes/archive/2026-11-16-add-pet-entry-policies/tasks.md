## 1. 迁移与测试

- [x] 1.1 扩展 SQLite 迁移测试，验证两张表的规则字段、历史行 `NULL`、数值范围、布尔约束、小数体重及两层值独立。
- [x] 1.2 新增 V7 Flyway 迁移，为 `administrative_region` 和 `pawtrip_location` 增加六项可空字段及值域约束，不回填旧记录。

## 2. 持久化模型

- [x] 2.1 添加 JPA 持久化往返测试，验证行政区与地点规则值独立且可读写。
- [x] 2.2 为 `AdministrativeRegion` 和 `PawtripLocation` 添加六项可空 JPA 属性，类型与已确认单位一致。
- [x] 2.3 运行地点迁移与持久化相关后端测试，并修复 schema 与实体映射不一致的问题。
