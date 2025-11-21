Component({
  properties: {
    selectedCount: {
      type: Number,
      value: 0
    }
  },

  data: {
    fabExpanded: false,
    fabTop: 0,   // px
    fabRight: 0  // px
  },

  lifetimes: {
    attached() {
      // 初始化位置：右侧居中
      const sys = wx.getSystemInfoSync();
      const windowWidth = sys.windowWidth;
      const windowHeight = sys.windowHeight;

      // 按照 112rpx 算按钮尺寸
      const fabSizeRpx = 112;
      const fabSizePx = fabSizeRpx * windowWidth / 750;

      // 距右边 24rpx
      const marginRightRpx = 24;
      const marginRightPx = marginRightRpx * windowWidth / 750;
 // ✅ 往上挪一点，比如 80rpx（你可以自己改大改小）
      const offsetUpRpx = 100;
      const offsetUpPx = offsetUpRpx * windowWidth / 750;

      let top = (windowHeight - fabSizePx) / 2 - offsetUpPx;
      if (top < 0) top = 0; // 别挪出屏幕
      const right = marginRightPx;

      this.windowWidth = windowWidth;
      this.windowHeight = windowHeight;
      this.fabSizePx = fabSizePx;

      this.setData({
        fabTop: top,
        fabRight: right
      });
    }
  },

  methods: {
    // 展开/收起
    toggleFab() {
      this.setData({
        fabExpanded: !this.data.fabExpanded
      });
    },

    onMaskTap() {
      this.setData({ fabExpanded: false });
    },

    // ========= 拖动 + 点击统一处理 =========
    onFabTouchStart(e) {
      const t = e.touches[0];
      this._startX = t.clientX;
      this._startY = t.clientY;
      this._startTop = this.data.fabTop;
      this._startRight = this.data.fabRight;
      this._dragMoved = false;
    },

    onFabTouchMove(e) {
      const t = e.touches[0];
      const deltaX = t.clientX - this._startX;
      const deltaY = t.clientY - this._startY;

      // 移动超过 5px 就认为是在拖动
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        this._dragMoved = true;
      }

      // 拖动更新位置（右侧坐标注意方向）
      let newTop = this._startTop + deltaY;
      let newRight = this._startRight - deltaX;

      // 边界限制
      const maxTop = this.windowHeight - this.fabSizePx;
      const minTop = 0;
      if (newTop < minTop) newTop = minTop;
      if (newTop > maxTop) newTop = maxTop;

      const maxRight = this.windowWidth - this.fabSizePx; // 最远拖到左边
      const minRight = 0; // 紧贴右边
      if (newRight < minRight) newRight = minRight;
      if (newRight > maxRight) newRight = maxRight;

      this.setData({
        fabTop: newTop,
        fabRight: newRight
      });
    },
      onConfirmTap() {
          console.log('[transfer-fab] confirm tapped');
          this.triggerEvent('confirm');
        },

        onCancelTap() {
          console.log('[transfer-fab] cancel tapped');
          this.triggerEvent('cancel');
        },

        onDownloadTap() {
          console.log('[transfer-fab] download tapped');
          this.triggerEvent('download');
        },
    onFabTouchEnd() {
      // 如果没怎么移动，当作点击：展开/收起
      if (!this._dragMoved) {
        this.toggleFab();
      }
      this._dragMoved = false;
    }
  }
});
