# 健康页功能优化设计

日期：2026-05-08

## 概述

对健康计划页面的两个功能进行优化：
1. 近7天饮食记录增加详情弹窗
2. 30天体重趋势柱状图完善

---

## 功能一：饮食记录详情弹窗

### 需求

当前饮食历史只显示 emoji 图标，点击后应展示完整的三餐菜单详情。

### 数据结构

每条饮食历史记录格式：
```js
{
  date: "2026-05-08",           // 日期
  menu: {
    breakfast: [dish1, dish2], // 早餐
    lunch: [dish1, dish2],      // 午餐
    dinner: [dish1, dish2]      // 晚餐
  },
  nutritionStats: {             // 营养统计
    carbsCount: 1,
    proteinCount: 2,
    fatCount: 0,
    fiberCount: 1,
    totalCount: 4
  }
}
```

### UI 设计

```
┌─────────────────────────────┐
│  2026年5月8日            × │
├─────────────────────────────┤
│  🌅 早餐                     │
│  🍚 米饭  🥩 土豆炖牛肉       │
│                              │
│  ☀️ 午餐                     │
│  🥬 西兰花炒鸡胸肉            │
│                              │
│  🌙 晚餐                     │
│  🥒 凉拌黄瓜                  │
└─────────────────────────────┘
```

### 实现方案

- 新增 `showDietDetailModal` 弹窗，数据绑定 `dietDetailData`
- 点击历史记录触发 `showDietDetail(e)` 方法
- WXML 中遍历 breakfast/lunch/dinner 三个分组
- 菜品显示 emoji + name

---

## 功能二：30天体重趋势柱状图（Canvas）

### 需求

- 横轴：日期（格式 M/D，如 3/15）
- 纵轴：体重数值
- 可左右滑动查看全部30天数据
- 每次显示约5天数据
- 柱颜色：比昨日涨→红色，跌→绿色

### 数据结构

```js
// weightRecords 数组
[
  { date: "2026-05-08", weight: 65.5 },
  { date: "2026-05-07", weight: 65.3 },
  ...
]
```

### UI 设计

```
┌────────────────────────────────────────┐
│  📊 30天体重趋势                        │
├────────────────────────────────────────┤
│                                        │
│  66kg ┤                              │  ← 右侧刻度
│       │    ██                          │
│  65kg ┤    ██ ██                       │
│       │    ██ ██ ██                    │
│  64kg ┤ ██ ██ ██ ██                    │
│       │ ██ ██ ██ ██ ██                  │
│  63kg ┤ ██ ██ ██ ██ ██                  │
│       └─────────────────────────       │
│        5/4   5/5   5/6   5/7   5/8     │  ← 日期标签
│                                        │
│  ●上涨  ●下降                          │
└────────────────────────────────────────┘
```

颜色规则：
- 红色柱（#C45C5C）：体重比昨日上涨
- 绿色柱（#5A8A6A）：体重比昨日下降
- 灰色柱（#E8D5D8）：第一天的数据（无对比）

### Canvas 绘制参数

- Canvas 总宽度：30天 × 120rpx = 3600rpx
- 每柱宽度：100rpx
- 柱间距：20rpx
- 左侧留白（刻度）：100rpx
- 底部留白（日期）：60rpx
- 柱子圆角：8rpx

### 实现方案

1. 使用 `scroll-view` (scroll-x) 横向滚动
2. Canvas 绘制：
   - Y轴刻度和网格线
   - X轴日期标签（每隔一天显示，避免拥挤）
   - 柱状条（颜色根据涨跌判断）
   - 体重数值在柱子上方
3. 动态计算 Y轴范围：min(weight) - 1 ~ max(weight) + 1

### 关键代码

```js
// 计算颜色
getBarColor(currentWeight, prevWeight) {
  if (prevWeight === null) return '#E8D5D8'  // 第一天灰色
  if (currentWeight > prevWeight) return '#C45C5C'  // 涨→红
  if (currentWeight < prevWeight) return '#5A8A6A'  // 跌→绿
  return '#C48B8B'  // 不变→粉
}
```

---

## 修改文件清单

1. `miniprogram/pages/health/health.wxml` - 添加详情弹窗，调整体重趋势区域
2. `miniprogram/pages/health/health.js` - 添加 showDietDetail、绘制柱状图方法
3. `miniprogram/pages/health/health.wxss` - 添加弹窗和图表样式