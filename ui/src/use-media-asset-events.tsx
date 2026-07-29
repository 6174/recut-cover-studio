/**
 * [INPUT]: 依赖浏览器 EventSource 与 Recut `/v1/media/events` 的 Asset 快照/增量协议
 * [OUTPUT]: 对外提供素材缓存与图片内容 URL；历史和参考图选择共享同一素材真相
 * [POS]: Cover Studio 的媒体状态边界；不轮询单个素材或 Provider
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type ImageAsset = { id: string; name: string; kind: string; status: string; createdAt?: string; metadata?: Record<string, unknown> };
type AssetState = { images: ImageAsset[]; byID: Record<string, ImageAsset>; ready: boolean; error: string };
const empty: AssetState = { images: [], byID: {}, ready: false, error: "" };
const Context = createContext<AssetState | null>(null);
const object = (value: unknown): Record<string, any> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : null;

function image(value: unknown): ImageAsset | null {
  const item = object(value);
  if (!item || item.kind !== "image" || typeof item.id !== "string" || !item.id) return null;
  return { id: item.id, name: typeof item.name === "string" ? item.name : "未命名图片", kind: "image", status: typeof item.status === "string" ? item.status : "completed", createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined, metadata: object(item.metadata) ?? {} };
}

function parse(event: Event) { try { return JSON.parse((event as MessageEvent<string>).data) as unknown; } catch { return null; } }

function Connection({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AssetState>(empty);
  useEffect(() => {
    const stream = new EventSource("/v1/media/events");
    stream.addEventListener("media.snapshot", (event) => {
      const payload = object(parse(event));
      const images = (Array.isArray(payload?.assets) ? payload.assets : []).map(image).filter((asset): asset is ImageAsset => Boolean(asset));
      setState({ images, byID: Object.fromEntries(images.map((asset) => [asset.id, asset])), ready: true, error: "" });
    });
    stream.addEventListener("asset.updated", (event) => {
      const next = image(object(parse(event))?.asset);
      if (!next) return;
      setState((current) => {
        const byID = { ...current.byID, [next.id]: next };
        const images = Object.values(byID).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        return { images, byID, ready: true, error: "" };
      });
    });
    stream.onerror = () => setState((current) => current.ready ? current : { ...current, error: "无法连接素材库；请检查 Recut service 后重试。" });
    return () => stream.close();
  }, []);
  return <Context.Provider value={useMemo(() => state, [state])}>{children}</Context.Provider>;
}

export function MediaAssetEventsProvider({ children }: { children: ReactNode }) { return useContext(Context) ? <>{children}</> : <Connection>{children}</Connection>; }
export function useMediaAssets() { return useContext(Context) ?? empty; }
export function imageURL(assetID: string) { return `/v1/media/assets/${encodeURIComponent(assetID)}/content`; }
