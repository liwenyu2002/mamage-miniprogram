// app.js
"use strict";

// 模板风格的 app 定义，兼容小程序运行时的 App(...) 调用
const _sfc_main = {
  onLaunch: function() {
    console.log("App Launch");

    // 检查并创建文件
    try {
      const fs = wx.getFileSystemManager();
      const logDirPath = `${wx.env.USER_DATA_PATH}/miniprogramLog`;
      const logFiles = ['log1', 'log2', 'log3', 'log4'];

      // 创建目录
      fs.access({
        path: logDirPath,
        success: () => {
          console.log('Directory exists');
          checkAndCreateFiles();
        },
        fail: () => {
          console.log('Directory does not exist, creating it');
          fs.mkdir({
            dirPath: logDirPath,
            success: () => {
              console.log('Directory created successfully');
              checkAndCreateFiles();
            },
            fail: err => {
              console.error('Failed to create directory', err);
            }
          });
        }
      });

      function checkAndCreateFiles() {
        logFiles.forEach(logFile => {
          const logFilePath = `${logDirPath}/${logFile}`;
          fs.access({
            path: logFilePath,
            success: () => {
              console.log(`${logFile} exists`);
            },
            fail: () => {
              console.log(`${logFile} does not exist, creating it`);
              fs.writeFile({
                filePath: logFilePath,
                data: '',
                success: res => {
                  console.log(`${logFile} created successfully`);
                },
                fail: err => {
                  console.error(`Failed to create ${logFile}`, err);
                }
              });
            }
          });
        });
      }
    } catch (e) {
      console.warn('File system API not available or error during log init', e);
    }

    // 原有云初始化与全局配置
    this.globalData = {
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
  onShow: function() {
    console.log("App Show");
  },
  onHide: function() {
    console.log("App Hide");
  }
};

// 兼容模板导出：导出 createApp 并同时调用小程序运行时的 App
function createApp() {
  return { app: _sfc_main };
}

// 注册小程序应用
App(_sfc_main);

module.exports = { createApp };
