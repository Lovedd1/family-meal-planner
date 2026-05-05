# Pop Style 前端重设计文档

## 概述

将"家庭饮食健康管家"小程序的前端页面从当前配色风格调整为 Pop Style（玫瑰盐粉配色），统一所有页面的设计语言，提升视觉一致性和美感。

**日期**: 2026-05-05
**状态**: 已批准

---

## 设计系统

### 色彩体系

| 变量 | 色值 | 用途 |
|------|------|------|
| `--primary` | `#C48B8B` | 主色（玫瑰盐粉） |
| `--primary-light` | `#E8D5D8` | 浅主色 |
| `--primary-dark` | `#A67070` | 深主色 |
| `--bg-start` | `#FDF8F8` | 背景起点 |
| `--bg-end` | `#F5EEF0` | 背景终点 |
| `--bg-card` | `#FFFFFF` | 卡片背景 |
| `--text-primary` | `#5D4A4A` | 主要文字 |
| `--text-secondary` | `#8A6A6A` | 次要文字 |
| `--text-placeholder` | `#BDBDBD` | 占位符文字 |
| `--success` | `#5A8A6A` | 成功状态 |
| `--warning` | `#D4A828` | 警告状态 |
| `--danger` | `#C45C5C` | 危险状态 |
| `--border-light` | `#E8D5D8` | 边框 |

### 字体

- **中文**: Noto Sans SC, -apple-system, BlinkMacSystemFont, sans-serif
- **数字/英文**: Space Mono（monospace）

### 圆角

- `--radius-sm`: 8px
- `--radius-md`: 16px
- `--radius-lg`: 24px
- `--radius-xl`: 32px

### 阴影

```css
--shadow-sm: 0 4px 16rpx rgba(93, 74, 74, 0.08);
--shadow-md: 0 6px 20rpx rgba(93, 74, 74, 0.12);
--shadow-lg: 0 8px 24rpx rgba(93, 74, 74, 0.16);
```

---

## 页面结构

### 全局布局

每个页面包含：
1. **导航栏** (`.nav-bar`): 渐变背景 + 底部弧形 + 装饰元素
2. **内容区** (`.page`): 渐变背景 + 点阵纹理 + 底部内边距
3. **底部导航** (`.bottom-nav`): 固定在底部

### 点阵背景

```css
.pop-dots-bg {
  background-image: radial-gradient(var(--primary-light) 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.3;
}
```

---

## 组件样式

### 1. 导航栏

```css
.nav-bar {
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
  padding: 60rpx 24rpx 40rpx;
  position: relative;
}
.nav-bar::after {
  content: '';
  position: absolute;
  bottom: -20px; left: 0; right: 0;
  height: 40px;
  background: var(--bg-end);
  border-radius: 20px 20px 0 0;
}
.nav-bar::before {
  content: '';
  position: absolute;
  top: 50rpx; right: 30rpx;
  width: 60rpx; height: 60rpx;
  background: repeating-conic-gradient(var(--primary) 0deg 15deg, transparent 15deg 30deg);
  border-radius: 50%;
  opacity: 0.3;
}
```

### 2. Tab 栏（今日菜单）

```css
.tab-bar {
  display: flex; gap: 6px; margin: 0 20rpx 16rpx;
  background: var(--bg-card); border-radius: var(--radius-md); padding: 6rpx;
  box-shadow: var(--shadow-sm); position: relative; z-index: 10;
}
.tab-item {
  flex: 1; text-align: center; padding: 16rpx 8rpx; font-size: 13px; font-weight: 600;
  color: var(--text-secondary); border-radius: var(--radius-sm); transition: all 0.25s ease;
}
.tab-item.active {
  background: var(--primary); color: #fff;
  box-shadow: 0 4px 12px rgba(196, 139, 139, 0.35);
}
.tab-icon { font-size: 24px; }
.tab-badge {
  min-width: 20px; height: 20px;
  background: rgba(196, 139, 139, 0.15); color: var(--primary);
  border-radius: 10px; font-size: 11px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
}
.tab-item.active .tab-badge {
  background: rgba(255, 255, 255, 0.3); color: #fff;
}
```

### 3. 菜品卡片

```css
.dish-card {
  background: var(--bg-card); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px;
  display: flex; align-items: center; gap: 14px; position: relative; overflow: hidden;
  box-shadow: var(--shadow-sm); transition: transform 0.2s;
}
/* 右上角三角装饰 */
.dish-card::before {
  content: ''; position: absolute; top: 0; right: 0; width: 0; height: 0;
  border-style: solid; border-width: 0 32px 32px 0;
  border-color: transparent var(--primary-light) transparent transparent; opacity: 0.5;
}
/* 右下角圆点装饰 */
.dish-card::after {
  content: ''; position: absolute; bottom: 6px; right: 6px; width: 10px; height: 10px;
  background: var(--primary); border-radius: 50%; opacity: 0.3;
}
.dish-card:active { transform: scale(0.98); }
```

### 4. 加热标签

```css
.heat-tag {
  display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700;
  padding: 4px 10px; border-radius: 6px;
  background: rgba(93, 74, 74, 0.06); color: var(--text-secondary);
}
.heat-tag.safe { background: rgba(90, 138, 106, 0.12); color: var(--success); }
.heat-tag.danger { background: rgba(196, 92, 92, 0.12); color: var(--danger); }
.heat-tag.warning { background: rgba(212, 168, 40, 0.12); color: var(--warning); }
```

### 5. 主按钮

```css
.btn-primary {
  background: var(--primary); color: #fff; border: none; border-radius: var(--radius-md);
  font-family: 'Space Mono', monospace; font-size: 14px; font-weight: 700; padding: 18px;
  position: relative; overflow: hidden; box-shadow: 0 6px 20px rgba(196, 139, 139, 0.4);
}
.btn-primary::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
  background: repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 8px, transparent 8px, transparent 16px);
}
```

### 6. 搜索栏

```css
.search-bar {
  background: var(--bg-card); border-radius: var(--radius-md); padding: 14px 16px;
  display: flex; align-items: center; gap: 12px; margin: 0 20px 16px;
  box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
}
/* 底部条纹装饰 */
.search-bar::before {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
  background: repeating-linear-gradient(90deg, var(--primary) 0px, var(--primary) 4px, var(--primary-light) 4px, var(--primary-light) 8px);
}
```

### 7. 分类标签

```css
.category-tab {
  padding: 8px 16px; background: var(--bg-card); border-radius: 20px;
  font-family: 'Space Mono', monospace; font-size: 12px; font-weight: 700;
  color: var(--text-secondary); border: 1.5px solid var(--border-light);
  cursor: pointer; transition: all 0.2s;
}
.category-tab.active {
  background: var(--primary); color: #fff; border-color: var(--primary);
}
```

### 8. 添加按钮圆形

```css
.add-btn-circle {
  width: 44px; height: 44px; background: var(--primary); color: #fff; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 300;
  box-shadow: 0 4px 16px rgba(196, 139, 139, 0.35); cursor: pointer; position: relative;
}
.add-btn-circle::after {
  content: ''; position: absolute; top: 6px; left: 6px; width: 10px; height: 10px;
  background: rgba(255,255,255,0.3); border-radius: 2px;
}
```

### 9. 分类卡片（冰箱）

```css
.category-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-width: 72px; height: 80px; background: var(--bg-card); border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm); padding: 8px; flex-shrink: 0; position: relative; overflow: hidden;
}
/* 顶部条纹装饰 */
.category-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: repeating-linear-gradient(90deg, var(--primary) 0px, var(--primary) 3px, var(--primary-light) 3px, var(--primary-light) 6px);
}
/* 右上角小圆点 */
.category-card::after {
  content: ''; position: absolute; top: 8px; right: 6px; width: 8px; height: 8px;
  background: var(--primary-light); border-radius: 50%; opacity: 0.6;
}
```

### 10. 食材卡片

```css
.item-card {
  display: flex; align-items: center; background: var(--bg-card); border-radius: var(--radius-md);
  padding: 14px; margin-bottom: 10px; box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
}
/* 左侧状态条 */
.item-card::before { content: ''; position: absolute; left: 0; top: 0; width: 4px; height: 100%; }
.item-card.safe::before { background: repeating-linear-gradient(180deg, var(--success) 0px, var(--success) 6px, transparent 6px, transparent 12px); }
.item-card.warning::before { background: repeating-linear-gradient(180deg, var(--warning) 0px, var(--warning) 6px, transparent 6px, transparent 12px); }
.item-card.danger::before { background: repeating-linear-gradient(180deg, var(--danger) 0px, var(--danger) 6px, transparent 6px, transparent 12px); }
```

### 11. FAB 按钮

```css
.fab {
  position: fixed; right: 24px; bottom: calc(100px + env(safe-area-inset-bottom, 20px));
  width: 56px; height: 56px; border-radius: 16px; background: var(--primary);
  box-shadow: 0 6px 24px rgba(196, 139, 139, 0.5); display: flex; align-items: center;
  justify-content: center; font-size: 28px; color: #fff; z-index: 100; cursor: pointer;
}
.fab::before {
  content: ''; position: absolute; top: 6px; left: 6px; width: 10px; height: 10px;
  background: rgba(255,255,255,0.3); border-radius: 3px;
}
```

### 12. 健康 Hero 卡片

```css
.health-hero {
  margin: 20px; padding: 32px 24px;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
  border-radius: var(--radius-lg); color: #fff; position: relative; overflow: hidden;
}
.health-hero::before {
  content: ''; position: absolute; top: -40%; right: -15%; width: 200px; height: 200px;
  background: repeating-conic-gradient(var(--primary) 0deg 15deg, transparent 15deg 30deg);
  border-radius: 50%; opacity: 0.3;
}
/* 底部条纹 */
.health-hero::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 6px;
  background: repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 8px, transparent 8px, transparent 16px);
}
```

### 13. 功能卡片

```css
.function-card {
  background: var(--bg-card); border-radius: var(--radius-md); padding: 24px 16px;
  box-shadow: var(--shadow-sm); display: flex; flex-direction: column; align-items: center;
  text-align: center; transition: transform 0.2s; position: relative; overflow: hidden; cursor: pointer;
}
.function-card::after {
  content: ''; position: absolute; top: 8px; right: 8px; width: 10px; height: 10px;
  background: var(--primary-light); border-radius: 2px; transform: rotate(45deg); opacity: 0.5;
}
.function-card:active { transform: scale(0.97); }
.function-icon {
  width: 56px; height: 56px;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  margin-bottom: 12px; font-size: 26px; color: #fff;
}
```

### 14. 报告卡片

```css
.report-card {
  background: var(--bg-card); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px;
  box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
}
/* 右上角三角 */
.report-card::before {
  content: ''; position: absolute; top: 0; right: 0; width: 0; height: 0;
  border-style: solid; border-width: 0 32px 32px 0;
  border-color: transparent var(--primary-light) transparent transparent; opacity: 0.5;
}
/* 底部条纹 */
.report-card::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
  background: repeating-linear-gradient(90deg, var(--primary) 0px, var(--primary) 4px, var(--primary-light) 4px, var(--primary-light) 8px);
}
```

### 15. 用户卡片

```css
.user-card {
  display: flex; align-items: center; gap: 14px; background: var(--bg-card);
  border-radius: var(--radius-md); padding: 16px; margin: 20px;
  position: relative; overflow: hidden; box-shadow: var(--shadow-sm);
}
/* 右上角装饰圆 */
.user-card::before {
  content: ''; position: absolute; top: 0; right: 0; width: 60px; height: 60px;
  background: repeating-conic-gradient(var(--primary-light) 0deg 30deg, transparent 30deg 60deg);
  border-radius: 50%; opacity: 0.45;
}
.user-avatar {
  width: 48px; height: 48px; background: var(--primary); border-radius: 14px;
  display: flex; align-items: center; justify-content: center; font-size: 24px; position: relative; z-index: 1;
}
/* 头像右下角状态指示 */
.user-avatar::after {
  content: ''; position: absolute; bottom: -3px; right: -3px; width: 14px; height: 14px;
  background: var(--success); border-radius: 4px; border: 2px solid var(--bg-card);
}
```

### 16. 设置项

```css
.settings-item {
  display: flex; align-items: center; padding: 14px 16px;
  border-bottom: 1px dashed var(--border-light); cursor: pointer;
}
.settings-item:last-child { border-bottom: none; }
.settings-icon {
  width: 36px; height: 36px; background: var(--bg-start); border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
  margin-right: 12px; position: relative;
}
/* 图标右上角小装饰 */
.settings-icon::after {
  content: ''; position: absolute; top: -2px; right: -2px; width: 8px; height: 8px;
  background: var(--primary-light); border-radius: 2px; transform: rotate(45deg);
}
/* 不同功能图标背景色 */
.settings-icon.sync { background: #E8F5E9; }
.settings-icon.export { background: #E3F2FD; }
.settings-icon.reset { background: #FFF8E6; }
.settings-icon.about { background: #F5F0F8; }
```

### 17. 底部导航

```css
.bottom-nav {
  position: fixed; bottom: 0; left: 0; right: 0; background: var(--bg-card);
  display: flex; padding: 8px 0;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 20px));
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06); z-index: 1000;
}
.nav-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; padding: 6px 0;
  color: var(--text-placeholder); font-size: 10px; cursor: pointer; transition: all 0.2s;
}
.nav-item.active { color: var(--primary); }
.nav-item-icon { font-size: 24px; margin-bottom: 2px; }
.nav-item-label {
  font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700;
}
```

---

## 页面具体修改

### 今日菜单页面 (today)

- 导航栏改为玫瑰盐粉渐变
- Tab 栏增加图标和徽章
- 冲突提示条保持危险红色样式
- 菜品卡片添加三角装饰
- 底部按钮使用主按钮样式

### 点餐页面 (order)

- 搜索框添加底部条纹装饰
- 分类标签使用胶囊样式
- 菜品卡片添加三角装饰和圆点
- 添加按钮使用圆形 + 图标装饰
- 底部购物车栏固定显示

### 冰箱页面 (fridge)

- 导航栏改为玫瑰盐粉渐变
- 分类卡片添加顶部条纹和圆点装饰
- 食材卡片添加左侧状态条（渐变条纹）
- FAB 按钮添加装饰
- 天数标签使用状态色

### 健康页面 (health)

- Hero 大数字展示卡片
- 体重折线图使用主色
- 功能入口卡片使用渐变图标
- 报告卡片添加三角装饰和底部条纹

### 设置页面 (settings)

- 用户卡片圆形头像 + 状态指示
- 双人同步卡片保留
- 设置项使用图标背景色区分
- 邀请码展示框使用条纹装饰

---

## 实施文件

| 文件 | 改动 |
|------|------|
| `app.wxss` | 全局样式变量、通用组件样式 |
| `pages/today/today.wxss` | 今日菜单页面样式 |
| `pages/order/order.wxss` | 点餐页面样式 |
| `pages/fridge/fridge.wxss` | 冰箱页面样式 |
| `pages/health/health.wxss` | 健康页面样式 |
| `pages/settings/settings.wxss` | 设置页面样式 |

---

## 注意事项

1. 所有页面统一使用玫瑰盐粉配色，不再有各自的主题色
2. 保持微信小程序语法（rpx 单位、WXSS 限制）
3. 动画使用 `transition` 和 `transform`，避免复杂动画
4. 兼容安全区域 `env(safe-area-inset-bottom)`
5. 保持现有功能不变，样式调整不影响业务逻辑