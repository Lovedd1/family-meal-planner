# 每日饮食建议重构设计

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将阶段性饮食计划重构为每日饮食建议，基于7天历史分析给出明日菜单和营养建议

**Architecture:** 健康页新增饮食分析卡片，自动基于历史数据调用AI分析，推荐菜品仅从现有菜品库选择，可直接点单到今日菜单

**Tech Stack:** 微信小程序、云函数、DeepSeek API、本地存储

---

## 1. 数据结构改动

### 1.1 新增存储：dietHistory

键名：`dietHistory`

```javascript
// 结构
[
  {
    "date": "2026-05-06",
    "menu": {
      "breakfast": [dish, dish],
      "lunch": [dish],
      "dinner": [dish, dish]
    },
    "nutritionStats": {
      "carbsCount": 2,
      "proteinCount": 3,
      "fatCount": 1,
      "fiberCount": 2,
      "totalCount": 8
    }
  }
]
```

- 保留最近7天，自动清理超过7天的记录
- 每日确认菜单时自动存档

### 1.2 修改 confirmMenu 函数

位置：`miniprogram/pages/today/today.js`

**改动点：**
1. 执行原有扣减逻辑
2. 存档当天菜单到 `dietHistory`
3. 清理超过7天的历史

```javascript
confirmMenu() {
  // ... 原有扣减逻辑 ...

  // 存档到历史
  this.saveToDietHistory()

  // 清空菜单
  this.setData({ menu: emptyMenu })
  storageAdapter.set('todayMenu', emptyMenu)

  // ... 其余逻辑 ...
}

saveToDietHistory() {
  const history = storageAdapter.get('dietHistory') || []
  const todayMenu = this.data.menu

  // 计算今日营养统计
  const allDishes = [
    ...todayMenu.breakfast,
    ...todayMenu.lunch,
    ...todayMenu.dinner
  ]
  const nutritionStats = this.calculateDayNutrition(allDishes)

  // 添加今日记录
  history.unshift({
    date: new Date().toISOString().split('T')[0],
    menu: todayMenu,
    nutritionStats
  })

  // 只保留7天
  const trimmed = history.slice(0, 7)
  storageAdapter.set('dietHistory', trimmed)
}

calculateDayNutrition(dishes) {
  const stats = { carbsCount: 0, proteinCount: 0, fatCount: 0, fiberCount: 0, totalCount: 0 }
  dishes.forEach(dish => {
    if (dish.nutritionTypes && Array.isArray(dish.nutritionTypes)) {
      dish.nutritionTypes.forEach(nType => {
        if (nType === 'carbs') stats.carbsCount++
        else if (nType === 'protein') stats.proteinCount++
        else if (nType === 'fat') stats.fatCount++
        else if (nType === 'fiber') stats.fiberCount++
      })
    }
  })
  stats.totalCount = stats.carbsCount + stats.proteinCount + stats.fatCount + stats.fiberCount
  return stats
}
```

---

## 2. 云函数改动

### 2.1 修改 generateDietPlan 云函数

位置：`cloudfunctions/generateDietPlan/index.js`

**输入参数变更：**
```javascript
{
  "dietGoal": "lose/maintain/gain",
  "activityLevel": "sedentary/moderate/active",
  "allergies": "虾、芒果等",
  "currentPhase": "menstruation/follicular/ovulation/luteal",
  "targetWeight": 60,
  "currentWeight": 65,
  "dietHistory": [
    {
      "date": "2026-05-06",
      "menu": { "breakfast": [...], "lunch": [...], "dinner": [...] },
      "nutritionStats": { "carbsCount": 2, "proteinCount": 3, "fatCount": 1, "fiberCount": 2, "totalCount": 8 }
    }
  ],
  "availableFoods": [
    { "id": "f001", "name": "土豆炖牛肉", "emoji": "🥘", "nutritionTypes": ["carbs", "protein", "fiber"], ... },
    { "id": "custom_xxx", "name": "自定义菜品", "emoji": "🍲", ... }
  ]
}
```

**输出格式：**
```javascript
{
  "success": true,
  "data": {
    "tomorrowMenu": {
      "breakfast": [
        { "id": "f002", "name": "番茄炒蛋", "emoji": "🍳", "nutritionTypes": ["protein", "fiber"], "reason": "补充蛋白质和膳食纤维" }
      ],
      "lunch": [...],
      "dinner": [...]
    },
    "analysis": {
      "summary": "近7天饮食分析：碳水摄入偏高，蛋白质和膳食纤维不足",
      "needsMore": [
        {
          "type": "protein",
          "reason": "近7天蛋白质摄入仅占18%，低于推荐的25%",
          "suggestions": [{ "id": "f003", "name": "西兰花炒鸡胸肉", "emoji": "🥦" }]
        },
        {
          "type": "fiber",
          "reason": "膳食纤维摄入不足，建议增加蔬菜",
          "suggestions": [{ "id": "f007", "name": "凉拌黄瓜", "emoji": "🥒" }]
        }
      ],
      "needsLess": [
        {
          "type": "carbs",
          "reason": "碳水占比偏高，建议减少米饭等主食",
          "currentAvg": "45%",
          "suggested": "35%"
        }
      ]
    },
    "nutritionPrediction": {
      "carbsCount": 2,
      "proteinCount": 3,
      "fatCount": 1,
      "fiberCount": 2
    }
  }
}
```

**Prompt 改动要点：**
- 分析7天饮食历史，计算各营养素占比
- 对比目标，给出"需要补充"和"需要减少"的建议
- 从 `availableFoods` 中选择明日菜品
- 每个推荐菜品说明推荐理由

---

## 3. 健康页UI改动

### 3.1 页面结构

```
健康页
├── 体重记录区域
├── 生理期追踪区域
├── 饮食分析卡片（新增）
│   ├── 近7天饮食概览
│   ├── 需要补充列表
│   ├── 需要减少列表
│   └── 明日推荐菜单
├── 历史饮食列表（新增，可折叠）
└── 健康报告区域
```

### 3.2 饮食分析卡片

**显示条件：**
- `dietHistory` 长度 ≥ 3，自动显示
- 长度 < 3，显示"记录X天后解锁AI分析"

**布局：**
```xml
<view class="diet-analysis-card" wx:if="{{dietHistory.length >= 3}}">
  <!-- 分析摘要 -->
  <view class="analysis-summary">{{aiAnalysis.analysis.summary}}</view>

  <!-- 需要补充 -->
  <view class="needs-section" wx:if="{{aiAnalysis.analysis.needsMore.length > 0}}">
    <view class="section-title">需要补充</view>
    <view class="need-item" wx:for="{{aiAnalysis.analysis.needsMore}}" wx:key="type">
      <view class="need-type">{{item.type === 'protein' ? '蛋白质' : item.type === 'fiber' ? '膳食纤维' : item.type}}</view>
      <view class="need-reason">{{item.reason}}</view>
      <view class="need-suggestions">
        <view class="suggestion-tag" wx:for="{{item.suggestions}}" wx:key="id" data-dish="{{item}}" bindtap="addRecommendedDish">
          {{item.emoji}} {{item.name}}
        </view>
      </view>
    </view>
  </view>

  <!-- 需要减少 -->
  <view class="needs-section" wx:if="{{aiAnalysis.analysis.needsLess.length > 0}}">
    <view class="section-title">需要减少</view>
    <view class="need-item" wx:for="{{aiAnalysis.analysis.needsLess}}" wx:key="type">
      <view class="need-type">{{item.type === 'carbs' ? '碳水' : item.type}}</view>
      <view class="need-reason">{{item.reason}}（当前{{item.currentAvg}}，建议{{item.suggested}}）</view>
    </view>
  </view>

  <!-- 明日推荐 -->
  <view class="tomorrow-menu">
    <view class="section-title">明日推荐</view>
    <view class="meal-section">
      <view class="meal-label">🌅 早餐</view>
      <view class="meal-dishes">
        <view class="dish-chip" wx:for="{{aiAnalysis.tomorrowMenu.breakfast}}" wx:key="id" data-dish="{{item}}" data-meal="breakfast" bindtap="addRecommendedDish">
          {{item.emoji}} {{item.name}}
        </view>
      </view>
    </view>
    <view class="meal-section">...</view>
    <view class="meal-section">...</view>
  </view>
</view>

<!-- 数据不足提示 -->
<view class="diet-analysis-locked" wx:elif="{{dietHistory.length > 0}}">
  <text>再记录{{3 - dietHistory.length}}天即可解锁AI饮食分析</text>
</view>
```

### 3.3 历史饮食列表

**位置：** 饮食分析卡片下方

**布局：**
```xml
<view class="diet-history-section">
  <view class="section-header" bindtap="toggleDietHistory">
    <text>近7天饮食记录</text>
    <text class="toggle-icon">{{showDietHistory ? '▼' : '▶'}}</text>
  </view>
  <view class="history-list" wx:if="{{showDietHistory}}">
    <view class="history-item" wx:for="{{dietHistory}}" wx:key="date">
      <view class="history-date">{{item.date}}</view>
      <view class="history-dishes">
        <text wx:for="{{item.menu.breakfast}}" wx:key="id">{{item.emoji}}</text>
        <text wx:for="{{item.menu.lunch}}" wx:key="id">{{item.emoji}}</text>
        <text wx:for="{{item.menu.dinner}}" wx:key="id">{{item.emoji}}</text>
      </view>
    </view>
  </view>
</view>
```

---

## 4. 健康页JS改动

### 4.1 data 新增字段

```javascript
data: {
  // ... 现有字段 ...

  // 饮食历史
  dietHistory: [],
  showDietHistory: false,

  // AI分析结果
  aiAnalysis: null,
  isAnalyzing: false
}
```

### 4.2 onShow 逻辑

```javascript
onShow() {
  this.loadHealthData()
  this.loadDietHistory()
  // 如果数据足够，自动触发AI分析
  if (this.data.dietHistory.length >= 3) {
    this.generateDailyAdvice()
  }
}

loadDietHistory() {
  const history = storageAdapter.get('dietHistory') || []
  this.setData({ dietHistory: history })
}

generateDailyAdvice() {
  if (this.data.isAnalyzing) return
  this.setData({ isAnalyzing: true })

  wx.showLoading({ title: '分析中...' })

  // 获取现有菜品库
  const customFoods = storageAdapter.get('customFoods') || []
  const availableFoods = [...foods.foods, ...customFoods].map(f => ({
    id: f.id,
    name: f.name,
    emoji: f.emoji,
    nutritionTypes: f.nutritionTypes || ['protein'],
    category: f.category,
    heatMethod: f.heatMethod
  }))

  wx.cloud.callFunction({
    name: 'generateDietPlan',
    data: {
      action: 'dailyAdvice',
      dietGoal: this.data.dietGoal,
      activityLevel: this.data.activityLevel,
      allergies: this.data.allergies,
      currentPhase: this.data.currentPhase,
      targetWeight: this.data.targetWeight,
      currentWeight: this.data.currentWeight,
      dietHistory: this.data.dietHistory,
      availableFoods: availableFoods
    }
  }).then(res => {
    wx.hideLoading()
    if (res.result && res.result.success) {
      this.setData({ aiAnalysis: res.result.data })
    }
  }).catch(err => {
    wx.hideLoading()
    console.error('AI分析失败:', err)
  }).finally(() => {
    this.setData({ isAnalyzing: false })
  })
}
```

### 4.3 添加推荐菜品

```javascript
addRecommendedDish(e) {
  const dish = e.currentTarget.dataset.dish
  const meal = e.currentTarget.dataset.meal || 'breakfast'

  // 获取当前菜单
  const menu = app.getTodayMenu()
  if (!menu[meal]) menu[meal] = []

  // 检查是否已添加
  const exists = menu[meal].some(d => d.id === dish.id)
  if (exists) {
    wx.showToast({ title: '已在菜单中', icon: 'none' })
    return
  }

  menu[meal].push(dish)
  app.updateTodayMenu(menu)

  wx.showToast({ title: `已添加到${this.getMealName(meal)}`, icon: 'success' })
}

getMealName(meal) {
  return { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }[meal] || '菜单'
}
```

---

## 5. 样式改动

### 5.1 新增WXSS

位置：`miniprogram/pages/health/health.wxss`

```css
/* 饮食分析卡片 */
.diet-analysis-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(93, 74, 74, 0.08);
}

.analysis-summary {
  font-size: 28rpx;
  color: #5D4A4A;
  line-height: 1.6;
  margin-bottom: 24rpx;
  padding: 20rpx;
  background: #FDF8F8;
  border-radius: 16rpx;
}

.needs-section {
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #C48B8B;
  margin-bottom: 16rpx;
  font-family: monospace;
  letter-spacing: 2rpx;
}

.need-item {
  margin-bottom: 16rpx;
  padding: 16rpx;
  background: #FDF8F8;
  border-radius: 12rpx;
}

.need-type {
  font-size: 26rpx;
  font-weight: 600;
  color: #5D4A4A;
  margin-bottom: 8rpx;
}

.need-reason {
  font-size: 24rpx;
  color: #8A6A6A;
  margin-bottom: 12rpx;
}

.need-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.suggestion-tag {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 16rpx;
  background: rgba(90, 138, 106, 0.12);
  color: #5A8A6A;
  border-radius: 16rpx;
  font-size: 24rpx;
}

.dish-chip {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 10rpx 20rpx;
  background: #C48B8B;
  color: #fff;
  border-radius: 20rpx;
  font-size: 26rpx;
}

/* 历史饮食列表 */
.diet-history-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(93, 74, 74, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 28rpx;
  font-weight: 600;
  color: #5D4A4A;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx dashed #E8D5D8;
}

.history-item:last-child {
  border-bottom: none;
}

.history-date {
  font-size: 26rpx;
  color: #8A6A6A;
}

.history-dishes {
  display: flex;
  gap: 8rpx;
}

.history-dishes text {
  font-size: 28rpx;
}

/* 锁定状态 */
.diet-analysis-locked {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  text-align: center;
  font-size: 26rpx;
  color: #8A6A6A;
  box-shadow: 0 4rpx 16rpx rgba(93, 74, 74, 0.08);
}
```

---

## 6. 实现任务清单

### Task 1: 数据层改动
- 修改 `today.js` confirmMenu 函数，添加历史存档
- 添加 `saveToDietHistory` 和 `calculateDayNutrition` 方法

### Task 2: 云函数改动
- 修改 `generateDietPlan` 云函数
- 添加 `dailyAdvice` action
- 重写 Prompt 支持7天分析和现有菜品推荐

### Task 3: 健康页JS改动
- 添加 data 字段
- 实现 `loadDietHistory` 方法
- 实现 `generateDailyAdvice` 方法
- 实现 `addRecommendedDish` 方法
- 修改 `onShow` 逻辑

### Task 4: 健康页WXML改动
- 添加饮食分析卡片
- 添加历史饮食列表
- 添加数据不足提示

### Task 5: 健康页WXSS改动
- 添加饮食分析卡片样式
- 添加历史饮食列表样式
- 添加锁定状态样式

### Task 6: 测试验证
- 测试确认菜单时自动存档
- 测试7天历史清理
- 测试AI分析功能和UI
- 测试添加推荐菜品到今日菜单

---

## 7. 注意事项

1. **数据兼容性**：升级后 `dietHistory` 为空，用户需重新积累
2. **阶段性计划保留**：暂不删除相关UI，后续可清理
3. **网络错误处理**：AI分析失败时显示友好提示，不阻塞页面
4. **历史数据清理**：只保留7天，超出自动清理
