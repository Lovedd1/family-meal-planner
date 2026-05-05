# 前端重设计设计方案

**项目**：家庭饮食健康管家 - 前端界面重设计
**日期**：2026-05-05
**状态**：草稿

---

## 1. 设计方向

### 视觉风格
- **风格**：温暖治愈系
- **布局**：圆润卡片、柔和阴影、层次分明
- **图标**：精致线性图标（统一线条粗细，现代简约）

### 配色方案（玫瑰盐粉 A3）
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
- Info: #7A8AA0 (雾蓝)
```

### 字体
- **标题**：ZCOOL XiaoWei (手写体) - 营造温馨感
- **正文**：Noto Sans SC (思源黑体) - 清晰易读
- **英文辅助**：system-ui fallback

---

## 2. 页面设计规范

### 2.1 全局规范

**圆角系统**
```
- 小组件/标签: 8rpx
- 卡片: 16rpx
- 按钮: 24rpx
- 模态框: 24rpx
- 大容器: 32rpx
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
- 轻阴影: 0 2rpx 8rpx rgba(139,115,85,0.08)
- 中阴影: 0 4rpx 12rpx rgba(139,115,85,0.12)
- 重阴影: 0 8rpx 24rpx rgba(139,115,85,0.16)
```

### 2.2 导航栏 (Nav Bar)
- 背景：渐变 #E8D5D8 → #DCC0C5
- 标题：ZCOOL XiaoWei, 26px, #5D4A4A
- 日期：14px, #8A6A6A
- 底部装饰：波浪形分割线（CSS实现）
- 内边距：顶部 100rpx（适配刘海屏），底部 32rpx

### 2.3 Tab 栏
- 背景：透明（显示页面背景）
- Tab 项：
  - 默认：背景 rgba(255,255,255,0.6)，圆角 16rpx
  - 选中：背景 #fff，边框 2rpx solid #E8D5D8，阴影
- 标签：图标(20px) + 文字(13px)
- 选中指示器：底部边框 #C48B8B

### 2.4 菜品卡片
- 背景：#fff
- 圆角：16rpx
- 内边距：16rpx
- 边框：1rpx solid rgba(0,0,0,0.05)
- 阴影：轻阴影
- Emoji 容器：52x52rpx，圆角 12rpx，背景渐变

### 2.5 按钮
**主按钮**
- 背景：渐变 #C48B8B → #A67070
- 文字：#fff, 14px, 600 weight
- 圆角：24rpx
- 内边距：30rpx 24rpx
- 阴影：0 4rpx 16rpx rgba(196,139,139,0.3)

**次按钮**
- 背景：rgba(255,255,255,0.8)
- 文字：#8A6A6A
- 边框：1rpx solid #E8D5D8

### 2.6 标签/徽章
- 圆角：8rpx
- 内边距：4rpx 12rpx
- 字体：10px, 500 weight
- 颜色变体：
  - 内置：背景 #EDE5E8，文字 #8A6A6A
  - 自定义：背景 #E8F0E8，文字 #5A8A6A
  - 警告：背景 #FFF0E6，文字 #B86E3A
  - 危险：背景 #FDEDED，文字 #C45C5C

### 2.7 警告/提示条
- 背景：#FDF5F5
- 边框：左侧 4rpx solid #C48B8B
- 圆角：12rpx
- 内边距：12rpx 16rpx
- 图标 + 文字布局

### 2.8 模态框
- 遮罩：rgba(0,0,0,0.4)
- 内容背景：#fff
- 圆角：24rpx
- 头部：标题 + 关闭按钮
- 底部按钮组

---

## 3. 各页面设计

### 3.1 今日菜单页面 (today)
**结构**
1. 导航栏（标题 + 日期）
2. Tab 栏（早餐/午餐/晚餐 + 数量徽章）
3. 相克警告条（条件显示）
4. 菜品列表（可滚动）
5. 底部确认按钮（固定）

**组件**
- TabBadge: 显示各餐次菜品数量
- DishCard: 菜品卡片（emoji + 名称 + 标签）
- ConflictBanner: 相克警告

### 3.2 健康计划页面 (health)
**结构**
1. 导航栏
2. 功能入口卡片（体重记录/生理期追踪）
3. AI 饮食计划卡片
4. 详情弹窗

**配色强调**
- 背景渐变：#FDF8F8 → #F0F0F5（微紫调）
- 卡片边框：#E8E0E8

### 3.3 点餐页面 (order)
**结构**
1. 导航栏 + 搜索栏
2. 分类筛选 Tab
3. 菜品网格/列表
4. 底部购物车栏

**组件**
- SearchBar: 搜索输入框
- CategoryTab: 分类标签（全部/荤菜/素菜/汤品/主食）
- DishCard: 菜品卡片 + 添加按钮
- CartBar: 购物车悬浮栏

### 3.4 我的冰箱页面 (fridge)
**结构**
1. 导航栏 + 同步状态
2. 分类统计卡片（横排滚动）
3. 操作栏（筛选/添加）
4. 食材列表
5. 添加弹窗

**组件**
- CategoryCard: 分类统计（emoji + 数量）
- FridgeItem: 食材项（名称 + 剩余天数 + 删除）
- AddModal: 添加食材表单

### 3.5 设置页面 (settings)
**结构**
1. 导航栏
2. 用户信息卡片（头像 + 昵称）
3. 功能列表（数据同步/导出/重置/关于）
4. 配对入口

**组件**
- UserCard: 用户头像 + 昵称 + 邀请码
- SettingsItem: 设置项（图标 + 名称 + 箭头）
- PairCard: 配对状态

---

## 4. 图标规范

**线性图标风格**
- 线宽：2rpx（统一）
- 圆角：自动圆角
- 尺寸：24x24rpx（标准）/ 32x32rpx（大）
- 颜色：继承文字颜色或指定

**图标列表**
```
首页/菜单: icon-home / icon-menu
健康: icon-heart / icon-health
冰箱: icon-fridge
订单/点餐: icon-order
设置: icon-settings
搜索: icon-search
添加: icon-add
删除: icon-delete
警告: icon-warning
完成: icon-check
同步: icon-sync
导出: icon-export
```

**实现方式**
- 优先使用 iconfont 或 Nerd Fonts
- 或使用 inline SVG
- 小程序中可使用 `icon` 组件

---

## 5. 动画规范

**过渡动画**
- 默认时长：300ms
- 缓动函数：ease-out
- 适用：页面切换、弹窗出现/消失

**微交互**
- 卡片点击：scale(0.98) + 阴影减弱
- 按钮点击：scale(0.95)
- Tab 切换：背景色渐变
- 添加到购物车：弹跳动画

**加载状态**
- 骨架屏或简单 spinner
- 颜色：#E8D5D8

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
  --info: #7A8AA0;

  /* Border */
  --border-light: #E8D5D8;
  --border-lighter: rgba(0,0,0,0.05);

  /* Shadow */
  --shadow-sm: 0 2rpx 8rpx rgba(139,115,85,0.08);
  --shadow-md: 0 4rpx 12rpx rgba(139,115,85,0.12);
  --shadow-lg: 0 8rpx 24rpx rgba(139,115,85,0.16);

  /* Radius */
  --radius-sm: 8rpx;
  --radius-md: 16rpx;
  --radius-lg: 24rpx;
  --radius-xl: 32rpx;
}
```

---

## 7. 实施计划

### Phase 1: 全局样式
- [ ] 定义 CSS 变量
- [ ] 重置样式
- [ ] 全局组件样式（按钮、标签、卡片）

### Phase 2: 今日菜单页面
- [ ] 导航栏 + Tab 栏
- [ ] 菜品卡片组件
- [ ] 警告条组件
- [ ] 底部按钮
- [ ] 弹窗（配方、确认）

### Phase 3: 其他页面
- [ ] 冰箱页面
- [ ] 点餐页面
- [ ] 健康计划页面
- [ ] 设置页面

### Phase 4: 细节打磨
- [ ] 动画效果
- [ ] 空状态设计
- [ ] 加载状态
- [ ] 图标替换

---

## 8. 验收标准

1. **视觉统一**：所有页面使用统一的配色和间距系统
2. **功能完整**：不增删功能，只改变视觉呈现
3. **适配良好**：适配不同屏幕尺寸（主要是小屏）
4. **性能良好**：动画流畅，无明显卡顿
5. **代码质量**：CSS 变量化，易于维护
