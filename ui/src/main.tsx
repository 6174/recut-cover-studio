/**
 * [INPUT]: 依赖 React、宿主 SDK、Cover operation 与共享 Asset SSE 缓存
 * [OUTPUT]: 对外提供独立封面工作台的加载、编辑、生成、历史刷新与错误恢复流程
 * [POS]: ui/src 编排层；顺序读取 App SQLite，避免并发 schema 初始化导致 database is locked
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */
import { createRoot } from "react-dom/client";
import { useCallback, useEffect, useState } from "react";
import { AssetPicker } from "./asset-picker";
import { CoverComposer } from "./cover-composer";
import { HistoryGrid } from "./history-grid";
import { recut } from "./recut-sdk";
import type { Channel, Cover, Draft, Template } from "./types";
import { MediaAssetEventsProvider } from "./use-media-asset-events";
import { Button } from "./ui";
import "./style.css";

const channels: Channel[] = [{ id: "小红书", label: "小红书", width: 1242, height: 1660 }, { id: "抖音", label: "抖音封面", width: 1080, height: 1920 }, { id: "B站", label: "B 站", width: 1146, height: 717 }, { id: "YouTube", label: "YouTube", width: 1280, height: 720 }];
const initialDraft: Draft = { channel: "小红书", width: 1242, height: 1660, templateId: "", referenceAssetIds: [], brief: "" };

function App() {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [covers, setCovers] = useState<Cover[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("正在连接封面工作台…");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // These calls deliberately stay serial: every operation lazily ensures the same SQLite schema.
      const context = await recut.state.query("cover.context") as Draft;
      const nextTemplates = await recut.state.query("template.list") as Template[];
      const nextCovers = await recut.state.query("cover.list") as Cover[];
      const compatible = channels.find((item) => item.id === context.channel && item.width === context.width && item.height === context.height) ?? channels[0];
      setDraft({ ...context, channel: compatible.id, width: compatible.width, height: compatible.height, templateId: nextTemplates.some((item) => item.id === context.templateId) ? context.templateId : nextTemplates[0]?.id ?? "" });
      setTemplates(nextTemplates);
      setCovers(nextCovers);
      setMessage("已同步模板、素材引用与历史封面。");
    } catch (cause) { setMessage(cause instanceof Error ? `无法读取创作台：${cause.message}` : "无法读取创作台。"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { window.addEventListener("recut-sdk-ready", refresh); void refresh(); return () => window.removeEventListener("recut-sdk-ready", refresh); }, [refresh]);
  useEffect(() => recut.events.subscribe((event) => { const value = event as { type?: string; appId?: string; name?: string }; if (value.type === "app.capability.completed" && value.appId === "recut.cover-studio" && value.name === "cover.save") void refresh(); }), [refresh]);

  const generate = async () => {
    setBusy(true);
    try {
      await recut.background.call("cover.configure", draft);
      await recut.agent.send("请生成这一张封面：先调用 recut.project_context、recut.cover-studio.cover.context 和 recut.cover-studio.template.list，按当前平台图片生成方案执行。无论底层使用 Media Platform 或 Codex 原生生成，最终都必须以 Recut Media Asset 交付：Media Platform 直接使用返回的 assetId；Codex 原生图先写入当前 Recut 项目目录，再调用 recut.media.import_image 归档并使用返回的 assetId。之后调用 recut.cover-studio.cover.save 保存完整提示词、渠道、尺寸、templateId 和 referenceAssetIds。不要伪造 assetId 或只交付对话图片；若归档失败，先修复归档路径。画面不要出现可读文字、Logo 或水印，并保留标题留白。");
      setMessage("已交给 Agent；生成图归档为 Asset 后会自动出现在历史中。");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "无法发起生成。"); } finally { setBusy(false); }
  };

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,oklch(0.99_0.012_151),transparent_34rem)] p-4 sm:p-6"><div className="mx-auto max-w-[1440px]"><header className="mb-5 border-b border-border/80 pb-4"><p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-primary">RECUT APP / COVER STUDIO</p><h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">封面生成</h1><p className="mt-1 text-sm text-muted-foreground">用渠道尺寸、视觉模板和素材库参考图构成可追溯的封面创作决策。</p></header>{loading && !templates.length ? <div className="grid min-h-72 place-items-center rounded-xl border bg-card text-sm text-muted-foreground">正在读取封面创作台…</div> : <><CoverComposer busy={busy} channels={channels} draft={draft} onChange={setDraft} onGenerate={() => void generate()} onOpenReferences={() => setPickerOpen(true)} onRemoveReference={(id) => setDraft((current) => ({ ...current, referenceAssetIds: current.referenceAssetIds.filter((item) => item !== id) }))} templates={templates} /><HistoryGrid covers={covers} /></>}<footer className="mt-4 flex items-center justify-between gap-4 text-xs text-muted-foreground"><p role="status">{message}</p><Button disabled={loading} onClick={() => void refresh()} type="button" variant="ghost">重新同步</Button></footer></div>{pickerOpen && <AssetPicker ids={draft.referenceAssetIds} onChange={(ids) => setDraft((current) => ({ ...current, referenceAssetIds: ids }))} onClose={() => setPickerOpen(false)} />}</main>;
}

createRoot(document.getElementById("root")!).render(<MediaAssetEventsProvider><App /></MediaAssetEventsProvider>);
