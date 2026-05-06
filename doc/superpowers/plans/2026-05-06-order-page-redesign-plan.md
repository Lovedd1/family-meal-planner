# 点餐页面交互优化实施计划

**Goal:** 将点餐页面的分类改为左侧美团式侧边栏，添加菜品时改为底部弹出餐次选择器

**Architecture:**
- 布局：左侧160rpx固定侧边栏 + 右侧flex1菜品列表
- 交互：点击菜品卡片 → 底部弹出餐次选择 → 确认后添加
- 移除顶部 add-to-bar 餐次选择栏

**Tech Stack:** 微信小程序 WXML/WXSS/JS

---

## 文件清单

| 文件 | 改动 |
|------|------|
| `miniprogram/pages/order/order.wxml` | 结构调整：侧边栏+菜品列表分栏、移除add-to-bar、添加底部弹窗 |
| `miniprogram/pages/order/order.wxss` | 新增侧边栏样式、底部弹窗样式、移除旧add-to-bar样式 |
| `miniprogram/pages/order/order.js` | addToMenu改为弹窗选择、移除switchTab、新增弹窗相关方法 |

---

## Task 1: 修改 order.wxml 布局结构

**Files:**
- Modify: `miniprogram/pages/order/order.wxml`

布局改为左右分栏：左侧160rpx分类侧边栏 + 右侧flex1菜品列表。移除顶部add-to-bar。新增底部餐次选择弹窗。

---

## Task 2: 修改 order.wxss 样式

**Files:**
- Modify: `miniprogram/pages/order/order.wxss`

添加.content-wrapper左右分栏样式、.category-sidebar侧边栏样式（美团式选中效果）、.meal-picker-modal底部弹窗样式。移除.add-to-bar/.add-label/.tab-btn样式。

---

## Task 3: 修改 order.js 逻辑

**Files:**
- Modify: `miniprogram/pages/order/order.js`

data中移除currentTab，新增showMealPicker和pendingDish。移除switchTab方法。addToMenu改为弹出选择器。新增closeMealPicker和selectMealType方法。removeFromMenu改为遍历所有餐次移除。

---

## Task 4: 验证完整流程

**Files:**
- Review: 所有改动文件

验证弹窗catchtap、侧边栏滚动、开发者工具预览。
