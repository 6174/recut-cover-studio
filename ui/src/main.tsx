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
import { interpolate, t, type Locale } from "./i18n";
import { recut, useRecutLocale } from "./recut-sdk";
import type { Channel, Cover, Draft, ImageModelConfiguration } from "./types";
import { MediaAssetEventsProvider, useMediaAssets } from "./use-media-asset-events";
import { Button } from "./ui";
import "./style.css";

const channels: Channel[] = [
  { id: "xiaohongshu-note", labelKey: "channel.xiaohongshu-note", width: 1242, height: 1660, group: "domestic" },
  { id: "douyin-vertical", labelKey: "channel.douyin-vertical", width: 1080, height: 1920, group: "domestic" },
  { id: "douyin-horizontal", labelKey: "channel.douyin-horizontal", width: 1920, height: 1080, group: "domestic" },
  { id: "wechat-channels-vertical", labelKey: "channel.wechat-channels-vertical", width: 1080, height: 1260, group: "domestic" },
  { id: "wechat-channels-horizontal", labelKey: "channel.wechat-channels-horizontal", width: 1920, height: 1080, group: "domestic" },
  { id: "kuaishou-vertical", labelKey: "channel.kuaishou-vertical", width: 1080, height: 1920, group: "domestic" },
  { id: "bilibili-video", labelKey: "channel.bilibili-video", width: 1146, height: 717, group: "domestic" },
  { id: "wechat-article", labelKey: "channel.wechat-article", width: 900, height: 383, group: "domestic" },
  { id: "weibo-video", labelKey: "channel.weibo-video", width: 1920, height: 1080, group: "domestic" },
  { id: "youtube-thumbnail", labelKey: "channel.youtube-thumbnail", width: 1280, height: 720, group: "overseas" },
  { id: "tiktok-vertical", labelKey: "channel.tiktok-vertical", width: 1080, height: 1920, group: "overseas" },
  { id: "instagram-feed", labelKey: "channel.instagram-feed", width: 1080, height: 1350, group: "overseas" },
  { id: "instagram-reel", labelKey: "channel.instagram-reel", width: 1080, height: 1920, group: "overseas" },
  { id: "linkedin-post", labelKey: "channel.linkedin-post", width: 1200, height: 627, group: "overseas" },
  { id: "x-post", labelKey: "channel.x-post", width: 1600, height: 900, group: "overseas" },
  { id: "pinterest-pin", labelKey: "channel.pinterest-pin", width: 1000, height: 1500, group: "overseas" },
];

const initialDraft: Draft = { channel: "xiaohongshu-note", width: 1242, height: 1660, referenceAssetIds: [], referenceCoverAssetIds: [], brief: "", previewAssetId: "" };
type PendingGeneration = { assetID: string; prompt: string; draft: Draft };

function coverPrompt(channel: Channel, draft: Draft, locale: Locale) {
  return [
    interpolate(t(locale, "prompt.channel"), { channel: t(locale, channel.labelKey), width: channel.width, height: channel.height }),
    draft.brief ? interpolate(t(locale, "prompt.brief"), { brief: draft.brief }) : t(locale, "prompt.brief-fallback"),
    draft.referenceAssetIds.length ? t(locale, "prompt.reference-image") : t(locale, "prompt.reference-image-empty"),
    draft.referenceCoverAssetIds.length ? t(locale, "prompt.reference-cover") : t(locale, "prompt.reference-cover-empty"),
    t(locale, "prompt.no-text"),
  ].join("\n");
}

function codexPrompt(prompt: string, locale: Locale) {
  return `${prompt}\n\n${t(locale, "prompt.codex-instructions")}`;
}

function App() {
  const locale = useRecutLocale();
  const { byID } = useMediaAssets();
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [covers, setCovers] = useState<Cover[]>([]);
  const [models, setModels] = useState<ImageModelConfiguration[]>([]);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [pending, setPending] = useState<PendingGeneration | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(t(locale, "status.connecting"));

  useEffect(() => { document.documentElement.lang = locale === "zh" ? "zh-CN" : "en"; }, [locale]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // These calls deliberately stay serial: every operation lazily ensures the same SQLite schema.
      const context = await recut.state.query("cover.context") as Draft;
      const nextCovers = await recut.state.query("cover.list") as Cover[];
      const compatible = channels.find((item) => item.id === context.channel && item.width === context.width && item.height === context.height) ?? channels[0];
      setDraft({ ...initialDraft, ...context, channel: compatible.id, width: compatible.width, height: compatible.height, referenceAssetIds: context.referenceAssetIds ?? [], referenceCoverAssetIds: context.referenceCoverAssetIds ?? [] });
      setCovers(nextCovers);
      setMessage(t(locale, "status.synced"));
    } catch (cause) { setMessage(cause instanceof Error ? interpolate(t(locale, "status.read-failed-detail"), { error: cause.message }) : t(locale, "status.read-failed")); } finally { setLoading(false); }
  }, [locale]);

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
      setMessage(t(locale, "status.model-failed"));
      return;
    }
    if (asset.status !== "completed") return;
    let active = true;
    void (async () => {
      setBusy(true);
      try {
        await recut.background.call("cover.save", { assetId: pending.assetID, prompt: pending.prompt, channel: pending.draft.channel, width: pending.draft.width, height: pending.draft.height, referenceAssetIds: pending.draft.referenceAssetIds, referenceCoverAssetIds: pending.draft.referenceCoverAssetIds });
        if (active) { setPending(null); setMessage(t(locale, "status.saved")); await refresh(); }
      } catch (cause) { if (active) { setPending(null); setMessage(cause instanceof Error ? interpolate(t(locale, "status.save-failed-detail"), { error: cause.message }) : t(locale, "status.save-failed")); } } finally { if (active) setBusy(false); }
    })();
    return () => { active = false; };
  }, [byID, locale, pending, refresh]);

  const updateReferences = (kind: ReferenceKind, ids: string[]) => setDraft((current) => kind === "image" ? { ...current, referenceAssetIds: ids } : { ...current, referenceCoverAssetIds: ids });
  const openReferences = async (kind: ReferenceKind) => {
    const selectedIDs = kind === "image" ? draft.referenceAssetIds : draft.referenceCoverAssetIds;
    try {
      const result = await recut.media.pick(["image"], { multiple: true, selectedIDs }) as { id: string }[] | null;
      if (result) updateReferences(kind, result.map((asset) => asset.id));
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : t(locale, "status.pick-failed")); }
  };

  const generate = async () => {
    const model = models.find((item) => item.id === selectedRoute);
    const channel = channels.find((item) => item.id === draft.channel) ?? channels[0];
    if (!model) { setMessage(t(locale, "status.no-model")); return; }
    const references = [...draft.referenceAssetIds, ...draft.referenceCoverAssetIds];
    if (references.length && !model.model.inputModes.includes("image")) { setMessage(interpolate(t(locale, "status.model-no-reference"), { model: model.model.name })); return; }
    const prompt = coverPrompt(channel, draft, locale);
    setBusy(true);
    try {
      await recut.background.call("cover.configure", draft);
      const job = await recut.media.generate({ prompt, modelID: model.model.id, credentialID: model.credentialID, referenceIDs: references }) as { assetIds?: string[] };
      const assetID = job.assetIds?.[0];
      if (!assetID) throw new Error(t(locale, "status.no-asset-id"));
      setPending({ assetID, prompt, draft: { ...draft, referenceAssetIds: [...draft.referenceAssetIds], referenceCoverAssetIds: [...draft.referenceCoverAssetIds] } });
      setMessage(interpolate(t(locale, "status.submitted"), { model: model.model.name }));
    } catch (cause) { setMessage(cause instanceof Error ? interpolate(t(locale, "status.generate-failed-detail"), { error: cause.message }) : t(locale, "status.generate-failed")); } finally { setBusy(false); }
  };

  const compose = async () => {
    const channel = channels.find((item) => item.id === draft.channel) ?? channels[0];
    const prompt = codexPrompt(coverPrompt(channel, draft, locale), locale);
    setBusy(true);
    try {
      await recut.background.call("cover.configure", draft);
      const copy = navigator.clipboard?.writeText(prompt) ?? Promise.reject(new Error("clipboard unavailable"));
      const [clipboard, composed] = await Promise.allSettled([copy, recut.agent.compose(prompt)]);
      if (composed.status === "rejected") throw composed.reason;
      setMessage(clipboard.status === "fulfilled" ? t(locale, "status.codex-copied") : t(locale, "status.codex-no-copy"));
    } catch (cause) { setMessage(cause instanceof Error ? interpolate(t(locale, "status.codex-failed-detail"), { error: cause.message }) : t(locale, "status.codex-failed")); } finally { setBusy(false); }
  };

  const channel = channels.find((item) => item.id === draft.channel) ?? channels[0];
  return <main className="min-h-screen bg-background p-4 sm:p-6"><div className="mx-auto max-w-[1600px]"><header className="mb-5 border-b border-border/80 pb-4"><p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-primary">{t(locale, "app.kicker")}</p><h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">{t(locale, "app.name")}</h1><p className="mt-1 text-sm text-muted-foreground">{t(locale, "app.subtitle")}</p></header>{loading && !covers.length ? <div className="grid min-h-72 place-items-center rounded-lg border bg-card text-sm text-muted-foreground">{t(locale, "status.reading")}</div> : <><div className="grid gap-5 xl:items-stretch xl:grid-cols-[27rem_minmax(0,1fr)]"><CoverComposer busy={busy || Boolean(pending)} channels={channels} draft={draft} models={models} onChange={setDraft} onCompose={() => void compose()} onConfigureModels={() => void recut.settings.open("multimodal")} onGenerate={() => void generate()} onModelChange={setSelectedRoute} onOpenReferences={(kind) => void openReferences(kind)} onRemoveReference={(kind, id) => updateReferences(kind, (kind === "image" ? draft.referenceAssetIds : draft.referenceCoverAssetIds).filter((item) => item !== id))} selectedModelID={selectedRoute} /><CoverPreview channel={channel} draft={draft} /></div><HistoryGrid covers={covers} /></>}<footer className="mt-4 flex items-center justify-between gap-4 text-xs text-muted-foreground"><p role="status">{message}</p><Button disabled={loading || busy || Boolean(pending)} onClick={() => { void refresh(); void loadModels(); }} type="button" variant="ghost">{t(locale, "app.resync")}</Button></footer></div></main>;
}

createRoot(document.getElementById("root")!).render(<MediaAssetEventsProvider><App /></MediaAssetEventsProvider>);
