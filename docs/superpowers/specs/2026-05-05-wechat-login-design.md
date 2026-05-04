# 微信登录功能设计

## 概述

在设置页面添加微信登录功能，用户点击登录后，通过微信 button 组件获取昵称和头像，下载头像到本地，并同步到云端数据库。

## 功能流程

```
用户点击登录按钮
    ↓
微信 button 组件唤起授权
    ↓
用户确认授权
    ↓
获取 nickname + avatarUrl
    ↓
下载头像到本地文件
    ↓
存储到本地 Storage
    ↓
同步到云端 user_profiles Collection
    ↓
更新页面显示
```

## 数据结构

### 本地 Storage

| Key | 内容 |
|-----|------|
| `userProfile` | `{ nickname, localAvatarPath, wechatAvatarUrl, updateTime }` |

### 云端 Collection: `user_profiles`

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 用户 openid |
| `nickname` | string | 昵称 |
| `localAvatarPath` | string | 本地头像路径 |
| `wechatAvatarUrl` | string | 微信头像URL |
| `updateTime` | number | 更新时间戳 |

## 页面改动

### 设置页面 (settings.wxml)

用户信息卡片区域：
- 未登录时：显示"点击登录"按钮 + 默认头像
- 已登录时：显示头像 + 昵称

```html
<view class="user-card" bindtap="handleLogin">
  <view class="avatar">{{userInfo.avatar}}</view>
  <view class="user-info">
    <text class="nickname">{{userInfo.nickname}}</text>
    <text class="login-hint" wx:if="{{!isLoggedIn}}">点击登录微信账号</text>
  </view>
  <view class="login-btn" wx:if="{{!isLoggedIn}}">登录</view>
</view>
```

登录按钮使用 button 组件，open-type 为 getUserProfile：

```html
<button class="btn-login" open-type="getUserProfile" bindgetuserinfo="onGetUserProfile">
  微信登录
</button>
```

### 设置页面逻辑 (settings.js)

```javascript
// 新增 data 字段
data: {
  userInfo: {
    nickname: '我',
    avatar: '',
    localAvatarPath: ''
  },
  isLoggedIn: false,
  // ... 其他现有字段
}

// 新增方法
onGetUserProfile(e) {
  const { nickname, avatarUrl } = e.detail
  this.saveUserProfile(nickname, avatarUrl)
},

async saveUserProfile(nickname, avatarUrl) {
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
      avatar: localPath || nickname.charAt(0)
    },
    isLoggedIn: true
  })
},

async downloadAvatar(url) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      filePath: wx.env.USER_DATA_PATH + '/avatar',
      success: res => resolve(res.filePath),
      fail: err => {
        console.error('下载头像失败', err)
        resolve('')
      }
    })
  })
},

async syncToCloud(profile) {
  try {
    await db.collection('user_profiles').doc(app.globalData.userId).set({
      data: profile
    })
  } catch (err) {
    console.error('同步到云端失败', err)
  }
}
```

## 错误处理

| 场景 | 处理 |
|------|------|
| 用户拒绝授权 | 显示提示"需要授权才能登录"，不跳转 |
| 下载头像失败 | 继续流程，avatar 显示昵称首字母 |
| 云端同步失败 | 本地已保存，下次同步时重试 |
| 无网络 | 本地优先，云端同步稍后重试 |

## 依赖

- 微信 button 组件 open-type="getUserProfile"
- wx.cloud.database()
- storageAdapter（现有）
- app.globalData.userId（现有）

## 改动文件

1. `miniprogram/pages/settings/settings.wxml` - UI 改动
2. `miniprogram/pages/settings/settings.js` - 登录逻辑
3. `cloudfunctions/login/index.js` - 无改动（已获取 openid）