/*
 * [INPUT]: 依赖平台注入的 ctx.sqlite；图片本体与生命周期由 Media Platform 的 Asset 管理
 * [OUTPUT]: 注册封面工作台配置、当前真实预览与生成历史的读写 operation；生成后仅保存 assetId 和可追溯元数据
 * [POS]: cover-studio 的唯一业务后端；把渠道、参考图、创作要求和封面历史固化为工作区 App 数据，不创建项目或复制素材文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */

function ensureSchema(ctx) {
  ctx.sqlite.execute("create table if not exists cover_meta (key text primary key, value text not null)");
  ctx.sqlite.execute("create table if not exists cover_history (id text primary key, asset_id text not null, prompt text not null, channel text not null, width integer not null, height integer not null, reference_asset_ids_json text not null, reference_cover_asset_ids_json text not null default '[]', created_at text not null)");
  const columns = ctx.sqlite.query("pragma table_info(cover_history)");
  if (!columns.some((column) => column.name === "reference_cover_asset_ids_json")) ctx.sqlite.execute("alter table cover_history add column reference_cover_asset_ids_json text not null default '[]'");
}

function text(value) { return String(value || "").trim(); }
function ids(value) { return [...new Set(Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : [])]; }
function identifier() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

function readContext(_, ctx) {
  ensureSchema(ctx);
  const rows = ctx.sqlite.query("select value from cover_meta where key = ?", ["draft"]);
  if (!rows.length) return { channel: "xiaohongshu-note", width: 1242, height: 1660, referenceAssetIds: [], referenceCoverAssetIds: [], brief: "", previewAssetId: "" };
  const saved = JSON.parse(rows[0].value);
  return { channel: text(saved.channel), width: Number(saved.width), height: Number(saved.height), referenceAssetIds: ids(saved.referenceAssetIds), referenceCoverAssetIds: ids(saved.referenceCoverAssetIds), brief: text(saved.brief), previewAssetId: text(saved.previewAssetId), updatedAt: text(saved.updatedAt) };
}

function configure(input, ctx) {
  ensureSchema(ctx);
  const channel = text(input.channel);
  const width = Number(input.width);
  const height = Number(input.height);
  if (!channel || !Number.isFinite(width) || width < 1 || !Number.isFinite(height) || height < 1) throw new Error("channel, width and height are required");
  const current = readContext({}, ctx);
  const draft = { channel, width, height, referenceAssetIds: ids(input.referenceAssetIds), referenceCoverAssetIds: ids(input.referenceCoverAssetIds), brief: text(input.brief), previewAssetId: text(current.previewAssetId), updatedAt: new Date().toISOString() };
  ctx.sqlite.execute("insert into cover_meta (key, value) values (?, ?) on conflict(key) do update set value = excluded.value", ["draft", JSON.stringify(draft)]);
  return draft;
}

function listCovers(_, ctx) {
  ensureSchema(ctx);
  return ctx.sqlite.query("select id, asset_id, prompt, channel, width, height, reference_asset_ids_json, reference_cover_asset_ids_json, created_at from cover_history order by created_at desc").map((row) => ({ id: row.id, assetId: row.asset_id, prompt: row.prompt, channel: row.channel, width: row.width, height: row.height, referenceAssetIds: JSON.parse(row.reference_asset_ids_json), referenceCoverAssetIds: JSON.parse(row.reference_cover_asset_ids_json), createdAt: row.created_at }));
}

function saveCover(input, ctx) {
  ensureSchema(ctx);
  const assetId = text(input.assetId);
  const prompt = text(input.prompt);
  const channel = text(input.channel);
  const width = Number(input.width);
  const height = Number(input.height);
  if (!assetId || !prompt || !channel || !Number.isFinite(width) || !Number.isFinite(height)) throw new Error("assetId, prompt, channel, width and height are required");
  const cover = { id: identifier(), assetId, prompt, channel, width, height, referenceAssetIds: ids(input.referenceAssetIds), referenceCoverAssetIds: ids(input.referenceCoverAssetIds), createdAt: new Date().toISOString() };
  ctx.sqlite.execute("insert into cover_history (id, asset_id, prompt, channel, width, height, reference_asset_ids_json, reference_cover_asset_ids_json, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)", [cover.id, cover.assetId, cover.prompt, cover.channel, cover.width, cover.height, JSON.stringify(cover.referenceAssetIds), JSON.stringify(cover.referenceCoverAssetIds), cover.createdAt]);
  const draft = { ...readContext({}, ctx), previewAssetId: assetId, updatedAt: new Date().toISOString() };
  ctx.sqlite.execute("insert into cover_meta (key, value) values (?, ?) on conflict(key) do update set value = excluded.value", ["draft", JSON.stringify(draft)]);
  return cover;
}

recut.operation.register("cover.context", readContext);
recut.operation.register("cover.configure", configure);
recut.operation.register("cover.list", listCovers);
recut.operation.register("cover.save", saveCover);
