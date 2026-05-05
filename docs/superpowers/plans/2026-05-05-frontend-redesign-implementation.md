# 前端重设计实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重设计点餐、冰箱、健康、设置四个页面的样式，只改变视觉呈现，不增删功能，不修改逻辑。

**Architecture:** 使用 CSS 变量系统实现统一风格，修改各页面 `.wxss` 文件，保持 `.js` 和 `.wxml` 不变。

**Tech Stack:** 微信小程序 WXSS

---

## 页面设计选定方案

- **点餐页面**: V1 美团外卖风格（搜索栏 + 促销横幅 + 分类Tab + 列表卡片）
- **我的冰箱页面**: V1大卡片 + V3时间线混合（顶部分类卡片 + 时间线分区）
- **健康计划页面**: V3 时间线布局
- **设置页面**: V1 卡片分组

---

## 文件结构

```
miniprogram/
├── app.wxss                    # 全局样式（已定义CSS变量）
├── pages/
│   ├── order/
│   │   └── order.wxss         # 点餐页面样式
│   ├── fridge/
│   │   └── fridge.wxss         # 冰箱页面样式
│   ├── health/
│   │   └── health.wxss         # 健康页面样式
│   └── settings/
│       └── settings.wxss       # 设置页面样式（已实现）
```

---

## 任务列表

### Task 1: 点餐页面 V1 美团风格

**Files:**
- Modify: `miniprogram/pages/order/order.wxss`

**Design Spec:**
- 搜索栏：圆角矩形，白色背景，轻阴影，圆角16rpx
- 促销横幅：渐变背景 #FF6B6B → #FF8E53，白色文字
- 分类Tab：横向滚动胶囊样式，选中时渐变背景
- 菜品卡片：左侧 Emoji 展示区(80x80rpx)，右侧信息区，价格红色突出
- 底部购物车栏：渐变背景按钮

**Steps:**
- [ ] **Step 1: 重写 order.wxss**

```wxss
/* 点餐页面 - 美团外卖风格 */

/* 搜索栏 */
.search-bar {
  margin: 16rpx;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: var(--shadow-sm);
  border: 1rpx solid var(--border-light);
}

.search-icon {
  font-size: 36rpx;
  color: var(--text-secondary);
}

.search-input {
  flex: 1;
  border: none;
  font-size: 28rpx;
  background: transparent;
}

/* 促销横幅 */
.promo-banner {
  margin: 0 32rpx 32rpx;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  border-radius: var(--radius-md);
  padding: 32rpx;
  color: #fff;
}

.promo-title {
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}

.promo-sub {
  font-size: 24rpx;
  opacity: 0.9;
}

/* 分类Tab */
.category-tabs {
  display: flex;
  gap: 16rpx;
  padding: 0 32rpx 24rpx;
  overflow-x: auto;
}

.category-tab {
  flex: 0 0 auto;
  padding: 16rpx 40rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  background: var(--bg-card);
  color: var(--text-secondary);
  box-shadow: var(--shadow-sm);
  white-space: nowrap;
}

.category-tab.active {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: #fff;
}

/* 菜品列表 */
.dish-list {
  padding: 0 32rpx;
}

.dish-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 28rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  gap: 28rpx;
  box-shadow: var(--shadow-sm);
  border: 1rpx solid var(--border-lighter);
}

.dish-emoji {
  width: 160rpx;
  height: 160rpx;
  background: linear-gradient(135deg, var(--bg-start) 0%, var(--primary-light) 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72rpx;
  flex-shrink: 0;
}

.dish-info {
  flex: 1;
  min-width: 0;
}

.dish-name {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8rpx;
}

.dish-meta {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-bottom: 12rpx;
  display: flex;
  gap: 16rpx;
}

.dish-tags {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.dish-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}

.dish-price {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--danger);
}

.dish-price small {
  font-size: 24rpx;
  font-weight: 400;
}

.add-btn {
  width: 88rpx;
  height: 88rpx;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  box-shadow: 0 8rpx 24rpx rgba(196,139,139,0.4);
}

/* 购物车栏 */
.cart-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  background: linear-gradient(180deg, transparent 0%, var(--bg-end) 30%);
}

.cart-btn {
  width: 100%;
  padding: 28rpx;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: #fff;
  border-radius: var(--radius-lg);
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 8rpx 32rpx rgba(196,139,139,0.4);
}
```

---

### Task 2: 冰箱页面 V1+V3 混合

**Files:**
- Modify: `miniprogram/pages/fridge/fridge.wxss`

**Design Spec:**
- 顶部分类卡片：横向滚动，大 Emoji + 数量，居中布局
- 时间线分区：按过期紧急程度分组（即将过期/本周内/其他）
- 食材卡片：左侧 Emoji，左侧彩色边框表示状态，右侧徽章 + 删除按钮

**Steps:**
- [ ] **Step 1: 重写 fridge.wxss**

```wxss
/* 冰箱页面 - V1大卡片 + V3时间线混合 */

/* 分类滚动卡片 */
.category-scroll {
  display: flex;
  gap: 24rpx;
  padding: 40rpx 32rpx 32rpx;
  overflow-x: auto;
  margin-top: -60rpx;
  position: relative;
  z-index: 10;
}

.category-card {
  flex: 0 0 auto;
  min-width: 180rpx;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 28rpx 24rpx;
  text-align: center;
  box-shadow: var(--shadow-md);
}

.category-icon {
  font-size: 52rpx;
  margin-bottom: 8rpx;
}

.category-name {
  font-size: 22rpx;
  color: var(--text-secondary);
}

.category-count {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--primary);
  margin-top: 8rpx;
}

/* 时间线分区 */
.timeline-section {
  padding: 0 32rpx;
}

.date-header {
  font-size: 26rpx;
  color: var(--text-secondary);
  margin: 32rpx 0 20rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.date-header::after {
  content: '';
  flex: 1;
  height: 2rpx;
  background: var(--border-light);
}

/* 食材卡片 */
.item-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: 24rpx;
  border-left: 8rpx solid var(--success);
}

.item-card.warning {
  border-left-color: var(--warning);
}

.item-card.danger {
  border-left-color: var(--danger);
}

.item-icon {
  font-size: 56rpx;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.item-days {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-top: 4rpx;
}

.days-badge {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.days-badge.safe {
  background: #E8F5E9;
  color: var(--success);
}

.days-badge.warning {
  background: #FFF8E6;
  color: var(--warning);
}

.days-badge.danger {
  background: #FDEDED;
  color: var(--danger);
}

.item-delete {
  width: 64rpx;
  height: 64rpx;
  background: #FFF5F5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--danger);
  font-size: 28rpx;
}

/* 添加按钮 */
.add-btn {
  padding: 24rpx 32rpx;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: #fff;
  border-radius: var(--radius-lg);
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 8rpx 32rpx rgba(196,139,139,0.4);
}
```

---

### Task 3: 健康页面 V3 时间线

**Files:**
- Modify: `miniprogram/pages/health/health.wxss`

**Design Spec:**
- 健康数据仪表盘卡片：顶部 Hero 卡片显示体重
- 时间线布局：左侧圆点 + 连接线，右侧卡片内容
- 每条记录包含：时间、标题、描述、数值标签

**Steps:**
- [ ] **Step 1: 重写 health.wxss**

```wxss
/* 健康页面 - V3 时间线布局 */

/* Hero 卡片 */
.health-hero {
  margin: 0 32rpx;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
  border-radius: var(--radius-lg);
  padding: 40rpx;
  color: #fff;
}

.hero-title {
  font-size: 28rpx;
  opacity: 0.9;
  margin-bottom: 16rpx;
}

.hero-value {
  font-size: 64rpx;
  font-weight: 700;
}

.hero-value small {
  font-size: 28rpx;
  font-weight: 400;
  opacity: 0.8;
}

.hero-trend {
  font-size: 24rpx;
  margin-top: 16rpx;
  opacity: 0.9;
}

/* 时间线区域 */
.timeline-section {
  padding: 32rpx;
}

.timeline-header {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-header span {
  font-size: 24rpx;
  color: var(--primary);
}

.timeline-item {
  display: flex;
  gap: 24rpx;
  margin-bottom: 32rpx;
  position: relative;
}

.timeline-dot {
  width: 24rpx;
  height: 24rpx;
  background: var(--primary);
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 8rpx;
  box-shadow: 0 0 0 8rpx var(--primary-light);
}

.timeline-line {
  position: absolute;
  left: 10rpx;
  top: 32rpx;
  bottom: -32rpx;
  width: 4rpx;
  background: linear-gradient(to bottom, var(--primary), var(--border-light));
}

.timeline-content {
  flex: 1;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 28rpx;
  box-shadow: var(--shadow-sm);
}

.timeline-date {
  font-size: 22rpx;
  color: var(--text-secondary);
  margin-bottom: 8rpx;
}

.timeline-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.timeline-desc {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-top: 12rpx;
  line-height: 1.5;
}

.timeline-value {
  display: inline-block;
  background: var(--primary-light);
  color: var(--primary-dark);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 600;
  margin-top: 12rpx;
}

/* 功能入口卡片 */
.feature-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  padding: 0 32rpx;
  margin-top: 32rpx;
}

.feature-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 32rpx;
  text-align: center;
  box-shadow: var(--shadow-md);
}

.feature-icon {
  font-size: 56rpx;
  margin-bottom: 16rpx;
}

.feature-name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.feature-desc {
  font-size: 22rpx;
  color: var(--text-secondary);
  margin-top: 8rpx;
}
```

---

### Task 4: 设置页面完善（已有 V1 基础，微调）

**Files:**
- Modify: `miniprogram/pages/settings/settings.wxss`

**Design Spec:**
- 用户卡片：头像(120rpx) + 昵称 + ID + 状态
- 设置组卡片：白色背景圆角，标题栏 + 列表项
- 配对卡片：左侧强调边框，显示邀请码
- 危险操作：红色背景警告

**Steps:**
- [ ] **Step 1: 检查并完善 settings.wxss 确保符合 V1 设计规范**

---

## 验收标准

1. **视觉统一**: 所有页面使用统一的配色和间距系统
2. **功能完整**: 不增删功能，只改变视觉呈现
3. **适配良好**: 适配不同屏幕尺寸
4. **性能良好**: 动画流畅，无明显卡顿
5. **代码质量**: CSS 变量化，易于维护