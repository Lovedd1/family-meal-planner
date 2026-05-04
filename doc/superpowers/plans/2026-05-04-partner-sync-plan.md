# 双人实时同步实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现双人实时同步功能，通过邀请码配对双方，冰箱和菜单数据双向共享

**Architecture:** 采用邀请码配对机制，StorageAdapter 增加伴侣数据同步逻辑，后台30秒轮询检测伴侣数据变化

**Tech Stack:** 微信小程序云开发、MongoDB (NoSQL)、StorageAdapter

---

## 文件结构

```
miniprogram/
├── utils/
│   └── storageAdapter.js  [改造: 增加伴侣同步方法]
├── pages/
│   └── settings/
│       └── settings.js     [改造: 绑定/解绑伴侣UI]
└── app.js                 [改造: 初始化伴侣轮询]
```

---

## Task 1: 改造 StorageAdapter - 邀请码与绑定

**Files:**
- Modify: `miniprogram/utils/storageAdapter.js`

- [ ] **Step 1: 添加云数据库初始化和工具方法**

在 `StorageAdapter` 类中添加以下方法：

```javascript
/**
 * 生成6位邀请码
 */
generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * 初始化用户档案（确保有userId）
 */
async initUserProfile() {
  if (!this.db) this.initCloudDB()
  const userId = this.getUserId()
  if (!userId) return null

  const collection = this.db.collection('user_profiles')
  const result = await collection.where({ _id: userId }).get()

  if (result.data && result.data.length > 0) {
    return result.data[0]
  }

  // 创建新用户档案
  const profile = {
    _id: userId,
    nickname: '我',
    partnerId: '',
    codes: {},
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  await collection.add({ data: profile })
  return profile
}

/**
 * 验证邀请码
 */
async validateInviteCode(code) {
  if (!this.db) this.initCloudDB()

  const collection = this.db.collection('user_profiles')
  // 遍历查找匹配的有效邀请码
  const allUsers = await collection.limit(100).get()

  for (const user of allUsers.data) {
    if (user.codes && user.codes[code]) {
      const codeInfo = user.codes[code]
      // 检查是否24小时内有效
      if (!codeInfo.used && (Date.now() - codeInfo.createdAt) < 24 * 60 * 60 * 1000) {
        return { valid: true, userId: user._id, nickname: user.nickname }
      }
    }
  }
  return { valid: false }
}
```

- [ ] **Step 2: 添加绑定伴侣方法**

```javascript
/**
 * 绑定伴侣
 */
async bindPartner(inviteCode) {
  if (!this.db) this.initCloudDB()

  const codeInfo = await this.validateInviteCode(inviteCode)
  if (!codeInfo.valid) {
    throw new Error('邀请码无效或已过期')
  }

  const myUserId = this.getUserId()
  if (myUserId === codeInfo.userId) {
    throw new Error('不能绑定自己')
  }

  const collection = this.db.collection('user_profiles')

  // 更新自己：设置partnerId
  await collection.doc(myUserId).update({
    data: {
      partnerId: codeInfo.userId,
      updatedAt: Date.now()
    }
  })

  // 更新对方：设置partnerId
  await collection.doc(codeInfo.userId).update({
    data: {
      partnerId: myUserId,
      updatedAt: Date.now()
    }
  })

  // 标记邀请码已使用
  const partnerProfile = await collection.doc(codeInfo.userId).get()
  if (partnerProfile.data) {
    const codes = partnerProfile.data.codes || {}
    codes[inviteCode] = { ...codes[inviteCode], used: true }
    await collection.doc(codeInfo.userId).update({
      data: { codes }
    })
  }

  // 保存到本地
  wx.setStorageSync('partnerId', codeInfo.userId)
  wx.setStorageSync('partnerNickname', codeInfo.nickname)

  return { success: true, partnerId: codeInfo.userId }
}

/**
 * 解绑伴侣
 */
async unbindPartner() {
  if (!this.db) this.initCloudDB()

  const myUserId = this.getUserId()
  const partnerId = wx.getStorageSync('partnerId')
  if (!partnerId) return { success: false }

  const collection = this.db.collection('user_profiles')

  // 清除自己的partnerId
  await collection.doc(myUserId).update({
    data: {
      partnerId: '',
      updatedAt: Date.now()
    }
  })

  // 清除对方的partnerId
  await collection.doc(partnerId).update({
    data: {
      partnerId: '',
      updatedAt: Date.now()
    }
  })

  // 清除本地
  wx.removeStorageSync('partnerId')
  wx.removeStorageSync('partnerNickname')

  return { success: true }
}
```

- [ ] **Step 3: 添加邀请码生成方法**

```javascript
/**
 * 生成并保存邀请码
 */
async createInviteCode() {
  if (!this.db) this.initCloudDB()

  const userId = this.getUserId()
  if (!userId) throw new Error('用户未登录')

  const code = this.generateInviteCode()
  const collection = this.db.collection('user_profiles')

  // 获取当前档案
  const profile = await collection.doc(userId).get()
  if (!profile.data) throw new Error('用户档案不存在')

  // 添加邀请码
  const codes = profile.data.codes || {}
  codes[code] = { createdAt: Date.now(), used: false }
  await collection.doc(userId).update({
    data: { codes, updatedAt: Date.now() }
  })

  return { code, expiresAt: Date.now() + 24 * 60 * 60 * 1000 }
}
```

- [ ] **Step 4: 提交代码**

```bash
git add miniprogram/utils/storageAdapter.js
git commit -m "feat: StorageAdapter增加邀请码和绑定伴侣功能"
```

---

## Task 2: 改造 StorageAdapter - 伴侣数据同步

**Files:**
- Modify: `miniprogram/utils/storageAdapter.js`

- [ ] **Step 1: 添加拉取伴侣数据方法**

```javascript
/**
 * 拉取伴侣数据
 */
async pullPartnerData(key) {
  if (!this.db) this.initCloudDB()

  const partnerId = wx.getStorageSync('partnerId')
  if (!partnerId) return null

  const collectionName = this.getCollectionName(key)
  if (!collectionName) return null

  try {
    const collection = this.db.collection(collectionName)
    const result = await collection.doc(partnerId).get()

    if (result.data) {
      const { _id, _openid, userId, updatedAt, ...data } = result.data
      return data.items || data
    }
  } catch (err) {
    console.error('拉取伴侣数据失败:', key, err)
  }
  return null
}

/**
 * 获取Storage Key对应的Collection名称
 */
getCollectionName(key) {
  const map = {
    fridgeItems: 'fridge_items',
    customFoods: 'menu_items',
    todayMenu: null
  }
  return map[key]
}
```

- [ ] **Step 2: 添加同步到伴侣方法**

```javascript
/**
 * 同步数据到伴侣
 */
async syncToPartner(key, data) {
  if (!this.db) this.initCloudDB()

  const partnerId = wx.getStorageSync('partnerId')
  if (!partnerId) return

  const collectionName = this.getCollectionName(key)
  if (!collectionName) return

  try {
    const collection = this.db.collection(collectionName)

    // 检查伴侣是否有数据
    const partnerData = await collection.doc(partnerId).get()

    if (partnerData.data) {
      // 更新伴侣数据
      await collection.doc(partnerId).update({
        data: {
          ...this.prepareForCloud(data),
          updatedAt: Date.now()
        }
      })
    } else {
      // 伴侣无数据，新增
      await collection.doc(partnerId).set({
        data: {
          ...this.prepareForCloud(data),
          userId: partnerId,
          updatedAt: Date.now()
        }
      })
    }
  } catch (err) {
    console.error('同步到伴侣失败:', key, err)
  }
}
```

- [ ] **Step 3: 改造set方法，增加同步到伴侣逻辑**

修改现有的 `set` 方法：

```javascript
set(key, value) {
  // 直接写本地
  wx.setStorageSync(key, value)

  // 加入同步队列
  this.addToSyncQueue(key, 'set', value)

  // 尝试同步到云端
  this.trySync(key)

  // 尝试同步到伴侣（共享数据）
  const sharedKeys = ['fridgeItems', 'customFoods', 'todayMenu']
  if (sharedKeys.includes(key)) {
    this.syncToPartner(key, value)
  }
}
```

- [ ] **Step 4: 添加伴侣数据变更监听**

```javascript
/**
 * 启动伴侣数据轮询
 */
startPartnerPolling() {
  if (this.partnerPollingTimer) return

  this.partnerPollingTimer = setInterval(() => {
    this.checkPartnerUpdates()
  }, 30000) // 30秒轮询
}

/**
 * 停止伴侣数据轮询
 */
stopPartnerPolling() {
  if (this.partnerPollingTimer) {
    clearInterval(this.partnerPollingTimer)
    this.partnerPollingTimer = null
  }
}

/**
 * 检查伴侣数据更新
 */
async checkPartnerUpdates() {
  const partnerId = wx.getStorageSync('partnerId')
  if (!partnerId) return

  const sharedKeys = ['fridgeItems', 'customFoods']

  for (const key of sharedKeys) {
    try {
      const partnerData = await this.pullPartnerData(key)
      if (partnerData) {
        const localData = wx.getStorageSync(key)
        // 比较更新时间
        if (JSON.stringify(partnerData) !== JSON.stringify(localData)) {
          // 伴侣数据更新，通知UI
          wx.setStorageSync(key, partnerData)
          this.emitPartnerUpdate(key, partnerData)
        }
      }
    } catch (err) {
      console.error('检查伴侣更新失败:', key, err)
    }
  }
}

/**
 * 伴侣更新事件
 */
partnerUpdateListeners: [],

onPartnerUpdate(callback) {
  this.partnerUpdateListeners.push(callback)
},

emitPartnerUpdate(key, data) {
  this.partnerUpdateListeners.forEach(cb => cb(key, data))
}
```

- [ ] **Step 5: 在initCloudDB中启动轮询**

修改 `initCloudDB` 方法：

```javascript
initCloudDB() {
  if (!this.db) {
    this.db = wx.cloud.database()
  }
  // 启动伴侣轮询
  this.startPartnerPolling()
  return this.db
}
```

- [ ] **Step 6: 提交代码**

```bash
git add miniprogram/utils/storageAdapter.js
git commit -m "feat: StorageAdapter增加伴侣数据同步功能"
```

---

## Task 3: 改造 app.js - 伴侣轮询初始化

**Files:**
- Modify: `miniprogram/app.js`

- [ ] **Step 1: 添加伴侣轮询启动**

修改 `onShow` 方法：

```javascript
onShow() {
  // 每次进入小程序尝试同步
  storageAdapter.syncAll()
  // 启动伴侣轮询
  storageAdapter.startPartnerPolling()
},
```

修改 `onHide` 方法（添加）：

```javascript
onHide() {
  // 停止伴侣轮询
  storageAdapter.stopPartnerPolling()
},
```

- [ ] **Step 2: 提交代码**

```bash
git add miniprogram/app.js
git commit -m "feat: app.js启动伴侣数据轮询"
```

---

## Task 4: 改造 settings.js - 绑定伴侣UI

**Files:**
- Modify: `miniprogram/pages/settings/settings.js`

- [ ] **Step 1: 添加绑定相关数据和方法**

在 data 中添加：
```javascript
showBindPartnerModal: false,
inviteCode: '',
isGeneratingCode: false,
isBinding: false
```

添加方法：
```javascript
showBindPartner() {
  this.setData({ showBindPartnerModal: true })
},

closeBindPartnerModal() {
  this.setData({
    showBindPartnerModal: false,
    inviteCode: '',
    isGeneratingCode: false,
    isBinding: false
  })
},

async generateInviteCode() {
  this.setData({ isGeneratingCode: true })
  try {
    const result = await storageAdapter.createInviteCode()
    this.setData({ inviteCode: result.code })
  } catch (err) {
    wx.showToast({ title: err.message || '生成失败', icon: 'none' })
  } finally {
    this.setData({ isGeneratingCode: false })
  }
},

async bindWithCode(e) {
  const code = e.detail.value.code
  if (!code || code.length !== 6) {
    wx.showToast({ title: '请输入6位邀请码', icon: 'none' })
    return
  }

  this.setData({ isBinding: true })
  try {
    await storageAdapter.bindPartner(code)
    wx.showToast({ title: '绑定成功', icon: 'success' })
    this.closeBindPartnerModal()
    this.loadSettings()
  } catch (err) {
    wx.showToast({ title: err.message || '绑定失败', icon: 'none' })
  } finally {
    this.setData({ isBinding: false })
  }
},

async unbindPartner() {
  wx.showModal({
    title: '确认解除',
    content: '确定要解除与TA的绑定吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await storageAdapter.unbindPartner()
          wx.showToast({ title: '已解除绑定', icon: 'success' })
          this.loadSettings()
        } catch (err) {
          wx.showToast({ title: '解除失败', icon: 'none' })
        }
      }
    }
  })
},

copyInviteCode() {
  wx.setClipboardData({
    data: this.data.inviteCode,
    success: () => {
      wx.showToast({ title: '已复制', icon: 'success' })
    }
  })
}
```

- [ ] **Step 2: 监听伴侣数据更新**

在 onLoad 中添加：
```javascript
onLoad() {
  this.loadSettings()
  // 监听伴侣数据更新
  storageAdapter.onPartnerUpdate((key, data) => {
    if (key === 'fridgeItems') {
      // 刷新冰箱数据
      this.loadSettings()
    }
  })
},
```

- [ ] **Step 3: 提交代码**

```bash
git add miniprogram/pages/settings/settings.js
git commit -m "feat: settings页面增加绑定伴侣UI"
```

---

## Task 5: 更新 settings.wxml - 绑定伴侣界面

**Files:**
- Modify: `miniprogram/pages/settings/settings.wxml`

- [ ] **Step 1: 添加绑定伴侣按钮和弹窗**

在"同步状态"区域后添加：

```xml
<!-- 伴侣信息 -->
<view class="section" wx:if="{{partnerInfo.connected}}">
  <view class="section-title">TA的信息</view>
  <view class="partner-card">
    <view class="partner-avatar">{{partnerInfo.nickname}}</view>
    <view class="partner-name">{{partnerInfo.nickname}}</view>
    <button class="btn-small" bindtap="unbindPartner">解除绑定</button>
  </view>
</view>

<!-- 绑定按钮（未绑定时显示） -->
<view class="section" wx:if="{{!partnerInfo.connected}}">
  <button class="btn-primary" bindtap="showBindPartner">绑定伴侣</button>
</view>

<!-- 绑定弹窗 -->
<modal visible="{{showBindPartnerModal}}" title="绑定伴侣" bind:close="closeBindPartnerModal">
  <view class="bind-modal-content">
    <!-- 我的邀请码 -->
    <view class="invite-code-section">
      <view class="section-title">我的邀请码</view>
      <view wx:if="{{inviteCode}}" class="invite-code">{{inviteCode}}</view>
      <button wx:if="{{!inviteCode}}" loading="{{isGeneratingCode}}" bindtap="generateInviteCode">
        生成邀请码
      </button>
      <button wx:if="{{inviteCode}}" class="btn-small" bindtap="copyInviteCode">复制</button>
    </view>

    <!-- 输入伴侣邀请码 -->
    <view class="bind-input-section">
      <view class="section-title">输入TA的邀请码</view>
      <form bindsubmit="bindWithCode">
        <input name="code" maxlength="6" placeholder="请输入6位邀请码" class="code-input"/>
        <button form-type="submit" loading="{{isBinding}}" class="btn-primary">确认绑定</button>
      </form>
    </view>
  </view>
</modal>
```

- [ ] **Step 2: 添加样式**

修改 `settings.wxss` 添加：

```css
.partner-card {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
}

.partner-avatar {
  width: 80rpx;
  height: 80rpx;
  background: #07c160;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.partner-name {
  flex: 1;
  margin-left: 20rpx;
  font-size: 32rpx;
}

.bind-modal-content {
  padding: 20rpx;
}

.invite-code-section {
  text-align: center;
  margin-bottom: 40rpx;
}

.invite-code {
  font-size: 48rpx;
  font-weight: bold;
  letter-spacing: 8rpx;
  color: #07c160;
  margin: 20rpx 0;
}

.code-input {
  border: 1px solid #ddd;
  padding: 20rpx;
  border-radius: 8rpx;
  text-align: center;
  font-size: 36rpx;
  letter-spacing: 8rpx;
  margin-bottom: 20rpx;
}
```

- [ ] **Step 3: 提交代码**

```bash
git add miniprogram/pages/settings/settings.wxml miniprogram/pages/settings/settings.wxss
git commit -m "feat: settings页面添加绑定伴侣UI"
```

---

## Task 6: 更新 settings.json - 启用modal组件

**Files:**
- Modify: `miniprogram/pages/settings/settings.json`

- [ ] **Step 1: 添加modal组件**

```json
{
  "usingComponents": {
    "modal": "/components/modal/modal"
  }
}
```

- [ ] **Step 2: 创建通用modal组件**

创建 `miniprogram/components/modal/modal.wxml`：
```xml
<view class="modal-mask" wx:if="{{visible}}" bindtap="onMaskTap">
  <view class="modal-content" catchtap="preventTap">
    <view class="modal-header">
      <view class="modal-title">{{title}}</view>
      <view class="modal-close" bindtap="onClose">×</view>
    </view>
    <view class="modal-body">
      <slot></slot>
    </view>
  </view>
</view>
```

创建 `miniprogram/components/modal/modal.js`：
```javascript
Component({
  properties: {
    visible: Boolean,
    title: String
  },
  methods: {
    onClose() {
      this.triggerEvent('close')
    },
    onMaskTap() {
      this.triggerEvent('close')
    },
    preventTap(e) {
      e.stopPropagation()
    }
  }
})
```

创建 `miniprogram/components/modal/modal.wxss`：
```css
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  border-radius: 16rpx;
  width: 80%;
  max-width: 600rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1px solid #eee;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
}

.modal-close {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
}

.modal-body {
  padding: 30rpx;
}
```

创建 `miniprogram/components/modal/modal.json`：
```json
{
  "component": true
}
```

- [ ] **Step 3: 提交代码**

```bash
git add miniprogram/pages/settings/settings.json
git add miniprogram/components/modal/
git commit -m "feat: 添加通用modal组件"
```

---

## Task 7: 更新 CLAUDE.md 记录进度

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 更新待开发列表**

将 `双人实时同步` 从待开发移到已完成

- [ ] **Step 2: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: 更新CLAUDE.md记录双人同步完成"
```

---

## 自检清单

- [ ] spec覆盖：邀请码生成、验证、绑定/解绑、伴侣数据同步、UI
- [ ] 无placeholder：所有代码块完整
- [ ] 类型一致性：方法名在所有Task中一致

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-05-04-partner-sync-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
