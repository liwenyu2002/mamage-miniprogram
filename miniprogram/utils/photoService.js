// utils/photoService.js

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

module.exports = {
  fetchLatestByType
};
