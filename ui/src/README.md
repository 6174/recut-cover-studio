# src/

> L2 | 父级: /ui/README.md

成员清单
main.tsx: 工作台编排层；串行读取创作上下文、模板和历史，保存选择并将 Asset 交付要求发送给 Agent。
cover-composer.tsx: 左侧渠道、模板、参考图与补充要求输入表单。
cover-preview.tsx: 右侧本次真实生成的 Asset 预览；没有 Asset 时只显示空状态，绝不伪造封面。
asset-picker.tsx: 基于素材缓存的图片多选弹窗与引用条；只维护 assetId。
history-grid.tsx: 已归档封面历史；直接打开素材库 Asset 内容。
use-media-asset-events.tsx: iframe 内唯一图片 Asset SSE 缓存。
recut-sdk.ts: Host MessageChannel 的 operation、Agent 与项目事件通信边界。
types.ts: App operation 返回值的领域类型。
ui.tsx: 无业务的卡片与按钮原子。
style.css: 与 Vox B-roll 同构的 Tailwind token 和基础样式。
css.d.ts: CSS 模块声明。

依赖关系

`main.tsx` 聚合业务状态；表单、素材选择器和历史网格只接收数据与回调。任何 App 数据访问经过 `recut-sdk.ts`，任何 Asset 状态访问经过 `use-media-asset-events.tsx`。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
