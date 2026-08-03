# src/

> L2 | 父级: /ui/README.md

成员清单
main.tsx: 工作台编排层；串行读取创作上下文/已连接 Provider 图片模型/历史，通过宿主全局素材选择器多选参考素材，直接生成后仅在真实 Asset 完成时归档，Codex 路径只复制并回填 Prompt。
cover-composer.tsx: 左侧渠道、图片模型、参考图、参考封面与补充要求输入表单；渠道和模型均使用 App 内置列表选择器，并提供直接/Codex 两条生成入口。
cover-preview.tsx: 右侧本次真实生成的 Asset 预览；没有 Asset 时只显示空状态，绝不伪造封面。
asset-picker.tsx: 两类已选图片的紧凑引用条；选择、上传和详情由宿主全局素材选择器负责。
history-grid.tsx: 已归档封面历史；直接打开素材库 Asset 内容。
use-media-asset-events.tsx: iframe 内唯一图片 Asset SSE 缓存。
recut-sdk.ts: Host MessageChannel 的 operation、媒体配置/直生、Agent 草稿回填、设置定位与项目事件通信边界。
types.ts: App operation 与媒体配置返回值的领域类型。
ui.tsx: 无业务的卡片与按钮原子。
style.css: 与 Vox B-roll 同构的 Tailwind token 和基础样式。
css.d.ts: CSS 模块声明。

依赖关系

`main.tsx` 聚合业务状态；表单、已选素材引用条和历史网格只接收数据与回调。图片模型与直接生成均经 `recut-sdk.ts` 请求宿主：宿主将所有已连接 Provider 的可用图片模型与凭据配对，再将选定任务绑定到当前 workspace scope；参考图/参考封面通过 `media.pick` 请求全局选择器，App 只接收稳定 Asset ID 列表。直接生成的 queued Asset 由 `use-media-asset-events.tsx` 观察，完成后才允许 `cover.save`；Codex 路径只回填右侧输入，不自动创建 turn。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
