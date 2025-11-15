// app.js
App({
  onLaunch: function () {
    // 尝试创建本地日志目录和占位日志文件，避免真机运行时因缺失路径报错
    try {
      const fs = wx.getFileSystemManager();
      const logDirPath = `${wx.env.USER_DATA_PATH}/miniprogramLog`;
      const logFiles = ['log1', 'log2', 'log3'];

      // 检查并创建目录
      fs.access({
        path: logDirPath,
        success: () => {
          // 目录存在，确保文件存在
          logFiles.forEach(name => {
            const filePath = `${logDirPath}/${name}`;
            fs.access({
              path: filePath,
              success: () => {},
              fail: () => {
                // 创建空文件
                try { fs.writeFileSync ? fs.writeFileSync(filePath, '') : fs.writeFile({filePath, data: ''}); } catch (e) { try { fs.writeFile({filePath, data: ''}); } catch (err) {} }
              }
            });
          });
        },
        fail: () => {
          // 目录不存在，创建目录并写入文件
          fs.mkdir({
            dirPath: logDirPath,
            success: () => {
              logFiles.forEach(name => {
                const filePath = `${logDirPath}/${name}`;
                try { fs.writeFileSync ? fs.writeFileSync(filePath, '') : fs.writeFile({filePath, data: ''}); } catch (e) { try { fs.writeFile({filePath, data: ''}); } catch (err) {} }
              });
            },
            fail: (err) => {
              console.warn('创建日志目录失败', err);
            }
          });
        }
      });
    } catch (e) {
      // 在某些环境下 wx.getFileSystemManager 可能不存在，忽略错误
      console.warn('初始化本地日志目录时出错', e);
    }

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
});
