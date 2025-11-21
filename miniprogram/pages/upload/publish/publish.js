// pages/upload/publish/publish.js

const { request } = require('../../../utils/request.js');

Page({
  data: {
    projectId: null,
    projectName: '',
    description: '',
    eventDate: '', // YYYY-MM-DD (开展日期)
    submitting: false
  },

  onLoad(options) {
    // 如果有来自其他页面传来的 data，尝试解析（保留兼容）
    if (options && options.data) {
      try {
        const d = JSON.parse(decodeURIComponent(options.data));
        if (d) {
          if (d.projectId) this.setData({ projectId: Number(d.projectId) });
          if (d.selected && Array.isArray(d.selected)) this.setData({ selected: d.selected });
          if (d.uploaded && Array.isArray(d.uploaded)) this.setData({ uploaded: d.uploaded });
        }
      } catch (e) {
        console.warn('publish onLoad parse data failed', e);
      }
    }
  },

  onNameInput(e) {
    this.setData({ projectName: e.detail.value });
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ eventDate: e.detail.value });
  },

  // 确认发布：校验必填项并调用后端创建项目接口
  async confirmPublish() {
    const { projectName, description, eventDate, submitting } = this.data;
    if (submitting) return;
    if (!projectName || !projectName.trim()) {
      return wx.showToast({ title: '项目名称为必填项', icon: 'none' });
    }
    // 使用开展日期字段（YYYY-MM-DD），接口参考 detail 页面使用的 `eventDate`
    const payload = {
      projectName: projectName.trim(),
      description: description || '',
      eventDate: eventDate || null
    };

    this.setData({ submitting: true });
    try {
      // 这里假设后端有 POST /api/projects 创建项目
      const resp = await request('/api/projects', { method: 'POST', data: payload });
      console.log('create project resp', resp);
      wx.showToast({ title: '发布成功', icon: 'success' });
      // 跳转到发布成功页面
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/upload/publish_success/publish_success' });
      }, 600);
    } catch (err) {
      console.error('create project failed', err);
      wx.showToast({ title: '发布失败，请稍后重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
