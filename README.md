# Cover Studio - Recut 封面生成 App

Cover Studio 是一个为 Recut 设计的工作区型封面创作台。它将发布渠道尺寸、参考图、参考封面和创作要求放进一次清晰的选择流程；生成图片由 Recut 素材库统一保存，应用只保留能够复现决策的元数据。

它不是项目管理工具。打开一次，继续使用同一份创作上下文和历史；不必为每张封面创建项目。

## 功能

- **渠道尺寸**：下拉选择国内和海外主流渠道；抖音、微信视频号等横竖画幅是独立规格。
- **参考图**：通过平台全局素材选择器选择、上传或查看本机/素材库图片，用于约束主体、产品、人物或画面元素。
- **参考封面**：通过同一平台全局素材选择器选择、上传或查看图片，用于约束构图、留白和视觉语气。
- **图片模型选择与直接生成**：使用 App 内置选择器列出所有已连接 Provider 的可用图片模型（含 Atlas Cloud）；选定后直接在当前工作区生成，完成的 Asset 自动归档到封面历史。没有模型时可直接打开 AI 服务商设置。
- **Codex 生成**：复制完整 Prompt，并只回填右侧 Codex 输入框；用户检查并确认发送后，Codex 才按平台配置选择图片生成方案。能取得 Recut Asset 的结果才会进入素材库历史。
- **可追溯历史**：每次成功生成都保存 `assetId`、完整提示词、渠道、尺寸与两类参考。图片本体仍属于素材库。

## 使用方式

1. 在 Recut 的 **Apps** 中打开“封面生成”。
2. 从下拉框选择发布渠道与尺寸。
3. 选择或上传参考图；需要复用风格时，再选择或上传参考封面。
4. 写下本次画面要求，选择系统已配置的图片模型后点击“直接生成”；没有可用模型时，在打开的 AI 服务商设置中连接并配置一个。
5. 或点击“交给 Codex 生成”：Prompt 会复制到剪贴板并回填右侧输入框，由你确认发送。
6. 成功生成的封面会保存在素材库，并写入下方历史。

生成图默认不包含可读文字、Logo 或水印，而是为后续可控排版留出空间。当前 `codex/image` 原生生成也遵守同一交付规则：Agent 将最终图片写入当前 Recut 项目目录，再调用 `recut.media.import_image` 归档，取得真实 `assetId` 后才会进入素材库与本 App 历史。对话预览从不构成封面交付。

## 安装与本地开发

此仓库是一个标准 Recut App 包，需要运行中的 Recut service。将它放到 Recut 运行时 App 目录，或在 Recut 主仓库中链接本地源码：

```sh
make app-link APP=apps/cover-studio
make dev
```

UI 开发时，在 `ui/` 内执行 `npm ci && npm run dev`；发布或安装前执行 `npm run build` 并提交更新后的 `ui/dist/`，宿主读取 `ui/dist/index.html`。

`manifest.json` 是唯一的运行时配置。它声明此 App 为 `standalone`，因此 Recut 会为它创建一个稳定的私有工作区 scope，而不会创建用户项目。

App 已发布在 [6174/recut-cover-studio](https://github.com/6174/recut-cover-studio)，`manifest.json` 声明同一 HTTPS 地址；用户可从 Recut Apps 市场直接安装。

## 数据与隐私边界

| 数据 | 归属与保存位置 |
| --- | --- |
| 生成图片、用户上传参考图和参考封面 | Recut Media Platform 的素材库，以全局 `assetId` 标识 |
| 当前选择 | App SQLite；保存渠道、尺寸、两类参考、补充要求和本次真实预览的 `assetId` |
| 历史记录 | App SQLite；保存可追溯元数据，不复制媒体文件 |

App 不读取其他 App 的数据库，也不写入本地媒体文件。它只通过 Recut 的公开 capability、MCP 和 Asset ID 协议与平台协作。

## 架构

```text
ui/dist/index.html
  ├─ 左侧选择渠道、已配置图片模型、参考图、参考封面和补充要求
  ├─ 右侧只渲染本次已归档的真实 Asset
  ├─ 宿主读取系统图片模型、绑定当前 scope 创建媒体任务并在完成后保存真实预览
  └─ Codex 路径只复制 Prompt 并回填右侧输入，用户确认后才发送

background.js
  ├─ cover_meta          当前创作选择与当前预览 Asset
  └─ cover_history       指向素材库 Asset 的生成历史

Recut Agent（仅用户确认 Codex 路径后）
  ├─ 按 `recut.project_context` 选择图片生成方案
  │   ├─ Media Platform route → `recut.image.generate`
  │   └─ Codex 原生方案 → 宿主提供的图片生成能力
  ├─ 用户上传参考图/参考封面 → `/v1/media/assets` → Asset ID → cover.configure
  ├─ Media Platform result → Recut Media Asset → cover.save
  └─ Codex 原生 result → 写入项目 → recut.media.import_image → Asset → cover.save
```

完整的 App operation 契约见 [docs/integration.md](docs/integration.md)。贡献方式见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 仓库结构

```text
AGENTS.md              Recut Agent 的封面生成规则
background.js          App SQLite operation 后端
manifest.json          App 身份、权限、UI 与 operation 声明
ui/                    React/Vite 封面创作台；与 Vox B-roll 使用相同的 SDK、Asset SSE 缓存与分层组件架构
docs/                  Recut 集成与 API 契约
CONTRIBUTING.md        开发、测试和提交约定
CHANGELOG.md           发布变更记录
LICENSE                MIT 许可证
```

## License

[MIT](LICENSE) © Recut Contributors.

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
