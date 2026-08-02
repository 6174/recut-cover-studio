/**
 * [INPUT]: 依赖渠道、草稿、两类参考图选择与生成回调
 * [OUTPUT]: 对外提供封面创作输入表单与平台生成方案提示
 * [POS]: Cover Studio 的主编辑区；只收集意图并交由根组件持久化或发送 Agent
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */
import { Sparkles } from "lucide-react";
import { ReferenceStrip, type ReferenceKind } from "./asset-picker";
import type { Channel, Draft } from "./types";
import { Button, Card } from "./ui";

export function CoverComposer({ channels, draft, busy, onChange, onGenerate, onOpenReferences, onRemoveReference }: { channels: Channel[]; draft: Draft; busy: boolean; onChange: (next: Draft) => void; onGenerate: () => void; onOpenReferences: (kind: ReferenceKind) => void; onRemoveReference: (kind: ReferenceKind, id: string) => void }) {
  const channel = channels.find((item) => item.id === draft.channel) ?? channels[0];
  const chooseChannel = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = channels.find((item) => item.id === event.target.value) ?? channels[0];
    onChange({ ...draft, channel: next.id, width: next.width, height: next.height });
  };
  const groups = ["国内渠道", "海外渠道"] as const;
  return <Card className="h-full overflow-hidden"><header className="flex items-center justify-between border-b px-5 py-4"><div><p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-primary">INPUT</p><h2 className="mt-1 text-sm font-semibold">生成参数</h2></div><span className="rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">FORM</span></header><section className="p-5"><Section title="发布渠道与尺寸" detail="选择最终投放规格。" /><label className="mt-3 block text-xs font-medium" htmlFor="cover-channel">发布渠道</label><select className="mt-2 block h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" id="cover-channel" onChange={chooseChannel} value={channel.id}>{groups.map((group) => <optgroup key={group} label={group}>{channels.filter((item) => item.group === group).map((item) => <option key={item.id} value={item.id}>{item.label} · {item.width} × {item.height}</option>)}</optgroup>)}</select></section><section className="border-t p-5"><Section title="参考图" detail="约束主体、产品或画面元素。" /><div className="mt-3"><ReferenceStrip empty="还没有参考图；可从素材库选择或上传本机图片。" ids={draft.referenceAssetIds} onOpen={() => onOpenReferences("image")} onRemove={(id) => onRemoveReference("image", id)} selectLabel="选择参考图" /></div></section><section className="border-t p-5"><Section title="参考封面" detail="约束构图、留白和视觉语气。" /><div className="mt-3"><ReferenceStrip empty="还没有参考封面；可从素材库选择或上传本机图片。" ids={draft.referenceCoverAssetIds} onOpen={() => onOpenReferences("cover")} onRemove={(id) => onRemoveReference("cover", id)} selectLabel="选择参考封面" /></div></section><section className="border-t p-5"><Section title="补充要求" detail="说明这一次画面重点。" /><label className="mt-3 block text-xs font-medium" htmlFor="cover-brief">画面要求</label><textarea className="mt-2 block min-h-36 w-full rounded-md border bg-background px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" id="cover-brief" onChange={(event) => onChange({ ...draft, brief: event.target.value })} placeholder="例如：主体放在右侧，左侧留出标题区域；整体克制、有科技杂志感。" value={draft.brief} /><div className="mt-4"><p className="text-xs leading-5 text-muted-foreground">{draft.referenceAssetIds.length ? `已选 ${draft.referenceAssetIds.length} 张参考图。` : "未添加参考图。"}{draft.referenceCoverAssetIds.length ? ` 已选 ${draft.referenceCoverAssetIds.length} 张参考封面。` : " 未添加参考封面。"}</p><Button className="mt-4 w-full" disabled={busy} onClick={onGenerate} type="button"><Sparkles className="size-3.5" />{busy ? "正在交给 Agent…" : "交给 Agent 生成"}</Button></div></section></Card>;
}

function Section({ title, detail }: { title: string; detail: string }) { return <div className="flex items-baseline justify-between gap-4"><h2 className="text-sm font-semibold">{title}</h2><p className="text-right text-[11px] text-muted-foreground">{detail}</p></div>; }
