/**
 * [INPUT]: 依赖宿主注入的 MessageChannel 与独立 App workspace scope
 * [OUTPUT]: 对外提供 background operation、Agent 草稿回填、媒体配置/直生、设置定位、平台素材单选/多选与项目事件订阅的 iframe SDK
 * [POS]: ui/src 的宿主通信边界；业务组件不访问 SQLite、媒体 HTTP、终端或 Agent HTTP API
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */
type RequestType = "state.query" | "background.call" | "agent.compose" | "media.configuration" | "media.generate" | "media.pick" | "settings.open";
type Request = { id: string; type: RequestType; input: Record<string, unknown> };
let port: MessagePort | null = null;
let sequence = 0;
const pending = new Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>();

function requestID() { sequence += 1; return `cover-${Date.now().toString(36)}-${sequence}`; }

window.addEventListener("message", (event) => {
  if (event.data?.type === "recut.project.event") {
    window.dispatchEvent(new CustomEvent("recut-project-event", { detail: event.data.event }));
    return;
  }
  if (event.data?.type !== "recut.ui.connect" || !event.ports[0]) return;
  port = event.ports[0];
  port.onmessage = (message) => {
    const request = pending.get(message.data?.id);
    if (!request) return;
    pending.delete(message.data.id);
    message.data.error ? request.reject(new Error(message.data.error)) : request.resolve(message.data.result);
  };
  port.start();
  window.dispatchEvent(new Event("recut-sdk-ready"));
});

function call(type: RequestType, input: Record<string, unknown>) {
  return new Promise<any>((resolve, reject) => {
    if (!port) return reject(new Error("Recut Host 尚未连接"));
    const id = requestID();
    pending.set(id, { resolve, reject });
    port.postMessage({ id, type, input } satisfies Request);
  });
}

export const recut = {
  state: { query: (name: string) => call("state.query", { name }) },
  background: { call: (name: string, input: Record<string, unknown> = {}) => call("background.call", { name, ...input }) },
  agent: { compose: (prompt: string) => call("agent.compose", { prompt }) },
  media: {
    configuration: () => call("media.configuration", {}),
    generate: (input: { prompt: string; modelID: string; credentialID: string; referenceIDs: string[] }) => call("media.generate", input),
    pick: (kinds: string[], options: { multiple?: boolean; selectedIDs?: string[] } = {}) => call("media.pick", { kinds, ...options }),
  },
  settings: { open: (section: "multimodal") => call("settings.open", { section }) },
  events: { subscribe: (listener: (event: unknown) => void) => {
    const receive = (event: Event) => listener((event as CustomEvent<unknown>).detail);
    window.addEventListener("recut-project-event", receive);
    return () => window.removeEventListener("recut-project-event", receive);
  } },
};
