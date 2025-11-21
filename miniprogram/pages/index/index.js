// pages/index/index.js

const photoService = require('../../utils/photoService.js');
const projectService = require('../../utils/projectService.js');
const { BASE_URL } = require('../../utils/request.js');
const transferStore = require('../../utils/transferStore.js'); // ✅ 全局中转站

// 统一把相对路径转成带 BASE_URL 的绝对地址
function normalizeUrl(u) {
  if (!u) return null;
  // 如果已经是绝对 URL
  if (/^https?:\/\//i.test(u)) {
    // 若为 http 且我们使用的是 https 的 BASE_URL，则把 origin 替换为 BASE_URL 的 origin，强制使用 HTTPS
    if (/^http:\/\//i.test(u) && /^https:\/\//i.test(BASE_URL)) {
      const path = u.replace(/^https?:\/\/[^\/]+/i, '');
      return (BASE_URL || '').replace(/\/$/, '') + path;
    }
    return u;
  }
  if (u.startsWith('/')) return (BASE_URL || '').replace(/\/$/, '') + u;
  return (BASE_URL || '').replace(/\/$/, '') + '/' + u;
}

// 本地占位封面图（待上传）
const PLACEHOLDER_COVER = normalizeUrl('/uploads/assets/daishangchuan.png');

// 把各种格式转成 YYYY-MM-DD
function formatDay(v) {
  if (!v) return '';
  try {
    if (typeof v === 'string') {
      if (v.length >= 10) return v.slice(0, 10);
      return v;
    }
    const n = Number(v);
    if (!Number.isNaN(n)) {
      const d = new Date(n > 1e12 ? n : n * 1000);
      return d.toISOString().slice(0, 10);
    }
    return '';
  } catch {
    return '';
  }
}

Page({
  data: {
    // 中转站已选数量（传给 <transfer-fab>）
    selectedCount: 0,
    // 首页轮播图（从后端拉）
    images: [],
    // 首页展示的“最新项目卡片”
    topProjects: []
  },

  onLoad() {
    this.loadBannerImages();
    this.loadTopProjects();
  },

  onShow() {
    // 页面每次显示时同步一次当前中转站数量
    this.setData({
      selectedCount: transferStore.getCount()
    });

    // 订阅中转站变化，实时更新按钮上的数字
    this.unsubscribeTransfer = transferStore.subscribe(list => {
      this.setData({
        selectedCount: list.length
      });
    });
  },

  onHide() {
    if (this.unsubscribeTransfer) {
      this.unsubscribeTransfer();
      this.unsubscribeTransfer = null;
    }
  },

  onUnload() {
    if (this.unsubscribeTransfer) {
      this.unsubscribeTransfer();
      this.unsubscribeTransfer = null;
    }
  },

  // ===== 轮播图 =====
  // 轮播图：只展示 project_id = 1 的图，随机 4 张
  loadBannerImages() {
    photoService.fetchRandomByProject(1, 4)
      .then(list => {
        const imgs = (list || [])
          .map(p => normalizeUrl(p.thumbUrl || p.url))
          .filter(Boolean);

        if (imgs.length) {
          this.setData({ images: imgs });
        } else {
          console.warn('没有拉到首页轮播图，images 为空');
        }
      })
      .catch(err => {
        console.error('load banner images failed', err);
      });
  },

  // ===== 顶部“最新项目”列表（只要 3 个） =====
  loadTopProjects() {
    projectService.fetchLatestProjects(3)
      .then(list => {
        const projects = (list || []).map(p => {
          const title = p.projectName || p.title || '项目';

          // ✨ 优先活动日期 eventDate，没有就用 createdAt
          const rawEvent   = p.eventDate || p.event_date;
          const rawCreated = p.createdAt || p.created_at || p.date || '';

          const day = formatDay(rawEvent || rawCreated);
          let dateLabel = '';
          if (day) {
            // 有活动时间 -> 开展于；否则 -> 创建于
            dateLabel = (rawEvent ? '开展于 ' : '创建于 ') + day;
          }

          const status = p.status || '已完结';
          const statusClass = status === '进行中' ? 'status-active' : 'status-finished';

          // 封面：项目自己的封面，没有就用「待上传」
          const cover = this.getCoverImage(p) || PLACEHOLDER_COVER;

          return {
            id: p.id,
            title,
            date: dateLabel,
            status,
            statusClass,
            src: cover
          };
        });

        this.setData({ topProjects: projects });
      })
      .catch(err => {
        console.error('load top projects failed', err);
      });
  },

  // 首页用的封面图规则，和 detail 页保持一致的思路
  getCoverImage(p) {
    if (p.coverThumbUrl || p.coverUrl) {
      return normalizeUrl(p.coverThumbUrl || p.coverUrl);
    }
    // 列表接口一般不会带 photos，这里就不再兜底用第一张照片了
    return null;
  },

  // “更多项目”按钮
  goMore() {
    wx.navigateTo({ url: '/pages/projects/list/list' });
  },

  openProjects() {
    this.goMore();
  },

  // 点击轮播图预览（如果有绑定的话）
  previewImage(e) {
    const idx = Number(e.currentTarget.dataset.index || 0);
    const list = this.data.images || [];
    if (!list.length) return;

    // 直接跳转到 project_id = 1 的详情页，传递当前封面作为 cover 参数
    const cover = encodeURIComponent(list[idx] || '');
    wx.navigateTo({ url: `/pages/projects/detail?id=1&cover=${cover}` });
  },

  // 点击 mini 项打开详情
  openDetail(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.topProjects[idx];
    if (!item) return;

    console.log('openDetail item:', item);

    // 把首页的封面图一并传给详情页
    const cover = encodeURIComponent(item.src || '');

    wx.navigateTo({
      url: `/pages/projects/detail?id=${item.id}&cover=${cover}`
    });
  },

  // 若 wxml 里对 mini-image 绑定了 binderror="onImageError"，需要这个方法避免警告
  onImageError(e) {
    const idx = e.currentTarget.dataset.index;
    console.warn('mini image load error', idx, e.detail);
  },

  // ===== 中转站三个按钮的事件（首页里可以先做占位） =====
  onFabConfirm() {
    const all = transferStore.getAll();
    console.log('中转站确认选择：', all);
    wx.showToast({
      title: `已确认 ${all.length} 张照片`,
      icon: 'none'
    });
    // 这里先不清空，等你确认需求后再决定逻辑
  },

  onFabCancel() {
    transferStore.clear();
    wx.showToast({
      title: '已清空中转站',
      icon: 'none'
    });
  },

  onFabDownload() {
    const all = transferStore.getAll();
    if (!all.length) {
      wx.showToast({
        title: '还没有选中照片',
        icon: 'none'
      });
      return;
    }
    console.log('准备下载这些照片：', all);
    wx.showToast({
      title: `准备下载 ${all.length} 张`,
      icon: 'none'
    });
    // 后续可以在这里调用后端接口生成 zip 或跳转到“下载确认页”
  }
});
