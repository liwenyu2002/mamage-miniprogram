Page({
  data: {
    selected: []
  },

  onLoad() {},

  // 选择图片（简单示例：选择并显示数量提示）
  chooseImage() {
    const self = this;
    wx.chooseImage({ count: 9, sizeType: ['compressed'], sourceType: ['album', 'camera'], success(res) {
      const files = res.tempFilePaths || [];
      self.setData({ selected: files });
      wx.showToast({ title: `已选择 ${files.length} 张`, icon: 'none' });
      // TODO: 上传到云或其他处理
    }, fail() {
      wx.showToast({ title: '选择取消', icon: 'none' });
    } });
  },

  // 发布任务（示例行为：弹出输入提示，然后确认）
  publishTask() {
    // 临时改为跳转到调试页面以排查真机问题
    wx.navigateTo({ url: '/pages/debug/test' });
  }
});