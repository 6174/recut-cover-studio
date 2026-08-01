/**
 * [INPUT]: 依赖当前 Draft、模板与 Media Asset 内容 URL
 * [OUTPUT]: 对外提供当前一次生成的真实封面预览与交付元信息
 * [POS]: Cover Studio 的输出区；只渲染 cover.save 确认后的 Asset，不制造视觉占位图
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */
import { ExternalLink, Image as ImageIcon } from "lucide-react";
import type { Channel, Draft, Template } from "./types";
import { imageURL } from "./use-media-asset-events";
import { Button, Card } from "./ui";

export function CoverPreview({ channel, draft, template }: { channel: Channel; draft: Draft; template?: Template }) {
  const assetID = draft.previewAssetId?.trim();
  const openAsset = () => { if (assetID) window.open(imageURL(assetID), "_blank", "noopener"); };
  return <Card className="flex h-full min-h-[38rem] flex-col overflow-hidden"><header className="flex items-center justify-between border-b px-5 py-4"><div><p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-primary">OUTPUT</p><h2 className="mt-1 text-sm font-semibold">本次真实生成</h2></div><span className={`rounded-md px-2 py-1 font-mono text-[10px] ${assetID ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{assetID ? "ASSET READY" : "EMPTY"}</span></header><div className="flex min-h-0 flex-1 items-center justify-center bg-muted/30 p-5 sm:p-7">{assetID ? <button aria-label="在新窗口打开原始封面" className="group relative max-h-[42rem] max-w-full overflow-hidden rounded-lg border bg-background shadow-sm" onClick={openAsset} style={{ aspectRatio: `${channel.width} / ${channel.height}` }} type="button"><img alt={`本次生成的 ${channel.label} 封面`} className="max-h-[42rem] max-w-full object-contain" src={imageURL(assetID)} /><span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100"><ExternalLink className="size-3" />查看原图</span></button> : <div className="grid max-w-sm place-items-center px-6 py-16 text-center"><span className="grid size-12 place-items-center rounded-xl border bg-card text-muted-foreground"><ImageIcon className="size-5" /></span><h3 className="mt-4 text-sm font-semibold">等待本次生成</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">填写左侧表单后发起生成。只有成功归档的 Asset 会显示在这里，不会使用假预览。</p></div>}</div><footer className="border-t px-5 py-4"><dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4"><Meta label="渠道" value={channel.label} /><Meta label="尺寸" value={`${channel.width} × ${channel.height}`} /><Meta label="模板" value={template?.name ?? "未选择"} /><Meta label="参考图" value={`${draft.referenceAssetIds.length} 张`} /></dl>{assetID && <div className="mt-4 flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2"><span className="min-w-0 truncate font-mono text-[10px] text-muted-foreground">{assetID}</span><Button onClick={openAsset} type="button" variant="outline"><ExternalLink className="size-3.5" />打开原图</Button></div>}</footer></Card>;
}

function Meta({ label, value }: { label: string; value: string }) { return <div><dt className="text-[10px] text-muted-foreground">{label}</dt><dd className="mt-1 truncate font-medium">{value}</dd></div>; }
