# 家庭饮食管家 - 前端重设计实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 5 个小程序页面统一重设计为温暖治愈系（玫瑰盐粉配色），使用精致线性图标，不增删功能逻辑。

**Architecture:** 采用 CSS 变量化设计，在 app.wxss 定义全局变量和基础样式，各页面 wxss 继承全局样式并实现页面特定样式。

**Tech Stack:** 微信小程序 WXSS + CSS Variables + Inline SVG Icons

---

## 文件结构

```
miniprogram/
├── app.wxss                          # 全局样式 + CSS变量
├── pages/
│   ├── today/today.wxss               # 今日菜单页面样式
│   ├── fridge/fridge.wxss             # 我的冰箱页面样式
│   ├── order/order.wxss              # 点餐页面样式
│   ├── health/health.wxss            # 健康计划页面样式
│   └── settings/settings.wxss         # 设置页面样式
└── static/icons/                      # 线性图标 SVG
```

---

## 任务列表

### Task 1: 全局样式 - app.wxss

**Files:**
- Modify: `miniprogram/app.wxss`

- [ ] **Step 1: 备份现有 app.wxss**

读取现有 `app.wxss` 内容并确认

- [ ] **Step 2: 添加 CSS 变量定义**

```wxss
/* ==================== CSS Variables ==================== */
page {
  /* Primary Colors */
  --primary: #C48B8B;
  --primary-light: #E8D5D8;
  --primary-dark: #A67070;

  /* Background */
  --bg-start: #FDF8F8;
  --bg-end: #F5EEF0;
  --bg-card: #FFFFFF;

  /* Text */
  --text-primary: #5D4A4A;
  --text-secondary: #8A6A6A;
  --text-placeholder: #BDBDBD;

  /* Functional */
  --success: #5A8A6A;
  --warning: #D4A828;
  --danger: #C45C5C;
  --info: #7A8AA0;

  /* Border */
  --border-light: #E8D5D8;
  --border-lighter: rgba(0, 0, 0, 0.05);

  /* Shadow */
  --shadow-sm: 0 2rpx 8rpx rgba(139, 115, 85, 0.08);
  --shadow-md: 0 4rpx 12rpx rgba(139, 115, 85, 0.12);
  --shadow-lg: 0 8rpx 24rpx rgba(139, 115, 85, 0.16);

  /* Radius */
  --radius-sm: 8rpx;
  --radius-md: 16rpx;
  --radius-lg: 24rpx;
  --radius-xl: 32rpx;

  /* Spacing */
  --space-xs: 8rpx;
  --space-sm: 12rpx;
  --space-md: 16rpx;
  --space-lg: 20rpx;
  --space-xl: 24rpx;
  --space-xxl: 32rpx;
}
```

- [ ] **Step 3: 添加全局重置样式**

```wxss
/* ==================== Global Reset ==================== */
page {
  background: linear-gradient(180deg, var(--bg-start) 0%, var(--bg-end) 100%);
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--text-primary);
  font-size: 28rpx;
  line-height: 1.5;
}

/* 页面容器 */
.page {
  min-height: 100vh;
  padding-bottom: 120rpx;
}

/* 导航栏 */
.nav-bar {
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
  padding: 100rpx 24rpx 32rpx;
  position: relative;
}

.nav-bar::after {
  content: '';
  position: absolute;
  bottom: -20rpx;
  left: 0;
  right: 0;
  height: 40rpx;
  background: var(--bg-end);
  border-radius: 20rpx 20rpx 0 0;
}

.nav-title {
  font-family: 'ZCOOL XiaoWei', 'Noto Sans SC', serif;
  font-size: 52rpx;
  color: var(--text-primary);
  letter-spacing: 4rpx;
}

.date-title {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-top: 8rpx;
}

/* Tab 栏 */
.tab-bar {
  display: flex;
  gap: var(--space-sm);
  padding: 30rpx 20rpx 16rpx;
  position: relative;
  z-index: 10;
}

.tab-item {
  flex: 1;
  padding: 28rpx 16rpx;
  background: rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-md);
  text-align: center;
  font-size: 26rpx;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  border: 2rpx solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.tab-item.active {
  background: var(--bg-card);
  border-color: var(--border-light);
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: var(--shadow-md);
}

.tab-item .tab-icon {
  font-size: 40rpx;
}

.tab-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  min-width: 32rpx;
  height: 32rpx;
  background: var(--primary);
  color: #fff;
  border-radius: 16rpx;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

/* 卡片 */
.card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  border: 1rpx solid var(--border-lighter);
}

/* 按钮 */
.btn {
  padding: 28rpx 48rpx;
  border-radius: var(--radius-lg);
  font-size: 28rpx;
  font-weight: 600;
  border: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn:active {
  transform: scale(0.95);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: #fff;
  box-shadow: 0 4rpx 16rpx rgba(196, 139, 139, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.8);
  color: var(--text-secondary);
  border: 1rpx solid var(--border-light);
}

/* 标签 */
.tag {
  display: inline-block;
  padding: 4rpx 12rpx;
  border-radius: var(--radius-sm);
  font-size: 20rpx;
  font-weight: 500;
}

.tag-primary {
  background: var(--primary-light);
  color: var(--primary-dark);
}

.tag-success {
  background: #E8F5E9;
  color: var(--success);
}

.tag-warning {
  background: #FFF8E6;
  color: var(--warning);
}

.tag-danger {
  background: #FDEDED;
  color: var(--danger);
}

/* 警告条 */
.alert {
  margin: 0 20rpx var(--space-md);
  padding: 24rpx 32rpx;
  background: #FDF5F5;
  border-radius: var(--radius-md);
  border-left: 8rpx solid var(--primary);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.alert-icon {
  font-size: 32rpx;
}

.alert-text {
  font-size: 24rpx;
  color: var(--text-secondary);
}

/* 模态框 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1rpx solid var(--border-lighter);
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  font-size: 48rpx;
  color: var(--text-placeholder);
}

.modal-body {
  padding: var(--space-lg);
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-top: 1rpx solid var(--border-lighter);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 128rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: var(--text-secondary);
  margin-top: 32rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: var(--text-placeholder);
  margin-top: 8rpx;
}

/* 底部栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16rpx 20rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, transparent 0%, var(--bg-end) 30%);
}
```

- [ ] **Step 4: 提交**

```bash
git add miniprogram/app.wxss
git commit -m "feat(style): 添加全局CSS变量和基础组件样式"
```

---

### Task 2: 今日菜单页面样式

**Files:**
- Modify: `miniprogram/pages/today/today.wxss`

- [ ] **Step 1: 读取现有 today.wxss**

确认当前样式内容

- [ ] **Step 2: 替换为新样式**

```wxss
/* ==================== 今日菜单页面 ==================== */

/* 菜品列表 */
.dish-list {
  padding: 0 20rpx;
}

.dish-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  transition: all 0.3s;
  border: 1rpx solid var(--border-lighter);
  box-shadow: var(--shadow-sm);
}

.dish-card:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-sm);
}

.dish-emoji {
  width: 104rpx;
  height: 104rpx;
  background: linear-gradient(135deg, var(--bg-start) 0%, var(--primary-light) 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  flex-shrink: 0;
}

.dish-info {
  flex: 1;
  min-width: 0;
}

.dish-name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10rpx;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.dish-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.heat-tag {
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
  font-size: 22rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background: #F5F0F0;
  color: var(--text-secondary);
}

.heat-tag.safe {
  background: #E8F5E9;
  color: var(--success);
}

.heat-tag.danger {
  background: #FDEDED;
  color: var(--danger);
}

.heat-tag.warning {
  background: #FFF8E6;
  color: var(--warning);
}

.conflict-tag {
  background: #FFF0E6;
  color: #B86E3A;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
}

.dish-remove {
  width: 60rpx;
  height: 60rpx;
  background: var(--bg-start);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-placeholder);
  font-size: 36rpx;
  flex-shrink: 0;
}

/* 确认按钮 */
.bottom-bar .btn-primary {
  width: 100%;
}
```

- [ ] **Step 3: 提交**

```bash
git add miniprogram/pages/today/today.wxss
git commit -m "feat(today): 应用玫瑰盐粉配色样式"
```

---

### Task 3: 我的冰箱页面样式

**Files:**
- Modify: `miniprogram/pages/fridge/fridge.wxss`

- [ ] **Step 1: 读取现有 fridge.wxss**

- [ ] **Step 2: 替换为新样式**

```wxss
/* ==================== 我的冰箱页面 ==================== */

/* 分类卡片 */
.category-cards {
  display: flex;
  gap: var(--space-md);
  padding: 0 20rpx;
  margin-top: -10rpx;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.category-card {
  flex: 0 0 auto;
  min-width: 160rpx;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  text-align: center;
  box-shadow: var(--shadow-sm);
  border: 1rpx solid var(--border-lighter);
}

.category-icon {
  font-size: 56rpx;
  display: block;
  margin-bottom: 8rpx;
}

.category-name {
  font-size: 22rpx;
  color: var(--text-secondary);
  display: block;
}

.category-count {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--primary);
  display: block;
  margin-top: 4rpx;
}

/* 操作栏 */
.action-bar {
  background: var(--bg-card);
  padding: var(--space-md) 20rpx;
  margin: var(--space-md) 20rpx;
  border-radius: var(--radius-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-sm);
}

.filter-tabs {
  display: flex;
  gap: var(--space-xs);
}

.filter-tab {
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  background: var(--bg-start);
  color: var(--text-secondary);
}

.filter-tab.active {
  background: var(--primary-light);
  color: var(--primary-dark);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 16rpx 24rpx;
  border-radius: var(--radius-lg);
  background: var(--primary);
  color: #fff;
  font-size: 24rpx;
}

/* 食材列表 */
.item-list {
  padding: 0 20rpx;
}

.item-card {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-sm);
  box-shadow: var(--shadow-sm);
  border: 1rpx solid var(--border-lighter);
  border-left: 8rpx solid var(--success);
}

.item-card.warning {
  border-left-color: var(--warning);
}

.item-card.danger {
  border-left-color: var(--danger);
}

.item-icon {
  font-size: 48rpx;
  margin-right: var(--space-md);
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--text-primary);
}

.item-meta {
  display: flex;
  gap: var(--space-md);
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}

.days-left {
  color: var(--success);
}

.days-left.warning {
  color: var(--warning);
}

.days-left.danger {
  color: var(--danger);
  font-weight: 500;
}

.item-delete {
  color: var(--danger);
  font-size: 24rpx;
  padding: 8rpx 16rpx;
}

/* 添加弹窗表单 */
.form-item {
  margin-bottom: var(--space-lg);
}

.form-item label {
  display: block;
  font-size: 26rpx;
  color: var(--text-secondary);
  margin-bottom: 12rpx;
}

.form-item input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 0 var(--space-md);
  font-size: 28rpx;
  box-sizing: border-box;
  background: var(--bg-start);
}

.form-item input:focus {
  border-color: var(--primary);
  outline: none;
}

/* 推荐食材 */
.recommend-tip {
  text-align: center;
  color: var(--text-secondary);
  font-size: 24rpx;
  margin-bottom: var(--space-md);
}

.recommend-item {
  display: flex;
  align-items: center;
  padding: var(--space-md);
  border-bottom: 1rpx solid var(--border-lighter);
}

.recommend-item .emoji {
  font-size: 48rpx;
  margin-right: var(--space-md);
}

.recommend-info {
  flex: 1;
}

.recommend-info .name {
  font-size: 28rpx;
  font-weight: 500;
}

.recommend-info .matched {
  display: block;
  font-size: 22rpx;
  color: var(--success);
  margin-top: 4rpx;
}

.btn-mini {
  font-size: 22rpx;
  padding: 8rpx 16rpx;
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius-sm);
}

/* 同步状态 */
.sync-status {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--text-secondary);
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  background: var(--success);
  border-radius: 50%;
}
```

- [ ] **Step 3: 提交**

```bash
git add miniprogram/pages/fridge/fridge.wxss
git commit -m "feat(fridge): 应用玫瑰盐粉配色样式"
```

---

### Task 4: 点餐页面样式

**Files:**
- Modify: `miniprogram/pages/order/order.wxss`

- [ ] **Step 1: 读取现有 order.wxss**

- [ ] **Step 2: 替换为新样式**

```wxss
/* ==================== 点餐页面 ==================== */

/* 搜索栏 */
.search-bar {
  padding: var(--space-md) 20rpx;
  background: var(--bg-card);
  margin: var(--space-md) 20rpx;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  box-shadow: var(--shadow-sm);
}

.search-icon {
  font-size: 32rpx;
  color: var(--text-secondary);
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  border: none;
  background: transparent;
}

.search-input::placeholder {
  color: var(--text-placeholder);
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-sm) 20rpx;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.category-tab {
  flex: 0 0 auto;
  padding: 12rpx 28rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  background: var(--bg-card);
  color: var(--text-secondary);
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}

.category-tab.active {
  background: var(--primary);
  color: #fff;
}

/* 菜品网格 */
.dish-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
  padding: var(--space-md) 20rpx;
}

.dish-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  box-shadow: var(--shadow-sm);
  border: 1rpx solid var(--border-lighter);
  transition: all 0.3s;
}

.dish-card:active {
  transform: scale(0.97);
}

.dish-emoji {
  width: 100%;
  height: 140rpx;
  background: linear-gradient(135deg, var(--bg-start) 0%, var(--primary-light) 100%);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64rpx;
  margin-bottom: var(--space-sm);
}

.dish-name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  margin-bottom: 8rpx;
}

.dish-meta {
  font-size: 22rpx;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: var(--space-sm);
}

.dish-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-sm);
}

.dish-price {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--primary);
}

.add-btn {
  width: 56rpx;
  height: 56rpx;
  background: var(--primary);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  box-shadow: 0 4rpx 12rpx rgba(196, 139, 139, 0.3);
}

/* 购物车栏 */
.cart-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-md) 20rpx;
  padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom));
  background: var(--bg-card);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.cart-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.cart-icon {
  position: relative;
  font-size: 48rpx;
}

.cart-count {
  position: absolute;
  top: -8rpx;
  right: -12rpx;
  min-width: 36rpx;
  height: 36rpx;
  background: var(--danger);
  color: #fff;
  border-radius: 18rpx;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.cart-total {
  font-size: 28rpx;
  color: var(--text-secondary);
}

.cart-total-num {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--primary);
}

.cart-btn {
  padding: 20rpx 48rpx;
  background: var(--primary);
  color: #fff;
  border-radius: var(--radius-lg);
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(196, 139, 139, 0.3);
}

/* 菜品详情弹窗 */
.detail-header {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.detail-emoji {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, var(--bg-start) 0%, var(--primary-light) 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64rpx;
}

.detail-info {
  flex: 1;
}

.detail-name {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8rpx;
}

.detail-category {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.detail-section {
  margin-bottom: var(--space-lg);
}

.detail-section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
  padding-left: 12rpx;
  border-left: 4rpx solid var(--primary);
}

.ingredient-list {
  background: var(--bg-start);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.ingredient-item {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 0;
  font-size: 26rpx;
  color: var(--text-secondary);
}

.ingredient-item:not(:last-child) {
  border-bottom: 1rpx solid var(--border-lighter);
}

.step-list {
  counter-reset: step;
}

.step-item {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.step-num {
  width: 48rpx;
  height: 48rpx;
  background: var(--primary-light);
  color: var(--primary-dark);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
  font-size: 26rpx;
  color: var(--text-secondary);
  line-height: 1.6;
}
```

- [ ] **Step 3: 提交**

```bash
git add miniprogram/pages/order/order.wxss
git commit -m "feat(order): 应用玫瑰盐粉配色样式"
```

---

### Task 5: 健康计划页面样式

**Files:**
- Modify: `miniprogram/pages/health/health.wxss`

- [ ] **Step 1: 读取现有 health.wxss**

- [ ] **Step 2: 替换为新样式**

```wxss
/* ==================== 健康计划页面 ==================== */

/* 内容区 */
.content {
  height: calc(100vh - 180rpx);
}

/* 卡片 */
.card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin: var(--space-md) 20rpx;
  box-shadow: var(--shadow-sm);
  border: 1rpx solid var(--border-lighter);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.edit-btn {
  font-size: 26rpx;
  color: var(--primary);
}

/* 伴侣卡片 */
.partner-card {
  border-left: 8rpx solid var(--primary);
}

.partner-info {
  display: flex;
  gap: var(--space-lg);
}

.info-item {
  flex: 1;
  text-align: center;
}

.info-item text:first-child {
  display: block;
  font-size: 22rpx;
  color: var(--text-secondary);
}

.info-item text:last-child {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-primary);
}

/* 目标选择 */
.goal-selector {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.goal-btn {
  flex: 1;
  padding: 24rpx;
  text-align: center;
  border-radius: var(--radius-md);
  background: var(--bg-start);
  font-size: 28rpx;
  color: var(--text-secondary);
}

.goal-btn.active {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: #fff;
  font-weight: 600;
}

/* 数据概览 */
.data-overview {
  display: flex;
  justify-content: space-around;
  padding: var(--space-lg) 0;
  border-top: 1rpx solid var(--border-lighter);
  border-bottom: 1rpx solid var(--border-lighter);
  margin: var(--space-md) 0;
}

.data-item {
  text-align: center;
}

.data-label {
  display: block;
  font-size: 22rpx;
  color: var(--text-secondary);
  margin-bottom: 8rpx;
}

.data-value {
  font-size: 40rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.data-unit {
  font-size: 22rpx;
  color: var(--text-secondary);
}

/* 活动量 */
.activity-selector {
  margin-bottom: var(--space-md);
}

.section-label {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-bottom: 12rpx;
  display: block;
}

.activity-btns {
  display: flex;
  gap: var(--space-xs);
}

.activity-btn {
  flex: 1;
  padding: 16rpx;
  text-align: center;
  border-radius: var(--radius-sm);
  background: var(--bg-start);
  font-size: 24rpx;
  color: var(--text-secondary);
}

.activity-btn.active {
  background: var(--primary-light);
  color: var(--primary-dark);
  font-weight: 600;
}

/* 过敏源标签 */
.allergy-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.allergy-tag {
  padding: 8rpx 16rpx;
  background: #FFF0F0;
  color: var(--danger);
  border-radius: 20rpx;
  font-size: 22rpx;
}

/* 体重图表 */
.weight-chart {
  padding: var(--space-md) 0;
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 160rpx;
  padding-bottom: 50rpx;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, var(--primary-light) 0%, var(--primary) 100%);
  border-radius: 6rpx 6rpx 0 0;
  margin: 0 4rpx;
  min-height: 20rpx;
  position: relative;
}

.bar-value {
  position: absolute;
  bottom: -40rpx;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18rpx;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* 进度条 */
.progress-bar {
  height: 16rpx;
  background: var(--bg-start);
  border-radius: 8rpx;
  margin-top: 80rpx;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background: linear-gradient(to right, var(--primary-light) 0%, var(--primary) 100%);
  border-radius: 8rpx;
  transition: width 0.3s;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: var(--text-secondary);
}

/* 生理期 */
.phase-status {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.phase-badge {
  padding: 16rpx 32rpx;
  border-radius: var(--radius-lg);
  font-size: 28rpx;
  font-weight: 500;
}

.phase-menstruation {
  background: #FFF0F0;
  color: var(--danger);
}

.phase-follicular {
  background: #F0FFF0;
  color: var(--success);
}

.phase-ovulation {
  background: #FFF8E6;
  color: var(--warning);
}

.phase-luteal {
  background: #F0F8FF;
  color: var(--info);
}

.phase-day {
  font-size: 28rpx;
  color: var(--text-secondary);
}

/* 日历 */
.calendar-view {
  margin: var(--space-md) 0;
}

.calendar-legend {
  display: flex;
  gap: var(--space-lg);
  margin-bottom: var(--space-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: var(--text-secondary);
}

.legend-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 4rpx;
}

.legend-dot.period {
  background: var(--danger);
}

.legend-dot.fertile {
  background: var(--warning);
}

.legend-dot.today {
  background: var(--success);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8rpx;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-start);
  border-radius: var(--radius-sm);
  font-size: 24rpx;
  color: var(--text-secondary);
}

.day-cell.today {
  background: var(--primary-light);
  color: var(--primary-dark);
  font-weight: 600;
}

.day-cell.period {
  background: #FFF0F0;
  color: var(--danger);
}

/* 阶段提示 */
.phase-tips {
  background: var(--bg-start);
  padding: var(--space-md);
  border-radius: var(--radius-md);
}

.phase-tip-title {
  display: block;
  font-weight: 500;
  margin-bottom: 8rpx;
  color: var(--text-primary);
}

.phase-tip-text {
  font-size: 24rpx;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* AI饮食计划 */
.ai-hint {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
  line-height: 1.6;
}

/* 计划弹窗 */
.plan-tabs {
  display: flex;
  padding: 0 var(--space-lg);
  border-bottom: 1rpx solid var(--border-lighter);
}

.plan-tab {
  flex: 1;
  padding: var(--space-md);
  text-align: center;
  font-size: 28rpx;
  color: var(--text-secondary);
  position: relative;
}

.plan-tab.active {
  color: var(--primary);
  font-weight: 600;
}

.plan-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 6rpx;
  background: var(--primary);
  border-radius: 3rpx;
}

/* 周计划 */
.weekly-plans {
  margin-bottom: var(--space-lg);
}

.week-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-md);
  padding-left: 16rpx;
  border-left: 6rpx solid var(--primary);
}

.day-plans {
  background: var(--bg-start);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
}

.day-plan-header {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.meal-item {
  display: flex;
  padding: 12rpx 0;
  border-bottom: 1rpx solid var(--border-lighter);
}

.meal-item:last-child {
  border-bottom: none;
}

.meal-label {
  width: 100rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.meal-content {
  flex: 1;
}

.meal-name {
  font-size: 26rpx;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
  margin-bottom: 4rpx;
}

.meal-effect {
  font-size: 22rpx;
  color: var(--success);
  display: block;
  margin-bottom: 4rpx;
}

.meal-ingredients {
  font-size: 22rpx;
  color: var(--text-placeholder);
}

.ing-label {
  color: var(--text-secondary);
}

/* 购物清单 */
.shopping-section {
  margin-top: var(--space-lg);
  border-top: 1rpx solid var(--border-lighter);
  padding-top: var(--space-md);
}

.shopping-title {
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: var(--space-md);
}

.shopping-item {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid var(--border-lighter);
  font-size: 26rpx;
}

.shopping-item:last-child {
  border-bottom: none;
}

.shopping-icon {
  margin-right: var(--space-sm);
  font-size: 28rpx;
}

.shopping-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.shopping-amount {
  color: var(--primary);
  margin-right: var(--space-md);
}

.shopping-period {
  font-size: 22rpx;
  color: var(--text-secondary);
}

.shopping-item.need-buy .shopping-name {
  color: var(--danger);
}

.shopping-item.sufficient .shopping-icon {
  color: var(--success);
}
```

- [ ] **Step 3: 提交**

```bash
git add miniprogram/pages/health/health.wxss
git commit -m "feat(health): 应用玫瑰盐粉配色样式"
```

---

### Task 6: 设置页面样式

**Files:**
- Modify: `miniprogram/pages/settings/settings.wxss`

- [ ] **Step 1: 读取现有 settings.wxss**

- [ ] **Step 2: 替换为新样式**

```wxss
/* ==================== 设置页面 ==================== */

/* 用户卡片 */
.user-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-xl);
  margin: var(--space-md) 20rpx;
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  box-shadow: var(--shadow-sm);
  border: 1rpx solid var(--border-lighter);
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64rpx;
  overflow: hidden;
}

.user-avatar image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8rpx;
}

.user-id {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.user-status {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--success);
}

/* 设置列表 */
.settings-section {
  margin: var(--space-lg) 20rpx;
}

.section-title {
  font-size: 22rpx;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
  padding-left: 8rpx;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.settings-list {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1rpx solid var(--border-lighter);
}

.settings-item {
  display: flex;
  align-items: center;
  padding: var(--space-lg);
  border-bottom: 1rpx solid var(--border-lighter);
}

.settings-item:last-child {
  border-bottom: none;
}

.settings-icon {
  width: 56rpx;
  height: 56rpx;
  background: var(--primary-light);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  margin-right: var(--space-md);
}

.settings-icon.sync {
  background: #E8F5E9;
}

.settings-icon.export {
  background: #E3F2FD;
}

.settings-icon.reset {
  background: #FFF8E6;
}

.settings-icon.about {
  background: #F5F0F8;
}

.settings-content {
  flex: 1;
}

.settings-name {
  font-size: 30rpx;
  color: var(--text-primary);
  font-weight: 500;
}

.settings-desc {
  font-size: 22rpx;
  color: var(--text-secondary);
  margin-top: 4rpx;
}

.settings-arrow {
  font-size: 28rpx;
  color: var(--text-placeholder);
}

/* 配对卡片 */
.pair-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin: var(--space-md) 20rpx;
  box-shadow: var(--shadow-sm);
  border: 1rpx solid var(--border-lighter);
  border-left: 8rpx solid var(--primary);
}

.pair-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.pair-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.pair-status {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: var(--success);
}

.pair-status.disconnected {
  color: var(--text-secondary);
}

.pair-code {
  background: var(--bg-start);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  text-align: center;
  margin-bottom: var(--space-md);
}

.code-label {
  font-size: 22rpx;
  color: var(--text-secondary);
  margin-bottom: 8rpx;
}

.code-value {
  font-size: 48rpx;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: 8rpx;
  font-family: monospace;
}

.code-hint {
  font-size: 22rpx;
  color: var(--text-placeholder);
  margin-top: 8rpx;
}

.pair-actions {
  display: flex;
  gap: var(--space-sm);
}

.pair-btn {
  flex: 1;
  padding: 20rpx;
  border-radius: var(--radius-md);
  font-size: 28rpx;
  text-align: center;
}

.pair-btn.primary {
  background: var(--primary);
  color: #fff;
}

.pair-btn.secondary {
  background: var(--bg-start);
  color: var(--text-secondary);
}

/* 输入框 */
.input-group {
  margin-bottom: var(--space-lg);
}

.input-label {
  display: block;
  font-size: 26rpx;
  color: var(--text-secondary);
  margin-bottom: 12rpx;
}

.input-field {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 0 var(--space-md);
  font-size: 28rpx;
  box-sizing: border-box;
  background: var(--bg-start);
}

.input-field:focus {
  border-color: var(--primary);
  outline: none;
}

/* 版本信息 */
.version-info {
  text-align: center;
  padding: var(--space-xl);
  font-size: 24rpx;
  color: var(--text-placeholder);
}

/* 危险操作 */
.danger-zone {
  margin-top: var(--space-lg);
}

.danger-item {
  background: #FFF5F5;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.danger-item .settings-item {
  border-bottom: none;
}

.danger-item .settings-icon {
  background: #FDEDED;
  color: var(--danger);
}

.danger-item .settings-name {
  color: var(--danger);
}
```

- [ ] **Step 3: 提交**

```bash
git add miniprogram/pages/settings/settings.wxss
git commit -m "feat(settings): 应用玫瑰盐粉配色样式"
```

---

### Task 7: 图标 SVG 文件（可选）

**Files:**
- Create: `miniprogram/static/icons/icons.wxml`

如果需要精致线性图标替代 Emoji，创建图标组件：

- [ ] **Step 1: 创建图标组件文件**

```xml
<!-- miniprogram/static/icons/icons.wxml -->
<template name="icon">
  <svg class="icon" style="width:{{size}}rpx;height:{{size}}rpx;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <block wx:if="{{name === 'home'}}">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </block>
    <block wx:elif="{{name === 'heart'}}">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </block>
    <block wx:elif="{{name === 'fridge'}}">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
      <line x1="4" y1="10" x2="20" y2="10"/>
      <line x1="16" y1="6" x2="16" y2="6.01"/>
      <line x1="16" y1="14" x2="16" y2="14.01"/>
    </block>
    <block wx:elif="{{name === 'settings'}}">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </block>
    <block wx:elif="{{name === 'search'}}">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </block>
    <block wx:elif="{{name === 'plus'}}">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </block>
    <block wx:elif="{{name === 'trash'}}">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </block>
    <block wx:elif="{{name === 'alert'}}">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </block>
    <block wx:elif="{{name === 'check'}}">
      <polyline points="20 6 9 17 4 12"/>
    </block>
    <block wx:elif="{{name === 'sync'}}">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </block>
    <block wx:elif="{{name === 'export'}}">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </block>
    <block wx:elif="{{name === 'user'}}">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </block>
    <block wx:elif="{{name === 'menu'}}">
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </block>
  </svg>
</template>
```

- [ ] **Step 2: 提交**

```bash
git add miniprogram/static/icons/icons.wxml
git commit -m "feat(icons): 添加线性图标SVG组件"
```

---

## 自检清单

完成所有任务后，检查以下内容：

1. **CSS 变量是否统一定义在 app.wxss 中？** ✓
2. **所有页面是否使用 var() 引用变量？** ✓
3. **配色是否符合 A3 玫瑰盐粉方案？** ✓
4. **圆角、间距是否遵循设计规范？** ✓
5. **是否保留了所有功能逻辑（仅样式变更）？** ✓

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-05-05-frontend-redesign-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
