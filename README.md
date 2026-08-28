<div align="center">

<img src="./assets/logo.jpg" alt="Recut logo" width="112" />

# 封面工坊 · Cover Studio

**按发布渠道与画幅，从参考图和参考封面出发，一键生成可复用封面**

面向发布的封面创作台 — 选渠道、定画幅、给参考，生成即入库

[中文](./README.md) · [English](./README.en.md)

</div>

![封面工坊](./assets/cover-maker.jpg)

## 这是什么

封面工坊是 Recut 的**封面生成 App**（`standalone` 类型）。它把发布渠道、画幅、参考图、参考封面和画面要求放进一次清晰的选择流程：生成的图片以 Recut Media Asset 入库，App 只保留可追溯的生成历史。

- **渠道即尺寸**：抖音、视频号、B站等横竖画幅为独立规格，下拉即得正确宽高。
- **两类参考各司其职**：参考图约束主体/元素，参考封面约束构图、留白与视觉语气。
- **生成即 Asset**：无论走 Media Platform 还是 Codex 原生路径，都以真实 `assetId` 交付；对话预览不算交付。

> 随 Recut 安装使用，无需额外下载。发布于 [6174/recut-cover-studio](https://github.com/6174/recut-cover-studio)。

## 为什么用它

### 按渠道出图，不再猜尺寸

不同平台的封面尺寸各不相同。选择渠道自动确定宽高，避免导出后被裁切或留黑边。

### 参考约束结果

用已有的产品图、人物图约束内容，用喜欢的封面约束版式与气质，让生成结果更可控。

### 生成即沉淀

每次成功生成都保存 `assetId`、完整提示词、渠道、尺寸与两类参考。图片本体在素材库中全局复用。

## 从想法到成片

1. **选择渠道与尺寸**：从下拉框选择发布渠道与画幅。
2. **给出参考**：挑选或上传参考图；需要复用风格时再选参考封面。
3. **写下画面要求**：补充本次的视觉诉求，选择已配置的图片模型。
4. **生成并沉淀**：点击生成，成功结果自动归档到素材库并写入下方历史。

## 核心能力

| 能力 | 你能做什么 | 关键操作 |
| --- | --- | --- |
| **渠道与尺寸** | 选择发布渠道自动确定宽高 | `cover.context` · `cover.configure` |
| **参考约束** | 两类参考分别约束内容与版式 | `cover.configure` (`referenceAssetIds` / `referenceCoverAssetIds`) |
| **图片生成** | 按平台配置选择 Media Platform 或 Codex 原生路径 | `recut.image.generate` / Codex → `recut.media.import_image` |
| **历史沉淀** | 保存 `assetId`、提示词、渠道、尺寸与参考 | `cover.save` · `cover.list` |

> 完整操作契约见 `manifest.json` 的 `operations` 列表。

## 快速开始

### 在 Recut 中打开

1. 安装并启动 Recut（见主仓库 [README](../../README.md#安装-recut)）。
2. 在 **Apps** 中打开 **封面生成**。
3. 选择渠道与尺寸、参考图/参考封面，写下画面要求后选择模型并生成。

### 让 Agent 帮你做

在 Claude Code / OpenCode / Codex Cli 中对项目说：

> “用封面工坊生成一张封面。先读 `recut.project_context` 与 `cover.context`，确认渠道尺寸、参考图、参考封面和补充要求；按平台配置选择图片生成路径，最终以 Recut Media Asset 交付并调用 `cover.save` 保存历史。”

## 界面导览

- **顶部选择器**：渠道、尺寸、已配置图片模型。
- **左侧**：参考图与参考封面（走全局素材选择器）。
- **中央**：本次真实 Asset 预览。
- **底部**：可追溯生成历史。

![封面工坊界面](./assets/cover-maker.jpg)
<sub>按渠道尺寸组织参考图、参考封面和生成结果。</sub>

## 常见问题

**没有可用模型？** 在 AI 服务商设置中连接并配置一个图片模型，再回到本 App 选择后生成。

**Codex 生成如何交付？** Prompt 复制并回填右侧输入框，确认发送后按平台配置生成；最终图片需写入项目目录并经 `recut.media.import_image` 归档，取得 `assetId` 后才入历史。

**生成图带文字/水印？** 默认不含可读文字、Logo 或水印，为后续可控排版留白。

## 面向开发者

封面工坊是 `standalone` App，拥有稳定的私有工作区 scope。

```sh
# 链接本地开发
make app-link APP=apps/cover-studio
make dev

# 仅构建 UI
cd apps/cover-studio/ui && npm ci && npm run build
```

- 运行时入口：`ui/dist/index.html`（`ui/dist/` 不入库）。
- 契约：`manifest.json` · `background.js` · `AGENTS.md`。

[返回主 README](../../README.md) · [应用地图](../../README.md#应用地图)
