Page({
  data: {
    // 全部图片（来自 images/latest_album）
    allImages: [
      'https://mamage-album.oss-cn-beijing.aliyuncs.com/latest_album/1.png',
      'https://mamage-album.oss-cn-beijing.aliyuncs.com/latest_album/2.png',
      'https://mamage-album.oss-cn-beijing.aliyuncs.com/latest_album/3.png',
      'https://mamage-album.oss-cn-beijing.aliyuncs.com/latest_album/4.png',
      'https://mamage-album.oss-cn-beijing.aliyuncs.com/latest_album/5.png',
      'https://mamage-album.oss-cn-beijing.aliyuncs.com/latest_album/6.png',
      'https://mamage-album.oss-cn-beijing.aliyuncs.com/latest_album/7.png',
    ],
    items: [],
    nextIndex: 0,
  },

  onLoad() {
    // 初始化显示前 5 张（如不足则显示全部）
    const count = Math.min(5, this.data.allImages.length);
    const items = [];
    for (let i = 0; i < count; i++) {
      items.push(this._makeItem(i));
    }
    this.setData({ items, nextIndex: count });
  },

  // 生成临时标题和日期
  _makeItem(i) {
    const src = this.data.allImages[i];
    const date = this._fakeDate(i);
    const title = `项目示例 ${i + 1}`;
    // 随机分配状态：进行中 或 已完结
    const status = Math.random() < 0.5 ? '进行中' : '已完结';
    const statusClass = status === '进行中' ? 'status-active' : 'status-finished';
    return { src, date, title, status, statusClass };
  },

  _fakeDate(i) {
    // 简单生成最近日期：今天往前推 i 天
    const d = new Date();
    d.setDate(d.getDate() - i);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${d.getFullYear()}-${m.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  },

  // 预览图片
  // 打开项目详情页，传递该项目数据
  openDetail(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.items[idx];
    const q = encodeURIComponent(JSON.stringify(item));
    wx.navigateTo({ url: `/pages/projects/detail?data=${q}` });
  },

  // 下拉加载更多（每次加载两个）
  onPullDownRefresh() {
    const next = this.data.nextIndex;
    if (next >= this.data.allImages.length) {
      wx.showToast({ title: '没有更多图片了', icon: 'none' });
      wx.stopPullDownRefresh();
      return;
    }
    const toLoad = Math.min(2, this.data.allImages.length - next);
    const newItems = [];
    for (let i = 0; i < toLoad; i++) {
      newItems.push(this._makeItem(next + i));
    }
    const items = this.data.items.concat(newItems);
    this.setData({ items, nextIndex: next + toLoad }, () => {
      wx.stopPullDownRefresh();
      wx.showToast({ title: `已加载 ${toLoad} 张`, icon: 'none' });
    });
  }
});