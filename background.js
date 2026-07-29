/*
 * [INPUT]: 依赖平台注入的 ctx.sqlite；图片本体与生命周期由 Media Platform 的 Asset 管理
 * [OUTPUT]: 注册封面工作台配置、模板与生成历史的读写 operation；生成后仅保存 assetId 和可追溯元数据
 * [POS]: cover-studio 的唯一业务后端；把模板选择和封面历史固化为工作区 App 数据，不创建项目或复制素材文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */

const builtInTemplates = [
  { id: "editorial", name: "编辑主视觉", prompt: "Editorial cover, one unmistakable visual subject, strong hierarchy, generous negative space reserved for later typography, art-directed color palette, no readable text, no logo, no watermark.", channel: "通用", width: 1600, height: 900, referenceAssetIds: [] },
  { id: "product", name: "产品发布", prompt: "Premium product launch cover, product as the sole hero, controlled studio lighting, clean silhouette, deliberate depth, clear empty title area, no readable text, no logo, no watermark.", channel: "通用", width: 1600, height: 900, referenceAssetIds: [] },
  { id: "portrait", name: "人物观点", prompt: "Magazine-style portrait cover, expressive subject, confident crop, restrained background, high contrast focal lighting, deliberate space for editorial title, no readable text, no logo, no watermark.", channel: "通用", width: 1080, height: 1350, referenceAssetIds: [] },
];

function ensureSchema(ctx) {
  ctx.sqlite.execute("create table if not exists cover_meta (key text primary key, value text not null)");
  ctx.sqlite.execute("create table if not exists cover_templates (id text primary key, name text not null, prompt text not null, channel text not null, width integer not null, height integer not null, reference_asset_ids_json text not null, created_at text not null)");
  ctx.sqlite.execute("create table if not exists cover_history (id text primary key, asset_id text not null, prompt text not null, channel text not null, width integer not null, height integer not null, template_id text, reference_asset_ids_json text not null, created_at text not null)");
}

function text(value) { return String(value || "").trim(); }
function ids(value) { return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : []; }
function identifier() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

function readContext(_, ctx) {
  ensureSchema(ctx);
  const rows = ctx.sqlite.query("select value from cover_meta where key = ?", ["draft"]);
  return rows.length ? JSON.parse(rows[0].value) : { channel: "小红书", width: 1242, height: 1660, templateId: "editorial", referenceAssetIds: [], brief: "" };
}

function configure(input, ctx) {
  ensureSchema(ctx);
  const channel = text(input.channel);
  const width = Number(input.width);
  const height = Number(input.height);
  if (!channel || !Number.isFinite(width) || width < 1 || !Number.isFinite(height) || height < 1) throw new Error("channel, width and height are required");
  const draft = { channel, width, height, templateId: text(input.templateId), referenceAssetIds: ids(input.referenceAssetIds), brief: text(input.brief), updatedAt: new Date().toISOString() };
  ctx.sqlite.execute("insert into cover_meta (key, value) values (?, ?) on conflict(key) do update set value = excluded.value", ["draft", JSON.stringify(draft)]);
  return draft;
}

function listTemplates(_, ctx) {
  ensureSchema(ctx);
  const saved = ctx.sqlite.query("select id, name, prompt, channel, width, height, reference_asset_ids_json, created_at from cover_templates order by created_at desc").map((row) => ({ id: row.id, name: row.name, prompt: row.prompt, channel: row.channel, width: row.width, height: row.height, referenceAssetIds: JSON.parse(row.reference_asset_ids_json), createdAt: row.created_at, source: "saved" }));
  return [...builtInTemplates.map((item) => ({ ...item, source: "built-in" })), ...saved];
}

function saveTemplate(input, ctx) {
  ensureSchema(ctx);
  const name = text(input.name);
  const prompt = text(input.prompt);
  if (!name || !prompt) throw new Error("name and prompt are required");
  const draft = readContext({}, ctx);
  const template = { id: identifier(), name, prompt, channel: text(input.channel) || draft.channel, width: Number(input.width) || draft.width, height: Number(input.height) || draft.height, referenceAssetIds: ids(input.referenceAssetIds), createdAt: new Date().toISOString(), source: "saved" };
  ctx.sqlite.execute("insert into cover_templates (id, name, prompt, channel, width, height, reference_asset_ids_json, created_at) values (?, ?, ?, ?, ?, ?, ?, ?)", [template.id, template.name, template.prompt, template.channel, template.width, template.height, JSON.stringify(template.referenceAssetIds), template.createdAt]);
  return template;
}

function listCovers(_, ctx) {
  ensureSchema(ctx);
  return ctx.sqlite.query("select id, asset_id, prompt, channel, width, height, template_id, reference_asset_ids_json, created_at from cover_history order by created_at desc").map((row) => ({ id: row.id, assetId: row.asset_id, prompt: row.prompt, channel: row.channel, width: row.width, height: row.height, templateId: row.template_id || "", referenceAssetIds: JSON.parse(row.reference_asset_ids_json), createdAt: row.created_at }));
}

function saveCover(input, ctx) {
  ensureSchema(ctx);
  const assetId = text(input.assetId);
  const prompt = text(input.prompt);
  const channel = text(input.channel);
  const width = Number(input.width);
  const height = Number(input.height);
  if (!assetId || !prompt || !channel || !Number.isFinite(width) || !Number.isFinite(height)) throw new Error("assetId, prompt, channel, width and height are required");
  const cover = { id: identifier(), assetId, prompt, channel, width, height, templateId: text(input.templateId), referenceAssetIds: ids(input.referenceAssetIds), createdAt: new Date().toISOString() };
  ctx.sqlite.execute("insert into cover_history (id, asset_id, prompt, channel, width, height, template_id, reference_asset_ids_json, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)", [cover.id, cover.assetId, cover.prompt, cover.channel, cover.width, cover.height, cover.templateId, JSON.stringify(cover.referenceAssetIds), cover.createdAt]);
  return cover;
}

recut.operation.register("cover.context", readContext);
recut.operation.register("cover.configure", configure);
recut.operation.register("template.list", listTemplates);
recut.operation.register("template.save", saveTemplate);
recut.operation.register("cover.list", listCovers);
recut.operation.register("cover.save", saveCover);
