# 封面生成 App

生成封面前先调用 `cover.context`。它是当前渠道尺寸、模板、参考图与创作补充的唯一事实来源。

使用 `recut.image.generate` 生成图片时：

1. 复用已选模板提示词，并明确画幅 `width × height`。
2. 将 `referenceAssetIds` 传给 `imageAssetIds`，只把它们当作视觉参考。
3. 不要求模型生成可读文字、Logo 或水印；为后续可控文字保留留白。
4. 成功取得 `assetIds[0]` 后，立即调用 `cover.save` 保存图片的 `assetId`、完整提示词、渠道、尺寸、模板和参考图。失败时只报告失败，不能创建历史记录。

模板是“参考图 + 提示词”的可复用配方。用户要沉淀模板时调用 `template.save`；不复制媒体文件，只保存稳定的 Asset 引用。所有生成结果本体都属于素材库，App 历史只保存可追溯的元数据。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
