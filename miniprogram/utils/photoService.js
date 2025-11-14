const { request } = require('./request.js');

function fetchByType(type, limit = 4) {
  return request('/api/photos', { data: { type, limit } })
    .then(res => {
      const list = Array.isArray(res) ? res : (res && res.data) ? res.data : [];
      return (list || []).slice(0, limit).map(p => p.url || p.path || null).filter(Boolean);
    });
}

function fetchLatestByType(type, limit = 4) { return fetchByType(type, limit); }

function getById(id) {
  if (typeof id === 'undefined' || id === null) return Promise.resolve(null);
  return request(`/api/photos/${id}`).then(res => { const p = (res && res.data) ? res.data : res; return (p && (p.url || p.path)) ? (p.url || p.path) : null; });
}

function getByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return Promise.resolve([]);
  const jobs = ids.map(id => getById(id).catch(() => null));
  return Promise.all(jobs).then(list => (list || []).filter(Boolean));
}

module.exports = { fetchByType, fetchLatestByType, getById, getByIds };
// miniprogram/utils/photoService.js
// 仅使用后端 API 的 photo service。删除对本地 mock 的依赖。
const { request } = require('./request.js');

// 从后端获取指定 type 的图片列表（返回 Promise<url[]>），后端接口：GET /api/photos?type=xxx&limit=N
function fetchByType(type, limit = 4) {
  return request('/api/photos', { data: { type, limit } })
    .then(res => {
      const list = Array.isArray(res) ? res : (res && res.data) ? res.data : [];
      return (list || []).slice(0, limit).map(p => p.url || p.path || null).filter(Boolean);
    });
}

// 同名别名，语义化
function fetchLatestByType(type, limit = 4) {
  return fetchByType(type, limit);
}

// 根据图片 id 获取图片对象或 url（尝试调用 /api/photos/:id）
function getById(id) {
  if (typeof id === 'undefined' || id === null) return Promise.resolve(null);
  return request(`/api/photos/${id}`)
    .then(res => {
      const p = (res && res.data) ? res.data : res;
      if (!p) return null;
      // 如果后端直接返回对象/数组，确保返回 url 字符串
      return (p.url || p.path || null);
    });
}

// 根据 id 列表并行获取 url 数组 -> Promise<url[]>
function getByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return Promise.resolve([]);
  const jobs = ids.map(id => getById(id).catch(() => null));
  return Promise.all(jobs).then(list => (list || []).filter(Boolean));
}

module.exports = {
  fetchByType,
  fetchLatestByType,
  getById,
  getByIds,
};
