// app.js
App({
  onLaunch: function () {
    this.globalData = {
      // env 参数说明：
      //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
      //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
      //   如不填则使用默认环境（第一个创建的环境）
      env: ""
    };
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }
  },

  // 全局错误处理：静默特定的设备日志读取错误，减少真机控制台噪声
  onError(err) {
    try {
      const msg = typeof err === 'string' ? err : (err && err.message) ? err.message : JSON.stringify(err);
      if (msg && msg.indexOf('wxfile://usr/miniprogramLog') !== -1) {
        // 这是微信运行时/原生模块尝试读取设备日志路径产生的错误，通常不影响业务
        console.warn('Suppressed device log access error:', msg);
        return;
      }
      // 其余错误仍然打印并上报（如需，可集成上报到你们的错误收集系统）
      console.error('App onError:', err);
    } catch (e) {
      console.error('onError handler failed', e);
    }
  }
});
