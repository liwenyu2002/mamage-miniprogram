// pages/upload/upload_to_project/upload_to_project.js

const projectService = require('../../../utils/projectService.js');
const { BASE_URL } = require('../../../utils/request.js');

const PAGE_SIZE = 3; // 每次多加载 3 个项目

Page({
  data: {
    // 项目搜索
    searchText: '',
    allProjects: [],      // 当前从后端拉到的所有项目（最新在前）
    displayProjects: [],  // 经过搜索过滤后要显示的项目
    loadedCount: 0,       // 当前已经拉了多少个
    loadingMore: false,

    // 当前选中的项目
    selectedProjectId: null,
    selectedProjectName: '',

    // 图片上传相关
    images: [],           // 选中的本地图片 tempFilePaths
    uploading: false
  },

  onLoad(options) {
    // 如果是从 detail 页面跳来的，可以带 projectId 和 projectName
    const projectId = options && options.projectId
      ? Number(options.projectId)
      : null;
    const projectName = options && options.projectName
      ? decodeURIComponent(options.projectName)
      : '';

    this.setData({
      selectedProjectId: projectId,
      selectedProjectName: projectName || '',
      searchText: projectName || ''
    });

    // 初次加载最新 5 个项目
    this.loadMoreProjects();
  },

  // ===== 项目列表相关 =====

  // 向后端要更多项目（每次增加 PAGE_SIZE）
  loadMoreProjects() {
    if (this.data.loadingMore) return;

    const newLimit = this.data.loadedCount + PAGE_SIZE;

    this.setData({ loadingMore: true });

    projectService.fetchLatestProjects(newLimit)
      .then(list => {
        const projects = list || [];
        this.setData({
          allProjects: projects,
          loadedCount: projects.length
        });
        this.applyFilter(); // 按当前搜索词过滤
      })
      .catch(err => {
        console.error('loadMoreProjects failed', err);
        wx.showToast({ title: '加载项目失败', icon: 'none' });
      })
      .then(() => {
        this.setData({ loadingMore: false });
      });
  },

  // 根据 searchText 过滤 allProjects
  applyFilter() {
    const kw = (this.data.searchText || '').trim().toLowerCase();
    let display = this.data.allProjects;

    if (kw) {
      display = display.filter(p => {
        const name = (p.projectName || p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return name.includes(kw) || desc.includes(kw);
      });
    }

    this.setData({ displayProjects: display });
  },

  // 搜索框输入
  onSearchInput(e) {
    const value = e.detail.value || '';
    this.setData({ searchText: value }, () => {
      this.applyFilter();
    });
  },

  // 页面滚动到底部时触发，继续加载更多项目
  onReachBottom() {
    this.loadMoreProjects();
  },

  // 点击项目列表选中项目
  selectProject(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;

    this.setData({
      selectedProjectId: id,
      selectedProjectName: name,
      searchText: name // 顺便把搜索框也填上选中的项目名
    });
  },

  // ===== 图片选择 & 上传 =====

  // 选择图片
  chooseImages() {
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const files = res.tempFilePaths || [];
        this.setData({ images: files });
        wx.showToast({
          title: `已选择 ${files.length} 张`,
          icon: 'none'
        });
      },
      fail: () => {
        wx.showToast({ title: '选择已取消', icon: 'none' });
      }
    });
  },

  // 上传全部图片到选中的项目
  uploadAll() {
    if (this.data.uploading) return;

    const { selectedProjectId, images } = this.data;

    if (!selectedProjectId) {
      wx.showToast({ title: '请先选择项目', icon: 'none' });
      return;
    }
    if (!images.length) {
      wx.showToast({ title: '请先选择图片', icon: 'none' });
      return;
    }

    const projectId = Number(selectedProjectId);
    this.setData({ uploading: true });

    let successCount = 0;
    let failCount = 0;

    const tasks = images.map(filePath => new Promise(resolve => {
      wx.uploadFile({
        url: `${BASE_URL}/api/upload-photo`, // ⚠️ 你的后端上传接口
        filePath,
        name: 'file',
        formData: {
          projectId,
          title: '',
          type: 'normal'
        },
        success: res => {
          successCount += 1;
          // 需要的话可以 JSON.parse(res.data) 看具体返回
          resolve(true);
        },
        fail: err => {
          console.error('upload fail', err);
          failCount += 1;
          resolve(false);
        }
      });
    }));

    Promise.all(tasks).then(() => {
      this.setData({ uploading: false });
      wx.showToast({
        title: `成功 ${successCount} 张，失败 ${failCount} 张`,
        icon: 'none'
      });

      // 上传完成后自动返回上一页（比如详情页）
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 800);
    });
  }
});
