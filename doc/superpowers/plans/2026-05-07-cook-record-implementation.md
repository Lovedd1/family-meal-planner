# 做饭记录功能重写实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将做饭记录从弹窗式重构为故事流卡片式，包含照片墙主页、全屏详情页、全屏编辑页

**Architecture:** 三个独立页面（主页/详情页/编辑页），通过 wx.navigateTo 跳转，数据存储在本地 storageAdapter

**Tech Stack:** 微信小程序原生开发，使用 storageAdapter 存储，使用 foods.js 菜品数据

---

## 文件结构

```
miniprogram/pages/cook/           # 主页 - 照片墙（重构）
├── cook.wxml                     # 瀑布流照片墙
├── cook.js                       # 照片墙逻辑
├── cook.wxss                     # 照片墙样式
└── cook.json

miniprogram/pages/cook-detail/    # 详情页（新建）
├── cook-detail.wxml              # 大图展示 + 详情信息
├── cook-detail.js                # 详情逻辑（删除、编辑）
├── cook-detail.wxss              # 详情样式
└── cook-detail.json

miniprogram/pages/cook-edit/      # 编辑页（新建）
├── cook-edit.wxml                # 全屏编辑表单
├── cook-edit.js                  # 编辑逻辑（选择菜品、图片、评分）
├── cook-edit.wxss                # 编辑样式
└── cook-edit.json
```

---

## 任务列表

### Task 1: 创建 cook-detail 详情页（新建）

**Files:**
- Create: `miniprogram/pages/cook-detail/cook-detail.json`
- Create: `miniprogram/pages/cook-detail/cook-detail.wxml`
- Create: `miniprogram/pages/cook-detail/cook-detail.js`
- Create: `miniprogram/pages/cook-detail/cook-detail.wxss`
- Modify: `miniprogram/app.json` (添加 cook-detail 页面)

- [ ] **Step 1: 创建 cook-detail.json**

```json
{
  "usingComponents": {},
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 创建 cook-detail.wxml**

```xml
<!-- 做饭记录详情页 -->
<view class="page">
  <!-- 顶部导航 -->
  <view class="nav-bar">
    <view class="nav-back" bindtap="goBack">‹</view>
    <view class="nav-title">做饭记录</view>
    <view class="nav-more" bindtap="showMoreMenu">···</view>
  </view>

  <!-- 图片浏览区域 -->
  <view class="image-viewer">
    <swiper class="image-swiper" indicator-dots="{{true}}" circular="{{true}}">
      <swiper-item>
        <image class="detail-image" src="{{record.imagePath}}" mode="aspectFill"/>
      </swiper-item>
    </swiper>
  </view>

  <!-- 信息区域 -->
  <view class="info-section">
    <!-- 菜品名 + 评分 -->
    <view class="info-header">
      <view class="dish-info">
        <text class="dish-emoji">{{record.emoji}}</text>
        <text class="dish-name">{{record.menuItemName}}</text>
      </view>
      <view class="rating">
        <text wx:for="{{5}}" wx:key="*this" class="{{index < record.rating ? 'filled' : ''}}">⭐</text>
      </view>
    </view>

    <!-- 时间信息 -->
    <view class="time-info">
      <text>{{record.displayDate}}</text>
      <text class="separator">·</text>
      <text>{{record.displayTime}}</text>
      <text class="separator">·</text>
      <text class="meal-badge meal-{{record.meal}}">{{getMealLabel(record.meal)}}</text>
    </view>

    <!-- 备注区域 -->
    <view class="notes-section" wx:if="{{record.notes}}">
      <view class="section-label">备注</view>
      <view class="notes-content">{{record.notes}}</view>
    </view>
  </view>

  <!-- 编辑按钮 -->
  <view class="bottom-bar">
    <view class="edit-btn" bindtap="goToEdit">编辑</view>
  </view>

  <!-- 更多菜单 -->
  <view class="more-menu-mask" wx:if="{{showMoreMenu}}" bindtap="hideMoreMenu">
    <view class="more-menu" catchtap="">
      <view class="menu-item danger" bindtap="deleteRecord">删除记录</view>
      <view class="menu-item" bindtap="hideMoreMenu">取消</view>
    </view>
  </view>
</view>
```

- [ ] **Step 3: 创建 cook-detail.js**

```javascript
const app = getApp()
const storageAdapter = require('../../utils/storageAdapter.js')

Page({
  data: {
    recordId: '',
    record: null,
    showMoreMenu: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ recordId: options.id })
      this.loadRecord()
    }
  },

  loadRecord() {
    const records = storageAdapter.get('cookingRecords') || []
    const record = records.find(r => r.id === this.data.recordId)
    if (record) {
      const date = new Date(record.createdAt)
      record.displayDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
      record.displayTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      this.setData({ record })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  showMoreMenu() {
    this.setData({ showMoreMenu: true })
  },

  hideMoreMenu() {
    this.setData({ showMoreMenu: false })
  },

  goToEdit() {
    wx.navigateTo({
      url: `/pages/cook-edit/cook-edit?id=${this.data.recordId}`
    })
  },

  deleteRecord() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          const records = storageAdapter.get('cookingRecords') || []
          const filtered = records.filter(r => r.id !== this.data.recordId)
          storageAdapter.set('cookingRecords', filtered)
          wx.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
        this.hideMoreMenu()
      }
    })
  },

  getMealLabel(meal) {
    const labels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }
    return labels[meal] || meal
  }
})
```

- [ ] **Step 4: 创建 cook-detail.wxss**

```css
.page {
  min-height: 100vh;
  background: #f8f6f7;
  display: flex;
  flex-direction: column;
}

.nav-bar {
  height: 88rpx;
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1rpx solid #f0e9e9;
  padding: 0 24rpx;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.nav-back {
  font-size: 56rpx;
  color: #C48B8B;
  font-weight: 300;
  padding: 0 16rpx;
  margin-top: 40rpx;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
  margin-right: 60rpx;
}

.nav-more {
  font-size: 40rpx;
  color: #666;
  padding: 0 16rpx;
  margin-top: 40rpx;
}

.image-viewer {
  width: 100%;
  height: 500rpx;
  margin-top: 88rpx;
  background: #000;
}

.image-swiper {
  width: 100%;
  height: 100%;
}

.detail-image {
  width: 100%;
  height: 100%;
}

.info-section {
  flex: 1;
  background: #fff;
  padding: 32rpx;
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.dish-info {
  display: flex;
  align-items: center;
}

.dish-emoji {
  font-size: 40rpx;
  margin-right: 12rpx;
}

.dish-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.rating {
  font-size: 32rpx;
  color: #ddd;
}

.rating .filled {
  color: #FFD700;
}

.time-info {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 24rpx;
}

.separator {
  margin: 0 8rpx;
  color: #999;
}

.meal-badge {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-left: 8rpx;
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

.notes-section {
  border-top: 1rpx solid #f5f5f5;
  padding-top: 24rpx;
}

.section-label {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.notes-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0e9e9;
}

.edit-btn {
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  background: linear-gradient(135deg, #C48B8B, #E8B4B4);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.more-menu-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.more-menu {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 0 32rpx 32rpx;
}

.menu-item {
  height: 100rpx;
  line-height: 100rpx;
  text-align: center;
  font-size: 32rpx;
  color: #333;
  border-bottom: 1rpx solid #f5f5f5;
}

.menu-item:last-child {
  border-bottom: none;
  color: #999;
}

.menu-item.danger {
  color: #E57373;
}
```

- [ ] **Step 5: 更新 app.json 添加 cook-detail 页面**

在 app.json 的 pages 数组中添加 `"pages/cook-detail/cook-detail"`

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages/cook-detail/ miniprogram/app.json
git commit -m "feat(cook): add cook-detail page for viewing record details"
```

---

### Task 2: 创建 cook-edit 编辑页（新建）

**Files:**
- Create: `miniprogram/pages/cook-edit/cook-edit.json`
- Create: `miniprogram/pages/cook-edit/cook-edit.wxml`
- Create: `miniprogram/pages/cook-edit/cook-edit.js`
- Create: `miniprogram/pages/cook-edit/cook-edit.wxss`
- Modify: `miniprogram/app.json` (添加 cook-edit 页面)

- [ ] **Step 1: 创建 cook-edit.json**

```json
{
  "usingComponents": {},
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 创建 cook-edit.wxml**

```xml
<!-- 做饭记录编辑页 -->
<view class="page">
  <!-- 顶部操作栏 -->
  <view class="top-bar">
    <view class="cancel-btn" bindtap="cancel">× 取消</view>
    <view class="save-btn {{canSave ? 'active' : ''}}" bindtap="saveRecord">保存 ✓</view>
  </view>

  <!-- 页面标题 -->
  <view class="page-header">
    <text class="page-title">{{isEdit ? '编辑记录' : '新增加录'}}</text>
  </view>

  <!-- 内容区域 -->
  <scroll-view class="content" scroll-y>
    <!-- 图片选择 -->
    <view class="image-section">
      <block wx:if="{{tempRecord.imagePath}}">
        <view class="image-preview" bindtap="chooseImage">
          <image src="{{tempRecord.imagePath}}" mode="aspectFill"/>
          <view class="change-image-hint">点击更换图片</view>
        </view>
      </block>
      <view class="image-placeholder" wx:else bindtap="chooseImage">
        <text class="icon">📷</text>
        <text class="text">点击选择图片</text>
        <text class="hint">从相册选择或拍照</text>
      </view>
    </view>

    <!-- 关联菜品 -->
    <view class="form-section">
      <view class="section-title">关联菜品 <text class="required">*</text></view>

      <!-- 搜索框 -->
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          placeholder="搜索菜品..."
          value="{{dishSearchKey}}"
          bindinput="searchDish"
        />
      </view>

      <!-- 菜品网格 -->
      <view class="dish-grid">
        <view
          class="dish-item {{tempRecord.menuItemId === item.id ? 'selected' : ''}}"
          wx:for="{{filteredDishes}}"
          wx:key="id"
          data-dish="{{item}}"
          bindtap="selectDish"
        >
          <text class="dish-emoji">{{item.emoji}}</text>
          <text class="dish-name">{{item.name}}</text>
          <view class="selected-check" wx:if="{{tempRecord.menuItemId === item.id}}">✓</view>
        </view>
      </view>

      <!-- 未选中提示 -->
      <view class="tips" wx:if="{{!tempRecord.menuItemId}}">
        <text>请选择关联的菜品</text>
      </view>
      <view class="selected-dish" wx:else>
        <text>已选择: {{tempRecord.emoji}} {{tempRecord.menuItemName}}</text>
      </view>
    </view>

    <!-- 餐次选择 -->
    <view class="form-section">
      <view class="section-title">餐次 <text class="required">*</text></view>
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
    <view class="form-section">
      <view class="section-title">评分</view>
      <view class="rating-selector">
        <text
          class="star {{index < tempRecord.rating ? 'filled' : ''}}"
          wx:for="{{5}}"
          wx:key="*this"
          data-rating="{{index + 1}}"
          bindtap="setRating"
        >⭐</text>
      </view>
    </view>

    <!-- 备注 -->
    <view class="form-section">
      <view class="section-title">备注（选填）</view>
      <textarea
        class="notes-input"
        placeholder="今天的牛肉很嫩！"
        value="{{tempRecord.notes}}"
        bindinput="inputNotes"
        maxlength="200"
      />
      <view class="notes-count">{{tempRecord.notes.length || 0}}/200</view>
    </view>

    <!-- 底部占位 -->
    <view class="bottom-placeholder"></view>
  </scroll-view>
</view>
```

- [ ] **Step 3: 创建 cook-edit.js**

```javascript
const app = getApp()
const storageAdapter = require('../../utils/storageAdapter.js')
const { foods } = require('../../utils/foods.js')

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

  // 合并内置菜品
  foods.forEach(food => {
    if (!dishes.find(d => d.id === food.id)) {
      dishes.push(food)
    }
  })

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

Page({
  data: {
    isEdit: false,
    recordId: '',
    dishSearchKey: '',
    filteredDishes: [],
    canSave: false,
    tempRecord: {
      imagePath: '',
      menuItemId: '',
      menuItemName: '',
      emoji: '',
      meal: 'breakfast',
      rating: 0,
      notes: ''
    }
  },

  onLoad(options) {
    const allDishes = getAllDishes()
    this.setData({ filteredDishes: allDishes })

    if (options.id) {
      // 编辑模式
      this.setData({ isEdit: true, recordId: options.id })
      wx.setNavigationBarTitle({ title: '编辑记录' })
      this.loadRecord(options.id)
    } else {
      // 新增模式
      this.setData({
        isEdit: false,
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
    }
  },

  loadRecord(id) {
    const records = storageAdapter.get('cookingRecords') || []
    const record = records.find(r => r.id === id)
    if (record) {
      this.setData({
        tempRecord: {
          imagePath: record.imagePath,
          menuItemId: record.menuItemId,
          menuItemName: record.menuItemName,
          emoji: record.emoji,
          meal: record.meal,
          rating: record.rating,
          notes: record.notes || ''
        }
      })
      this.checkCanSave()
    }
  },

  cancel() {
    wx.navigateBack()
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const tempPath = res.tempFilePaths[0]
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
            this.checkCanSave()
          }
        })
      }
    })
  },

  searchDish(e) {
    const key = e.detail.value.toLowerCase()
    const dishes = getAllDishes()
    if (!key) {
      this.setData({ filteredDishes: dishes, dishSearchKey: '' })
      return
    }
    const filtered = dishes.filter(d =>
      d.name.toLowerCase().includes(key) ||
      (d.emoji && d.emoji.includes(key))
    )
    this.setData({ filteredDishes: filtered, dishSearchKey: key })
  },

  selectDish(e) {
    const dish = e.currentTarget.dataset.dish
    this.setData({
      'tempRecord.menuItemId': dish.id,
      'tempRecord.menuItemName': dish.name,
      'tempRecord.emoji': dish.emoji || '',
      dishSearchKey: ''
    })
    this.checkCanSave()
  },

  setMeal(e) {
    this.setData({
      'tempRecord.meal': e.currentTarget.dataset.meal
    })
    this.checkCanSave()
  },

  setRating(e) {
    this.setData({
      'tempRecord.rating': e.currentTarget.dataset.rating
    })
    this.checkCanSave()
  },

  inputNotes(e) {
    this.setData({
      'tempRecord.notes': e.detail.value
    })
  },

  checkCanSave() {
    const { tempRecord } = this.data
    const canSave = !!(
      tempRecord.imagePath &&
      tempRecord.menuItemId &&
      tempRecord.meal
    )
    this.setData({ canSave })
  },

  saveRecord() {
    const { tempRecord, isEdit, recordId } = this.data

    // 验证
    if (!tempRecord.imagePath) {
      wx.showToast({ title: '请先选择图片', icon: 'none' })
      return
    }
    if (!tempRecord.menuItemId) {
      wx.showToast({ title: '请选择关联菜品', icon: 'none' })
      return
    }
    if (!tempRecord.meal) {
      wx.showToast({ title: '请选择餐次', icon: 'none' })
      return
    }

    const now = new Date()
    let records = storageAdapter.get('cookingRecords') || []

    if (isEdit) {
      // 更新现有记录
      records = records.map(r => {
        if (r.id === recordId) {
          return {
            ...r,
            imagePath: tempRecord.imagePath,
            menuItemId: tempRecord.menuItemId,
            menuItemName: tempRecord.menuItemName,
            emoji: tempRecord.emoji,
            meal: tempRecord.meal,
            rating: tempRecord.rating,
            notes: tempRecord.notes,
            updatedAt: Date.now()
          }
        }
        return r
      })
    } else {
      // 新增记录
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
      records.unshift(record)
    }

    storageAdapter.set('cookingRecords', records)
    wx.showToast({ title: '保存成功', icon: 'success' })

    // 返回上一页（主页或详情页）
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        // 如果有详情页，就返回详情页让它刷新
        const prevPage = pages[pages.length - 2]
        if (prevPage && prevPage.route.includes('cook-detail')) {
          prevPage.loadRecord && prevPage.loadRecord()
        }
      }
      wx.navigateBack()
    }, 1500)
  }
})
```

- [ ] **Step 4: 创建 cook-edit.wxss**

```css
.page {
  min-height: 100vh;
  background: #f8f6f7;
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #f0e9e9;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.cancel-btn {
  font-size: 32rpx;
  color: #666;
  padding: 16rpx;
}

.save-btn {
  font-size: 32rpx;
  color: #ccc;
  padding: 16rpx;
  font-weight: 600;
}

.save-btn.active {
  color: #C48B8B;
}

.page-header {
  padding: 120rpx 32rpx 24rpx;
  background: #fff;
}

.page-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
}

.content {
  flex: 1;
  padding: 0 24rpx;
}

/* 图片选择 */
.image-section {
  margin: 24rpx 0;
}

.image-preview {
  position: relative;
  border-radius: 16rpx;
  overflow: hidden;
}

.image-preview image {
  width: 100%;
  height: 400rpx;
}

.change-image-hint {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64rpx;
  line-height: 64rpx;
  text-align: center;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 26rpx;
}

.image-placeholder {
  height: 300rpx;
  border: 2rpx dashed #ddd;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.image-placeholder .icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.image-placeholder .text {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.image-placeholder .hint {
  font-size: 24rpx;
  color: #999;
}

/* 表单区块 */
.form-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.required {
  color: #E57373;
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 20rpx;
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
}

/* 菜品网格 */
.dish-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.dish-item {
  width: calc(33.33% - 12rpx);
  padding: 20rpx 16rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  border: 2rpx solid transparent;
}

.dish-item.selected {
  background: #FFF5F5;
  border-color: #C48B8B;
}

.dish-emoji {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.dish-name {
  font-size: 24rpx;
  color: #333;
  text-align: center;
}

.selected-check {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  text-align: center;
  background: #C48B8B;
  color: #fff;
  border-radius: 50%;
  font-size: 20rpx;
}

.tips {
  text-align: center;
  padding: 24rpx;
  color: #E57373;
  font-size: 26rpx;
}

.selected-dish {
  text-align: center;
  padding: 16rpx;
  color: #C48B8B;
  font-size: 26rpx;
  background: #FFF5F5;
  border-radius: 12rpx;
}

/* 餐次选择 */
.meal-selector {
  display: flex;
  gap: 16rpx;
}

.meal-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  background: #f5f5f5;
  border-radius: 12rpx;
}

.meal-btn.active {
  background: #C48B8B;
  color: #fff;
}

/* 评分 */
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

/* 备注 */
.notes-input {
  width: 100%;
  min-height: 160rpx;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  font-size: 28rpx;
  line-height: 1.6;
  text-align: left;
}

.notes-count {
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.bottom-placeholder {
  height: 120rpx;
}
```

- [ ] **Step 5: 更新 app.json 添加 cook-edit 页面**

在 app.json 的 pages 数组中添加 `"pages/cook-edit/cook-edit"`

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages/cook-edit/ miniprogram/app.json
git commit -m "feat(cook): add cook-edit page for creating/editing records"
```

---

### Task 3: 重构 cook 主页为照片墙

**Files:**
- Modify: `miniprogram/pages/cook/cook.wxml` (完全重写)
- Modify: `miniprogram/pages/cook/cook.js` (完全重写)
- Modify: `miniprogram/pages/cook/cook.wxss` (完全重写)

- [ ] **Step 1: 重写 cook.wxml**

```xml
<!-- 做饭记录主页 - 照片墙 -->
<view class="page">
  <!-- 顶部导航 -->
  <view class="nav-bar">
    <view class="nav-title">做饭记录</view>
  </view>

  <!-- 空状态 -->
  <view class="empty-state" wx:if="{{groupedRecords.length === 0}}">
    <text class="icon">🍳</text>
    <text class="text">还没有做饭记录</text>
    <text class="text-small">点击下方按钮记录第一道菜</text>
  </view>

  <!-- 照片墙 -->
  <scroll-view class="photo-wall" scroll-y wx:else>
    <!-- 月份分组 -->
    <block wx:for="{{groupedRecords}}" wx:key="month">
      <view class="month-section">
        <view class="month-title">{{item.month}}</view>

        <!-- 卡片网格 -->
        <view class="card-grid">
          <view
            class="card"
            wx:for="{{item.records}}"
            wx:key="id"
            data-record="{{item}}"
            bindtap="goToDetail"
          >
            <image class="card-image" src="{{item.imagePath}}" mode="aspectFill"/>
            <view class="card-content">
              <view class="card-header">
                <text class="card-emoji">{{item.emoji}}</text>
                <text class="card-name">{{item.menuItemName}}</text>
              </view>
              <view class="card-rating">
                <text wx:for="{{item.rating}}" wx:key="*this" class="star">⭐</text>
              </view>
              <view class="card-notes" wx:if="{{item.notes}}">"{{item.notes}}"</view>
              <view class="card-meta">
                <text>{{item.day}}</text>
                <text class="meal-badge meal-{{item.meal}}">{{getMealLabel(item.meal)}}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </block>

    <!-- 底部占位 -->
    <view class="bottom-placeholder"></view>
  </scroll-view>

  <!-- 悬浮添加按钮 -->
  <view class="fab" bindtap="goToAdd">
    <text class="fab-icon">+</text>
  </view>
</view>
```

- [ ] **Step 2: 重写 cook.js**

```javascript
const app = getApp()
const storageAdapter = require('../../utils/storageAdapter.js')

// 格式化月份显示
function formatMonth(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

// 生成唯一ID
function generateId() {
  return 'cr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

Page({
  data: {
    records: [],
    groupedRecords: []
  },

  onLoad() {
    // do nothing, wait for onShow
  },

  onShow() {
    this.loadRecords()
  },

  loadRecords() {
    const records = storageAdapter.get('cookingRecords') || []

    // 按日期降序排序
    records.sort((a, b) => b.createdAt - a.createdAt)

    // 添加显示用字段
    records.forEach(r => {
      const date = new Date(r.createdAt)
      r.day = `${date.getMonth() + 1}月${date.getDate()}日`
      r.displayTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    })

    this.setData({ records })
    this.groupRecordsByMonth()
  },

  groupRecordsByMonth() {
    const { records } = this.data

    // 按月份分组
    const groups = {}
    records.forEach(r => {
      const date = new Date(r.createdAt)
      const monthKey = formatMonth(date)
      if (!groups[monthKey]) {
        groups[monthKey] = []
      }
      groups[monthKey].push(r)
    })

    // 转换为数组并排序（最新月在前）
    const grouped = Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(month => ({
        month,
        records: groups[month]
      }))

    this.setData({ groupedRecords: grouped })
  },

  goToDetail(e) {
    const record = e.currentTarget.dataset.record
    wx.navigateTo({
      url: `/pages/cook-detail/cook-detail?id=${record.id}`
    })
  },

  goToAdd() {
    wx.navigateTo({
      url: '/pages/cook-edit/cook-edit'
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

- [ ] **Step 3: 重写 cook.wxss**

```css
.page {
  min-height: 100vh;
  background: #f8f6f7;
  position: relative;
}

.nav-bar {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-bottom: 1rpx solid #f0e9e9;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding-bottom: 120rpx;
}

.empty-state .icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
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

/* 照片墙 */
.photo-wall {
  height: 100vh;
  padding-top: 88rpx;
}

.month-section {
  padding: 24rpx;
}

.month-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 24rpx;
}

.card-grid {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card-image {
  width: 100%;
  height: 360rpx;
  background: #f0f0f0;
}

.card-content {
  padding: 20rpx;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.card-emoji {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.card-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.card-rating {
  font-size: 24rpx;
  color: #FFD700;
  margin-bottom: 8rpx;
}

.card-rating .star {
  margin-right: 2rpx;
}

.card-notes {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 24rpx;
  color: #999;
}

.meal-badge {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
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

.bottom-placeholder {
  height: 160rpx;
}

/* 悬浮添加按钮 */
.fab {
  position: fixed;
  bottom: 80rpx;
  right: 32rpx;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #C48B8B, #E8B4B4);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(196, 139, 139, 0.4);
  z-index: 100;
}

.fab-icon {
  font-size: 64rpx;
  color: #fff;
  font-weight: 300;
  line-height: 1;
}
```

- [ ] **Step 4: Commit**

```bash
git add miniprogram/pages/cook/
git commit -m "refactor(cook): rewrite main page as photo wall with story cards"
```

---

### Task 4: 更新 app.json 确保页面路径正确

**Files:**
- Modify: `miniprogram/app.json`

- [ ] **Step 1: 检查并更新 app.json**

确保 pages 数组中的页面顺序正确，且包含所有三个页面：
- `pages/cook/cook`
- `pages/cook-detail/cook-detail`
- `pages/cook-edit/cook-edit`

- [ ] **Step 2: Commit**

```bash
git add miniprogram/app.json
git commit -m "chore(cook): ensure all cook pages registered in app.json"
```

---

## 任务完成检查

| 任务 | 描述 | 状态 |
|------|------|------|
| Task 1 | 创建 cook-detail 详情页 | ⬜ |
| Task 2 | 创建 cook-edit 编辑页 | ⬜ |
| Task 3 | 重构 cook 主页为照片墙 | ⬜ |
| Task 4 | 更新 app.json | ⬜ |

---

## 实现要点

1. **照片墙瀑布流**: 使用垂直卡片流，按月份分组
2. **全屏编辑**: 解决旧版弹窗问题，菜品选择网格高亮已选项
3. **详情页**: 大图展示 + 完整信息，支持删除和编辑
4. **数据存储**: 继续使用 `cookingRecords` 键，本地存储
5. **路由**: 使用 wx.navigateTo，详情页和编辑页通过 id 参数传递记录 ID
