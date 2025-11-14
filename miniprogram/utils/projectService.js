const photoService = require('./photoService.js');
const { request } = require('./request.js');

function getLatestProjects(limit = 3) {
  return request('/api/projects', { data: { limit } })
    .then(res => {
      const list = Array.isArray(res) ? res : (res && res.data) ? res.data : [];
      return (list || []).slice(0, limit).map(p => Object.assign({}, p));
    });
}

function getProjectById(id) {
  return request(`/api/projects/${id}`).then(res => {
    const p = (res && res.data) ? res.data : res;
    if (!p) return null;
    const photoIds = p.photo_ids || p.photoIds || [];
    return photoService.getByIds(photoIds || []).then(photoUrls => Object.assign({}, p, { photoUrls }));
  });
}

module.exports = { getLatestProjects, getProjectById };
// miniprogram/utils/projectService.js
// 仅使用后端 API 的 project service。删除对本地 mock 的依赖。
const photoService = require('./photoService.js');
const { request } = require('./request.js');

// 获取最新 projects（返回 Promise<project[]>），每个 project 会补上 coverPhotoUrl（若后端未直接提供则通过 photoService.getById 获取）
function getLatestProjects(limit = 3) {
  return request('/api/projects', { data: { limit } })
    .then(res => {
      const list = Array.isArray(res) ? res : (res && res.data) ? res.data : [];
      const slice = (list || []).slice(0, limit);
      // 为每个 project 补上 coverPhotoUrl（异步）
      const jobs = slice.map(p => {
        if (p && (p.coverPhotoUrl || p.cover_photo_url)) {
          return Promise.resolve(Object.assign({}, p, { coverPhotoUrl: p.coverPhotoUrl || p.cover_photo_url }));
        }
        if (p && typeof p.coverPhotoId !== 'undefined') {
          return photoService.getById(p.coverPhotoId)
            .then(url => Object.assign({}, p, { coverPhotoUrl: url || null }))
            .catch(() => Object.assign({}, p, { coverPhotoUrl: null }));
        }
        return Promise.resolve(Object.assign({}, p, { coverPhotoUrl: null }));
      });
      return Promise.all(jobs);
    });
}

// 根据 id 获取单个 project，返回 Promise<project>，并把 photoIds 映射成 photoUrls
function getProjectById(id) {
  return request(`/api/projects/${id}`)
    .then(res => {
      const p = (res && res.data) ? res.data : res;
      if (!p) return null;
      const photoIds = p.photo_ids || p.photoIds || [];
      return photoService.getByIds(photoIds || [])
        .then(photoUrls => {
          const coverUrl = p.coverPhotoUrl || null;
          return Object.assign({}, p, { photoUrls, coverPhotoUrl: coverUrl });
        });
    });
}

module.exports = {
  getLatestProjects,
  getProjectById,
};
