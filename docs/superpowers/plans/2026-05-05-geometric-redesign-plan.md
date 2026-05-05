# 几何波普风格前端重设计实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将小程序前端从温暖治愈系重设计为几何波普风格（90年代几何印花），保持配色不变

**Architecture:** 通过更新 app.wxss 全局样式和各页面 wxss 文件实现风格切换。波普装饰元素使用 CSS mixin 方式复用，页面组件保持原有结构仅更新视觉样式。

**Tech Stack:** 微信小程序 wxss、CSS 变量、CSS repeating-conic-gradient/repeating-linear-gradient

---

## 文件变更清单

| 文件 | 操作 | 职责 |
|------|------|------|
| `miniprogram/app.wxss` | 修改 | 全局 CSS 变量 + 波普装饰 mixin |
| `miniprogram/pages/today/today.wxss` | 修改 | Tab栏、菜品卡片、区块标题 |
| `miniprogram/pages/fridge/fridge.wxss` | 修改 | 分类卡片、食材卡片、FAB |
| `miniprogram/pages/order/order.wxss` | 修改 | 搜索栏、分类标签、菜品卡片 |
| `miniprogram/pages/health/health.wxss` | 修改 | 健康数据卡片 |
| `miniprogram/pages/settings/settings.wxss` | 修改 | 用户卡片、设置列表 |

---

## Task 1: 更新全局样式 (app.wxss)

**Files:**
- Modify: `miniprogram/app.wxss`

- [ ] **Step 1: 备份当前 app.wxss**

查看现有内容了解当前结构。

- [ ] **Step 2: 更新 CSS 变量**

保留原有配色变量，调整阴影数值为波普风格（更柔和）：

```wxss
/* ==================== 全局变量 ==================== */
page {
  /* Primary Colors - 保持不变 */
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

  /* Functional Colors */
  --success: #5A8A6A;
  --warning: #D4A828;
  --danger: #C45C5C;

  /* Border */
  --border-light: #E8D5D8;

  /* Shadow - 波普风格更柔和的阴影 */
  --shadow-sm: 0 4rpx 16rpx rgba(93,74,74,0.08);
  --shadow-md: 0 6rpx 20rpx rgba(93,74,74,0.12);
  --shadow-lg: 0 8rpx 24rpx rgba(93,74,74,0.16);

  /* Radius */
  --radius-sm: 8rpx;
  --radius-md: 16rpx;
  --radius-lg: 20rpx;
}

/* ==================== 波普装饰元素 ==================== */
/* 锯齿条纹 - 45度 */
.pop-zigzag {
  background: repeating-linear-gradient(
    45deg,
    var(--primary-light) 0px,
    var(--primary-light) 3px,
    transparent 3px,
    transparent 6px
  );
}

/* 水平条纹 */
.pop-stripes {
  background: repeating-linear-gradient(
    90deg,
    var(--primary) 0px,
    var(--primary) 4px,
    var(--primary-light) 4px,
    var(--primary-light) 8px
  );
}

/* 波普圆点 */
.pop-dots {
  background: repeating-conic-gradient(
    var(--primary) 0deg 15deg,
    transparent 15deg 30deg
  );
}

/* 标题文字 - 大写 + 字间距 */
.pop-title {
  font-family: 'Space Mono', monospace;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* 区块标题 - 大写 + 细字间距 */
.section-title {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: 3px;
  text-transform: uppercase;
}
```

- [ ] **Step 3: 验证文件语法**

确认 wxss 语法正确，无错误。

---

## Task 2: 今日菜单页面 (today.wxss)

**Files:**
- Modify: `miniprogram/pages/today/today.wxss`

- [ ] **Step 1: 查看当前 today.wxss 内容**

确认现有样式结构。

- [ ] **Step 2: 更新 Tab 栏样式**

```wxss
/* ==================== Tab栏 - 波普条纹背景 ==================== */
.tab-bar {
  display: flex;
  gap: 10rpx;
  padding: 0 20rpx;
  margin-bottom: 24rpx;
  position: relative;
}

.tab-bar::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 20rpx;
  right: 20rpx;
  height: 2rpx;
  background: repeating-linear-gradient(
    90deg,
    var(--primary-light) 0px,
    var(--primary-light) 4px,
    transparent 4px,
    transparent 8px
  );
  transform: translateY(-50%);
  z-index: 0;
}

.tab-item {
  position: relative;
  z-index: 1;
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-secondary);
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  transition: all 0.3s;
}

.tab-item.active {
  color: #fff;
  background: var(--primary);
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20rpx;
  height: 20rpx;
  padding: 0 6rpx;
  background: var(--primary-light);
  color: var(--primary-dark);
  border-radius: 10rpx;
  font-size: 10px;
  font-weight: 700;
  margin-left: 5rpx;
}

.tab-item.active .tab-count {
  background: rgba(255,255,255,0.3);
  color: #fff;
}
```

- [ ] **Step 3: 更新菜品卡片样式**

```wxss
/* ==================== 菜品卡片 - 三角形角落 + 圆点 ==================== */
.dish-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 18rpx;
  margin-bottom: 12rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: var(--shadow-sm);
}

/* 右上角三角形装饰 */
.dish-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 40rpx 40rpx 0;
  border-color: transparent var(--primary-light) transparent transparent;
  opacity: 0.4;
}

/* 右下角小圆点 */
.dish-card::after {
  content: '';
  position: absolute;
  bottom: 8rpx;
  right: 8rpx;
  width: 12rpx;
  height: 12rpx;
  background: var(--primary);
  border-radius: 50%;
  opacity: 0.3;
}

.dish-card:active {
  transform: scale(0.98);
}

.dish-emoji {
  width: 56rpx;
  height: 56rpx;
  background: linear-gradient(135deg, var(--bg-start) 0%, var(--primary-light) 100%);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
  position: relative;
}

/* 图标右下角小方块 */
.dish-emoji::after {
  content: '';
  position: absolute;
  bottom: -5rpx;
  right: -5rpx;
  width: 12rpx;
  height: 12rpx;
  background: var(--primary);
  border-radius: 4rpx;
  opacity: 0.2;
}

.dish-name {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 6rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  letter-spacing: 0.5px;
}

.dish-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

/* 标签 - 波普风格 */
.heat-tag {
  display: inline-flex;
  align-items: center;
  padding: 4rpx 10rpx;
  border-radius: 6rpx;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: rgba(93,74,74,0.06);
  color: var(--text-secondary);
}

.heat-tag.safe {
  background: rgba(90, 138, 106, 0.15);
  color: var(--success);
}

.heat-tag.danger {
  background: rgba(196, 92, 92, 0.15);
  color: var(--danger);
}

.heat-tag.warning {
  background: rgba(212, 168, 40, 0.15);
  color: var(--warning);
}

.conflict-tag {
  background: rgba(212, 168, 40, 0.15);
  color: var(--warning);
  padding: 4rpx 10rpx;
  border-radius: 6rpx;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
}
```

- [ ] **Step 4: 更新区块标题样式**

```wxss
/* ==================== 区块标题 ==================== */
.section-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.section-title {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: 3px;
  text-transform: uppercase;
}

.section-line {
  flex: 1;
  height: 2rpx;
  background: repeating-linear-gradient(
    90deg,
    var(--primary-light) 0px,
    var(--primary-light) 6px,
    transparent 6px,
    transparent 10px
  );
}
```

- [ ] **Step 5: 更新按钮样式**

```wxss
/* ==================== 主按钮 - 波普条纹顶部 ==================== */
.bottom-bar .btn-primary {
  width: 100%;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 2px;
  padding: 18rpx;
  position: relative;
  overflow: hidden;
  box-shadow: 0 6rpx 20rpx rgba(196,139,139,0.4);
}

/* 顶部条纹装饰 */
.bottom-bar .btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rpx;
  background: repeating-linear-gradient(
    90deg,
    rgba(255,255,255,0.3) 0px,
    rgba(255,255,255,0.3) 8px,
    transparent 8px,
    transparent 16px
  );
}

.bottom-bar .btn-primary:active {
  transform: scale(0.98);
}
```

---

## Task 3: 冰箱页面 (fridge.wxss)

**Files:**
- Modify: `miniprogram/pages/fridge/fridge.wxss`

- [ ] **Step 1: 查看当前 fridge.wxss 内容**

确认现有样式结构。

- [ ] **Step 2: 更新分类卡片样式**

```wxss
/* ==================== 分类卡片 - 顶部条纹 + 波普圆点 ==================== */
.category-scroll {
  margin-top: -60rpx;
  padding: 0 20rpx;
  position: relative;
  z-index: 10;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.category-card {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 90px;
  height: 95px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  margin-right: 14rpx;
  box-shadow: var(--shadow-sm);
  padding: 12rpx;
  vertical-align: top;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

/* 顶部条纹装饰 */
.category-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rpx;
  background: repeating-linear-gradient(
    90deg,
    var(--primary) 0px,
    var(--primary) 4px,
    var(--primary-light) 4px,
    var(--primary-light) 8px
  );
}

/* 右上角波普圆点 */
.category-card::after {
  content: '';
  position: absolute;
  top: 15rpx;
  right: 10rpx;
  width: 16rpx;
  height: 16rpx;
  background: var(--primary-light);
  border-radius: 50%;
  opacity: 0.6;
}

.category-emoji {
  font-size: 28px;
  margin-top: 8rpx;
}

.category-name {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--text-secondary);
  margin-top: 4rpx;
}

.category-count {
  font-family: 'Space Mono', monospace;
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: -1px;
}
```

- [ ] **Step 3: 更新食材卡片样式**

```wxss
/* ==================== 食材卡片 - 条纹状态条 ==================== */
.item-card {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 16rpx;
  margin-bottom: 10rpx;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

/* 左侧条纹状态条 */
.item-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 6rpx;
  height: 100%;
  background: repeating-linear-gradient(
    180deg,
    var(--success) 0px,
    var(--success) 6px,
    transparent 6px,
    transparent 12px
  );
}

.item-card.safe::before {
  background: repeating-linear-gradient(
    180deg,
    var(--success) 0px,
    var(--success) 6px,
    transparent 6px,
    transparent 12px
  );
}

.item-card.warning::before {
  background: repeating-linear-gradient(
    180deg,
    var(--warning) 0px,
    var(--warning) 6px,
    transparent 6px,
    transparent 12px
  );
}

.item-card.danger::before {
  background: repeating-linear-gradient(
    180deg,
    var(--danger) 0px,
    var(--danger) 6px,
    transparent 6px,
    transparent 12px
  );
}

.item-emoji {
  font-size: 32px;
  margin-right: 16rpx;
  flex-shrink: 0;
  position: relative;
}

/* 食材图标角落小方块 */
.item-emoji::after {
  content: '';
  position: absolute;
  top: -3rpx;
  right: -3rpx;
  width: 10rpx;
  height: 10rpx;
  background: var(--primary-light);
  border-radius: 4rpx;
  transform: rotate(45deg);
}

.item-name {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 4rpx;
  letter-spacing: 0.5px;
}

.days-badge {
  display: inline-block;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.days-badge.safe {
  background: rgba(90, 138, 106, 0.15);
  color: var(--success);
}

.days-badge.warning {
  background: rgba(212, 168, 40, 0.15);
  color: var(--warning);
}

.days-badge.danger {
  background: rgba(196, 92, 92, 0.15);
  color: var(--danger);
}
```

- [ ] **Step 4: 更新浮动添加按钮样式**

```wxss
/* ==================== 浮动按钮 - 波普风格 ==================== */
.add-btn {
  position: fixed;
  right: 24rpx;
  bottom: calc(120rpx + env(safe-area-inset-bottom));
  width: 60px;
  height: 60px;
  border-radius: 20rpx;
  background: var(--primary);
  box-shadow: 0 6rpx 24rpx rgba(196,139,139,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #fff;
  z-index: 100;
}

.add-btn::before {
  content: '';
  position: absolute;
  top: 6rpx;
  left: 6rpx;
  width: 12rpx;
  height: 12rpx;
  background: rgba(255,255,255,0.3);
  border-radius: 3rpx;
}

.add-btn:active {
  transform: scale(0.95);
}
```

---

## Task 4: 点餐页面 (order.wxss)

**Files:**
- Modify: `miniprogram/pages/order/order.wxss`

- [ ] **Step 1: 查看当前 order.wxss 内容**

确认现有样式结构。

- [ ] **Step 2: 更新搜索栏样式**

```wxss
/* ==================== 搜索栏 - 底部条纹 ==================== */
.search-bar {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 16rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: 0 20rpx 20rpx;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

/* 底部条纹装饰 */
.search-bar::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: repeating-linear-gradient(
    90deg,
    var(--primary) 0px,
    var(--primary) 6px,
    var(--primary-light) 6px,
    var(--primary-light) 12px
  );
}

.search-icon {
  color: var(--text-placeholder);
  font-size: 16px;
}

.search-placeholder {
  color: var(--text-placeholder);
  font-size: 13px;
  letter-spacing: 0.5px;
}
```

- [ ] **Step 3: 更新分类标签样式**

```wxss
/* ==================== 分类标签 - 胶囊形状 ==================== */
.category-tabs {
  display: flex;
  gap: 10rpx;
  padding: 0 20rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}

.category-tab {
  padding: 10rpx 18rpx;
  background: var(--bg-card);
  border-radius: 25rpx;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  border: 2rpx solid var(--border-light);
  letter-spacing: 1px;
  transition: all 0.3s;
}

.category-tab.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
```

- [ ] **Step 4: 更新菜品卡片样式**

复用 today.wxss 中的 dish-card 样式逻辑。

---

## Task 5: 健康计划页面 (health.wxss)

**Files:**
- Modify: `miniprogram/pages/health/health.wxss`

- [ ] **Step 1: 查看当前 health.wxss 内容**

确认现有样式结构。

- [ ] **Step 2: 更新健康数据卡片样式**

```wxss
/* ==================== 健康数据卡片 - 波普圆点 + 底部条纹 ==================== */
.health-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20rpx;
  margin: 0 20rpx 16rpx;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

/* 右上角波普圆点装饰 */
.health-card::before {
  content: '';
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 50rpx;
  height: 50rpx;
  background: repeating-conic-gradient(
    var(--primary-light) 0deg 30deg,
    transparent 30deg 60deg
  );
  border-radius: 50%;
  opacity: 0.4;
}

/* 底部条纹装饰 */
.health-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6rpx;
  background: repeating-linear-gradient(
    90deg,
    var(--primary) 0px,
    var(--primary) 8px,
    var(--primary-light) 8px,
    var(--primary-light) 16px
  );
}

.health-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
  position: relative;
  z-index: 1;
}

.health-card-title {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
}

.health-stat {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.health-stat-value {
  font-family: 'Space Mono', monospace;
  font-size: 34px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: -2px;
}

.health-stat-unit {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
}
```

- [ ] **Step 3: 更新迷你柱状图样式**

```wxss
/* ==================== 迷你柱状图 - 圆点装饰 ==================== */
.mini-chart {
  display: flex;
  align-items: flex-end;
  gap: 8rpx;
  height: 50px;
  padding-top: 12rpx;
  position: relative;
  z-index: 1;
}

.chart-bar {
  flex: 1;
  background: var(--primary-light);
  border-radius: 4rpx 4rpx 0 0;
  min-height: 12rpx;
  position: relative;
}

/* 非最新柱子的小圆点 */
.chart-bar:not(:last-child)::after {
  content: '';
  position: absolute;
  top: -4rpx;
  right: -2rpx;
  width: 8rpx;
  height: 8rpx;
  background: var(--primary);
  border-radius: 50%;
  opacity: 0.3;
}

.chart-bar:last-child {
  background: var(--primary);
}

.trend-text {
  font-size: 11px;
  font-weight: 700;
  color: var(--success);
  margin-top: 10rpx;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}
```

---

## Task 6: 设置页面 (settings.wxss)

**Files:**
- Modify: `miniprogram/pages/settings/settings.wxss`

- [ ] **Step 1: 查看当前 settings.wxss 内容**

确认现有样式结构。

- [ ] **Step 2: 更新用户卡片样式**

```wxss
/* ==================== 用户卡片 - 波普圆形背景 ==================== */
.user-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20rpx;
  margin: 0 20rpx 24rpx;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

/* 波普圆形背景 */
.user-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 80px;
  background: repeating-conic-gradient(
    var(--primary-light) 0deg 30deg,
    transparent 30deg 60deg
  );
  border-radius: 50%;
  opacity: 0.4;
}

.user-avatar {
  width: 56rpx;
  height: 56rpx;
  background: var(--primary);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  position: relative;
  z-index: 1;
}

/* 头像右下角绿色指示 */
.user-avatar::after {
  content: '';
  position: absolute;
  bottom: -4rpx;
  right: -4rpx;
  width: 18rpx;
  height: 18rpx;
  background: var(--success);
  border-radius: 6rpx;
  border: 3rpx solid var(--bg-card);
}

.user-info {
  flex: 1;
  position: relative;
  z-index: 1;
}

.user-name {
  font-family: 'Space Mono', monospace;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4rpx;
  letter-spacing: 1px;
}

.user-id {
  font-size: 11px;
  color: var(--text-secondary);
  letter-spacing: 1px;
}
```

- [ ] **Step 3: 更新设置列表样式**

```wxss
/* ==================== 设置列表 - 虚线分隔 + 图标方块 ==================== */
.settings-list {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  margin: 0 20rpx;
}

.settings-item {
  display: flex;
  align-items: center;
  padding: 18rpx 20rpx;
  border-bottom: 2rpx dashed var(--border-light);
  position: relative;
}

.settings-item:last-child {
  border-bottom: none;
}

.settings-icon {
  width: 44rpx;
  height: 44rpx;
  background: var(--bg-start);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-right: 16rpx;
  position: relative;
}

/* 图标角落小方块 */
.settings-icon::after {
  content: '';
  position: absolute;
  top: -3rpx;
  right: -3rpx;
  width: 10rpx;
  height: 10rpx;
  background: var(--primary-light);
  border-radius: 3rpx;
  transform: rotate(45deg);
}

.settings-label {
  flex: 1;
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.settings-arrow {
  color: var(--text-placeholder);
  font-size: 16px;
  font-weight: 300;
}

/* 危险操作项 */
.settings-item.danger {
  background: rgba(196, 92, 92, 0.05);
}

.settings-item.danger .settings-label {
  color: var(--danger);
}

.settings-item.danger .settings-icon {
  background: rgba(196, 92, 92, 0.1);
}
```

---

## Task 7: 验证与测试

**Files:**
- None (visual verification)

- [ ] **Step 1: 在微信开发者工具中预览**

确认所有页面的波普风格显示正确。

- [ ] **Step 2: 检查页面元素**

- [ ] 导航栏标题是否大写 + 字间距
- [ ] Tab栏是否有条纹背景线
- [ ] 卡片是否有三角形角落/圆点装饰
- [ ] 分类卡片是否有顶部条纹
- [ ] 食材状态条是否为条纹图案

- [ ] **Step 3: 测试交互**

- [ ] Tab切换是否正常
- [ ] 卡片点击是否有缩放效果
- [ ] 浮动按钮是否可点击

---

## 验收标准

1. **视觉统一**：所有页面使用统一的波普几何元素
2. **配色不变**：保持玫瑰盐粉配色方案
3. **功能完整**：不增删功能，仅改变视觉呈现
4. **动画流畅**：卡片缩放、Tab切换等动效正常

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-05-geometric-redesign-plan.md`**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?