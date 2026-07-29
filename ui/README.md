# ui/

> L2 | 父级: /README.md

成员清单
package.json: Node 20.19+、Vite、React、Tailwind 与图标依赖及 dev/build/preview 脚本的独立构建配置。
vite.config.ts: Vite 构建配置；以相对资源路径输出给 Recut App Host。
index.html: React 挂载入口；构建后由 `dist/index.html` 替代为运行时入口。
src/: Cover Studio 的 SDK、素材缓存、创作表单、参考图选择器和历史网格；成员细节见 `src/README.md`。
dist/: 已提交的发布构建产物；`manifest.json` 的 standaloneView 指向此目录，修改 UI 后必须由 `npm run build` 更新。

依赖关系

`main.tsx -> recut-sdk.ts -> Host MessageChannel` 负责 App operation 与 Agent 请求；`use-media-asset-events.tsx -> /v1/media/events` 维护图片素材缓存。首次读取 operation 固定串行执行，避免多个 lazy schema 初始化竞争同一个 SQLite 写锁。

[PROTOCOL]: 变更时更新此头部，然后检查 README.md
