// pages/functions/functions.js
Page({
  data: {
    features: [
      {
        key: 'createProject',
        title: '新建项目',
        icon: '🆕'
      },
      {
        key: 'uploadPhoto',
        title: '我要上传',
        icon: '📸'
      },
      {
        key: 'aiNews',
        title: '图生新闻',
        icon: '📰'
      }
    ]
  },

  onLoad() {},

  onFeatureTap(e) {
    const key = e.currentTarget.dataset.key;

    switch (key) {
      case 'createProject':
        // 跳转到发布/新建项目页面
        wx.navigateTo({ url: '/pages/upload/publish/publish' });
        break;

      case 'uploadPhoto':
        // 跳转到项目列表页（上传入口处也可以从列表进入）
        wx.navigateTo({ url: '/pages/projects/list/list' });
        break;

      case 'aiNews':
        wx.showToast({
          title: '图生新闻（待开发）',
          icon: 'none'
        });
        // 将来你可以这样：
        // wx.navigateTo({ url: '/pages/ai-news/index/index' });
        break;

      default:
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
    }
  }
});
