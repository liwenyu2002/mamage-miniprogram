Page({
  data: {
    code: ''
  },

  onLoad(options) {
    const code = options.code || '';
    this.setData({ code });
    // 小延迟后绘制二维码占位（使用 canvas 绘制简单图样和邀请码文字）
    setTimeout(() => this.drawPlaceholder(code), 120);
  },

  drawPlaceholder(code) {
    try {
      const res = wx.getSystemInfoSync();
      const dpr = res.pixelRatio || 1;
      // canvas style is 360rpx; convert to px: 360rpx ~= 360 * (windowWidth/750) px
      const canvasWidthPx = Math.floor((360 * res.windowWidth) / 750);
      const canvasId = 'qrCanvas';
      const ctx = wx.createCanvasContext(canvasId, this);

      // clear
      ctx.setFillStyle('#ffffff');
      ctx.fillRect(0, 0, canvasWidthPx, canvasWidthPx);

      // draw simple QR-like patterns (corner squares)
      ctx.setFillStyle('#000000');
      const s = Math.floor(canvasWidthPx * 0.12);
      // top-left
      ctx.fillRect(10, 10, s, s);
      ctx.fillRect(10 + s + 6, 10, s, s);
      ctx.fillRect(10, 10 + s + 6, s, s);
      // top-right
      ctx.fillRect(canvasWidthPx - 10 - s, 10, s, s);
      ctx.fillRect(canvasWidthPx - 10 - s - s - 6, 10, s, s);
      ctx.fillRect(canvasWidthPx - 10 - s, 10 + s + 6, s, s);
      // bottom-left
      ctx.fillRect(10, canvasWidthPx - 10 - s, s, s);
      ctx.fillRect(10 + s + 6, canvasWidthPx - 10 - s, s, s);
      ctx.fillRect(10, canvasWidthPx - 10 - s - s - 6, s, s);

      // draw code text centered
      ctx.setFontSize(14);
      ctx.setFillStyle('#000000');
      const text = code || '';
      const textX = canvasWidthPx / 2;
      const textY = canvasWidthPx / 2 + 6;
      ctx.setTextAlign('center');
      ctx.fillText(text, textX, textY);

      ctx.draw();
    } catch (e) {
      console.warn('drawPlaceholder error', e);
    }
  },

  onCopy() {
    const code = this.data.code || '';
    if (!code) {
      wx.showToast({ title: '无可复制的邀请码', icon: 'none' });
      return;
    }
    wx.setClipboardData({ data: code, success() { wx.showToast({ title: '已复制' }); } });
  },

  onSave() {
    const canvasId = 'qrCanvas';
    wx.showLoading({ title: '保存中...' });
    wx.canvasToTempFilePath({ canvasId, success: (res) => {
      const tmp = res.tempFilePath;
      wx.saveImageToPhotosAlbum({ filePath: tmp, success() {
        wx.hideLoading();
        wx.showToast({ title: '已保存到相册' });
      }, fail: (err) => {
        wx.hideLoading();
        // 处理未授权情况
        if (err && err.errMsg && err.errMsg.includes('auth')) {
          wx.showModal({ title: '需要授权', content: '请允许保存图片到相册', showCancel: false, success() {
            // 引导用户在设置中授权
            wx.openSetting();
          } });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      } });
    }, fail: (e) => {
      wx.hideLoading();
      wx.showToast({ title: '生成图片失败', icon: 'none' });
    }, complete: () => {} }, this);
  }
});
