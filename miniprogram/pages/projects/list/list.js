// pages/projects/list/list.js
const projectService = require('../../../utils/projectService.js');
const { BASE_URL } = require('../../../utils/request.js');

// 和首页一样的 URL 处理
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

const PLACEHOLDER_COVER = normalizeUrl('/uploads/assets/daishangchuan.png');

// 日期 + 前缀文案
function buildDateDisplay(p) {
  const rawDate = p.eventDate || p.createdAt || p.date || '';
  const dateOnly = rawDate ? String(rawDate).slice(0, 10) : '';
  const prefix = p.eventDate ? '开展于 ' : '创建于 ';
  return {
    dateOnly,
    display: prefix + (dateOnly || '未知日期')
  };
}

// 封面图规则：coverThumbUrl / coverUrl -> 占位
function getCover(p) {
  if (p.coverThumbUrl || p.coverUrl) {
    return normalizeUrl(p.coverThumbUrl || p.coverUrl);
  }
  return PLACEHOLDER_COVER;
}

Page({
  data: {
    keyword: '',        // 当前搜索关键字
    page: 1,
    pageSize: 6,
    hasMore: true,
    loading: false,
    projects: [],
    isSearching: false, // 现在有没有在搜索模式
    noResult: false     // 是否没有结果，用来显示“暂无相关项目”
  },

  onLoad() {
    this.loadProjects(true);
  },

  // ===== 列表加载 =====
  async loadProjects(reset = false) {
    if (this.data.loading) return;
    if (!reset && !this.data.hasMore) return;

    this.setData({ loading: true });

    const page = reset ? 1 : this.data.page;
    const { pageSize, keyword } = this.data;

    try {
      const { list, hasMore } = await projectService.fetchProjectList({
        page,
        pageSize,
        keyword
      });

      const arr = Array.isArray(list) ? list : [];

      const mapped = arr.map(p => {
        const { dateOnly, display } = buildDateDisplay(p);
        return {
          id: p.id,
          title: p.projectName || p.title || '项目',
          date: dateOnly,
          dateDisplay: display,
          src: getCover(p)
        };
      });

      const newProjects = reset
        ? mapped
        : (this.data.projects || []).concat(mapped);

      this.setData({
        projects: newProjects,
        page: page + 1,
        hasMore,
        loading: false,
        noResult: !newProjects.length
      });
    } catch (err) {
      console.error('loadProjects error', err);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // ===== 搜索相关 =====

  // 真正的输入处理函数
  onSearchInput(e) {
    const value = (e.detail.value || '').trim();
    this.setData({ keyword: value });
  },

  // 真正的搜索触发函数
  onSearchConfirm() {
    this.setData({ isSearching: !!this.data.keyword });
    this.loadProjects(true);
  },

  // 兼容 WXML 里写的 onInputChange / onSearchTap
  onInputChange(e) {
    this.onSearchInput(e);
  },
  onSearchTap() {
    this.onSearchConfirm();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadProjects(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 滚动到底部加载更多
  onReachBottom() {
    this.loadProjects(false);
  },

  // 点击某个项目卡片，跳详情
  openDetail(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.projects[idx];
    if (!item) return;

    const cover = encodeURIComponent(item.src || '');
    wx.navigateTo({
      url: `/pages/projects/detail?id=${item.id}&cover=${cover}`
    });
  }
});
