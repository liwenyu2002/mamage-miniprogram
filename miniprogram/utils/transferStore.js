// utils/transferStore.js
// 全局“中转站”选择仓库：最多 30 张，跨页面、跨会话（本地存储）

const STORAGE_KEY = 'photo-transfer-selection';
const MAX_COUNT = 30;

let selection = [];

// ===== 持久化相关 =====
function load() {
  try {
    const saved = wx.getStorageSync(STORAGE_KEY);
    if (saved && Array.isArray(saved)) {
      selection = saved;
      console.log('[transferStore] loaded from storage:', selection.length);
    }
  } catch (e) {
    console.warn('[transferStore] load failed', e);
  }
}

function persist() {
  try {
    wx.setStorageSync(STORAGE_KEY, selection);
  } catch (e) {
    console.warn('[transferStore] save failed', e);
  }
}

// 简单订阅机制（组件/页面可以监听变化）
const listeners = [];

function notify() {
  const snapshot = selection.slice();
  listeners.forEach(fn => {
    try {
      fn(snapshot);
    } catch (e) {
      console.warn('[transferStore] listener error', e);
    }
  });
}

function subscribe(fn) {
  if (typeof fn === 'function') {
    listeners.push(fn);
    // 立刻推一次当前值
    fn(selection.slice());
  }
  // 返回取消订阅函数
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

// ===== 对外 API =====

function getAll() {
  return selection.slice();
}

function getCount() {
  return selection.length;
}

// photo 建议至少包含 { id, url, projectId }
function add(photo) {
  if (!photo) return false;
  if (selection.length >= MAX_COUNT) {
    return false;
  }
  const key = photo.id || photo.url;
  if (!key) return false;

  // 去重：同一张不重复加
  if (selection.some(p => (p.id || p.url) === key)) {
    return true;
  }

  selection.push(photo);
  persist();
  notify();
  return true;
}

function removeById(idOrUrl) {
  const oldLen = selection.length;
  selection = selection.filter(p => (p.id || p.url) !== idOrUrl);
  if (selection.length !== oldLen) {
    persist();
    notify();
  }
}

function clear() {
  selection = [];
  persist();
  notify();
}

load();

module.exports = {
  getAll,
  getCount,
  add,
  clear,
  removeById,
  subscribe,
  MAX_COUNT
};
