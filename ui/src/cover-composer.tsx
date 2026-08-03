/**
 * [INPUT]: 依赖渠道、草稿、可用图片模型、两类参考图选择与生成回调
 * [OUTPUT]: 对外提供无原生下拉框的应用内选择器、封面创作输入表单与直接/Codex 两条生成入口
 * [POS]: Cover Studio 的主编辑区；只收集意图，根组件负责直生或把 Prompt 回填给 Agent
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */
import { Bot, Check, ChevronDown, Settings, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ReferenceStrip, type ReferenceKind } from "./asset-picker";
import type { Channel, Draft, ImageModelConfiguration } from "./types";
import { Button, Card } from "./ui";

type PickerOption = { id: string; label: string; description?: string; group?: string };

export function CoverComposer({ channels, draft, busy, models, selectedModelID, onChange, onGenerate, onCompose, onConfigureModels, onModelChange, onOpenReferences, onRemoveReference }: { channels: Channel[]; draft: Draft; busy: boolean; models: ImageModelConfiguration[]; selectedModelID: string; onChange: (next: Draft) => void; onGenerate: () => void; onCompose: () => void; onConfigureModels: () => void; onModelChange: (id: string) => void; onOpenReferences: (kind: ReferenceKind) => void; onRemoveReference: (kind: ReferenceKind, id: string) => void }) {
  const channel = channels.find((item) => item.id === draft.channel) ?? channels[0];
  const channelOptions = channels.map((item) => ({ id: item.id, label: `${item.label} · ${item.width} × ${item.height}`, group: item.group }));
  const modelOptions = models.map((item) => ({ id: item.id, label: item.model.name, description: `${item.providerName} · ${item.credentialName}` }));
  const chooseChannel = (id: string) => {
    const next = channels.find((item) => item.id === id) ?? channels[0];
    onChange({ ...draft, channel: next.id, width: next.width, height: next.height });
  };
  return <Card className="h-full overflow-hidden"><header className="flex items-center justify-between border-b px-5 py-4"><div><p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-primary">INPUT</p><h2 className="mt-1 text-sm font-semibold">生成参数</h2></div><span className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">FORM</span></header><section className="p-5"><Section title="发布渠道与尺寸" detail="选择最终投放规格。" /><div className="mt-3"><Picker ariaLabel="发布渠道" onChange={chooseChannel} options={channelOptions} value={channel.id} /></div></section><section className="border-t p-5"><Section title="图片模型" detail="可选择所有已连接 Provider 的可用模型。" />{models.length ? <div className="mt-3"><Picker ariaLabel="生成模型" onChange={onModelChange} options={modelOptions} value={selectedModelID} /></div> : <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-dashed bg-muted/25 p-3"><p className="text-xs leading-5 text-muted-foreground">还没有可直接生成的图片模型。请先在设置中连接一个图片 Provider。</p><Button className="shrink-0" onClick={onConfigureModels} type="button" variant="outline"><Settings className="size-3.5" />去配置</Button></div>}</section><section className="border-t p-5"><Section title="参考图" detail="约束主体、产品或画面元素。" /><div className="mt-3"><ReferenceStrip empty="还没有参考图；可从素材库选择或上传本机图片。" ids={draft.referenceAssetIds} onOpen={() => onOpenReferences("image")} onRemove={(id) => onRemoveReference("image", id)} selectLabel="选择参考图" /></div></section><section className="border-t p-5"><Section title="参考封面" detail="约束构图、留白和视觉语气。" /><div className="mt-3"><ReferenceStrip empty="还没有参考封面；可从素材库选择或上传本机图片。" ids={draft.referenceCoverAssetIds} onOpen={() => onOpenReferences("cover")} onRemove={(id) => onRemoveReference("cover", id)} selectLabel="选择参考封面" /></div></section><section className="border-t p-5"><Section title="补充要求" detail="说明这一次画面重点。" /><label className="mt-3 block text-xs font-medium" htmlFor="cover-brief">画面要求</label><textarea className="mt-2 block min-h-36 w-full rounded-md border bg-background px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" id="cover-brief" onChange={(event) => onChange({ ...draft, brief: event.target.value })} placeholder="例如：主体放在右侧，左侧留出标题区域；整体克制、有科技杂志感。" value={draft.brief} /><div className="mt-4"><p className="text-xs leading-5 text-muted-foreground">{draft.referenceAssetIds.length ? `已选 ${draft.referenceAssetIds.length} 张参考图。` : "未添加参考图。"}{draft.referenceCoverAssetIds.length ? ` 已选 ${draft.referenceCoverAssetIds.length} 张参考封面。` : " 未添加参考封面。"}</p><Button className="mt-4 w-full" disabled={busy || !models.length} onClick={onGenerate} type="button"><Sparkles className="size-3.5" />{busy ? "正在生成…" : "直接生成"}</Button><Button className="mt-2 w-full" disabled={busy} onClick={onCompose} type="button" variant="outline"><Bot className="size-3.5" />交给 Codex 生成</Button><p className="mt-2 text-[11px] leading-4 text-muted-foreground">会复制 Prompt 并填入右侧输入框；由你确认后才会发送。</p></div></section></Card>;
}

function Picker({ ariaLabel, onChange, options, value }: { ariaLabel: string; onChange: (id: string) => void; options: PickerOption[]; value: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const selected = options.find((item) => item.id === value) ?? options[0];
  const groups = [...new Set(options.map((item) => item.group ?? ""))];
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close); window.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); window.removeEventListener("keydown", escape); };
  }, []);
  return <div className="relative" ref={root}><button aria-expanded={open} aria-haspopup="listbox" aria-label={ariaLabel} className="flex h-10 w-full items-center justify-between gap-3 rounded-md border bg-background px-3 text-left text-sm outline-none transition hover:bg-muted focus:border-primary focus:ring-2 focus:ring-primary/20" onClick={() => setOpen((current) => !current)} type="button"><span className="min-w-0 truncate">{selected?.label ?? "请选择"}</span><ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} /></button>{open && <div className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-md border bg-card p-1 shadow-xl" role="listbox">{groups.map((group) => <div key={group || "all"}>{group && <p className="px-2 py-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-muted-foreground">{group}</p>}{options.filter((item) => (item.group ?? "") === group).map((item) => <button aria-selected={item.id === selected?.id} className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-xs transition hover:bg-muted ${item.id === selected?.id ? "bg-primary/10 text-foreground" : ""}`} key={item.id} onClick={() => { onChange(item.id); setOpen(false); }} role="option" type="button"><Check className={`size-3.5 shrink-0 ${item.id === selected?.id ? "text-primary" : "opacity-0"}`} /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.label}</span>{item.description && <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{item.description}</span>}</span></button>)}</div>)}</div>}</div>;
}

function Section({ title, detail }: { title: string; detail: string }) { return <div className="flex items-baseline justify-between gap-4"><h2 className="text-sm font-semibold">{title}</h2><p className="text-right text-[11px] text-muted-foreground">{detail}</p></div>; }
