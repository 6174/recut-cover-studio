/**
 * [INPUT]: 依赖宿主 SDK、Cover operation、Media Asset 上传接口与共享 Asset SSE 缓存
 * [OUTPUT]: 对外提供独立封面工作台的加载、编辑、上传、生成、历史刷新与错误恢复流程
 * [POS]: ui/src 编排层；顺序读取 App SQLite，避免并发 schema 初始化导致 database is locked
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */
import { createRoot } from "react-dom/client";
import { useCallback, useEffect, useState } from "react";
import { AssetPicker, type ReferenceKind } from "./asset-picker";
import { CoverComposer } from "./cover-composer";
import { CoverPreview } from "./cover-preview";
import { HistoryGrid } from "./history-grid";
import { recut } from "./recut-sdk";
import type { Channel, Cover, Draft } from "./types";
import { MediaAssetEventsProvider } from "./use-media-asset-events";
import { Button } from "./ui";
import "./style.css";

const channels: Channel[] = [
  { id: "xiaohongshu-note", label: "小红书图文", width: 1242, height: 1660, group: "国内渠道" },
  { id: "douyin-vertical", label: "抖音竖版封面", width: 1080, height: 1920, group: "国内渠道" },
  { id: "douyin-horizontal", label: "抖音横版封面", width: 1920, height: 1080, group: "国内渠道" },
  { id: "wechat-channels-vertical", label: "微信视频号竖版", width: 1080, height: 1260, group: "国内渠道" },
  { id: "wechat-channels-horizontal", label: "微信视频号横版", width: 1920, height: 1080, group: "国内渠道" },
  { id: "kuaishou-vertical", label: "快手竖版封面", width: 1080, height: 1920, group: "国内渠道" },
  { id: "bilibili-video", label: "B 站视频封面", width: 1146, height: 717, group: "国内渠道" },
  { id: "wechat-article", label: "公众号首图", width: 900, height: 383, group: "国内渠道" },
  { id: "weibo-video", label: "微博视频封面", width: 1920, height: 1080, group: "国内渠道" },
  { id: "youtube-thumbnail", label: "YouTube Thumbnail", width: 1280, height: 720, group: "海外渠道" },
  { id: "tiktok-vertical", label: "TikTok", width: 1080, height: 1920, group: "海外渠道" },
  { id: "instagram-feed", label: "Instagram Feed", width: 1080, height: 1350, group: "海外渠道" },
  { id: "instagram-reel", label: "Instagram Reel", width: 1080, height: 1920, group: "海外渠道" },
  { id: "linkedin-post", label: "LinkedIn Post", width: 1200, height: 627, group: "海外渠道" },
  { id: "x-post", label: "X Post", width: 1600, height: 900, group: "海外渠道" },
  { id: "pinterest-pin", label: "Pinterest Pin", width: 1000, height: 1500, group: "海外渠道" },
];

const initialDraft: Draft = { channel: "xiaohongshu-note", width: 1242, height: 1660, referenceAssetIds: [], referenceCoverAssetIds: [], brief: "", previewAssetId: "" };

function App() {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [covers, setCovers] = useState<Cover[]>([]);
  const [pickerKind, setPickerKind] = useState<ReferenceKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("正在连接封面工作台…");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // These calls deliberately stay serial: every operation lazily ensures the same SQLite schema.
      const context = await recut.state.query("cover.context") as Draft;
      const nextCovers = await recut.state.query("cover.list") as Cover[];
      const compatible = channels.find((item) => item.id === context.channel && item.width === context.width && item.height === context.height) ?? channels[0];
      setDraft({ ...initialDraft, ...context, channel: compatible.id, width: compatible.width, height: compatible.height, referenceAssetIds: context.referenceAssetIds ?? [], referenceCoverAssetIds: context.referenceCoverAssetIds ?? [] });
      setCovers(nextCovers);
      setMessage("已同步渠道、素材引用与历史封面。");
    } catch (cause) { setMessage(cause instanceof Error ? `无法读取创作台：${cause.message}` : "无法读取创作台。"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { window.addEventListener("recut-sdk-ready", refresh); void refresh(); return () => window.removeEventListener("recut-sdk-ready", refresh); }, [refresh]);
  useEffect(() => recut.events.subscribe((event) => { const value = event as { type?: string; appId?: string; name?: string }; if (value.type === "app.capability.completed" && value.appId === "recut.cover-studio" && value.name === "cover.save") void refresh(); }), [refresh]);

  const updateReferences = (kind: ReferenceKind, ids: string[]) => setDraft((current) => kind === "image" ? { ...current, referenceAssetIds: ids } : { ...current, referenceCoverAssetIds: ids });

  const uploadReference = async (kind: ReferenceKind, file: File) => {
    if (!file.type.startsWith("image/")) throw new Error("只能上传图片作为参考素材。");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/v1/media/assets", { method: "POST", body: form });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(body?.error ?? `“${file.name}”上传失败，请重试。`);
    }
    const asset = await response.json() as { id?: string };
    if (!asset.id) throw new Error("上传完成但未收到素材库 Asset ID。");
    setDraft((current) => kind === "image"
      ? { ...current, referenceAssetIds: [...new Set([...current.referenceAssetIds, asset.id!])] }
      : { ...current, referenceCoverAssetIds: [...new Set([...current.referenceCoverAssetIds, asset.id!])] });
  };

  const generate = async () => {
    setBusy(true);
    try {
      await recut.background.call("cover.configure", draft);
      await recut.agent.send("请生成这一张封面：先调用 recut.project_context 和 recut.cover-studio.cover.context，按当前平台图片生成方案执行。参考图用于约束主体、产品、人物或画面元素；参考封面用于约束构图、版式留白与视觉语气。无论底层使用 Media Platform 或 Codex 原生生成，最终都必须以 Recut Media Asset 交付：Media Platform 直接使用返回的 assetId；Codex 原生图先写入当前 Recut 项目目录，再调用 recut.media.import_image 归档并使用返回的 assetId。之后调用 recut.cover-studio.cover.save 保存完整提示词、渠道、尺寸、referenceAssetIds 和 referenceCoverAssetIds。不要伪造 assetId 或只交付对话图片；若归档失败，先修复归档路径。画面不要出现可读文字、Logo 或水印，并保留标题留白。");
      setMessage("已交给 Agent；生成图归档为 Asset 后会自动出现在历史中。");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "无法发起生成。"); } finally { setBusy(false); }
  };

  const channel = channels.find((item) => item.id === draft.channel) ?? channels[0];
  const pickerIDs = pickerKind === "image" ? draft.referenceAssetIds : draft.referenceCoverAssetIds;
  return <main className="min-h-screen bg-background p-4 sm:p-6"><div className="mx-auto max-w-[1600px]"><header className="mb-5 border-b border-border/80 pb-4"><p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-primary">RECUT APP / COVER STUDIO</p><h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">封面生成</h1><p className="mt-1 text-sm text-muted-foreground">左侧填写生成意图；右侧只展示本次已经归档的真实封面。</p></header>{loading && !covers.length ? <div className="grid min-h-72 place-items-center rounded-lg border bg-card text-sm text-muted-foreground">正在读取封面创作台…</div> : <><div className="grid gap-5 xl:items-stretch xl:grid-cols-[27rem_minmax(0,1fr)]"><CoverComposer busy={busy} channels={channels} draft={draft} onChange={setDraft} onGenerate={() => void generate()} onOpenReferences={setPickerKind} onRemoveReference={(kind, id) => updateReferences(kind, (kind === "image" ? draft.referenceAssetIds : draft.referenceCoverAssetIds).filter((item) => item !== id))} /><CoverPreview channel={channel} draft={draft} /></div><HistoryGrid covers={covers} /></>}<footer className="mt-4 flex items-center justify-between gap-4 text-xs text-muted-foreground"><p role="status">{message}</p><Button disabled={loading} onClick={() => void refresh()} type="button" variant="ghost">重新同步</Button></footer></div>{pickerKind && <AssetPicker ids={pickerIDs} kind={pickerKind} onChange={(ids) => updateReferences(pickerKind, ids)} onClose={() => setPickerKind(null)} onUpload={(file) => uploadReference(pickerKind, file)} />}</main>;
}

createRoot(document.getElementById("root")!).render(<MediaAssetEventsProvider><App /></MediaAssetEventsProvider>);
