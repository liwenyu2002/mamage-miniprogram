// pages/index/index.js

const photoService = require('../../utils/photoService.js');
const projectService = require('../../utils/projectService.js');
const { BASE_URL } = require('../../utils/request.js');

function normalizeUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('/')) return (BASE_URL || '').replace(/\/$/, '') + u;
  return (BASE_URL || '').replace(/\/$/, '') + '/' + u;
}

Page({
  data: {
    // 首页轮播图（从后端拉）
    images: [],
    // 首页展示的“最新项目卡片”
    topProjects: []
  },

  onLoad() {
    this.loadBannerImages();
    this.loadTopProjects();
  },

  // ===== 轮播图 =====
  loadBannerImages() {
    // 取最新 4 张照片
    photoService.fetchLatestByType(null, 4)
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
          const rawDate = p.createdAt || '';
          const date = rawDate ? rawDate.slice(0, 10) : '';
          const title = p.projectName || p.title || '项目';
          const status = p.status || '已完结';
          const statusClass = status === '进行中' ? 'status-active' : 'status-finished';

          // 统一封面图获取规则：优先缩略图，其次原图
          const cover = this.getCoverImage(p);

          return {
            id: p.id,
            title,
            date,
            status,
            statusClass,
            src: cover
          };
        }).filter(item => item.src); // 没封面图的先过滤掉

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
    wx.navigateTo({ url: '/pages/projects/list/list' }); // 按你实际路径来
  },

  openProjects() {
    this.goMore();
  },

  // 点击 mini 项打开详情
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
    }

});
