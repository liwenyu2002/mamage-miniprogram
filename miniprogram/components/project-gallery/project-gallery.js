Component({
  properties: {
    images: { type: Array, value: [] }
  },
  methods: {
    previewImage(e) {
      const idx = e.currentTarget.dataset.index || 0;
      const list = this.data.images || [];
      wx.previewImage({ current: list[idx], urls: list });
    }
  }
});
