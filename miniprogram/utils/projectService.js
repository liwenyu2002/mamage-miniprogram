// utils/projectService.js
const { request } = require('./request.js');

/**
 * 首页：拉取最新项目（简单列表）
 * GET /api/projects?limit=4
 */
function fetchLatestProjects(limit = 4) {
  return request('/api/projects', {
    method: 'GET',
    data: { limit }
  });
}

/**
 * list 页：分页 + 搜索项目列表
 * GET /api/projects/list?page=1&pageSize=6&keyword=xxx
 *
 * 返回格式统一成：
 * {
 *   list:   Array<Project>,
 *   hasMore: Boolean,
 *   total:  Number,
 *   page:   Number,
 *   pageSize: Number
 * }
 */
async function fetchProjectList({ page = 1, pageSize = 6, keyword = '' } = {}) {
  const res = await request('/api/projects/list', {
    method: 'GET',
    data: { page, pageSize, keyword }
  });

  const list = Array.isArray(res.list) ? res.list : [];

  return {
    list,
    hasMore: !!res.hasMore,
    total: res.total || 0,
    page: res.page || page,
    pageSize: res.pageSize || pageSize
  };
}

/**
 * 根据 id 获取单个项目详情
 * GET /api/projects/:id
 */
function getProjectById(id) {
  return request(`/api/projects/${id}`, {
    method: 'GET'
  });
}

module.exports = {
  fetchLatestProjects,
  fetchProjectList,
  getProjectById
};
