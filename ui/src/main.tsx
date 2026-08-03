/**
 * [INPUT]: 依赖宿主 SDK、Cover operation、已配置的图片模型与共享平台素材选择器
 * [OUTPUT]: 对外提供独立封面工作台的加载、编辑、全局素材多选/上传、模型直生、Codex 草稿回填、历史刷新与错误恢复流程
 * [POS]: ui/src 编排层；顺序读取 App SQLite，直接生成只经宿主提交到当前 workspace scope，Codex 路径只回填右侧输入框
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */
import { createRoot } from "react-dom/client";
import { useCallback, useEffect, useState } from "react";
import { type ReferenceKind } from "./asset-picker";
import { CoverComposer } from "./cover-composer";
import { CoverPreview } from "./cover-preview";
import { HistoryGrid } from "./history-grid";
import { recut } from "./recut-sdk";
import type { Channel, Cover, Draft, ImageModelConfiguration } from "./types";
import { MediaAssetEventsProvider, useMediaAssets } from "./use-media-asset-events";
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
type PendingGeneration = { assetID: string; prompt: string; draft: Draft };

function coverPrompt(channel: Channel, draft: Draft) {
  return [
    `为${channel.label}生成一张可直接投放的封面，画布严格为 ${channel.width} × ${channel.height} 像素。`,
    draft.brief ? `画面要求：${draft.brief}` : "画面要求：根据渠道规格制作有清晰视觉焦点的专业封面。",
    draft.referenceAssetIds.length ? "参考图用于约束主体、产品、人物或画面元素。" : "没有参考图，请自行建立与画面要求一致的主体。",
    draft.referenceCoverAssetIds.length ? "参考封面用于约束构图、版式留白与视觉语气。" : "请根据画面要求决定构图、版式留白与视觉语气。",
    "不要生成可读文字、数字、Logo 或水印；为后续可控标题排版保留明确留白。",
  ].join("\n");
}

function codexPrompt(prompt: string) {
  return `${prompt}\n\n请先调用 recut.project_context 和 recut.cover-studio.cover.context，确认当前平台图片生成方案与两类参考素材。按配置生成封面；若使用 Codex 原生图片生成，先将最终图片写入当前 Recut 项目目录，再调用 recut.media.import_image 归档。只有取得真实 assetId 后，调用 recut.cover-studio.cover.save 保存 prompt、渠道、尺寸、referenceAssetIds 和 referenceCoverAssetIds。不得只交付对话预览或伪造 assetId。`;
}

function App() {
  const { byID } = useMediaAssets();
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [covers, setCovers] = useState<Cover[]>([]);
  const [models, setModels] = useState<ImageModelConfiguration[]>([]);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [pending, setPending] = useState<PendingGeneration | null>(null);
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

  const loadModels = useCallback(async () => {
    try {
      const configuration = await recut.media.configuration() as ImageModelConfiguration[];
      const imageModels = configuration.filter((item) => item.model.id !== "codex/image");
      setModels(imageModels);
      setSelectedRoute((current) => imageModels.some((item) => item.id === current) ? current : imageModels[0]?.id ?? "");
    } catch { setModels([]); }
  }, []);

  useEffect(() => { const ready = () => { void refresh(); void loadModels(); }; window.addEventListener("recut-sdk-ready", ready); ready(); return () => window.removeEventListener("recut-sdk-ready", ready); }, [loadModels, refresh]);
  useEffect(() => recut.events.subscribe((event) => { const value = event as { type?: string; appId?: string; name?: string }; if (value.type === "app.capability.completed" && value.appId === "recut.cover-studio" && value.name === "cover.save") void refresh(); }), [refresh]);

  useEffect(() => {
    const asset = pending ? byID[pending.assetID] : undefined;
    if (!pending || !asset) return;
    if (asset.status === "failed") {
      setPending(null);
      setMessage("图片模型未能生成封面；请检查模型配置或换一个模型后重试。");
      return;
    }
    if (asset.status !== "completed") return;
    let active = true;
    void (async () => {
      setBusy(true);
      try {
        await recut.background.call("cover.save", { assetId: pending.assetID, prompt: pending.prompt, channel: pending.draft.channel, width: pending.draft.width, height: pending.draft.height, referenceAssetIds: pending.draft.referenceAssetIds, referenceCoverAssetIds: pending.draft.referenceCoverAssetIds });
        if (active) { setPending(null); setMessage("封面已生成并归档到素材库历史。"); await refresh(); }
      } catch (cause) { if (active) { setPending(null); setMessage(cause instanceof Error ? `封面已生成，但归档失败：${cause.message}` : "封面已生成，但归档失败。"); } } finally { if (active) setBusy(false); }
    })();
    return () => { active = false; };
  }, [byID, pending, refresh]);

  const updateReferences = (kind: ReferenceKind, ids: string[]) => setDraft((current) => kind === "image" ? { ...current, referenceAssetIds: ids } : { ...current, referenceCoverAssetIds: ids });
  const openReferences = async (kind: ReferenceKind) => {
    const selectedIDs = kind === "image" ? draft.referenceAssetIds : draft.referenceCoverAssetIds;
    try {
      const result = await recut.media.pick(["image"], { multiple: true, selectedIDs }) as { id: string }[] | null;
      if (result) updateReferences(kind, result.map((asset) => asset.id));
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "无法打开素材选择器。"); }
  };

  const generate = async () => {
    const model = models.find((item) => item.id === selectedRoute);
    const channel = channels.find((item) => item.id === draft.channel) ?? channels[0];
    if (!model) { setMessage("请先配置并选择一个图片模型。"); return; }
    const references = [...draft.referenceAssetIds, ...draft.referenceCoverAssetIds];
    if (references.length && !model.model.inputModes.includes("image")) { setMessage(`“${model.model.name}”不支持参考图；请选择支持参考图的模型，或先移除参考素材。`); return; }
    const prompt = coverPrompt(channel, draft);
    setBusy(true);
    try {
      await recut.background.call("cover.configure", draft);
      const job = await recut.media.generate({ prompt, modelID: model.model.id, credentialID: model.credentialID, referenceIDs: references }) as { assetIds?: string[] };
      const assetID = job.assetIds?.[0];
      if (!assetID) throw new Error("图片任务没有返回素材 ID");
      setPending({ assetID, prompt, draft: { ...draft, referenceAssetIds: [...draft.referenceAssetIds], referenceCoverAssetIds: [...draft.referenceCoverAssetIds] } });
      setMessage(`已提交给 ${model.model.name}，完成后会自动归档。`);
    } catch (cause) { setMessage(cause instanceof Error ? `无法生成封面：${cause.message}` : "无法发起生成。"); } finally { setBusy(false); }
  };

  const compose = async () => {
    const channel = channels.find((item) => item.id === draft.channel) ?? channels[0];
    const prompt = codexPrompt(coverPrompt(channel, draft));
    setBusy(true);
    try {
      await recut.background.call("cover.configure", draft);
      const copy = navigator.clipboard?.writeText(prompt) ?? Promise.reject(new Error("clipboard unavailable"));
      const [clipboard, composed] = await Promise.allSettled([copy, recut.agent.compose(prompt)]);
      if (composed.status === "rejected") throw composed.reason;
      setMessage(clipboard.status === "fulfilled" ? "Prompt 已复制并填入右侧 Codex 输入框；请检查后由你确认发送。" : "Prompt 已填入右侧 Codex 输入框；浏览器未允许自动复制，请在输入框中手动复制。");
    } catch (cause) { setMessage(cause instanceof Error ? `无法准备 Codex Prompt：${cause.message}` : "无法准备 Codex Prompt。"); } finally { setBusy(false); }
  };

  const channel = channels.find((item) => item.id === draft.channel) ?? channels[0];
  return <main className="min-h-screen bg-background p-4 sm:p-6"><div className="mx-auto max-w-[1600px]"><header className="mb-5 border-b border-border/80 pb-4"><p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-primary">RECUT APP / COVER STUDIO</p><h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">封面生成</h1><p className="mt-1 text-sm text-muted-foreground">选择已配置模型直接生成，或把 Prompt 交给右侧 Codex 继续创作。</p></header>{loading && !covers.length ? <div className="grid min-h-72 place-items-center rounded-lg border bg-card text-sm text-muted-foreground">正在读取封面创作台…</div> : <><div className="grid gap-5 xl:items-stretch xl:grid-cols-[27rem_minmax(0,1fr)]"><CoverComposer busy={busy || Boolean(pending)} channels={channels} draft={draft} models={models} onChange={setDraft} onCompose={() => void compose()} onConfigureModels={() => void recut.settings.open("multimodal")} onGenerate={() => void generate()} onModelChange={setSelectedRoute} onOpenReferences={(kind) => void openReferences(kind)} onRemoveReference={(kind, id) => updateReferences(kind, (kind === "image" ? draft.referenceAssetIds : draft.referenceCoverAssetIds).filter((item) => item !== id))} selectedModelID={selectedRoute} /><CoverPreview channel={channel} draft={draft} /></div><HistoryGrid covers={covers} /></>}<footer className="mt-4 flex items-center justify-between gap-4 text-xs text-muted-foreground"><p role="status">{message}</p><Button disabled={loading || busy || Boolean(pending)} onClick={() => { void refresh(); void loadModels(); }} type="button" variant="ghost">重新同步</Button></footer></div></main>;
}

createRoot(document.getElementById("root")!).render(<MediaAssetEventsProvider><App /></MediaAssetEventsProvider>);
