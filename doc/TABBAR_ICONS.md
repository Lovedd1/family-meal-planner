# TabBar 图标准备

## 需要准备的图标

微信小程序 tabBar 需要 5 组图标（每个 Tab 需要普通态和选中态两张图）：

| Tab | 普通态 | 选中态 |
|-----|--------|--------|
| 今日菜单 | `static/tab-today.png` | `static/tab-today-active.png` |
| 健康计划 | `static/tab-health.png` | `static/tab-health-active.png` |
| 点餐 | `static/tab-order.png` | `static/tab-order-active.png` |
| 我的冰箱 | `static/tab-fridge.png` | `static/tab-fridge-active.png` |
| 设置 | `static/tab-settings.png` | `static/tab-settings-active.png` |

## 图标规格

- **尺寸**：81 × 81 像素（推荐）/ 32位RGBA PNG
- **颜色**：普通态灰色 (#999999)，选中态绿色 (#07c160)
- **格式**：PNG（不支持 WebP）

## 快速获取图标

可以从以下免费图标库下载：
- [IconFont](https://www.iconfont.cn/)
- [Flaticon](https://www.flaticon.com/)
- [阿里巴巴矢量图标库](https://www.iconfont.cn/)

搜索关键词：`menu`, `health`, `food`, `fridge`, `settings` 或 `gear`

## 临时方案

如果暂时没有图标，微信开发者工具会报错。需要：
1. 准备图标文件放入 `miniprogram/static/` 目录
2. 或临时修改 `app.json` 移除 tabBar 配置

---

## 当前状态

所有 5 个页面代码已完成：
- [x] today - 今日菜单
- [x] health - 健康计划
- [x] order - 点餐
- [x] fridge - 我的冰箱
- [x] settings - 设置
