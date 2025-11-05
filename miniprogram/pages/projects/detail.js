Page({
  data: {
    title: '',
    date: '',
    status: '',
    statusClass: '',
    creator: '示例用户',
    src: ''
  },

  onLoad(options) {
    // 解析传入的数据
    if (options && options.data) {
      try {
        const item = JSON.parse(decodeURIComponent(options.data));
        this.setData({
          title: item.title || '项目',
          date: item.date || '',
          status: item.status || '',
          statusClass: item.statusClass || '',
          src: item.src || '',
          creator: item.creator || '示例用户'
        });
      } catch (e) {
        console.error('解析项目数据失败', e);
      }
    }
  }
});