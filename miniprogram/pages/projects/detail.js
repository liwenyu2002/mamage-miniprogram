// pages/projects/detail.js

const projectService = require('../../utils/projectService.js');
const { BASE_URL } = require('../../utils/request.js');

function normalizeUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) {
    if (/^http:\/\//i.test(u) && /^https:\/\//i.test(BASE_URL)) {
      const path = u.replace(/^https?:\/\/[^\/]+/i, '');
      return (BASE_URL || '').replace(/\/$/, '') + path;
    }
    return u;
  }
  if (u.startsWith('/')) return (BASE_URL || '').replace(/\/$/, '') + u;
  return (BASE_URL || '').replace(/\/$/, '') + '/' + u;
}

Page({
  data: {
    title: '',
    date: '',
    status: '',
    statusClass: '',
    creator: '示例用户',
    src: '',          // 顶部大封面图
    images: [],       // 项目照片列表
    description: '',
    projectId: null,
    projectData: null
  },

  onLoad(options) {
    // 1. 从 URL 里拿 id 和首页传过来的封面 cover
    const projectId = options && options.id ? Number(options.id) : null;
    const coverFromList = options && options.cover
      ? decodeURIComponent(options.cover)
      : '';

    // 先用首页传来的封面图，确保视觉一致
    if (coverFromList) {
      this.setData({ src: normalizeUrl(coverFromList) });
    }

    if (projectId) {
      this.loadProjectById(projectId);
    } else {
      console.warn('detail 页面缺少 project id');
    }
  },

  // 按 id 从后端加载项目详情
  async loadProjectById(id) {
    try {
      const proj = await projectService.getProjectById(id);
      console.log('project detail fetched for id', id, proj);
      if (!proj) return;

      const title  = proj.projectName || proj.title || '项目';
      const date   = proj.createdAt || proj.date || '';
      const status = proj.status || '已完结';
      const statusClass = status === '进行中' ? 'status-active' : 'status-finished';
      const creator = proj.creator || '示例用户';
      const description = proj.description || '';

      // 组装画廊图片
      let images = [];
      if (proj.photoThumbUrls && proj.photoThumbUrls.length) {
        images = proj.photoThumbUrls.map(normalizeUrl).filter(Boolean);
      } else if (proj.photos && proj.photos.length) {
        images = proj.photos
          .map(p => normalizeUrl(p.thumbUrl || p.url))
          .filter(Boolean);
      } else if (proj.photoUrls && proj.photoUrls.length) {
        images = proj.photoUrls.map(normalizeUrl).filter(Boolean);
      }

      // 计算封面：
      // 1）如果 onLoad 已经有 src（来自首页），就优先用它；
      // 2）否则用后端的 coverThumbUrl/coverUrl；
      // 3）再否则用 images 的第一张兜底。
      let cover = this.data.src;
      if (!cover && (proj.coverThumbUrl || proj.coverUrl)) {
        cover = normalizeUrl(proj.coverThumbUrl || proj.coverUrl);
      }
      if (!cover && images.length) {
        cover = images[0];
      }

      this.setData({
        title,
        date,
        status,
        statusClass,
        creator,
        description,
        src: cover,
        images,
        projectId: id,
        projectData: proj
      });
    } catch (err) {
      console.error('getProjectById error', err);
    }
  },

  // “我要补充照片”按钮
  goSupplementPhotos() {
    const id = this.data.projectId;
    const data = this.data.projectData;
    if (id) {
      wx.navigateTo({
        url: `/pages/upload/upload_to_project/upload_to_project?projectId=${id}`
      });
    } else if (data) {
      const arg = encodeURIComponent(JSON.stringify(data));
      wx.navigateTo({
        url: `/pages/upload/upload_to_project/upload_to_project?data=${arg}`
      });
    } else {
      wx.navigateTo({
        url: '/pages/upload/upload_to_project/upload_to_project'
      });
    }
  },

  // 点击预览图片
  previewImage(e) {
    const idx = e.currentTarget.dataset.index || 0;
    const list = this.data.images || (this.data.src ? [this.data.src] : []);
    if (!list.length) return;

    wx.previewImage({
      current: list[idx],
      urls: list
    });
  }
});
