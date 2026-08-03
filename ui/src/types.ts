/**
 * [INPUT]: 依赖 Cover Studio App operation 返回的 JSON 结构
 * [OUTPUT]: 对外提供 UI 所需的渠道、草稿、历史与素材类型
 * [POS]: ui/src 的领域类型边界；组件只依赖此处稳定语义，不重复解释 SQLite 行
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */
export type Channel = { id: string; label: string; width: number; height: number; group: "国内渠道" | "海外渠道" };
export type Draft = { channel: string; width: number; height: number; referenceAssetIds: string[]; referenceCoverAssetIds: string[]; brief: string; previewAssetId?: string };
export type Cover = { id: string; assetId: string; prompt: string; channel: string; width: number; height: number; referenceAssetIds: string[]; referenceCoverAssetIds: string[]; createdAt: string };
export type ImageModelConfiguration = {
  id: string;
  model: { id: string; name: string; inputModes: string[] };
  credentialID: string;
  credentialName: string;
  providerName: string;
};
