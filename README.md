# MaMage 小程序 — 项目说明文档

这是本仓库中小程序（WeChat Mini Program）端的源代码，包含一个以项目（Project）为中心的图片/活动管理小程序。

README 目标：帮助开发者快速了解代码结构、运行项目、关键页面与接口约定，以及最近的关键实现/改动要点。

**注意**：本 README 假设你会使用微信开发者工具打开 `miniprogram/` 目录进行调试和预览。

**目录（高层）**

- `miniprogram/`：小程序前端代码（WXML/JS/WXSS），是主要工作区。
- `cloudfunctions/`：云函数代码（若使用微信云开发）。
- `uploadCloudFunction.sh`：上传云函数的脚本（仓库自带的辅助脚本）。
- `project.config.json` / `project.private.config.json`：小程序项目配置（微信开发者工具使用）。

**快速预览（建议）**

1. 用微信开发者工具打开本仓库的 `miniprogram/` 目录。
2. 在模拟器中编译并运行，查看首页、项目列表与发布页（`/pages/index`、`/pages/projects/list`、`/pages/upload/publish`）。

**项目结构（重要文件/目录）**

- `miniprogram/app.js|app.json|app.wxss`：小程序入口、全局配置与样式。
- `miniprogram/pages/index/`：首页，包括轮播与顶部项目预览（入口：`index.wxml`、`index.js`、`index.wxss`）。
- `miniprogram/pages/projects/`：项目相关页面
	- `list/`：项目列表（`list.wxml`、`list.js`、`list.wxss`）
	- `detail.*`：项目详情页（`detail.wxml`、`detail.js`、`detail.wxss`）
- `miniprogram/pages/upload/publish/`：发布（新建）项目页（`publish.wxml`、`publish.js`）以及发布成功页 `publish_success`。
- `miniprogram/components/`：可复用组件（如 `project-item/`、`project-gallery/` 等）。
- `miniprogram/utils/`：工具与服务封装
	- `projectService.js`：拉取/查询项目的封装（对后端 REST 接口的封装）
	- `photoService.js`：图片相关的请求封装
	- `request.js`：通用请求函数与 `BASE_URL`（所有 URL 归一化规则在此处处理）
	- `transferStore.js`：前端“中转站”实现，用于暂存已选择的图片

**后端接口与字段约定（前端使用说明）**

- 列表 / 详情中的日期字段：前端在不同页面可能使用不同命名或经过映射：
	- 列表页（`list.js`）会把后端返回的 `eventDate` / `createdAt` / `date` 等字段统一映射为 `dateDisplay`（例如 “开展于 2025-11-17”）和 `date`（仅 `YYYY-MM-DD`）。模板使用 `{{item.dateDisplay}}` 来显示带前缀的日期文本。
	- 详情页（`detail.js`）在请求到项目数据后，会把 `proj.eventDate` 映射到 `eventDate`（YYYY-MM-DD），创建时间映射为 `createdDate`；页面上显示 `eventDate || createdDate`。
	- 发布/创建接口（`publish/publish.js`）向后端发送的字段为 `eventDate`（YYYY-MM-DD），而不是 `deadline`（以前有 `deadlineDate`/`deadlineTime` 的实现，此项目已改为使用 `eventDate`）。

**关键行为说明（近期实现/改动）**

- 修复：项目列表模板曾使用不存在的 `item.dateLabel` 字段，已修为使用 `item.dateDisplay` 并增加 `data-index` 以保证点击跳转到详情时能正确读取索引（请参考 `miniprogram/pages/projects/list/list.wxml` 与 `list.js`）。
- 发布页：将“截止日期/时间”改为单一“开展日期（eventDate）”，并在创建请求中传 `eventDate` 字段（参照详情页字段命名）。参考 `miniprogram/pages/upload/publish/publish.*`。
- 首页轮播：点击轮播项的行为已改为直接跳转到 `project_id=1` 的详情页，并把所点图片作为 `cover` 参数传递给详情页（`miniprogram/pages/index/index.js` 的 `previewImage` 已调整）。
- 功能页（`miniprogram/pages/function/function.js`）：
	- 点击“新建项目”跳转到发布页 `/pages/upload/publish/publish`。
	- 点击“我要上传”跳转到项目列表 `/pages/projects/list/list`（可从列表进入具体上传/详情）。

**如何运行与调试**

1. 打开微信开发者工具，导入 `miniprogram/` 目录作为小程序项目（或直接打开仓库根目录，选择 `miniprogram`）。
2. 确认 `project.config.json` 和 `project.private.config.json` 是否包含你的 AppID（调试可用测试号/空字符串）。
3. 若后端接口不可用，可临时 mock `miniprogram/utils/projectService.js` / `request.js` 中的请求以返回本地测试数据。
4. 若使用云函数，请参考 `cloudfunctions/quickstartFunctions` 和 `uploadCloudFunction.sh`，并按需部署到微信云开发环境。

**开发提示 / 维护指南**

- 调试接口地址：`miniprogram/utils/request.js` 中定义了 `BASE_URL`，你可以在这里切换成本地或远端 API。
- 主要的页面数据处理逻辑集中在 `miniprogram/pages/*/*.js` 中，组件化的视图（复用 UI）在 `miniprogram/components/`。
- 日期处理：统一使用 YYYY-MM-DD 字符串作为日期展示与交互（picker 返回格式），详情页提供 `formatDateToDay` 工具函数作为参考。
- 如果后端字段与前端约定不一致（例如 `event_date` vs `eventDate`），推荐在 `projectService` 或请求层做字段映射，而不要在每个页面里重复处理。

**常见操作/修改示例**

- 修改列表项日期展示：编辑 `miniprogram/pages/projects/list/list.js` 中的 `buildDateDisplay`，然后在 `list.wxml` 使用 `{{item.dateDisplay}}`。
- 将首页轮播点击改为跳到某个特定项目：修改 `miniprogram/pages/index/index.js` 中 `previewImage` 方法（当前实现已跳转 `id=1`）。

**后续建议 / 待办**

- 添加单元/集成测试（可考虑使用微信小程序真机测试或 CI 配置），并在 `utils` 层增加更完善的错误处理与重试机制。
- 将后端接口约定写入一个小文档（例如 `API.md`），包括请求路径、方法、必选与可选字段、示例返回值，便于后端/前端协同开发。

///1
