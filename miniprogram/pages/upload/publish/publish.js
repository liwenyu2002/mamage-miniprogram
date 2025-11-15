// pages/upload/publish/publish.js

Page({
  data: {
    // 如果以后从某个项目跳过来，可以带 projectId；现在可以先不管
    projectId: null
  },

  onLoad(options) {
    const projectId = options && options.projectId ? Number(options.projectId) : null;
    if (projectId) {
      this.setData({ projectId });
    }
  },

  // 跳到“上传到项目”页面（真正干活的那个页面）
  goUploadToProject() {
    const pid = this.data.projectId;

    const url = pid
      ? `/pages/upload/upload_to_project/upload_to_project?projectId=${pid}`
      : `/pages/upload/upload_to_project/upload_to_project`;

    wx.navigateTo({ url });
  },

  // 如果你以后想加“快速从相册选几张然后再去选择项目”，可以用这个
  quickChooseAndGo() {
    const self = this;
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const files = res.tempFilePaths || [];
        wx.showToast({
          title: `已选择 ${files.length} 张，将前往选择项目`,
          icon: 'none'
        });

        // 这里先简单直接跳到上传页，让 upload_to_project 自己处理选择项目+上传
        self.goUploadToProject();
      },
      fail() {
        wx.showToast({ title: '选择取消', icon: 'none' });
      }
    });
  }
});
