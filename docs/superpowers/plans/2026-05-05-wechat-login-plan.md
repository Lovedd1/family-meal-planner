# 微信登录功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在设置页面实现微信登录功能，用户点击登录后获取昵称和头像，下载头像到本地，并同步到云端

**Architecture:** 使用微信 button 组件的 open-type="getUserProfile" 获取用户信息，头像下载到本地文件系统中，昵称和头像信息通过 storageAdapter 存储到本地，并通过云开发 database 同步到 user_profiles Collection

**Tech Stack:** 微信小程序、云开发 (database)、storageAdapter

---

## 文件结构

- Modify: `miniprogram/pages/settings/settings.wxml` - 用户信息卡片添加登录按钮
- Modify: `miniprogram/pages/settings/settings.js` - 添加登录逻辑、下载头像、云端同步

---

## 实现任务

### Task 1: 修改设置页面 WXML 添加登录 UI

**Files:**
- Modify: `miniprogram/pages/settings/settings.wxml` - 用户卡片区域

- [ ] **Step 1: 在 settings.wxml 中找到用户信息卡片区域（约第8-21行），添加登录状态判断和登录按钮**

将第8-21行的用户卡片修改为：
```html
  <!-- 用户信息 -->
  <view class="section">
    <view class="user-card" bindtap="handleUserCardTap">
      <view class="avatar">{{userInfo.avatar}}</view>
      <view class="user-info">
        <text class="nickname">{{userInfo.nickname}}</text>
        <text class="login-hint" wx:if="{{!isLoggedIn}}">点击登录微信账号</text>
        <text class="collab-status" wx:else>
          <text class="status-dot {{partnerInfo.connected ? 'connected' : ''}}"></text>
          与{{partnerInfo.connected ? partnerInfo.nickname : '未连接'}}协作中
        </text>
      </view>
      <view class="edit-btn" wx:if="{{isLoggedIn}}" bindtap="showEditNickname">编辑</view>
    </view>

    <!-- 微信登录按钮（未登录时显示） -->
    <button wx:if="{{!isLoggedIn}}" class="btn-login" open-type="getUserProfile" bindgetuserinfo="onGetUserProfile">
      微信登录
    </button>
  </view>
```

- [ ] **Step 2: 检查是否需要添加 login-hint 样式（可选，当前基础样式已可工作）**

完成后提交：
```bash
git add miniprogram/pages/settings/settings.wxml
git commit -m "feat(settings): 添加微信登录按钮UI"
```

---

### Task 2: 修改设置页面 JS 添加登录逻辑

**Files:**
- Modify: `miniprogram/pages/settings/settings.js` - 添加登录相关方法和数据字段

- [ ] **Step 1: 在 data 对象中添加 isLoggedIn 字段（在 menstrualSettings 之后添加）**

在第33行 menstrualSettings 之后添加：
```javascript
    isLoggedIn: false,
```

- [ ] **Step 2: 在 loadSettings 方法中检查登录状态（第50-82行之间）**

在 loadSettings 方法开头（在 "用户信息" 注释之前）添加登录状态检查：
```javascript
    // 检查登录状态
    const userProfile = storageAdapter.get('userProfile') || {}
    const isLoggedIn = !!(userProfile.nickname && userProfile.localAvatarPath)

    this.setData({ isLoggedIn })
```

同时修改 data 中 userInfo 的初始化部分使用本地存储：
```javascript
    userInfo: {
      nickname: userProfile.nickname || '我',
      avatar: userProfile.localAvatarPath || userProfile.nickname?.charAt(0) || '',
      localAvatarPath: userProfile.localAvatarPath || ''
    },
```

- [ ] **Step 3: 添加 onGetUserProfile 方法（在 showEditNickname 方法之前）**

```javascript
  onGetUserProfile(e) {
    if (!e.detail || !e.detail.userInfo) {
      wx.showToast({ title: '需要授权才能登录', icon: 'none' })
      return
    }
    const { nickName, avatarUrl } = e.detail.userInfo
    this.saveUserProfile(nickName, avatarUrl)
  },

  async saveUserProfile(nickname, avatarUrl) {
    wx.showLoading({ title: '登录中...' })

    try {
      // 1. 下载头像
      const localPath = await this.downloadAvatar(avatarUrl)

      // 2. 保存到本地
      const profile = {
        nickname,
        localAvatarPath: localPath,
        wechatAvatarUrl: avatarUrl,
        updateTime: Date.now()
      }
      storageAdapter.set('userProfile', profile)

      // 3. 同步到云端
      await this.syncToCloud(profile)

      // 4. 更新页面
      this.setData({
        userInfo: {
          nickname,
          avatar: localPath || nickname.charAt(0),
          localAvatarPath: localPath
        },
        isLoggedIn: true
      })

      wx.hideLoading()
      wx.showToast({ title: '登录成功', icon: 'success' })
    } catch (err) {
      wx.hideLoading()
      console.error('登录失败', err)
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    }
  },

  downloadAvatar(url) {
    return new Promise((resolve) => {
      if (!url) {
        resolve('')
        return
      }
      wx.downloadFile({
        url,
        filePath: wx.env.USER_DATA_PATH + '/avatar',
        success: res => {
          if (res.statusCode === 200) {
            resolve(res.filePath)
          } else {
            resolve('')
          }
        },
        fail: err => {
          console.error('下载头像失败', err)
          resolve('')
        }
      })
    })
  },

  async syncToCloud(profile) {
    const app = getApp()
    if (!app.globalData.userId) {
      console.warn('userId 未准备好，跳过云端同步')
      return
    }
    try {
      const db = wx.cloud.database()
      await db.collection('user_profiles').doc(app.globalData.userId).set({
        data: profile
      })
    } catch (err) {
      console.error('同步到云端失败', err)
    }
  },
```

- [ ] **Step 4: 添加 handleUserCardTap 方法（点击用户卡片处理）**

在 onGetUserProfile 方法之前添加：
```javascript
  handleUserCardTap() {
    // 如果已登录，点击用户卡片无特殊操作
    // 如果未登录，触发登录按钮点击
    if (!this.data.isLoggedIn) {
      // 查找登录按钮并触发点击
      const loginBtn = this.selectComponent('.btn-login')
      // 实际上不需要，因为 button 的 open-type 会自动处理
    }
  },
```

**注意：** 由于微信 button 的 open-type="getUserProfile" 必须用户主动点击才能触发，handleUserCardTap 只是预留的扩展点，当前可留空。

- [ ] **Step 5: 更新 loadSettings 中的昵称和头像显示逻辑**

在 loadSettings 方法中确保使用正确的字段：
```javascript
    userInfo: {
      nickname: userProfile.nickname || '我',
      avatar: userProfile.localAvatarPath || userProfile.nickname?.charAt(0) || '我',
      localAvatarPath: userProfile.localAvatarPath || ''
    },
```

完成后提交：
```bash
git add miniprogram/pages/settings/settings.js
git commit -m "feat(settings): 添加微信登录逻辑"
```

---

### Task 3: 验证功能

**Files:**
- 测试文件：无（微信小程序无官方测试框架）

- [ ] **Step 1: 打开微信开发者工具，检查编译是否通过**

预期：无编译错误

- [ ] **Step 2: 在设置页面确认 UI 显示正确**

检查项：
- 未登录时显示"点击登录微信账号"和"微信登录"按钮
- 登录按钮可以点击，弹出微信授权框
- 授权后显示昵称和头像

- [ ] **Step 3: 检查本地存储是否正确保存**

在微信开发者工具的 Storage 中检查：
- `userProfile` key 是否存在
- 包含 nickname, localAvatarPath, wechatAvatarUrl, updateTime 字段

完成后提交：
```bash
git add -A
git commit -m "test: 验证微信登录功能"
```

---

## 验证清单

- [ ] 设置页面显示"微信登录"按钮
- [ ] 点击按钮弹出微信授权
- [ ] 授权成功后显示昵称和头像
- [ ] 头像下载到本地（wx.env.USER_DATA_PATH + '/avatar'）
- [ ] 本地 Storage 正确保存 userProfile
- [ ] 云端 user_profiles Collection 数据同步
- [ ] 编辑按钮仅在已登录时显示