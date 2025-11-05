Page({
  data: {
    name: '',
    endDate: ''
  },

  onLoad() {},

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ endDate: e.detail.value });
  },

  onPublish() {
    const { name, endDate } = this.data;
    if (!name || !name.trim()) {
      wx.showToast({ title: '任务名称为必填项', icon: 'none' });
      return;
    }

    // 简单示例：模拟发布并返回上一页
    wx.showLoading({ title: '发布中...' });
    setTimeout(() => {
      wx.hideLoading();
      // 生成一个简单的邀请码（8位字母数字）
      const code = Math.random().toString(36).slice(2, 10).toUpperCase();
      // 跳转到发布成功页并带上 code，成功页负责绘制二维码并提供复制/保存功能
      wx.navigateTo({ url: `/pages/upload/publish_success/publish_success?code=${code}` });
    }, 800);
  }
});
