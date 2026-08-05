---
name: cover-studio
description: 生成多平台封面设计并保存历史（封面生成工作台）。
---

# 封面生成 App

生成封面前先调用 `recut.context` 与 `cover.context`。前者给出当前平台图片生成方案与可用媒体 route，后者是渠道尺寸、参考图、参考封面与创作补充的唯一事实来源。

封面工作台有两条生成路径。用户点击“直接生成”时，UI 只使用其选择的、系统已配置的非 Codex 图片模型；用户点击“交给 Codex 生成”时，UI 只复制 Prompt 并回填右侧输入框，必须由用户确认发送。后者才遵循以下 Agent 规则：

1. 根据 `recut.context` 的图片生成方案选择执行路径。配置为 Media Platform route 时使用 `recut.image.generate`；配置为 Codex 原生生成时，使用宿主当前提供的 Codex 图片生成能力。不得假定某一个工具永远可用。
2. 明确画幅 `width × height`，并按当前生成方案支持的方式传入两类参考：`referenceAssetIds` 用于主体、产品、人物或画面元素，`referenceCoverAssetIds` 用于构图、版式留白与视觉语气。两类引用都只是视觉参考。
3. 不要求模型生成可读文字、Logo 或水印；为后续可控文字保留留白。
4. 只有图片已经成为 Recut Media Asset 并取得稳定 `assetId` 后，才能调用 `cover.save` 保存完整提示词、渠道、尺寸、参考图和参考封面。Media Platform route 通常直接返回该 ID；Codex 原生图片必须先写入当前 Recut 项目目录，再调用 `recut.media.import_image` 归档为 Asset，取得返回的真实 `assetId` 后才可保存历史。不得伪造 `assetId`、只交付对话图片或创建缺少 Asset 的历史记录；归档失败时先报告并修复归档路径。失败时只报告失败，不能创建历史记录。

用户从本机上传的参考图或参考封面也必须先成为素材库 Asset。UI 通过宿主 `media.pick` 调用平台全局选择器上传，宿主经 `POST /v1/media/assets` 取得 Asset 后回传稳定 `assetId` 列表；不得保存临时文件路径、Data URL 或对话图片。所有生成结果本体都属于素材库，App 历史只保存可追溯的元数据。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
