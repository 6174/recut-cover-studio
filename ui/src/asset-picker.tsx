/**
 * [INPUT]: 依赖共享素材缓存、已选 Asset ID、本机图片上传与选择回调
 * [OUTPUT]: 对外提供参考图与参考封面的多选弹窗，以及紧凑缩略图引用条
 * [POS]: Cover Studio 的参考素材交互层；所有图片先进入素材库，再按语义保存稳定 Asset 引用
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */
import { Check, ImagePlus, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { imageURL, useMediaAssets } from "./use-media-asset-events";
import { Button } from "./ui";

export type ReferenceKind = "image" | "cover";

export function ReferenceStrip({ ids, empty, selectLabel, onOpen, onRemove }: { ids: string[]; empty: string; selectLabel: string; onOpen: () => void; onRemove: (id: string) => void }) {
  const { byID } = useMediaAssets();
  return <div className="flex min-h-16 items-center gap-2 rounded-md border border-dashed bg-muted/25 p-2">{ids.length ? <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">{ids.map((id) => <div className="group relative size-12 shrink-0 overflow-hidden rounded-md border bg-muted" key={id}><img alt={byID[id]?.name ?? "参考素材"} className="size-full object-cover" src={imageURL(id)} /><button aria-label="移除参考素材" className="absolute right-1 top-1 hidden size-4 rounded-full bg-black/70 text-white group-hover:grid group-hover:place-items-center" onClick={() => onRemove(id)} type="button"><X className="size-3" /></button></div>)}</div> : <p className="flex-1 px-2 text-xs text-muted-foreground">{empty}</p>}<Button onClick={onOpen} type="button" variant="outline"><ImagePlus className="size-3.5" />{selectLabel}</Button></div>;
}

export function AssetPicker({ ids, kind, onChange, onClose, onUpload }: { ids: string[]; kind: ReferenceKind; onChange: (ids: string[]) => void; onClose: () => void; onUpload: (file: File) => Promise<void> }) {
  const { error, images, ready } = useMediaAssets();
  const uploadInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const visible = images.filter((asset) => asset.status === "completed");
  const title = kind === "image" ? "选择参考图" : "选择参考封面";
  const description = kind === "image" ? "从素材库选择，或上传本机图片；它们用于约束主体、产品或画面元素。" : "从素材库选择，或上传本机图片；它们用于约束构图、留白和视觉语气。";
  const toggle = (id: string) => onChange(ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try { await onUpload(file); } catch (cause) { setUploadError(cause instanceof Error ? cause.message : "上传失败，请重试。"); } finally { setUploading(false); }
  };
  useEffect(() => { const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", closeOnEscape); return () => window.removeEventListener("keydown", closeOnEscape); }, [onClose]);
  return <div aria-modal="true" className="fixed inset-0 z-20 grid place-items-center bg-foreground/25 p-6 backdrop-blur-[1px]" onMouseDown={onClose} role="dialog"><section aria-labelledby="reference-picker-title" className="flex max-h-[min(680px,calc(100vh-3rem))] w-full max-w-4xl flex-col overflow-hidden rounded-lg border bg-card shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><header className="flex items-start justify-between gap-4 border-b px-5 py-4"><div><h2 className="text-sm font-semibold" id="reference-picker-title">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><div className="flex shrink-0 items-center gap-1"><input accept="image/*" className="hidden" onChange={upload} ref={uploadInput} type="file" /><Button disabled={uploading} onClick={() => uploadInput.current?.click()} type="button" variant="outline"><Upload className="size-3.5" />{uploading ? "上传中…" : "上传图片"}</Button><Button aria-label="关闭" onClick={onClose} type="button" variant="ghost"><X className="size-4" /></Button></div></header>{uploadError && <p className="border-b bg-rose-50 px-5 py-2 text-xs text-rose-700">{uploadError}</p>}<div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto p-5 sm:grid-cols-4">{error ? <p className="col-span-full py-16 text-center text-xs text-rose-700">{error}</p> : !ready ? <p className="col-span-full py-16 text-center text-xs text-muted-foreground">正在读取素材库…</p> : visible.length ? visible.map((asset) => <button aria-pressed={ids.includes(asset.id)} className={`group relative overflow-hidden rounded-md border-2 bg-muted text-left ${ids.includes(asset.id) ? "border-primary" : "border-transparent hover:border-primary/40"}`} key={asset.id} onClick={() => toggle(asset.id)} type="button"><img alt={asset.name} className="aspect-square w-full object-cover" src={imageURL(asset.id)} />{ids.includes(asset.id) && <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5" /></span>}<span className="block truncate border-t bg-card px-2 py-2 text-[11px] font-medium">{asset.name}</span></button>) : <p className="col-span-full py-16 text-center text-xs text-muted-foreground">素材库中还没有已完成图片。上传一张图片开始。</p>}</div><footer className="flex justify-end gap-2 border-t px-5 py-3"><Button onClick={() => onChange([])} type="button" variant="outline">清空</Button><Button onClick={onClose} type="button">使用 {ids.length} 张{kind === "image" ? "参考图" : "参考封面"}</Button></footer></section></div>;
}
