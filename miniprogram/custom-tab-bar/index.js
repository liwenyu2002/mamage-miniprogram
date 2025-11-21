Component({
  data: {
    selected: 0
  },
  lifetimes: {
    attached() {
      this.updateSelected();
    }
  },
  methods: {
    updateSelected() {
      const pages = getCurrentPages();
      // pages 可能为空（组件初始化时或特殊子上下文），做安全检查
      if (!pages || pages.length === 0) {
        return;
      }
      const current = pages[pages.length - 1];
      if (!current || !current.route) {
        return;
      }
      const route = `/${current.route}`;
      let selected = -1;
      if (route === '/pages/index/index') selected = 0;
      else if (route === '/pages/function/function') selected = 1;
      else if (route === '/pages/profile/profile') selected = 2;
      this.setData({ selected });
    },
    switchTab(e) {
      const path = e.currentTarget.dataset.path;
      wx.switchTab({ url: path });
    }
  }
});