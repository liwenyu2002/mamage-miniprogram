const { request } = require('./request.js');

/**
 * 拉取最新的 photos。
 * 如果传了 type，则带上 type 过滤；如果没传 type，就只按 limit 取。
 */
function fetchLatestByType(type, limit = 10) {
  const data = { limit };
  if (type) {
    data.type = type;
  }
  return request('/api/photos', {
    method: 'GET',
    data
  });
}

/**
 * 从指定项目里随机取若干照片
 * 对应：GET /api/photos?projectId=xxx&limit=xxx&random=1
 */
function fetchRandomByProject(projectId, limit = 4) {
  return request('/api/photos', {
    method: 'GET',
    data: {
      projectId,
      limit,
      random: 1
    }
  });
}

module.exports = {
  fetchLatestByType,
  fetchRandomByProject
};
