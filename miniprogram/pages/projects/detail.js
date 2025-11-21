// pages/projects/detail.js

const projectService = require('../../utils/projectService.js');
const { BASE_URL, request } = require('../../utils/request.js');
const transferStore = require('../../utils/transferStore.js'); // 全局中转站

// 统一补全 URL
function normalizeUrl(u) {
  if (!u) return null;

  // 已经是 http/https
  if (/^https?:\/\//i.test(u)) {
    // 如果是 http 而 BASE_URL 是 https，则替换域名部分
    if (/^http:\/\//i.test(u) && /^https:\/\//i.test(BASE_URL)) {
      const path = u.replace(/^https?:\/\/[^/]+/i, '');
      return (BASE_URL || '').replace(/\/$/, '') + path;
    }
    return u;
  }

  // 相对路径
  if (u.startsWith('/')) {
    return (BASE_URL || '').replace(/\/$/, '') + u;
  }
  return (BASE_URL || '').replace(/\/$/, '') + '/' + u;
}

// 格式化日期为 YYYY-MM-DD
function formatDateToDay(v) {
  if (!v) return '';
  try {
    if (typeof v === 'string') {
      if (v.length >= 10) return v.slice(0, 10);
      return v;
    }
    const n = Number(v);
    if (!Number.isNaN(n)) {
      const date = new Date(n > 1e12 ? n : n * 1000);
      return date.toISOString().slice(0, 10);
    }
    return '';
  } catch (e) {
    return '';
  }
}

Page({
  data: {
    // 基本信息
    title: '',
    date: '',
    creator: '示例用户',
    description: '',
    src: '',                 // 顶部大封面图

    // 照片列表
    images: [],              // [{ id, url(原图), thumbUrl(缩略图), checked }]

    // 删除 / 选择模式
    deleteMode: false,
    selectedMap: {},
    selectedCount: 0,
    allSelected: false,

    // 项目信息
    projectId: null,
    projectData: null,
    eventDate: '',           // 活动日期 YYYY-MM-DD
    createdDate: '',         // 创建日期 YYYY-MM-DD

    // 内嵌上传模式
    uploadMode: false,
    stagingImages: [],
    uploading: false,

    // 编辑项目弹层
    editMode: false,
    editTitle: '',
    editDescription: '',
    editEventDate: '',

    // 中转站数量（用于悬浮按钮）
    transferCount: 0
  },

  // ================== 生命周期 ==================

  onLoad(options) {
    const projectId = options && options.id ? Number(options.id) : null;
    const coverFromList = options && options.cover
      ? decodeURIComponent(options.cover)
      : '';

    if (coverFromList) {
      this.setData({ src: normalizeUrl(coverFromList) });
    }

    if (projectId) {
      this.loadProjectById(projectId);
    } else {
      console.warn('detail 页面缺少 project id');
    }
  },

  onShow() {
    // 页面显示时，同步一次全局中转站数量
    this.setData({
      transferCount: transferStore.getCount()
    });

    // 订阅中转站变化
    this.unsubscribeTransfer = transferStore.subscribe(list => {
      this.setData({
        transferCount: list.length
      });
    });
  },

  onHide() {
    if (this.unsubscribeTransfer) {
      this.unsubscribeTransfer();
      this.unsubscribeTransfer = null;
    }
  },

  onUnload() {
    if (this.unsubscribeTransfer) {
      this.unsubscribeTransfer();
      this.unsubscribeTransfer = null;
    }
  },

  // ================== 加载项目详情 ==================

  async loadProjectById(id) {
    try {
      const proj = await projectService.getProjectById(id);
      console.log('project detail fetched for id', id, proj);
      if (!proj) return;

      const title = proj.projectName || proj.title || '项目';

      // 活动时间 + 创建时间
      const eventDate   = formatDateToDay(proj.eventDate || '');
      const createdDate = formatDateToDay(proj.createdAt || proj.date || '');
      const date        = eventDate || createdDate;

      const creator     = proj.creator || '示例用户';
      const description = proj.description || '';

      // 组装画廊图片（带 id、原图/缩略图）
      let images = [];

      if (proj.photos && proj.photos.length) {
        // 优先用 photos，因为同时有 url 和 thumbUrl
        images = proj.photos
          .map(p => {
            const originalUrl = normalizeUrl(p.url || p.thumbUrl);
            const thumbUrl = normalizeUrl(p.thumbUrl || p.url);
            return {
              id: p.id || p._id || null,
              url: originalUrl,   // 原图：预览 / 下载用
              thumbUrl,           // 缩略图：列表展示用
              checked: false
            };
          })
          .filter(it => it.url);
      } else if (proj.photoThumbUrls && proj.photoThumbUrls.length) {
        // 兜底：只有 thumb 数组的旧数据
        images = proj.photoThumbUrls
          .map((u, i) => ({
            id:
              (proj.photos &&
                proj.photos[i] &&
                (proj.photos[i].id || proj.photos[i]._id)) ||
              null,
            url: normalizeUrl(u),
            thumbUrl: normalizeUrl(u),
            checked: false
          }))
          .filter(it => it.url);
      } else if (proj.photoUrls && proj.photoUrls.length) {
        // 兜底：只有原图数组
        images = proj.photoUrls
          .map(u => {
            const originalUrl = normalizeUrl(u);
            return {
              id: null,
              url: originalUrl,
              thumbUrl: originalUrl,
              checked: false
            };
          })
          .filter(it => it.url);
      }

      // 封面：优先首页传来的 -> coverThumbUrl/coverUrl -> 第一张图
      let cover = this.data.src;
      if (!cover && (proj.coverThumbUrl || proj.coverUrl)) {
        cover = normalizeUrl(proj.coverThumbUrl || proj.coverUrl);
      }
      if (!cover && images.length) {
        cover = images[0] && images[0].url;
      }

      this.setData({
        title,
        date,
        creator,
        description,
        src: cover,
        images,
        projectId: id,
        projectData: proj,
        eventDate,
        createdDate,

        // 重置选择/删除状态
        deleteMode: false,
        selectedMap: {},
        selectedCount: 0,
        allSelected: false
      });
    } catch (err) {
      console.error('getProjectById error', err);
    }
  },

  // ================== 上传相关 ==================

  // “我要补充照片”：选择图片，进入上传预览模式
  goSupplementPhotos() {
    const self = this;
    const existing = (this.data.stagingImages || []).slice();

    wx.chooseImage({
      count: 9,
      sizeType: ['original'],          // ✅ 使用原图，避免前端压缩
      sourceType: ['album', 'camera'],
      success(res) {
        const files = res.tempFilePaths || [];
        if (!files.length) {
          return wx.showToast({ title: '未选择图片', icon: 'none' });
        }

        if (existing.length) {
          const merged = existing.slice();
          const seen = new Set(merged);
          for (const f of files) {
            if (!seen.has(f)) {
              merged.push(f);
              seen.add(f);
            }
          }
          self.setData({ stagingImages: merged, uploadMode: true });
        } else {
          self.setData({ stagingImages: files, uploadMode: true });
        }
      },
      fail() {
        wx.showToast({ title: '选择已取消', icon: 'none' });
      }
    });
  },

  // 取消上传
  cancelUpload() {
    this.setData({ uploadMode: false, stagingImages: [] });
  },

  // 确认上传
  async confirmUpload() {
    if (this.data.uploading) return;
    const images = this.data.stagingImages || [];
    if (!images.length) {
      return wx.showToast({ title: '没有要上传的图片', icon: 'none' });
    }
    const projectId = this.data.projectId;
    if (!projectId) {
      return wx.showToast({ title: '缺少 projectId，无法上传', icon: 'none' });
    }

    this.setData({ uploading: true });
    let successCount = 0;
    let failCount = 0;

    for (const filePath of images) {
      try {
        const ret = await new Promise(resolve => {
          wx.uploadFile({
            url: `${BASE_URL}/api/upload/photo`,
            filePath,
            name: 'file',
            formData: { projectId, title: '', type: 'normal' },
            success: r => resolve({ ok: true, res: r }),
            fail: e => resolve({ ok: false, err: e })
          });
        });
        if (ret.ok) successCount += 1;
        else failCount += 1;
      } catch (e) {
        console.error('upload error', e);
        failCount += 1;
      }
    }

    this.setData({ uploading: false, stagingImages: [] });
    wx.showToast({
      title: `成功 ${successCount} 张，失败 ${failCount} 张`,
      icon: 'none'
    });
    if (projectId) this.loadProjectById(projectId);
  },

  // ================== 图片浏览 / 删除 / 保存 ==================

  // 点击缩略图
  onThumbTap(e) {
    const idx = Number(e.currentTarget.dataset.index || 0);
    if (this.data.deleteMode) {
      this.toggleSelect({ currentTarget: { dataset: { index: idx } } });
      return;
    }

    // 预览用原图 url
    const list = (this.data.images || []).map(i => i.url);
    if (!list.length) return;
    wx.previewImage({ current: list[idx], urls: list });
  },

  // 切换删除模式
  toggleDeleteMode() {
    const turningOff = !!this.data.deleteMode;
    const newMode = !this.data.deleteMode;
    this.setData({ deleteMode: newMode, allSelected: false });
    if (turningOff) {
      this.setData({ selectedMap: {}, selectedCount: 0, allSelected: false });
    }
  },

  // 选中/取消选中单张
  toggleSelect(e) {
    const idx = String(
      (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.index) ||
      (e.target && e.target.dataset && e.target.dataset.index) ||
      0
    );
    const map = Object.assign({}, this.data.selectedMap || {});
    if (map[idx]) {
      delete map[idx];
    } else {
      map[idx] = true;
    }
    const count = Object.keys(map).length;
    const total = (this.data.images && this.data.images.length) || 0;
    const allSelected = total > 0 && count === total;
    this.setData({ selectedMap: map, selectedCount: count, allSelected });
  },

  // 全选 / 取消全选
  toggleSelectAll() {
    const imgs = this.data.images || [];
    const total = imgs.length;
    if (!total) return;
    const currentlyAll = !!this.data.allSelected;
    if (currentlyAll) {
      this.setData({ selectedMap: {}, selectedCount: 0, allSelected: false });
    } else {
      const map = {};
      for (let i = 0; i < total; i++) map[String(i)] = true;
      this.setData({ selectedMap: map, selectedCount: total, allSelected: true });
    }
  },

  // 保存所选图片到相册（用原图 url）
  onSave() {
    const self = this;
    const { selectedMap, images } = this.data;
    const indexes = Object.keys(selectedMap || {}).map(k => Number(k));
    if (!indexes.length) {
      return wx.showToast({ title: '未选择照片', icon: 'none' });
    }

    const urls = indexes.map(i => images[i] && images[i].url).filter(Boolean);
    if (!urls.length) {
      return wx.showToast({ title: '没有可保存的图片', icon: 'none' });
    }

    wx.getSetting({
      success(res) {
        const needAuth = !(res.authSetting && res.authSetting['scope.writePhotosAlbum']);

        const doSave = async () => {
          wx.showLoading({ title: '正在保存...' });
          let successCount = 0;
          let failCount = 0;

          for (const u of urls) {
            try {
              const dl = await new Promise(resolve => {
                wx.downloadFile({
                  url: u,
                  success: r => resolve({ ok: true, res: r }),
                  fail: e => resolve({ ok: false, err: e })
                });
              });
              if (!dl.ok || !dl.res || dl.res.statusCode !== 200) {
                failCount += 1;
                continue;
              }

              const sv = await new Promise(resolve => {
                wx.saveImageToPhotosAlbum({
                  filePath: dl.res.tempFilePath,
                  success: () => resolve({ ok: true }),
                  fail: err => resolve({ ok: false, err })
                });
              });

              if (sv.ok) {
                successCount += 1;
              } else {
                const err = sv.err || {};
                const msg = (err && err.errMsg) || '';
                if (msg.includes('auth') || msg.includes('deny')) {
                  wx.hideLoading();
                  wx.showModal({
                    title: '需要授权',
                    content: '请授权保存到相册以完成保存操作',
                    confirmText: '去设置',
                    success: r => {
                      if (r.confirm) wx.openSetting({});
                    }
                  });
                  return;
                }
                failCount += 1;
              }
            } catch (e) {
              console.error('save file error', e);
              failCount += 1;
            }
          }

          wx.hideLoading();
          wx.showToast({
            title: `保存成功 ${successCount} 张，失败 ${failCount} 张`,
            icon: 'none'
          });
          self.setData({
            deleteMode: false,
            selectedMap: {},
            selectedCount: 0,
            allSelected: false
          });
        };

        if (needAuth) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success() { doSave(); },
            fail() {
              wx.showModal({
                title: '权限请求',
                content: '需要允许保存到相册权限，是否前往设置？',
                confirmText: '去设置',
                success(r) {
                  if (r.confirm) wx.openSetting({});
                }
              });
            }
          });
        } else {
          doSave();
        }
      },
      fail() {
        wx.showToast({ title: '获取授权信息失败', icon: 'none' });
      }
    });
  },

  // 删除所选图片（调用后端 /api/photos/delete）
  async confirmDelete() {
    const { selectedMap, images, projectId } = this.data;
    const indexes = Object.keys(selectedMap || {}).map(k => Number(k));

    if (!indexes.length) {
      return wx.showToast({ title: '未选择照片', icon: 'none' });
    }

    const ids = indexes
      .map(i => images[i] && images[i].id)
      .filter(id => !!id);

    const missingCount = indexes.length - ids.length;

    if (!ids.length) {
      return wx.showModal({
        title: '无法删除',
        content: '所选照片都没有可删除的 ID，无法在服务端删除。',
        showCancel: false
      });
    }

    if (missingCount > 0) {
      const content = `有 ${missingCount} 张照片没有 ID，无法删除；是否继续删除其余 ${ids.length} 张？`;
      const res = await new Promise(resolve =>
        wx.showModal({ title: '部分照片不可删', content, success: r => resolve(r) })
      );
      if (!res || !res.confirm) return;
    }

    try {
      const resp = await request('/api/photos/delete', {
        method: 'POST',
        data: { photoIds: ids }
      });
      console.log('delete resp', resp);
      wx.showToast({ title: '删除成功', icon: 'success' });

      this.setData({
        deleteMode: false,
        selectedMap: {},
        selectedCount: 0,
        allSelected: false
      });
      if (projectId) this.loadProjectById(projectId);
    } catch (err) {
      console.error('delete error', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  // ================== 编辑项目信息 ==================

  openEdit() {
    const p = this.data.projectData || {};
    this.setData({
      editMode: true,
      editTitle: p.projectName || p.title || '',
      editDescription: p.description || '',
      editEventDate: this.data.eventDate || ''
    });
  },

  cancelEdit() {
    this.setData({ editMode: false });
  },

  onEditTitleInput(e) {
    this.setData({ editTitle: e.detail.value });
  },

  onEditDescInput(e) {
    this.setData({ editDescription: e.detail.value });
  },

  onEditEventDateChange(e) {
    this.setData({ editEventDate: e.detail.value }); // YYYY-MM-DD
  },

  async saveEdit() {
    const { projectId, editTitle, editDescription, editEventDate } = this.data;
    if (!projectId) {
      return wx.showToast({ title: '缺少项目 ID', icon: 'none' });
    }
    if (!editTitle || !editTitle.trim()) {
      return wx.showToast({ title: '标题不能为空', icon: 'none' });
    }

    try {
      await request(`/api/projects/${projectId}/update`, {
        method: 'POST',
        data: {
          projectName: editTitle.trim(),
          description: editDescription || '',
          eventDate: editEventDate || null
        }
      });

      wx.showToast({ title: '已保存', icon: 'success' });
      this.setData({ editMode: false });
      this.loadProjectById(projectId);
    } catch (err) {
      console.error('saveEdit error', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 删除整个项目
  async onDeleteProjectTap() {
    const { projectId, title } = this.data;
    if (!projectId) {
      return wx.showToast({ title: '缺少项目 ID', icon: 'none' });
    }

    // 二次确认
    const res = await new Promise(resolve => {
      wx.showModal({
        title: '删除项目',
        content: `确定要删除“${title || '当前项目'}”以及其下所有照片吗？此操作不可恢复。`,
        confirmText: '删除',
        cancelText: '取消',
        confirmColor: '#ff4d4f',
        success: r => resolve(r),
        fail: () => resolve({ confirm: false })
      });
    });

    if (!res || !res.confirm) return;

    try {
      // 优先尝试 REST 风格 DELETE /api/projects/:id
      let deleted = false;
      try {
        await request(`/api/projects/${projectId}`, { method: 'DELETE' });
        deleted = true;
      } catch (e) {
        console.warn('DELETE /api/projects/:id 失败，尝试 POST /api/projects/:id/delete', e);
      }

      // 如果后端是 POST /api/projects/:id/delete，就走这个兜底
      if (!deleted) {
        await request(`/api/projects/${projectId}/delete`, {
          method: 'POST'
        });
      }

      wx.showToast({ title: '项目已删除', icon: 'success' });
      this.setData({ editMode: false });

      // 稍等一下让 toast 显示，再返回上一页
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 600);
    } catch (err) {
      console.error('delete project error', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  // ================== 中转站悬浮按钮 ==================

  // 把当前 selectedMap 中勾选的照片加入全局中转站
  onFabConfirm() {
    const { selectedMap, images, projectId } = this.data;
    const indexes = Object.keys(selectedMap || {}).map(k => Number(k));
    if (!indexes.length) {
      return wx.showToast({ title: '先选择要加入中转站的照片', icon: 'none' });
    }

    let added = 0;
    let skipped = 0;
    let full = false;

    indexes.forEach(i => {
      const img = images[i];
      if (!img || !img.url) return;

      const ok = transferStore.add({
        id: img.id,
        url: img.url,   // 中转站也存原图 URL
        projectId
      });

      if (ok) {
        added += 1;
      } else {
        skipped += 1;
        if (transferStore.getCount() >= transferStore.MAX_COUNT) {
          full = true;
        }
      }
    });

    // 手动刷新一次 transferCount
    this.setData({
      transferCount: transferStore.getCount()
    });

    if (added) {
      wx.showToast({
        title: `已加入中转站 ${added} 张`,
        icon: 'none'
      });
    } else if (full) {
      wx.showToast({
        title: `已达到 ${transferStore.MAX_COUNT} 张上限`,
        icon: 'none'
      });
    } else {
      wx.showToast({
        title: '没有新增可加入的照片',
        icon: 'none'
      });
    }
  },

  // 一键清空中转站（不影响本页选择）
  onFabCancel() {
    transferStore.clear();
    this.setData({
      transferCount: transferStore.getCount()
    });

    wx.showToast({
      title: '中转站已清空',
      icon: 'none'
    });
  },

  // 中转站下载：把中转站里的所有照片保存到相册
  onFabDownload() {
    console.log('[detail] onFabDownload called');
    const all = transferStore.getAll();
    if (!all.length) {
      return wx.showToast({
        title: '中转站里还没有照片',
        icon: 'none'
      });
    }

    // 取出所有 url（原图）
    const urls = all.map(p => p.url).filter(Boolean);
    if (!urls.length) {
      return wx.showToast({
        title: '中转站里没有可下载的图片地址',
        icon: 'none'
      });
    }

    wx.getSetting({
      success: (res) => {
        const needAuth = !(res.authSetting && res.authSetting['scope.writePhotosAlbum']);

        const doSave = async () => {
          wx.showLoading({ title: '正在保存...' });
          let successCount = 0;
          let failCount = 0;

          for (const u of urls) {
            try {
              // 先下载到本地临时文件
              const dl = await new Promise(resolve => {
                wx.downloadFile({
                  url: u,
                  success: r => resolve({ ok: true, res: r }),
                  fail: e => resolve({ ok: false, err: e })
                });
              });

              if (!dl.ok || !dl.res || dl.res.statusCode !== 200) {
                console.warn('[transfer download] download fail', u, dl.err || dl.res);
                failCount += 1;
                continue;
              }

              // 再保存到相册
              const sv = await new Promise(resolve => {
                wx.saveImageToPhotosAlbum({
                  filePath: dl.res.tempFilePath,
                  success: () => resolve({ ok: true }),
                  fail: err => resolve({ ok: false, err })
                });
              });

              if (sv.ok) {
                successCount += 1;
              } else {
                const err = sv.err || {};
                const msg = (err && err.errMsg) || '';
                console.warn('[transfer download] save fail', u, msg);
                // 用户中途收回授权
                if (msg.includes('auth') || msg.includes('deny')) {
                  wx.hideLoading();
                  wx.showModal({
                    title: '需要授权',
                    content: '请在设置中允许“保存到相册”权限，才能下载照片',
                    confirmText: '去设置',
                    success: r => {
                      if (r.confirm) wx.openSetting({});
                    }
                  });
                  return;
                }
                failCount += 1;
              }
            } catch (e) {
              console.error('[transfer download] error', e);
              failCount += 1;
            }
          }

          wx.hideLoading();
          wx.showToast({
            title: `保存成功 ${successCount} 张，失败 ${failCount} 张`,
            icon: 'none'
          });

          // 是否自动清空中转站，看你需求：
          // transferStore.clear();
          // this.setData({ transferCount: transferStore.getCount() });
        };

        if (needAuth) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              doSave();
            },
            fail: () => {
              wx.showModal({
                title: '权限请求',
                content: '需要允许保存到相册权限，是否前往设置？',
                confirmText: '去设置',
                success: r => {
                  if (r.confirm) wx.openSetting({});
                }
              });
            }
          });
        } else {
          doSave();
        }
      },
      fail() {
        wx.showToast({ title: '获取授权信息失败', icon: 'none' });
      }
    });
  }
});
