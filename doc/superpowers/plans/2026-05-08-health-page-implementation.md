# 健康页功能优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为健康计划页面添加饮食记录详情弹窗和完善30天体重趋势柱状图

**Architecture:** 两个独立功能：1) 饮食记录点击查看详情弹窗；2) Canvas绘制可滑动柱状图，颜色根据涨跌区分

**Tech Stack:** 微信小程序 WXML/WXSS/JS，Canvas 2D API

---

## 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `miniprogram/pages/health/health.wxml` | 添加详情弹窗，调整体重趋势区域为scroll-view + canvas |
| `miniprogram/pages/health/health.js` | 添加 showDietDetail 方法、柱状图绘制逻辑、体重数据处理 |
| `miniprogram/pages/health/health.wxss` | 添加弹窗样式、柱状图容器样式、图例样式 |

---

## Task 1: 添加饮食记录详情弹窗

**Files:**
- Modify: `miniprogram/pages/health/health.wxml:333-349`
- Modify: `miniprogram/pages/health/health.js:692-696`
- Modify: `miniprogram/pages/health/health.wxss:1339-1410`

- [ ] **Step 1: 在 health.wxml 中添加详情弹窗**

在健康报告弹窗（showReportModal）后面添加饮食记录详情弹窗：

```xml
<!-- 饮食记录详情弹窗 -->
<view class="modal" wx:if="{{showDietDetailModal}}">
  <view class="modal-content" catchtap="">
    <view class="modal-header">
      <text class="modal-title">{{dietDetailData.date}}</text>
      <text class="modal-close" bindtap="closeDietDetailModal">×</text>
    </view>
    <scroll-view class="modal-body" scroll-y>
      <block wx:if="{{dietDetailData.menu}}">
        <!-- 早餐 -->
        <view class="diet-detail-section" wx:if="{{dietDetailData.menu.breakfast.length > 0}}">
          <view class="diet-detail-meal-label">🌅 早餐</view>
          <view class="diet-detail-dishes">
            <view class="diet-detail-dish" wx:for="{{dietDetailData.menu.breakfast}}" wx:key="id">
              <text class="dish-emoji">{{item.emoji}}</text>
              <text class="dish-name">{{item.name}}</text>
            </view>
          </view>
        </view>
        <!-- 午餐 -->
        <view class="diet-detail-section" wx:if="{{dietDetailData.menu.lunch.length > 0}}">
          <view class="diet-detail-meal-label">☀️ 午餐</view>
          <view class="diet-detail-dishes">
            <view class="diet-detail-dish" wx:for="{{dietDetailData.menu.lunch}}" wx:key="id">
              <text class="dish-emoji">{{item.emoji}}</text>
              <text class="dish-name">{{item.name}}</text>
            </view>
          </view>
        </view>
        <!-- 晚餐 -->
        <view class="diet-detail-section" wx:if="{{dietDetailData.menu.dinner.length > 0}}">
          <view class="diet-detail-meal-label">🌙 晚餐</view>
          <view class="diet-detail-dishes">
            <view class="diet-detail-dish" wx:for="{{dietDetailData.menu.dinner}}" wx:key="id">
              <text class="dish-emoji">{{item.emoji}}</text>
              <text class="dish-name">{{item.name}}</text>
            </view>
          </view>
        </view>
      </block>
    </scroll-view>
  </view>
</view>
```

- [ ] **Step 2: 在 health.js data 中添加弹窗状态**

在 data 对象中添加：
```js
// 饮食记录详情
showDietDetailModal: false,
dietDetailData: null,
```

- [ ] **Step 3: 在 health.js 中添加 showDietDetail 方法**

在 toggleDietHistory 方法附近添加：
```js
showDietDetail(e) {
  const index = e.currentTarget.dataset.index
  const dietHistory = this.data.dietHistory
  if (index >= 0 && index < dietHistory.length) {
    const item = dietHistory[index]
    // 格式化日期显示
    const dateObj = new Date(item.date)
    const formattedDate = dateObj.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    this.setData({
      showDietDetailModal: true,
      dietDetailData: {
        ...item,
        date: formattedDate
      }
    })
  }
},

closeDietDetailModal() {
  this.setData({ showDietDetailModal: false, dietDetailData: null })
},
```

- [ ] **Step 4: 修改 health.wxml 中历史记录点击事件**

将原来只显示 emoji 的列表项改为可点击：
```xml
<view class="history-item" wx:for="{{dietHistory}}" wx:key="date">
  <view class="history-info" data-index="{{index}}" bindtap="showDietDetail">
    <view class="history-date">{{item.date}}</view>
    <view class="history-dishes">
      <text wx:for="{{item.menu.breakfast}}" wx:key="id">{{item.emoji}}</text>
      <text wx:for="{{item.menu.lunch}}" wx:key="id">{{item.emoji}}</text>
      <text wx:for="{{item.menu.dinner}}" wx:key="id">{{item.emoji}}</text>
    </view>
  </view>
</view>
```

- [ ] **Step 5: 在 health.wxss 中添加弹窗样式**

在文件末尾添加：
```css
/* ========== 饮食记录详情弹窗 ========== */
.diet-detail-section {
  margin-bottom: 24rpx;
  padding: 20rpx;
  background: #FDF8F8;
  border-radius: 16rpx;
}

.diet-detail-meal-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #5D4A4A;
  margin-bottom: 16rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx dashed #E8D5D8;
}

.diet-detail-dishes {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.diet-detail-dish {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  background: #fff;
  border-radius: 20rpx;
  min-width: 140rpx;
}

.dish-emoji {
  font-size: 32rpx;
}

.dish-name {
  font-size: 26rpx;
  color: #5D4A4A;
  font-weight: 500;
}
```

---

## Task 2: 实现30天体重趋势柱状图

**Files:**
- Modify: `miniprogram/pages/health/health.wxml:118-134`
- Modify: `miniprogram/pages/health/health.js:93-147`
- Modify: `miniprogram/pages/health/health.wxss:259-280`

- [ ] **Step 1: 修改 health.wxml 中体重趋势区域**

将原来的进度条部分替换为 scroll-view + canvas：

```xml
<!-- 体重趋势柱状图 -->
<view class="card weight-chart-card" wx:if="{{weightRecords.length > 0}}">
  <view class="card-header">
    <text class="card-title">📊 30天体重趋势</text>
  </view>

  <!-- 进度条 -->
  <view class="chart-container">
    <view class="progress-bar">
      <view class="progress-inner" style="width: {{weightStats.progress}}%"></view>
    </view>
    <view class="progress-label">
      <text>当前 {{weightStats.current}}kg</text>
      <text class="text-success">{{weightStats.diff > 0 ? '距目标还有' : '已达标'}}{{weightStats.absDiff}}kg</text>
      <text>目标 {{weightStats.target}}kg</text>
    </view>
  </view>

  <!-- 柱状图滚动容器 -->
  <scroll-view class="weight-scroll-container" scroll-x enable-flex>
    <view class="weight-chart-wrapper">
      <canvas canvas-id="weightChart" class="weight-canvas" bindtouch="onWeightChartTouch"></canvas>
    </view>
  </scroll-view>

  <!-- 图例 -->
  <view class="weight-chart-legend">
    <view class="legend-item">
      <view class="legend-dot" style="background: #C45C5C;"></view>
      <text>上涨</text>
    </view>
    <view class="legend-item">
      <view class="legend-dot" style="background: #5A8A6A;"></view>
      <text>下降</text>
    </view>
  </view>
</view>
```

注意：需要移除原来的 chart-container 中的进度条（它们已经在上面显示了），或者保留在卡片头部作为概览。

- [ ] **Step 2: 在 health.js 中添加柱状图绘制逻辑**

在 loadHealthData 方法之后，updateWeightStats 方法之后添加：

```js
// 绘制体重柱状图
drawWeightChart() {
  const records = this.data.weightRecords
  if (records.length === 0) return

  // 取最近30天数据
  const recentRecords = records.slice(-30)

  const canvasWidth = recentRecords.length * 120  // 每柱120rpx
  const canvasHeight = 300
  const barWidth = 80
  const barGap = 40
  const leftPadding = 100  // Y轴刻度区域
  const bottomPadding = 60  // X轴日期区域

  // 计算体重范围
  const weights = recentRecords.map(r => r.weight)
  const minWeight = Math.min(...weights) - 1
  const maxWeight = Math.max(...weights) + 1
  const weightRange = maxWeight - minWeight

  // 图表区域高度
  const chartHeight = canvasHeight - bottomPadding - 40  // 40为顶部留白

  const ctx = wx.createCanvasContext('weightChart')
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 绘制Y轴刻度和网格线
  ctx.setFontSize(20)
  ctx.setFillStyle('#8A6A6A')
  ctx.setTextAlign('right')
  ctx.setLineWidth(1)
  ctx.setStrokeStyle('#E8D5D8')

  const yStep = weightRange > 5 ? 1 : 0.5
  for (let w = minWeight; w <= maxWeight; w += yStep) {
    const y = chartHeight - ((w - minWeight) / weightRange) * chartHeight + 40

    // 刻度值
    ctx.fillText(w.toFixed(1), leftPadding - 10, y + 6)

    // 网格线（虚线）
    ctx.beginPath()
    ctx.setLineDash([4, 4])
    ctx.moveTo(leftPadding, y)
    ctx.lineTo(canvasWidth - 20, y)
    ctx.stroke()
  }

  ctx.setLineDash([])

  // 绘制柱状条
  const today = new Date().toISOString().split('T')[0]

  recentRecords.forEach((record, index) => {
    const x = leftPadding + index * 120 + 20
    const barHeight = ((record.weight - minWeight) / weightRange) * chartHeight

    // 计算颜色：与昨日比较
    let color = '#C48B8B'  // 默认粉色
    if (index > 0) {
      const prevWeight = recentRecords[index - 1].weight
      if (record.weight > prevWeight) {
        color = '#C45C5C'  // 上涨红色
      } else if (record.weight < prevWeight) {
        color = '#5A8A6A'  // 下降绿色
      }
    }

    // 绘制柱子（圆角矩形）
    const barX = x
    const barY = chartHeight + 40 - barHeight
    const barHeightActual = Math.max(barHeight, 4)  // 最小高度4px

    ctx.beginPath()
    ctx.roundRect(barX, barY, barWidth, barHeightActual, 8)
    ctx.setFillStyle(color)
    ctx.fill()

    // 柱子上方显示体重数值
    ctx.setFontSize(18)
    ctx.setTextAlign('center')
    ctx.setFillStyle('#5D4A4A')
    ctx.fillText(record.weight.toFixed(1), barX + barWidth / 2, barY - 8)

    // 底部显示日期（每隔一天显示，避免拥挤）
    if (index % 2 === 0) {
      const date = new Date(record.date)
      const monthDay = `${date.getMonth() + 1}/${date.getDate()}`
      ctx.setFontSize(18)
      ctx.setTextAlign('center')
      ctx.setFillStyle('#8A6A6A')
      ctx.fillText(monthDay, barX + barWidth / 2, canvasHeight - 15)
    }
  })

  ctx.draw()

  // 保存滚动位置
  this._weightChartScrollLeft = canvasWidth - 400  // 默认滚动到最后（今天）
},

// 处理触摸滑动
onWeightChartTouch(e) {
  // 微信小程序 scroll-view 的 touch 事件不需要手动处理
  // 只需要确保 scroll-x 属性正确设置即可
},
```

- [ ] **Step 3: 在 health.wxss 中添加柱状图样式**

找到 `.progress-bar` 样式（约259行），在其后或合适位置添加：

```css
/* ========== 体重柱状图 ========== */
.weight-chart-card {
  padding-bottom: 20rpx;
}

.weight-scroll-container {
  width: 100%;
  overflow-x: scroll;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  margin-top: 20rpx;
}

.weight-chart-wrapper {
  display: inline-flex;
  min-width: 100%;
}

.weight-canvas {
  height: 300rpx;
  /* width 由 JS 动态计算 */
}

.weight-chart-legend {
  display: flex;
  justify-content: center;
  gap: 40rpx;
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx dashed #E8D5D8;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #8A6A6A;
}

.legend-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 6rpx;
}
```

- [ ] **Step 4: 在 health.js 的 loadHealthData 中调用绘制**

找到 loadHealthData 方法中加载体重记录的部分（约93-96行）：

```js
// 加载体重记录
const records = storageAdapter.get('weightRecords') || []
this.setData({ weightRecords: records })
this.updateWeightStats()

// 延迟绘制柱状图，确保 canvas 就绪
setTimeout(() => {
  this.drawWeightChart()
}, 100)
```

---

## 验证与测试

- [ ] **验证1: 饮食记录详情弹窗**
   1. 进入健康页
   2. 展开"近7天饮食记录"
   3. 点击任意一天记录
   4. 确认弹窗显示完整三餐内容

- [ ] **验证2: 体重柱状图**
   1. 进入健康页
   2. 确认柱状图显示
   3. 向左/右滑动查看更多数据
   4. 确认颜色：涨→红色，跌→绿色

---

## 实现顺序

1. Task 1: 饮食记录详情弹窗（完成后测试）
2. Task 2: 体重趋势柱状图（完成后测试）