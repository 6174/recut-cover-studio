# Cover Studio - Recut 封面生成 App

Cover Studio 是一个为 Recut 设计的工作区型封面创作台。它将发布渠道尺寸、可复用提示词模板和素材库参考图放进一次清晰的选择流程；生成图片由 Recut 素材库统一保存，应用只保留能够复现决策的元数据。

它不是项目管理工具。打开一次，继续使用同一组模板和历史；不必为每张封面创建项目。

## 功能

- **渠道尺寸**：内置小红书、抖音、B 站和 YouTube 画幅，可继续扩展。
- **封面模板**：模板是可编辑提示词与参考图 Asset ID 的组合，不是不可追溯的截图。
- **参考图选择**：从 Recut 素材库选择一张或多张已完成图片，作为生成的视觉参考。
- **Agent 生成**：界面将选择交给 Recut Agent；Agent 通过平台的图片生成能力产出真实 Asset。
- **可追溯历史**：每次成功生成都保存 `assetId`、完整提示词、渠道、尺寸、模板和参考图。图片本体仍属于素材库。

## 使用方式

1. 在 Recut 的 **Apps** 中打开“封面生成”。
2. 选择发布渠道与尺寸。
3. 选择模板；可从素材库附加参考封面。
4. 写下本次画面要求，点击“交给 Agent 生成”。
5. Agent 成功生成后会将封面保存在素材库，并写入下方历史。

生成图默认不包含可读文字、Logo 或水印，而是为后续可控排版留出空间。

## 安装与本地开发

此仓库是一个标准 Recut App 包，需要运行中的 Recut service。将它放到 Recut 运行时 App 目录，或在 Recut 主仓库中链接本地源码：

```sh
make app-link APP=apps/cover-studio
make dev
```

`manifest.json` 是唯一的运行时配置。它声明此 App 为 `standalone`，因此 Recut 会为它创建一个稳定的私有工作区 scope，而不会创建用户项目。

发布到 GitHub 后，在 `manifest.json` 中补充 `repository` 的 HTTPS 地址；用户便可从 Recut Apps 安装该仓库。

## 数据与隐私边界

| 数据 | 归属与保存位置 |
| --- | --- |
| 生成图片和用户上传参考图 | Recut Media Platform 的素材库，以全局 `assetId` 标识 |
| 模板 | App SQLite；保存提示词、默认尺寸和参考图 `assetId` |
| 当前选择 | App SQLite；保存渠道、尺寸、模板、参考图和补充要求 |
| 历史记录 | App SQLite；保存可追溯元数据，不复制媒体文件 |

App 不读取其他 App 的数据库，也不写入本地媒体文件。它只通过 Recut 的公开 capability、MCP 和 Asset ID 协议与平台协作。

## 架构

```text
ui/index.html
  ├─ 选择渠道、模板、参考图和补充要求
  ├─ 调用 background.js 保存当前配置与读取历史
  └─ 发送生成任务给 Recut Agent

background.js
  ├─ cover_meta          当前创作选择
  ├─ cover_templates     可复用模板
  └─ cover_history       指向素材库 Asset 的生成历史

Recut Agent
  ├─ recut.image.generate
  └─ recut.cover-studio.cover.save
```

完整的 App operation 契约见 [docs/integration.md](docs/integration.md)。贡献方式见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 仓库结构

```text
AGENTS.md              Recut Agent 的封面生成规则
background.js          App SQLite operation 后端
manifest.json          App 身份、权限、UI 与 operation 声明
ui/index.html          无构建依赖的封面创作台
docs/                  Recut 集成与 API 契约
CONTRIBUTING.md        开发、测试和提交约定
CHANGELOG.md           发布变更记录
LICENSE                MIT 许可证
```

## License

[MIT](LICENSE) © Recut Contributors.

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
