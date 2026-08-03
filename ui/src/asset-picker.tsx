/**
 * [INPUT]: 依赖共享素材缓存、已选 Asset ID 与全局素材选择器触发回调
 * [OUTPUT]: 对外提供参考图与参考封面的紧凑缩略图引用条
 * [POS]: Cover Studio 的已选参考展示层；选择、上传和详情完全委托给宿主全局素材选择器，所有图片按语义保存稳定 Asset 引用
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */
import { ImagePlus, X } from "lucide-react";
import { imageURL, useMediaAssets } from "./use-media-asset-events";
import { Button } from "./ui";

export type ReferenceKind = "image" | "cover";

export function ReferenceStrip({ ids, empty, selectLabel, onOpen, onRemove }: { ids: string[]; empty: string; selectLabel: string; onOpen: () => void; onRemove: (id: string) => void }) {
  const { byID } = useMediaAssets();
  return <div className="flex min-h-16 items-center gap-2 rounded-md border border-dashed bg-muted/25 p-2">{ids.length ? <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">{ids.map((id) => <div className="group relative size-12 shrink-0 overflow-hidden rounded-md border bg-muted" key={id}><img alt={byID[id]?.name ?? "参考素材"} className="size-full object-cover" src={imageURL(id)} /><button aria-label="移除参考素材" className="absolute right-1 top-1 hidden size-4 rounded-full bg-black/70 text-white group-hover:grid group-hover:place-items-center" onClick={() => onRemove(id)} type="button"><X className="size-3" /></button></div>)}</div> : <p className="flex-1 px-2 text-xs text-muted-foreground">{empty}</p>}<Button onClick={onOpen} type="button" variant="outline"><ImagePlus className="size-3.5" />{selectLabel}</Button></div>;
}
