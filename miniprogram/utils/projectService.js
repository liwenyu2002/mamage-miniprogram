// utils/projectService.js

const { request } = require('./request.js');

/**
 * 拉取项目列表（按 created_at DESC 排序，limit 条）
 * 对应：GET /api/projects?limit=4
 */
function fetchLatestProjects(limit = 4) {
  return request('/api/projects', {
    method: 'GET',
    data: { limit }
  });
}

/**
 * 根据 id 获取单个项目详情
 * 对应：GET /api/projects/:id
 */
function getProjectById(id) {
  return request(`/api/projects/${id}`, {
    method: 'GET'
  });
}

module.exports = {
  fetchLatestProjects,
  getProjectById
};
