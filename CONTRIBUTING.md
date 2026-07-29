# 贡献指南

感谢参与 Cover Studio。

## 开始前

- 保持 App 为 `standalone`；不要引入项目创建、项目命名或项目列表。
- 媒体内容属于 Recut 素材库。App 只能保存 `assetId` 和元数据，不能复制或直接读取其他 App 的数据文件。
- `manifest.json` 是 operation schema 与权限的唯一真相。修改 operation 时同步更新 [docs/integration.md](docs/integration.md) 和 `AGENTS.md`。

## 本地验证

在 Recut 主仓库中：

```sh
make app-link APP=apps/cover-studio
cd service && go test ./...
cd ../web && npm run build
```

修改 `background.js` 时，至少检查以下路径：

1. 保存 UI 选择后，`cover.context` 返回同一份数据。
2. `template.save` 后，`template.list` 能返回该模板。
3. 只有带真实 `assetId` 的 `cover.save` 能进入 `cover.list`。

## 提交原则

- 一个提交只解决一个问题。
- 不提交素材库内容、SQLite 数据库、凭据或生成图片。
- 新增渠道尺寸或模板时，说明它的实际发布场景；不要用“通用”掩盖不兼容的画幅。
- 变更文件职责、目录或公开 operation 后，更新相应 README 与集成契约。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
