/**
 * [INPUT]: 依赖已保存 Cover 历史与素材内容 URL
 * [OUTPUT]: 对外提供可打开原始 Asset 的历史封面网格与空状态
 * [POS]: Cover Studio 的可追溯交付区；不从提示词推断图片，不复制素材
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */
import type { Cover } from "./types";
import { imageURL } from "./use-media-asset-events";
import { Card } from "./ui";

export function HistoryGrid({ covers }: { covers: Cover[] }) { return <Card className="mt-5 p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="text-sm font-semibold">历史封面</h2><p className="mt-1 text-xs text-muted-foreground">图片由素材库统一保存；此处保留提示词、尺寸、模板和参考图元信息。</p></div><span className="font-mono text-[10px] text-muted-foreground">{covers.length} RECORDS</span></div>{covers.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">{covers.map((cover) => <button className="overflow-hidden rounded-lg border bg-card text-left transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-sm" key={cover.id} onClick={() => window.open(imageURL(cover.assetId), "_blank", "noopener")} type="button"><img alt={`历史封面 ${cover.channel}`} className="aspect-[4/3] w-full bg-muted object-cover" src={imageURL(cover.assetId)} /><span className="block border-t px-2.5 py-2"><strong className="block truncate text-[11px]">{cover.channel} · {cover.width}×{cover.height}</strong><span className="mt-1 block font-mono text-[10px] text-muted-foreground">{new Date(cover.createdAt).toLocaleDateString("zh-CN")}</span></span></button>)}</div> : <div className="mt-4 grid min-h-28 place-items-center rounded-lg border border-dashed bg-muted/25 px-4 text-center"><p className="text-xs text-muted-foreground">还没有已归档的封面。选择模板并生成第一张。</p></div>}</Card>; }
