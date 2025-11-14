const BASE_URL = 'http://10.11.12.193:3000';

function request(path, options = {}) {
  const url = (path && path.startsWith('http')) ? path : (BASE_URL + path);
  const method = (options.method || 'GET').toUpperCase();
  const header = Object.assign({ 'content-type': 'application/json' }, options.header || {});
  const data = options.data || {};
  return new Promise((resolve, reject) => {
    wx.request({ url, method, data, header,
      success(res) {
        if (res && res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
        else reject({ statusCode: res && res.statusCode, data: res && res.data });
      },
      fail(err) { reject(err); }
    });
  });
}

module.exports = { BASE_URL, request };
// miniprogram/utils/request.js
// 简单封装 wx.request，返回 Promise。将 BASE_URL 写成常量以便后续替换为你的后端 IP。
// 开发时可以在微信开发者工具勾选“忽略合法域名校验”。
const BASE_URL = 'http://10.11.12.193:3000'; // <- 请在本地替换为你的后端 IP

function request(path, options = {}) {
  const url = (path && path.startsWith('http')) ? path : (BASE_URL + path);
  const method = (options.method || 'GET').toUpperCase();
  const header = Object.assign({ 'content-type': 'application/json' }, options.header || {});
  const data = options.data || {};

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      header,
      success(res) {
        if (res && res.statusCode >= 200 && res.statusCode < 300) {
          // 兼容后端直接返回数组/对象，或 { data: ... } 的情况
          resolve(res.data);
        } else {
          reject({ statusCode: res && res.statusCode, data: res && res.data });
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

module.exports = {
  BASE_URL,
  request,
};
