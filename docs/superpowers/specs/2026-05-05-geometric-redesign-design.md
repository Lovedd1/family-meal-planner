# 前端重设计方案 - 几何波普风格

**项目**：家庭饮食健康管家 - 前端界面重设计
**风格**：几何波普（90年代几何印花风格）
**日期**：2026-05-05
**状态**：已确认

---

## 1. 设计方向

### 视觉风格
- **风格**：几何波普（90年代MTV + 几何印花）
- **关键词**：大胆、年轻化、个性化、有节奏感
- **装饰元素**：波普圆点、锯齿条纹、斜线条、重复几何图案

### 配色方案（玫瑰盐粉 - 保持不变）
```
主色调：
- Primary: #C48B8B (玫瑰粉棕)
- Primary Light: #E8D5D8 (浅玫瑰)
- Primary Dark: #A67070 (深玫瑰)

辅助色：
- Background: #FDF8F8 → #F5EEF0 (渐变米粉)
- Card: #FFFFFF
- Text: #5D4A4A (主文字)
- Text Light: #8A6A6A (次要文字)

功能色：
- Success: #5A8A6A (抹茶绿)
- Warning: #D4A828 (柠檬黄)
- Danger: #C45C5C (珊瑚红)
```

### 字体
- **标题**：Space Mono (等宽字体，营造科技感)
- **正文**：Noto Sans SC (思源黑体)
- **强调**：标题使用大写字母 + 字间距

---

## 2. 波普装饰元素规范

### 2.1 波普圆点
```css
/* 圆点排列 */
background: repeating-conic-gradient(
  var(--primary) 0deg 15deg,
  transparent 15deg 30deg
);
border-radius: 50%;
```

### 2.2 锯齿条纹
```css
/* 锯齿图案 */
background: repeating-linear-gradient(
  45deg,
  var(--primary-light) 0px,
  var(--primary-light) 3px,
  transparent 3px,
  transparent 6px
);
```

### 2.3 水平条纹
```css
/* 条纹装饰 */
background: repeating-linear-gradient(
  90deg,
  var(--primary) 0px,
  var(--primary) 4px,
  var(--primary-light) 4px,
  var(--primary-light) 8px
);
```

### 2.4 角落三角形
```css
/* 卡片右上角三角形 */
border-style: solid;
border-width: 0 40px 40px 0;
border-color: transparent var(--primary-light) transparent transparent;
```

### 2.5 斜方块装饰
```css
/* 小方块旋转45度 */
transform: rotate(45deg);
opacity: 0.5;
```

---

## 3. 页面设计规范

### 3.1 全局规范

**圆角系统**
```
- 小组件/标签: 6-8rpx
- 卡片: 16rpx
- 大容器: 20rpx
- 模态框: 20rpx
```

**间距系统**
```
- xs: 8rpx
- sm: 12rpx
- md: 16rpx
- lg: 20rpx
- xl: 24rpx
- xxl: 32rpx
```

**阴影系统**
```
- 轻阴影: 0 4rpx 16rpx rgba(93,74,74,0.08)
- 中阴影: 0 6rpx 20rpx rgba(93,74,74,0.12)
- 重阴影: 0 8rpx 24rpx rgba(93,74,74,0.16)
```

### 3.2 导航栏 (Nav Bar)
- 背景：渐变 #FDF8F8
- 标题：Space Mono, 20px, 大写 + 字间距2px, #5D4A4A
- 日期：11px, #8A6A6A, 字间距1px
- 波普装饰：顶部/右侧添加圆点、锯齿、圆形组合
- 内边距：顶部 100rpx（适配刘海屏）

### 3.3 Tab 栏
- 布局：带背景线的 Flex 布局
- 背景线：条纹图案（通过 ::before 实现）
- Tab 项：
  - 默认：背景 #fff，圆角 8rpx
  - 选中：背景 #C48B8B，文字 #fff
- 标签：12px, 700 weight, 大写, 字间距1px
- 计数徽章：20x20px, 圆角10px, 背景 rgba(255,255,255,0.3)

### 3.4 区块标题
- 标题：11px, 700 weight, #C48B8B, 字间距3px, 大写
- 下划线：条纹渐变（与Tab背景线相同）

### 3.5 菜品卡片
- 背景：#fff
- 圆角：16rpx
- 内边距：18rpx
- 阴影：轻阴影
- 右上角三角形装饰（::before）
- 右下角小圆点装饰（::after）
- 图标容器：56x56rpx，圆角12rpx，背景渐变

### 3.6 分类卡片
- 顶部条纹装饰（6px高）
- 右上角圆形波普装饰
- 数字：22px, 700 weight, #C48B8B
- 标签：10px, 700 weight, 字间距1px

### 3.7 食材卡片
- 左侧状态条：条纹图案（success/warning/danger）
- 状态条宽度：6px
- 右上角小方块旋转装饰

### 3.8 按钮
**主按钮**
- 背景：#C48B8B
- 文字：#fff, 14px, 700 weight, 字间距2px, 大写
- 圆角：16rpx
- 内边距：18rpx
- 顶部条纹装饰（::before）

**浮动按钮 (FAB)**
- 尺寸：60x60rpx
- 圆角：20rpx
- 背景：#C48B8B
- 字体：32px
- 阴影：0 6rpx 24rpx rgba(196,139,139,0.5)
- 角落小方块装饰

### 3.9 标签/徽章
- 圆角：6rpx
- 内边距：4px 10px
- 字体：10px, 700 weight, 字间距1px

### 3.10 健康数据卡片
- 右上角波普圆点装饰
- 底部条纹装饰（6px高）
- 数值：34px, 700 weight, 字间距-2px

### 3.11 设置列表
- 背景：#fff
- 圆角：20rpx
- 项目分隔：2px虚线
- 图标背景：#FDF8F8，圆角12rpx，角落小方块

---

## 4. 各页面设计

### 4.1 今日菜单页面 (today)
**结构**
1. 导航栏（标题 + 日期 + 波普装饰）
2. Tab 栏（早餐/午餐/晚餐 + 数量徽章）
3. 区块标题（早餐/晚餐）
4. 菜品列表（可滚动）
5. 底部确认按钮

**组件**
- TabBadge: 显示各餐次菜品数量
- DishCard: 菜品卡片（图标 + 名称 + 标签 + 波普装饰）
- SectionHeader: 区块标题 + 条纹线

### 4.2 健康计划页面 (health)
**结构**
1. 导航栏
2. 健康数据卡片（体重记录 + 迷你柱状图）
3. 生理期追踪卡片
4. AI 饮食计划卡片

**配色强调**
- 健康卡片带波普圆点和底部条纹装饰
- 标题使用大写 Space Mono

### 4.3 点餐页面 (order)
**结构**
1. 导航栏
2. 搜索栏（底部条纹装饰）
3. 分类标签（胶囊形状）
4. 菜品网格/列表

**组件**
- SearchBar: 搜索输入框（底部条纹）
- CategoryTab: 分类标签（全部/荤菜/素菜/汤品/主食）
- DishCard: 菜品卡片 + 添加按钮

### 4.4 我的冰箱页面 (fridge)
**结构**
1. 导航栏 + 同步状态
2. 分类统计卡片（横排滚动，顶部条纹）
3. 即将过期区块标题
4. 食材列表
5. 浮动添加按钮

**组件**
- CategoryCard: 分类统计（顶部条纹 + 右上角波普圆点）
- ItemCard: 食材项（左侧条纹状态条 + 角落小方块）

### 4.5 设置页面 (settings)
**结构**
1. 导航栏
2. 用户信息卡片（波普圆形背景 + 绿色在线指示）
3. 功能列表

**组件**
- UserCard: 用户头像 + 昵称 + 波普装饰
- SettingsItem: 设置项（图标 + 名称 + 箭头 + 虚线分隔）

---

## 5. 动效规范

### 5.1 过渡动画
- 默认时长：300ms
- 缓动函数：ease-out
- 适用：页面切换、弹窗出现/消失

### 5.2 微交互
- 卡片点击：scale(0.98)
- 按钮点击：scale(0.98)
- Tab 切换：背景色渐变

### 5.3 波普装饰
- 波普圆点：静态装饰
- 锯齿条纹：静态装饰
- 条纹背景：静态装饰

---

## 6. 技术实现

### 文件结构
```
miniprogram/
├── app.wxss          # 全局样式 + CSS变量
├── pages/
│   ├── today/
│   │   └── today.wxss
│   ├── health/
│   │   └── health.wxss
│   ├── order/
│   │   └── order.wxss
│   ├── fridge/
│   │   └── fridge.wxss
│   └── settings/
│       └── settings.wxss
└── static/
    └── icons/        # 线性图标 SVG
```

### CSS 变量定义 (app.wxss)
```css
:root {
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

  /* Border */
  --border-light: #E8D5D8;

  /* Shadow */
  --shadow-sm: 0 4rpx 16rpx rgba(93,74,74,0.08);
  --shadow-md: 0 6rpx 20rpx rgba(93,74,74,0.12);
  --shadow-lg: 0 8rpx 24rpx rgba(93,74,74,0.16);

  /* Radius */
  --radius-sm: 8rpx;
  --radius-md: 16rpx;
  --radius-lg: 20rpx;
}
```

---

## 7. 实施计划

### Phase 1: 全局样式
- [ ] 更新 app.wxss CSS 变量
- [ ] 添加波普装饰 mixin
- [ ] 定义全局组件样式（卡片、按钮、标签）

### Phase 2: 今日菜单页面
- [ ] 更新导航栏样式（标题大写 + 波普装饰）
- [ ] 更新 Tab 栏样式（条纹背景线）
- [ ] 更新菜品卡片（三角形角落 + 小圆点）
- [ ] 更新区块标题样式

### Phase 3: 冰箱页面
- [ ] 更新分类卡片（顶部条纹 + 波普圆点）
- [ ] 更新食材卡片（条纹状态条）
- [ ] 更新浮动按钮样式

### Phase 4: 点餐页面
- [ ] 更新搜索栏（底部条纹）
- [ ] 更新分类标签（胶囊形状）
- [ ] 更新菜品卡片样式

### Phase 5: 健康计划页面
- [ ] 更新健康数据卡片（波普圆点 + 底部条纹）
- [ ] 更新标题样式

### Phase 6: 设置页面
- [ ] 更新用户卡片（波普圆形背景）
- [ ] 更新设置列表（虚线分隔 + 图标方块装饰）

### Phase 7: 细节打磨
- [ ] 动画效果
- [ ] 空状态设计
- [ ] 加载状态
- [ ] 图标替换

---

## 8. 验收标准

1. **视觉统一**：所有页面使用统一的波普几何元素
2. **功能完整**：不增删功能，只改变视觉呈现
3. **适配良好**：适配不同屏幕尺寸（主要是小屏）
4. **性能良好**：动画流畅，无明显卡顿
5. **代码质量**：CSS 变量化，易于维护