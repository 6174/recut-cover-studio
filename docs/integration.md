# Recut 集成契约

Cover Studio 遵循 Recut App Host 的标准 manifest、operation、SQLite 和 Media Asset 协议。它不自建图片生成服务，也不复制素材文件。

## 运行时形态

`manifest.json` 声明：

```json
{
  "type": "standalone",
  "background": "background.js",
  "ui": { "standaloneView": "ui/index.html" },
  "permissions": ["sqlite"]
}
```

`standalone` 让宿主为应用提供稳定私有 scope。该 scope 拥有 SQLite 与 Agent 会话，却不出现在用户项目列表，也不会要求项目名称。

## 单向数据流

```text
用户选择
  → cover.configure
  → cover.context
  → Agent 读取模板与上下文
  → recut.image.generate
  → Media Asset assetId
  → cover.save
  → cover.list
```

只有 `recut.image.generate` 成功返回 `assetIds[0]` 后，Agent 才能调用 `cover.save`。失败的设想或文本不得写入历史。

## App operations

| Operation | Surface | 责任 |
| --- | --- | --- |
| `cover.context` | API, MCP | 读取当前渠道、尺寸、模板、参考图和补充要求；生成前的唯一事实来源。 |
| `cover.configure` | API | 保存 UI 当前选择；不生成图片。 |
| `template.list` | API, MCP | 返回内置模板和用户保存模板。 |
| `template.save` | API, MCP | 保存提示词与 Asset 引用组成的可复用模板；不复制媒体。 |
| `cover.list` | API | 按创建时间倒序返回历史元数据。 |
| `cover.save` | MCP | 在图片生成成功后保存完整元数据。 |

所有 operation 的输入 schema 以 `manifest.json` 为准。不要在文档中复制第二份 schema；变更 schema 时先更新 manifest，再同步本表的责任描述。

## Asset 规则

- 参考图只以 `referenceAssetIds` 保存，并在生成时传为 `imageAssetIds`。
- 生成结果只以 `assetId` 保存。Media Platform 是图片内容、状态和文件路径的唯一真相源。
- 历史数据可以删除或重做，但绝不删除素材库中的 Asset。
- 图片生成提示词应明确尺寸，禁止要求模型生成可读文字、Logo 或水印。

## 数据库

`background.js` 懒创建以下表：

| 表 | 责任 |
| --- | --- |
| `cover_meta` | 当前 UI 创作选择；键 `draft` 保存 JSON。 |
| `cover_templates` | 用户保存的模板。 |
| `cover_history` | 已成功生成封面的可追溯记录。 |

表是 App 私有实现，不构成跨 App API。外部消费者只能通过 operation 访问它们。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
