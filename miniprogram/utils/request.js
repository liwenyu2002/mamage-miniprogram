// utils/request.js

// Mac mini 的实际 IP
const BASE_URL = 'https://api.wenyuli.site';
function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const method = options.method || 'GET';
  const data = options.data || {};
  const header = options.header || {};

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      header,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          console.error('request error', res);
          reject(res);
        }
      },
      fail(err) {
        console.error('request fail', err);
        reject(err);
      }
    });
  });
}

module.exports = {
  BASE_URL,
  request
};
