// app.js
"use strict";

// 模板风格的 app 定义，兼容小程序运行时的 App(...) 调用
const _sfc_main = {
  onLaunch: function() {
    console.log("App Launch");

    // Wrap file system manager to dynamically create missing files when accessed
    try {
      if (wx.getFileSystemManager) {
        const origFs = wx.getFileSystemManager();
        const normalize = p => (typeof p === 'string' && p.startsWith('wxfile://')) ? p.replace('wxfile://', '') : p;

        // override access to attempt to create missing files dynamically
        const origAccess = origFs.access.bind(origFs);
        origFs.access = function(opts = {}) {
          try {
            const userPath = opts.path || opts.filePath;
            const path = normalize(userPath || '');
            const success = opts.success;
            const fail = opts.fail;

            const wrapped = Object.assign({}, opts);
            wrapped.path = path;
            wrapped.success = function(res) {
              if (typeof success === 'function') success(res);
            };
            wrapped.fail = function(err) {
              // Attempt to create parent directory and an empty file, then call success
              try {
                const idx = path.lastIndexOf('/');
                const parent = idx > 0 ? path.substring(0, idx) : path;
                origFs.mkdir({
                  dirPath: parent,
                  success: () => {
                    origFs.writeFile({ filePath: path, data: '', success: () => { if (typeof success === 'function') success({}); }, fail: () => { if (typeof fail === 'function') fail(err); } });
                  },
                  fail: () => {
                    // mkdir failed or not needed, still try to write file
                    origFs.writeFile({ filePath: path, data: '', success: () => { if (typeof success === 'function') success({}); }, fail: () => { if (typeof fail === 'function') fail(err); } });
                  }
                });
              } catch (e) {
                if (typeof fail === 'function') fail(e);
              }
            };

            return origAccess(wrapped);
          } catch (e) {
            if (typeof opts.fail === 'function') opts.fail(e);
          }
        };
      }
    } catch (e) {
      console.warn('fs wrapper install failed', e);
    }

    // 检查并创建文件
    try {
      const fs = wx.getFileSystemManager();
      const logDirPath = `${wx.env.USER_DATA_PATH}/miniprogramLog`;
      const logFiles = ['log1','log2','log3','log4','log5','log6','log7','log8','log9','log10'];

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
