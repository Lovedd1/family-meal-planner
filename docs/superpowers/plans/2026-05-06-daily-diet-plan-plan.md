# 每日饮食建议重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将阶段性饮食计划重构为每日饮食建议，基于7天历史分析给出明日菜单和营养建议

**Architecture:** 在 today.js 的 confirmMenu 中添加历史存档，云函数改为每日建议模式，健康页新增饮食分析卡片和历史列表

**Tech Stack:** 微信小程序、云函数、DeepSeek API、本地存储

---

## 文件结构

```
miniprogram/
├── pages/today/today.js          # 修改：confirmMenu添加历史存档
├── pages/health/health.js       # 修改：新增AI分析和推荐逻辑
├── pages/health/health.wxml     # 修改：新增饮食分析卡片、历史列表
├── pages/health/health.wxss     # 修改：新增分析卡片样式
cloudfunctions/generateDietPlan/index.js  # 修改：支持dailyAdvice action
```

---

## Task 1: today.js 添加历史存档

**Files:**
- Modify: `miniprogram/pages/today/today.js:353-384`

### 1.1 添加 calculateDayNutrition 辅助函数

在 `parseAmount` 函数后（约第18行）添加：

```javascript
// 计算单日营养统计
function calculateDayNutrition(dishes) {
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

### 1.2 添加 saveToDietHistory 方法

在 Page 对象的 methods 中添加（约第160行，在 loadMenu 后面）：

```javascript
saveToDietHistory() {
  const history = storageAdapter.get('dietHistory') || []
  const todayMenu = this.data.menu

  const allDishes = [
    ...todayMenu.breakfast,
    ...todayMenu.lunch,
    ...todayMenu.dinner
  ]

  if (allDishes.length === 0) return

  const nutritionStats = calculateDayNutrition(allDishes)

  history.unshift({
    date: new Date().toISOString().split('T')[0],
    menu: todayMenu,
    nutritionStats
  })

  // 只保留7天
  const trimmed = history.slice(0, 7)
  storageAdapter.set('dietHistory', trimmed)
},
```

### 1.3 修改 confirmMenu 函数

在 `confirmMenu` 函数中，执行扣减后调用存档：

```javascript
confirmMenu() {
  const deductionList = this.data.deductionList

  // 获取冰箱库存并执行扣减
  let fridgeItems = storageAdapter.get('fridgeItems') || []
  fridgeItems = performDeduction(deductionList, fridgeItems)
  storageAdapter.set('fridgeItems', fridgeItems)

  // 存档到历史（新增）
  this.saveToDietHistory()

  // 清空菜单
  const emptyMenu = {
    breakfast: [],
    lunch: [],
    dinner: []
  }
  this.setData({ menu: emptyMenu })
  storageAdapter.set('todayMenu', emptyMenu)
  this.updateTabCounts()
  this.closeConfirmModal()

  // 检查是否有不足需要补充的
  const insufficientItems = deductionList.filter(d => !d.sufficient)
  if (insufficientItems.length > 0) {
    const names = insufficientItems.map(d => d.name).join('、')
    wx.showModal({
      title: '已确认菜单',
      content: `库存已扣减，但需要补充：${names}`,
      showCancel: false
    })
  } else {
    wx.showToast({ title: '已确认菜单', icon: 'success' })
  }
}
```

---

## Task 2: 云函数 generateDietPlan 改动

**Files:**
- Modify: `cloudfunctions/generateDietPlan/index.js`

### 2.1 修改输入参数处理

在 `exports.main` 开头（约第15行），添加 `dailyAdvice` action 判断：

```javascript
exports.main = async (event, context) => {
  const { action, dietGoal, activityLevel, allergies, currentPhase, targetWeight, currentWeight, dietHistory, availableFoods } = event

  // 如果是每日建议请求，调用专门的处理逻辑
  if (action === 'dailyAdvice') {
    return await generateDailyAdvice({ dietGoal, activityLevel, allergies, currentPhase, targetWeight, currentWeight, dietHistory, availableFoods })
  }

  // 原有阶段性计划逻辑...
  const originalEvent = event
```

### 2.2 添加 generateDailyAdvice 函数

在文件末尾（`return { success: false, error: error.message }` 之前）添加：

```javascript
// 生成每日饮食建议
async function generateDailyAdvice({ dietGoal, activityLevel, allergies, currentPhase, targetWeight, currentWeight, dietHistory, availableFoods }) {
  // 构建Prompt
  const prompt = `你是专业营养师，请根据用户近7天饮食历史，分析营养摄入情况，给出明日饮食建议。

用户信息：
- 目标：${dietGoal === 'lose' ? '减脂' : dietGoal === 'maintain' ? '维持体重' : '增肌'}
- 当前体重：${currentWeight || '未记录'}kg
- 目标体重：${targetWeight || '未设定'}kg
- 活动水平：${activityLevel === 'sedentary' ? '久坐少动' : activityLevel === 'moderate' ? '适度活动' : '运动较多'}
- 过敏食物：${allergies || '无'}
- 生理期阶段：${currentPhase === 'menstruation' ? '经期' : currentPhase === 'follicular' ? '卵泡期' : currentPhase === 'ovulation' ? '排卵期' : currentPhase === 'luteal' ? '黄体期' : '未知'}

近7天饮食历史：
${JSON.stringify(dietHistory, null, 2)}

现有菜品库：
${JSON.stringify(availableFoods.map(f => ({ id: f.id, name: f.name, emoji: f.emoji, nutritionTypes: f.nutritionTypes })), null, 2)}

请按以下JSON格式返回（必须严格遵守格式，不要添加任何额外文字）：
{
  "tomorrowMenu": {
    "breakfast": [{"id": "菜品id", "name": "菜品名", "emoji": "emoji", "nutritionTypes": ["protein"], "reason": "推荐理由"}],
    "lunch": [...],
    "dinner": [...]
  },
  "analysis": {
    "summary": "近7天饮食分析：...",
    "needsMore": [
      {"type": "protein", "reason": "原因", "suggestions": [{"id": "f003", "name": "西兰花炒鸡胸肉", "emoji": "🥦"}]}
    ],
    "needsLess": [
      {"type": "carbs", "reason": "原因", "currentAvg": "45%", "suggested": "35%"}
    ]
  },
  "nutritionPrediction": {
    "carbsCount": 2,
    "proteinCount": 3,
    "fatCount": 1,
    "fiberCount": 2
  }
}`

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位专业营养师，擅长分析饮食历史并给出针对性建议，只从提供的菜品库中选择菜品。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    })

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('API返回内容为空')
    }

    let jsonStr = content
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    const data = JSON.parse(jsonStr)
    return { success: true, data }

  } catch (error) {
    console.error('生成每日建议失败:', error)
    return { success: false, error: error.message }
  }
}
```

### 2.3 修改原有云函数入口

将原有逻辑包装在 else 中，或保持原样通过 action 判断跳过：

```javascript
exports.main = async (event, context) => {
  const { action, ...rest } = event

  // 如果是每日建议请求
  if (action === 'dailyAdvice') {
    return await generateDailyAdvice(rest)
  }

  // 原有阶段性计划逻辑（保持不变）
  const { dietGoal, activityLevel, allergies, currentPhase, targetWeight } = event
  // ... 原有代码 ...
}
```

---

## Task 3: health.js 改动

**Files:**
- Modify: `miniprogram/pages/health/health.js`

### 3.1 data 新增字段

在 data 对象中添加（约第58行）：

```javascript
// 饮食历史
dietHistory: [],
showDietHistory: false,

// AI分析结果
aiAnalysis: null,
isAnalyzing: false
```

### 3.2 loadHealthData 中加载历史

在 loadHealthData 函数中（约第69行），在加载饮食计划历史后添加：

```javascript
// 加载饮食历史
const dietHistory = storageAdapter.get('dietHistory') || []
this.setData({ dietHistory })
```

### 3.3 修改 onShow 逻辑

修改 onShow 方法（约第65行）：

```javascript
onShow() {
  this.loadHealthData()
  // 如果数据足够，自动触发AI分析
  if (this.data.dietHistory.length >= 3) {
    this.generateDailyAdvice()
  }
},
```

### 3.4 添加 generateDailyAdvice 方法

在 methods 中添加（约第560行，在 getReportTagClass 前）：

```javascript
generateDailyAdvice() {
  if (this.data.isAnalyzing) return
  this.setData({ isAnalyzing: true })

  wx.showLoading({ title: '分析中...' })

  const profile = storageAdapter.get('healthProfile') || {}
  const customFoods = storageAdapter.get('customFoods') || []
  const allFoods = [...foods.foods, ...customFoods]

  const availableFoods = allFoods.map(f => ({
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
      allergies: this.data.allergies || '',
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
    } else {
      console.error('AI分析返回失败:', res.result)
    }
  }).catch(err => {
    wx.hideLoading()
    console.error('AI分析失败:', err)
  }).finally(() => {
    this.setData({ isAnalyzing: false })
  })
},

addRecommendedDish(e) {
  const dish = e.currentTarget.dataset.dish
  const meal = e.currentTarget.dataset.meal || 'breakfast'

  const menu = app.getTodayMenu()
  if (!menu[meal]) menu[meal] = []

  const exists = menu[meal].some(d => d.id === dish.id)
  if (exists) {
    wx.showToast({ title: '已在菜单中', icon: 'none' })
    return
  }

  menu[meal].push(dish)
  app.updateTodayMenu(menu)

  wx.showToast({ title: `已添加到${this.getMealName(meal)}`, icon: 'success' })
},

getMealName(meal) {
  const names = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }
  return names[meal] || '菜单'
},

toggleDietHistory() {
  this.setData({ showDietHistory: !this.data.showDietHistory })
},
```

---

## Task 4: health.wxml 改动

**Files:**
- Modify: `miniprogram/pages/health/health.wxml`

### 4.1 在体重记录区域后添加饮食分析卡片

在 `<view class="section-card">体重记录</view>` 区域后添加：

```xml
<!-- 饮食分析卡片 -->
<view class="diet-analysis-card" wx:if="{{dietHistory.length >= 3}}">
  <view class="card-header">
    <text class="card-title">📊 饮食分析</text>
    <text class="analyzing-tip" wx:if="{{isAnalyzing}}">分析中...</text>
  </view>

  <!-- 分析摘要 -->
  <view class="analysis-summary" wx:if="{{aiAnalysis}}">
    {{aiAnalysis.analysis.summary}}
  </view>

  <!-- 需要补充 -->
  <view class="needs-section" wx:if="{{aiAnalysis && aiAnalysis.analysis.needsMore.length > 0}}">
    <view class="section-title">需要补充</view>
    <view class="need-item" wx:for="{{aiAnalysis.analysis.needsMore}}" wx:key="type">
      <view class="need-type">{{item.type === 'protein' ? '🥩 蛋白质' : item.type === 'fiber' ? '🥬 膳食纤维' : item.type === 'carbs' ? '🥖 碳水' : '🥑 脂肪'}}</view>
      <view class="need-reason">{{item.reason}}</view>
      <view class="need-suggestions">
        <view class="suggestion-tag" wx:for="{{item.suggestions}}" wx:key="id" data-dish="{{item}}" data-meal="breakfast" bindtap="addRecommendedDish">
          {{item.emoji}} {{item.name}}
        </view>
      </view>
    </view>
  </view>

  <!-- 需要减少 -->
  <view class="needs-section" wx:if="{{aiAnalysis && aiAnalysis.analysis.needsLess.length > 0}}">
    <view class="section-title needs-less">需要减少</view>
    <view class="need-item" wx:for="{{aiAnalysis.analysis.needsLess}}" wx:key="type">
      <view class="need-type">{{item.type === 'carbs' ? '🥖 碳水' : item.type === 'fat' ? '🥑 脂肪' : item.type}}</view>
      <view class="need-reason">{{item.reason}}（当前{{item.currentAvg}}，建议{{item.suggested}}）</view>
    </view>
  </view>

  <!-- 明日推荐 -->
  <view class="tomorrow-menu" wx:if="{{aiAnalysis && aiAnalysis.tomorrowMenu}}">
    <view class="section-title">明日推荐</view>
    <view class="meal-section">
      <view class="meal-label">🌅 早餐</view>
      <view class="meal-dishes">
        <view class="dish-chip" wx:for="{{aiAnalysis.tomorrowMenu.breakfast}}" wx:key="id" data-dish="{{item}}" data-meal="breakfast" bindtap="addRecommendedDish">
          {{item.emoji}} {{item.name}}
        </view>
      </view>
    </view>
    <view class="meal-section">
      <view class="meal-label">☀️ 午餐</view>
      <view class="meal-dishes">
        <view class="dish-chip" wx:for="{{aiAnalysis.tomorrowMenu.lunch}}" wx:key="id" data-dish="{{item}}" data-meal="lunch" bindtap="addRecommendedDish">
          {{item.emoji}} {{item.name}}
        </view>
      </view>
    </view>
    <view class="meal-section">
      <view class="meal-label">🌙 晚餐</view>
      <view class="meal-dishes">
        <view class="dish-chip" wx:for="{{aiAnalysis.tomorrowMenu.dinner}}" wx:key="id" data-dish="{{item}}" data-meal="dinner" bindtap="addRecommendedDish">
          {{item.emoji}} {{item.name}}
        </view>
      </view>
    </view>
  </view>
</view>

<!-- 数据不足提示 -->
<view class="diet-analysis-locked" wx:elif="{{dietHistory.length > 0 && dietHistory.length < 3}}">
  <text>📝 再记录{{3 - dietHistory.length}}天即可解锁AI饮食分析</text>
</view>
```

### 4.2 在健康报告区域前添加历史列表

在 `<view class="section-card">健康报告</view>` 前添加：

```xml
<!-- 历史饮食列表 -->
<view class="diet-history-section" wx:if="{{dietHistory.length > 0}}">
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

## Task 5: health.wxss 改动

**Files:**
- Modify: `miniprogram/pages/health/health.wxss`

在文件末尾添加：

```css
/* ========== 饮食分析卡片 ========== */
.diet-analysis-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin: 0 24rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(93, 74, 74, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #5D4A4A;
}

.analyzing-tip {
  font-size: 24rpx;
  color: #C48B8B;
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

.section-title.needs-less {
  color: #D4A828;
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

.tomorrow-menu {
  border-top: 2rpx dashed #E8D5D8;
  padding-top: 24rpx;
}

.meal-section {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.meal-label {
  width: 100rpx;
  font-size: 24rpx;
  color: #8A6A6A;
  flex-shrink: 0;
}

.meal-dishes {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
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

/* ========== 历史饮食列表 ========== */
.diet-history-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  margin: 0 24rpx 24rpx;
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

.toggle-icon {
  color: #C48B8B;
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

/* ========== 锁定状态 ========== */
.diet-analysis-locked {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  margin: 0 24rpx 24rpx;
  text-align: center;
  font-size: 26rpx;
  color: #8A6A6A;
  box-shadow: 0 4rpx 16rpx rgba(93, 74, 74, 0.08);
}
```

---

## Task 6: 测试验证

### 6.1 测试今日菜单确认存档

1. 在点餐页添加几个菜品到今日菜单
2. 点击"确认菜单并扣减食材"
3. 确认后，打开健康页
4. 检查 `dietHistory` 是否有数据（可通过查看健康页是否显示历史列表）

### 6.2 测试AI分析功能

1. 连续确认3天菜单（每天不同菜品）
2. 打开健康页
3. 应该自动显示饮食分析卡片
4. 检查"需要补充"、"需要减少"、明日推荐是否正确显示

### 6.3 测试添加推荐菜品

1. 在健康页看到明日推荐菜品
2. 点击某个菜品的"添加"按钮
3. 前往今日菜单页，检查菜品是否已添加

### 6.4 测试历史列表

1. 在健康页点击"近7天饮食记录"展开/收起
2. 检查日期和emoji是否正确显示

### 6.5 测试云函数部署

1. 修改 `generateDietPlan/index.js` 后
2. 使用微信开发者工具或 MCP 部署云函数
3. 测试云函数调用是否正常

---

## 注意事项

1. **云函数部署**：修改云函数后需要重新部署才能生效
2. **历史数据**：新功能上线后 `dietHistory` 为空，需要重新积累
3. **网络错误**：AI分析失败时应显示友好提示
4. **数据清理**：只保留7天，超出自动清理
