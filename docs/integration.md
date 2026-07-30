# Recut 集成契约

Cover Studio 遵循 Recut App Host 的标准 manifest、operation、SQLite 和 Media Asset 协议。它不自建图片生成服务，也不复制素材文件；图片生成的实际执行路径始终由当前平台配置决定。

## 运行时形态

`manifest.json` 声明：

```json
{
  "type": "standalone",
  "background": "background.js",
  "ui": { "standaloneView": "ui/dist/index.html" },
  "permissions": ["sqlite"]
}
```

`standalone` 让宿主为应用提供稳定私有 scope。该 scope 拥有 SQLite 与 Agent 会话，却不出现在用户项目列表，也不会要求项目名称。

## 单向数据流

```text
用户选择
  → cover.configure
  → cover.context
  → Agent 读取 recut.project_context、模板与上下文
  → 根据平台配置选择图片生成方案
      ├─ Media Platform route → recut.image.generate
      └─ Codex 原生方案 → 宿主提供的图片生成能力
  → Media Asset assetId
  → cover.save（写入历史并更新当前真实预览 Asset）
  → cover.list
```

`recut.project_context.media.defaultRoutes` 是当前 Media Platform route 的事实来源。若当前平台选择 Codex 原生图片生成，Agent 应使用宿主提供的对应能力，而不是强行调用 `recut.image.generate`；随后必须把最终图片写入当前 Recut 项目目录，并调用 `recut.media.import_image`。这个平台工具会验证相对路径、符号链接、文件类型和大小，自动关联当前 scope，并返回唯一可保存的真实 `assetId`。不得伪造 Asset、只交付对话预览或创建缺少 Asset 的历史；失败的设想或文本不得写入历史。

## App operations

| Operation | Surface | 责任 |
| --- | --- | --- |
| `cover.context` | API, MCP | 读取当前渠道、尺寸、模板、参考图、补充要求和 `previewAssetId`；生成前的唯一事实来源。 |
| `cover.configure` | API | 保存 UI 当前选择；不生成图片。 |
| `template.list` | API, MCP | 返回内置模板和用户保存模板。 |
| `template.save` | API, MCP | 保存提示词与 Asset 引用组成的可复用模板；不复制媒体。 |
| `cover.list` | API | 按创建时间倒序返回历史元数据。 |
| `cover.save` | MCP | 在图片生成成功后保存完整元数据，并把该真实 Asset 更新为当前预览。 |

所有 operation 的输入 schema 以 `manifest.json` 为准。不要在文档中复制第二份 schema；变更 schema 时先更新 manifest，再同步本表的责任描述。

## Asset 规则

- 参考图只以 `referenceAssetIds` 保存，并按当前图片生成方案支持的参考图输入方式传入；Media Platform route 使用 `imageAssetIds`。
- 生成结果只以 `assetId` 保存。Media Platform 是图片内容、状态和文件路径的唯一真相源；Codex 原生图也必须经过 `recut.media.import_image` 成为该 Asset，不能以对话结果或本地路径替代。
- 历史数据可以删除或重做，但绝不删除素材库中的 Asset。
- 图片生成提示词应明确尺寸，禁止要求模型生成可读文字、Logo 或水印。

## 数据库

`background.js` 懒创建以下表：

| 表 | 责任 |
| --- | --- |
| `cover_meta` | 当前 UI 创作选择与 `previewAssetId`；键 `draft` 保存 JSON。 |
| `cover_templates` | 用户保存的模板。 |
| `cover_history` | 已成功生成封面的可追溯记录。 |

表是 App 私有实现，不构成跨 App API。外部消费者只能通过 operation 访问它们。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
