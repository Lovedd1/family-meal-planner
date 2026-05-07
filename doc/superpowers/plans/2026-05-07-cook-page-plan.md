# 做饭记录页面实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建做饭记录页面，支持拍照归档、关联菜品、评分、统计功能

**Architecture:** 独立页面 + 本地存储，使用 storageAdapter 读写 cookingRecords，与今日菜单共享菜品数据

**Tech Stack:** 微信小程序原生开发，storageAdapter 本地存储，wx.chooseImage 拍照

---

## 文件结构

```
miniprogram/pages/cook/
├── cook.wxml      # 页面结构
├── cook.wxss      # 样式
├── cook.js        # 页面逻辑
└── cook.json      # 页面配置

修改:
- miniprogram/app.json          # 添加页面路由
- miniprogram/utils/storageAdapter.js  # 添加 cookingRecords 存储键
```

---

## Task 1: 创建 cook.json

**Files:**
- Create: `miniprogram/pages/cook/cook.json`

```json
{
  "usingComponents": {},
  "navigationBarTitleText": "做饭记录",
  "navigationStyle": "custom"
}
```

- [ ] **Step 1: 创建文件**

```bash
mkdir -p miniprogram/pages/cook
touch miniprogram/pages/cook/cook.json
```

- [ ] **Step 2: 写入内容**

- [ ] **Step 3: Commit**

```bash
git add miniprogram/pages/cook/cook.json
git commit -m "feat(cook): add cook page config"
```

---

## Task 2: 创建 cook.wxml

**Files:**
- Create: `miniprogram/pages/cook/cook.wxml`

```xml
<!-- 做饭记录页面 -->
<view class="page">
  <!-- 顶部导航 -->
  <view class="nav-bar">
    <view class="nav-title">做饭记录</view>
  </view>

  <!-- TabBar -->
  <view class="tab-bar">
    <view
      class="tab-item {{currentTab === 'record' ? 'active' : ''}}"
      data-tab="record"
      bindtap="switchTab"
    >
      <text>📝 记录</text>
    </view>
    <view
      class="tab-item {{currentTab === 'stats' ? 'active' : ''}}"
      data-tab="stats"
      bindtap="switchTab"
    >
      <text>📊 统计</text>
    </view>
  </view>

  <!-- 记录 Tab -->
  <view wx:if="{{currentTab === 'record'}}">
    <!-- 月份切换 -->
    <view class="month-selector">
      <text class="month-btn" bindtap="prevMonth">◀</text>
      <text class="month-label">{{displayMonth}}</text>
      <text class="month-btn" bindtap="nextMonth">▶</text>
    </view>

    <!-- 历史记录列表 -->
    <scroll-view class="record-list" scroll-y>
      <block wx:if="{{groupedRecords.length > 0}}">
        <view
          class="record-group"
          wx:for="{{groupedRecords}}"
          wx:key="label"
        >
          <view class="group-label">{{item.label}}</view>
          <view
            class="record-card"
            wx:for="{{item.records}}"
            wx:key="id"
            data-record="{{item}}"
            bindtap="showRecordDetail"
          >
            <image class="record-image" src="{{item.imagePath}}" mode="aspectFill"/>
            <view class="record-info">
              <view class="record-header">
                <text class="record-emoji">{{item.emoji}}</text>
                <text class="record-name">{{item.menuItemName}}</text>
                <view class="record-rating">
                  <text wx:for="{{item.rating}}" wx:key="*this">⭐</text>
                </view>
              </view>
              <view class="record-meta">
                <text class="meal-badge meal-{{item.meal}}">{{getMealLabel(item.meal)}}</text>
                <text class="record-time">{{item.displayTime}}</text>
              </view>
              <view class="record-notes" wx:if="{{item.notes}}">{{item.notes}}</view>
            </view>
          </view>
        </view>
      </block>
      <view class="empty-state" wx:else>
        <text class="icon">🍳</text>
        <text class="text">还没有做饭记录</text>
        <text class="text-small">点击下方按钮记录第一道菜</text>
      </view>
    </scroll-view>

    <!-- 拍照按钮 -->
    <view class="camera-btn-wrap">
      <view class="camera-btn" bindtap="showCameraModal">
        <text class="camera-icon">📷</text>
      </view>
    </view>
  </view>

  <!-- 统计 Tab -->
  <view wx:if="{{currentTab === 'stats'}}" class="stats-tab">
    <scroll-view scroll-y>
      <!-- 本月做菜数 -->
      <view class="stats-card">
        <view class="stats-label">本月做菜数</view>
        <view class="stats-value">{{stats.monthCount}}</view>
        <view class="stats-unit">道</view>
      </view>

      <!-- 最爱菜品 TOP3 -->
      <view class="stats-card">
        <view class="stats-label">最爱菜品 TOP3</view>
        <view class="top-dishes">
          <view
            class="top-dish-item"
            wx:for="{{stats.topDishes}}"
            wx:key="name"
          >
            <text class="top-num">{{index + 1}}</text>
            <text class="top-emoji">{{item.emoji}}</text>
            <text class="top-name">{{item.name}}</text>
            <text class="top-count">{{item.count}}次</text>
          </view>
          <view class="empty-top" wx:if="{{stats.topDishes.length === 0}}">
            <text>暂无数据</text>
          </view>
        </view>
      </view>

      <!-- 平均评分 -->
      <view class="stats-card">
        <view class="stats-label">平均评分</view>
        <view class="avg-rating">
          <text class="rating-value">{{stats.avgRating}}</text>
          <text class="rating-stars">
            <text wx:for="{{5}}" wx:key="*this" class="{{index < stats.avgRating ? 'filled' : ''}}">⭐</text>
          </text>
        </view>
      </view>
    </scroll-view>
  </view>

  <!-- 拍照/添加记录弹窗 -->
  <view class="modal" wx:if="{{showCameraModal}}" bindtap="closeCameraModal">
    <view class="modal-content" catchtap="">
      <view class="modal-header">
        <text class="modal-title">🍳 记录做饭</text>
        <text class="modal-close" bindtap="closeCameraModal">×</text>
      </view>
      <view class="modal-body">
        <!-- 图片选择 -->
        <view class="image-section">
          <block wx:if="{{tempRecord.imagePath}}">
            <image class="preview-image" src="{{tempRecord.imagePath}}" mode="aspectFill"/>
            <view class="change-image-btn" bindtap="chooseImage">更换图片</view>
          </block>
          <view class="choose-image-btn" wx:else bindtap="chooseImage">
            <text class="icon">📷</text>
            <text>点击拍照或选择图片</text>
          </view>
        </view>

        <!-- 关联菜品 -->
        <view class="form-item">
          <label>关联菜品</label>
          <view class="dish-picker" bindtap="showDishPicker">
            <text wx:if="{{tempRecord.menuItemName}}">{{tempRecord.emoji}} {{tempRecord.menuItemName}}</text>
            <text wx:else class="placeholder">请选择关联的菜品</text>
          </view>
        </view>

        <!-- 餐次选择 -->
        <view class="form-item">
          <label>餐次</label>
          <view class="meal-selector">
            <view
              class="meal-btn {{tempRecord.meal === 'breakfast' ? 'active' : ''}}"
              data-meal="breakfast"
              bindtap="setMeal"
            >🌅 早餐</view>
            <view
              class="meal-btn {{tempRecord.meal === 'lunch' ? 'active' : ''}}"
              data-meal="lunch"
              bindtap="setMeal"
            >☀️ 午餐</view>
            <view
              class="meal-btn {{tempRecord.meal === 'dinner' ? 'active' : ''}}"
              data-meal="dinner"
              bindtap="setMeal"
            >🌙 晚餐</view>
          </view>
        </view>

        <!-- 评分 -->
        <view class="form-item">
          <label>评分</label>
          <view class="rating-selector">
            <text
              class="star {{index <= tempRecord.rating ? 'filled' : ''}}"
              wx:for="{{5}}"
              wx:key="*this"
              data-rating="{{index + 1}}"
              bindtap="setRating"
            >⭐</text>
          </view>
        </view>

        <!-- 备注 -->
        <view class="form-item">
          <label>备注（可选）</label>
          <input
            class="notes-input"
            placeholder="今天的牛肉很嫩！"
            value="{{tempRecord.notes}}"
            bindinput="inputNotes"
          />
        </view>
      </view>
      <view class="modal-footer">
        <button class="btn btn-default" catchtap="closeCameraModal">取消</button>
        <button class="btn btn-primary" bindtap="saveRecord">保存</button>
      </view>
    </view>
  </view>

  <!-- 菜品选择器弹窗 -->
  <view class="modal" wx:if="{{showDishPicker}}" bindtap="closeDishPicker">
    <view class="modal-content dish-picker-modal" catchtap="">
      <view class="modal-header">
        <text class="modal-title">选择菜品</text>
        <text class="modal-close" bindtap="closeDishPicker">×</text>
      </view>
      <view class="modal-body">
        <view class="dish-search">
          <input
            class="search-input"
            placeholder="搜索菜品..."
            value="{{dishSearchKey}}"
            bindinput="searchDish"
          />
        </view>
        <scroll-view class="dish-list" scroll-y>
          <view
            class="dish-item"
            wx:for="{{filteredDishes}}"
            wx:key="id"
            data-dish="{{item}}"
            bindtap="selectDish"
          >
            <text class="dish-emoji">{{item.emoji}}</text>
            <text class="dish-name">{{item.name}}</text>
            <view class="dish-tag tag-info" wx:if="{{item.isCustom}}">自定义</view>
          </view>
          <view class="empty-dish" wx:if="{{filteredDishes.length === 0}}">
            <text>未找到匹配的菜品</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>

  <!-- 记录详情弹窗 -->
  <view class="modal" wx:if="{{showDetailModal}}" bindtap="closeDetailModal">
    <view class="modal-content detail-modal" catchtap="">
      <view class="modal-header">
        <text class="modal-title">🍳 {{currentRecord.menuItemName}}</text>
        <text class="modal-close" bindtap="closeDetailModal">×</text>
      </view>
      <view class="modal-body">
        <image class="detail-image" src="{{currentRecord.imagePath}}" mode="aspectFill"/>
        <view class="detail-meta">
          <text class="meal-badge meal-{{currentRecord.meal}}">{{getMealLabel(currentRecord.meal)}}</text>
          <text class="detail-date">{{currentRecord.date}} {{currentRecord.displayTime}}</text>
        </view>
        <view class="detail-rating">
          <text wx:for="{{currentRecord.rating}}" wx:key="*this">⭐</text>
        </view>
        <view class="detail-notes" wx:if="{{currentRecord.notes}}">
          {{currentRecord.notes}}
        </view>
      </view>
      <view class="modal-footer">
        <button class="btn btn-danger" catchtap="deleteRecord">删除</button>
        <button class="btn btn-default" bindtap="closeDetailModal">关闭</button>
      </view>
    </view>
  </view>
</view>
```

- [ ] **Step 1: 创建文件**

- [ ] **Step 2: 写入内容**

- [ ] **Step 3: Commit**

```bash
git add miniprogram/pages/cook/cook.wxml
git commit -m "feat(cook): add cook page wxml structure"
```

---

## Task 3: 创建 cook.wxss

**Files:**
- Create: `miniprogram/pages/cook/cook.wxss`

```css
/* 做饭记录页面样式 */

.page {
  min-height: 100vh;
  background: #f8f6f7;
}

/* 导航栏 */
.nav-bar {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-bottom: 1rpx solid #f0e9e9;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

/* TabBar */
.tab-bar {
  display: flex;
  background: #fff;
  padding: 0 60rpx;
  border-bottom: 1rpx solid #f0e9e9;
}

.tab-item {
  flex: 1;
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #999;
  position: relative;
}

.tab-item.active {
  color: #C48B8B;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background: #C48B8B;
  border-radius: 2rpx;
}

/* 月份选择器 */
.month-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  background: #fff;
}

.month-btn {
  font-size: 28rpx;
  color: #C48B8B;
  padding: 16rpx 24rpx;
}

.month-label {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin: 0 32rpx;
}

/* 记录列表 */
.record-list {
  height: calc(100vh - 340rpx);
  padding: 0 24rpx;
}

.record-group {
  margin-bottom: 32rpx;
}

.group-label {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 16rpx;
  padding-left: 8rpx;
}

.record-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.record-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background: #f0f0f0;
}

.record-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.record-header {
  display: flex;
  align-items: center;
}

.record-emoji {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.record-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.record-rating {
  margin-left: auto;
  color: #FFD700;
  font-size: 24rpx;
}

.record-meta {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
}

.meal-badge {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-right: 12rpx;
}

.meal-badge.meal-breakfast {
  background: #FFF3E0;
  color: #FF9800;
}

.meal-badge.meal-lunch {
  background: #FFF8E1;
  color: #FFC107;
}

.meal-badge.meal-dinner {
  background: #E8F5E9;
  color: #4CAF50;
}

.record-time {
  font-size: 24rpx;
  color: #999;
}

.record-notes {
  font-size: 26rpx;
  color: #666;
  margin-top: 8rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 拍照按钮 */
.camera-btn-wrap {
  position: fixed;
  bottom: 80rpx;
  left: 50%;
  transform: translateX(-50%);
}

.camera-btn {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #C48B8B, #E8B4B4);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(196, 139, 139, 0.4);
}

.camera-icon {
  font-size: 56rpx;
}

/* 统计页 */
.stats-tab {
  padding: 24rpx;
}

.stats-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.stats-label {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.stats-value {
  font-size: 72rpx;
  font-weight: 700;
  color: #C48B8B;
  display: inline-block;
}

.stats-unit {
  font-size: 28rpx;
  color: #999;
  margin-left: 8rpx;
}

.top-dishes {
  display: flex;
  flex-direction: column;
}

.top-dish-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.top-dish-item:last-child {
  border-bottom: none;
}

.top-num {
  width: 40rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #C48B8B;
}

.top-emoji {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.top-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.top-count {
  font-size: 24rpx;
  color: #999;
}

.empty-top {
  padding: 24rpx 0;
  text-align: center;
  color: #999;
  font-size: 26rpx;
}

.avg-rating {
  display: flex;
  align-items: center;
}

.rating-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #333;
  margin-right: 16rpx;
}

.rating-stars {
  font-size: 32rpx;
  color: #ddd;
}

.rating-stars .filled {
  color: #FFD700;
}

/* 弹窗样式 */
.modal-content {
  width: 90%;
  max-height: 85vh;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

.modal-close {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
}

.modal-body {
  padding: 32rpx;
  max-height: 60vh;
}

/* 图片选择 */
.image-section {
  margin-bottom: 32rpx;
}

.choose-image-btn {
  height: 200rpx;
  border: 2rpx dashed #ddd;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.choose-image-btn .icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.preview-image {
  width: 100%;
  height: 300rpx;
  border-radius: 16rpx;
}

.change-image-btn {
  text-align: center;
  color: #C48B8B;
  font-size: 28rpx;
  margin-top: 16rpx;
}

/* 表单项 */
.form-item {
  margin-bottom: 28rpx;
}

.form-item label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.dish-picker {
  padding: 20rpx 24rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
}

.dish-picker .placeholder {
  color: #999;
}

/* 餐次选择 */
.meal-selector {
  display: flex;
  gap: 16rpx;
}

.meal-btn {
  flex: 1;
  padding: 16rpx;
  text-align: center;
  font-size: 26rpx;
  color: #666;
  background: #f5f5f5;
  border-radius: 12rpx;
}

.meal-btn.active {
  background: #C48B8B;
  color: #fff;
}

/* 评分选择 */
.rating-selector {
  display: flex;
  gap: 8rpx;
}

.rating-selector .star {
  font-size: 48rpx;
  color: #ddd;
}

.rating-selector .star.filled {
  color: #FFD700;
}

/* 备注输入 */
.notes-input {
  width: 100%;
  padding: 20rpx 24rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  font-size: 28rpx;
}

/* 弹窗底部 */
.modal-footer {
  display: flex;
  padding: 24rpx 32rpx;
  gap: 24rpx;
  border-top: 1rpx solid #f5f5f5;
}

.modal-footer .btn {
  flex: 1;
}

/* 菜品选择器 */
.dish-picker-modal {
  max-height: 70vh;
}

.dish-search {
  margin-bottom: 24rpx;
}

.search-input {
  width: 100%;
  padding: 16rpx 24rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.dish-list {
  max-height: 400rpx;
}

.dish-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.dish-item:last-child {
  border-bottom: none;
}

.dish-emoji {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.dish-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.dish-tag {
  font-size: 20rpx;
  padding: 4rpx 8rpx;
  border-radius: 6rpx;
  margin-left: 8rpx;
}

.empty-dish {
  text-align: center;
  padding: 48rpx 0;
  color: #999;
  font-size: 26rpx;
}

/* 详情弹窗 */
.detail-modal .detail-image {
  width: 100%;
  height: 400rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.detail-meta {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.detail-date {
  font-size: 24rpx;
  color: #999;
  margin-left: 16rpx;
}

.detail-rating {
  color: #FFD700;
  font-size: 36rpx;
  margin-bottom: 16rpx;
}

.detail-notes {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-state .icon {
  font-size: 96rpx;
  margin-bottom: 24rpx;
}

.empty-state .text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.empty-state .text-small {
  font-size: 26rpx;
  color: #999;
}

/* 按钮样式 */
.btn {
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  padding: 0 48rpx;
}

.btn-default {
  background: #f5f5f5;
  color: #666;
}

.btn-primary {
  background: linear-gradient(135deg, #C48B8B, #E8B4B4);
  color: #fff;
}

.btn-danger {
  background: #fff;
  color: #E57373;
  border: 2rpx solid #E57373;
}

/* 通用样式覆盖 */
page {
  background: #f8f6f7;
}
```

- [ ] **Step 1: 创建文件**

- [ ] **Step 2: 写入内容**

- [ ] **Step 3: Commit**

```bash
git add miniprogram/pages/cook/cook.wxss
git commit -m "feat(cook): add cook page styles"
```

---

## Task 4: 创建 cook.js

**Files:**
- Create: `miniprogram/pages/cook/cook.js`

```javascript
// pages/cook/cook.js
const app = getApp()
const storageAdapter = require('../../utils/storageAdapter.js')

// 获取所有菜品（今日菜单 + 自定义菜品）
function getAllDishes() {
  const todayMenu = storageAdapter.get('todayMenu') || { breakfast: [], lunch: [], dinner: [] }
  const customFoods = storageAdapter.get('customFoods') || []

  const dishes = []
  const addDishes = (list) => {
    list.forEach(dish => {
      if (!dishes.find(d => d.id === dish.id)) {
        dishes.push(dish)
      }
    })
  }

  addDishes(todayMenu.breakfast || [])
  addDishes(todayMenu.lunch || [])
  addDishes(todayMenu.dinner || [])
  addDishes(customFoods)

  return dishes
}

// 根据时间自动识别餐次
function getAutoMeal() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 10) return 'breakfast'
  if (hour >= 10 && hour < 14) return 'lunch'
  if (hour >= 17 && hour < 21) return 'dinner'
  return 'breakfast'
}

// 生成唯一ID
function generateId() {
  return 'cr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 格式化月份显示
function formatMonth(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

// 获取记录分组标签
function getRecordLabel(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const recordDate = new Date(dateStr)
  recordDate.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今日'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return '本周'
  return '更早'
}

Page({
  data: {
    currentTab: 'record',
    displayMonth: '',
    currentMonth: null,
    records: [],
    groupedRecords: [],
    stats: {
      monthCount: 0,
      topDishes: [],
      avgRating: 0
    },

    // 拍照弹窗
    showCameraModal: false,
    tempRecord: {
      imagePath: '',
      menuItemId: '',
      menuItemName: '',
      emoji: '',
      meal: 'breakfast',
      rating: 0,
      notes: ''
    },

    // 菜品选择器
    showDishPicker: false,
    dishSearchKey: '',
    filteredDishes: [],

    // 详情弹窗
    showDetailModal: false,
    currentRecord: null
  },

  onLoad() {
    this.initMonth()
    this.loadRecords()
  },

  onShow() {
    this.loadRecords()
  },

  initMonth() {
    const now = new Date()
    this.setData({
      currentMonth: now,
      displayMonth: formatMonth(now)
    })
  },

  loadRecords() {
    const records = storageAdapter.get('cookingRecords') || []
    // 按日期降序排序
    records.sort((a, b) => b.createdAt - a.createdAt)

    // 添加显示用字段
    records.forEach(r => {
      const date = new Date(r.createdAt)
      r.displayTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    })

    this.setData({ records })
    this.groupRecordsByDate()
    this.calculateStats()
  },

  groupRecordsByDate() {
    const { records, currentMonth } = this.data

    // 过滤当月记录
    const monthRecords = records.filter(r => {
      const recordDate = new Date(r.date)
      return recordDate.getFullYear() === currentMonth.getFullYear() &&
             recordDate.getMonth() === currentMonth.getMonth()
    })

    // 按日期分组
    const groups = {}
    monthRecords.forEach(r => {
      if (!groups[r.date]) {
        groups[r.date] = []
      }
      groups[r.date].push(r)
    })

    // 转换为数组并排序
    const grouped = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a)).map(date => ({
      label: getRecordLabel(date),
      date,
      records: groups[date]
    }))

    this.setData({ groupedRecords: grouped })
  },

  calculateStats() {
    const { records, currentMonth } = this.data

    // 本月记录
    const monthRecords = records.filter(r => {
      const recordDate = new Date(r.date)
      return recordDate.getFullYear() === currentMonth.getFullYear() &&
             recordDate.getMonth() === currentMonth.getMonth()
    })

    // 本月做菜数
    const monthCount = monthRecords.length

    // 最爱菜品 TOP3
    const dishCount = {}
    monthRecords.forEach(r => {
      const key = r.menuItemName
      if (!dishCount[key]) {
        dishCount[key] = { name: r.menuItemName, emoji: r.emoji, count: 0 }
      }
      dishCount[key].count++
    })
    const topDishes = Object.values(dishCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    // 平均评分
    let avgRating = 0
    if (monthRecords.length > 0) {
      const sum = monthRecords.reduce((acc, r) => acc + (r.rating || 0), 0)
      avgRating = Math.round((sum / monthRecords.length) * 10) / 10
    }

    this.setData({
      stats: { monthCount, topDishes, avgRating }
    })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
  },

  prevMonth() {
    const newMonth = new Date(this.data.currentMonth)
    newMonth.setMonth(newMonth.getMonth() - 1)
    this.setData({
      currentMonth: newMonth,
      displayMonth: formatMonth(newMonth)
    })
    this.groupRecordsByDate()
    this.calculateStats()
  },

  nextMonth() {
    const newMonth = new Date(this.data.currentMonth)
    newMonth.setMonth(newMonth.getMonth() + 1)
    this.setData({
      currentMonth: newMonth,
      displayMonth: formatMonth(newMonth)
    })
    this.groupRecordsByDate()
    this.calculateStats()
  },

  showCameraModal() {
    this.setData({
      showCameraModal: true,
      tempRecord: {
        imagePath: '',
        menuItemId: '',
        menuItemName: '',
        emoji: '',
        meal: getAutoMeal(),
        rating: 0,
        notes: ''
      }
    })
  },

  closeCameraModal() {
    this.setData({ showCameraModal: false })
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const tempPath = res.tempFilePaths[0]
        // 保存到本地用户数据目录
        const userDataPath = wx.env.USER_DATA_PATH
        const fileName = `cook_${Date.now()}.jpg`
        const savePath = `${userDataPath}/${fileName}`

        wx.saveFile({
          tempFilePath: tempPath,
          savedFilePath: savePath,
          success: (saveRes) => {
            this.setData({
              'tempRecord.imagePath': saveRes.savedFilePath
            })
          }
        })
      }
    })
  },

  showDishPicker() {
    const dishes = getAllDishes()
    this.setData({
      showDishPicker: true,
      dishSearchKey: '',
      filteredDishes: dishes
    })
  },

  closeDishPicker() {
    this.setData({ showDishPicker: false })
  },

  searchDish(e) {
    const key = e.detail.value.toLowerCase()
    const dishes = getAllDishes()
    if (!key) {
      this.setData({ filteredDishes: dishes })
      return
    }
    const filtered = dishes.filter(d =>
      d.name.toLowerCase().includes(key) ||
      (d.emoji && d.emoji.includes(key))
    )
    this.setData({ filteredDishes: filtered })
  },

  selectDish(e) {
    const dish = e.currentTarget.dataset.dish
    this.setData({
      'tempRecord.menuItemId': dish.id,
      'tempRecord.menuItemName': dish.name,
      'tempRecord.emoji': dish.emoji || '',
      showDishPicker: false
    })
  },

  setMeal(e) {
    this.setData({
      'tempRecord.meal': e.currentTarget.dataset.meal
    })
  },

  setRating(e) {
    this.setData({
      'tempRecord.rating': e.currentTarget.dataset.rating
    })
  },

  inputNotes(e) {
    this.setData({
      'tempRecord.notes': e.detail.value
    })
  },

  saveRecord() {
    const { tempRecord } = this.data

    // 验证
    if (!tempRecord.imagePath) {
      wx.showToast({ title: '请先拍照', icon: 'none' })
      return
    }
    if (!tempRecord.menuItemId) {
      wx.showToast({ title: '请选择关联菜品', icon: 'none' })
      return
    }
    if (tempRecord.rating === 0) {
      wx.showToast({ title: '请评分', icon: 'none' })
      return
    }

    // 创建记录
    const now = new Date()
    const record = {
      id: generateId(),
      date: `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`,
      meal: tempRecord.meal,
      imagePath: tempRecord.imagePath,
      menuItemId: tempRecord.menuItemId,
      menuItemName: tempRecord.menuItemName,
      emoji: tempRecord.emoji,
      rating: tempRecord.rating,
      notes: tempRecord.notes,
      createdAt: Date.now()
    }

    // 保存到存储
    const records = storageAdapter.get('cookingRecords') || []
    records.unshift(record)
    storageAdapter.set('cookingRecords', records)

    // 关闭弹窗并刷新
    this.setData({ showCameraModal: false })
    this.loadRecords()

    wx.showToast({ title: '保存成功', icon: 'success' })
  },

  showRecordDetail(e) {
    const record = e.currentTarget.dataset.record
    this.setData({
      showDetailModal: true,
      currentRecord: record
    })
  },

  closeDetailModal() {
    this.setData({ showDetailModal: false })
  },

  deleteRecord() {
    const { currentRecord } = this.data
    if (!currentRecord) return

    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          const records = storageAdapter.get('cookingRecords') || []
          const filtered = records.filter(r => r.id !== currentRecord.id)
          storageAdapter.set('cookingRecords', filtered)

          this.setData({ showDetailModal: false })
          this.loadRecords()

          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  getMealLabel(meal) {
    const labels = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐'
    }
    return labels[meal] || meal
  }
})
```

- [ ] **Step 1: 创建文件**

- [ ] **Step 2: 写入内容**

- [ ] **Step 3: Commit**

```bash
git add miniprogram/pages/cook/cook.js
git commit -m "feat(cook): add cook page logic"
```

---

## Task 5: 修改 app.json 添加页面路由

**Files:**
- Modify: `miniprogram/app.json`

在 pages 数组中添加 `"pages/cook/cook"`（放在第一个位置，作为默认首页）

```json
{
  "pages": [
    "pages/cook/cook",
    "pages/today/today",
    ...
  ],
  ...
}
```

- [ ] **Step 1: 修改 app.json**

- [ ] **Step 2: Commit**

```bash
git add miniprogram/app.json
git commit -m "feat(cook): add cook page route to app.json"
```

---

## Task 6: 更新 CLAUDE.md 记录新页面

**Files:**
- Modify: `CLAUDE.md`

在"已完成"部分添加：
```
- [x] 做饭记录页面（拍照归档、关联菜品、评分、统计）
```

- [ ] **Step 1: 更新 CLAUDE.md**

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with cook page"
```

---

## 验证步骤

1. 启动微信开发者工具
2. 进入做饭记录页面
3. 测试拍照功能
4. 测试关联菜品选择
5. 测试评分和保存
6. 测试历史记录查看
7. 测试删除功能
8. 测试统计页面显示

---

**Plan complete.** 计划已保存到 `doc/superpowers/plans/2026-05-07-cook-page-plan.md`

两个执行选项：

**1. Subagent-Driven (推荐)** - 每个 Task 派发一个 subagent 完成，任务间有检查点

**2. Inline Execution** - 在当前 session 顺序执行任务，带检查点

选择哪个方式？