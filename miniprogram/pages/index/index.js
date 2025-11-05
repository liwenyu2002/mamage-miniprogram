Page({
    data: {
        // 轮播图图片，使用 OSS 网络地址（相对路径保持不变）
        images: [
            'https://mamage-album.oss-cn-beijing.aliyuncs.com/index/1.png',
            'https://mamage-album.oss-cn-beijing.aliyuncs.com/index/2.png',
            'https://mamage-album.oss-cn-beijing.aliyuncs.com/index/3.png',
            'https://mamage-album.oss-cn-beijing.aliyuncs.com/index/4.png',
        ],
            topProjects: [],
    },

    // 点击轮播图预览大图
    previewImage(e) {
        const idx = e.currentTarget.dataset.index || 0;
        const urls = this.data.images;
        wx.previewImage({
            current: urls[idx],
            urls,
        });
    },
        // 跳转到更多项目页面
        goMore() {
            wx.navigateTo({ url: '/pages/projects/list' });
        },
            // 打开更多项目页（点击 mini 项）
                openProjects() {
                    wx.navigateTo({ url: '/pages/projects/list' });
                },

                // 点击 mini 项打开详情
                openDetail(e) {
                    const idx = e.currentTarget.dataset.index;
                    const item = this.data.topProjects[idx];
                    const q = encodeURIComponent(JSON.stringify(item));
                    wx.navigateTo({ url: `/pages/projects/detail?data=${q}` });
                },

            onLoad() {
                // 生成首页要展示的前三个项目（与 projects 列表数据格式一致）
                const all = [
                    'https://mamage-album.oss-cn-beijing.aliyuncs.com/latest_album/1.png',
                    'https://mamage-album.oss-cn-beijing.aliyuncs.com/latest_album/2.png',
                    'https://mamage-album.oss-cn-beijing.aliyuncs.com/latest_album/3.png',
                    'https://mamage-album.oss-cn-beijing.aliyuncs.com/latest_album/4.png',
                    'https://mamage-album.oss-cn-beijing.aliyuncs.com/latest_album/5.png',
                    'https://mamage-album.oss-cn-beijing.aliyuncs.com/latest_album/6.png',
                    'https://mamage-album.oss-cn-beijing.aliyuncs.com/latest_album/7.png',
                ];
                const count = Math.min(3, all.length);
                const top = [];
                for (let i = 0; i < count; i++) {
                    const date = this._fakeDate ? this._fakeDate(i) : this._simpleDate(i);
                    const title = `项目示例 ${i + 1}`;
                    const status = Math.random() < 0.5 ? '进行中' : '已完结';
                    const statusClass = status === '进行中' ? 'status-active' : 'status-finished';
                    top.push({ src: all[i], date, title, status, statusClass });
                }
                this.setData({ topProjects: top });
            },

            _simpleDate(i) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const m = d.getMonth() + 1;
                const day = d.getDate();
                return `${d.getFullYear()}-${m.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            },
});