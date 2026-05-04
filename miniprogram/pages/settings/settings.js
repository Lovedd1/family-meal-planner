// pages/settings/settings.js
const storageAdapter = require('../../utils/storageAdapter.js')

Page({
  data: {
    userInfo: {
      nickname: '我',
      avatar: ''
    },
    partnerInfo: {
      nickname: 'TA',
      connected: false
    },
    syncStatus: 'disconnected',
    lastSyncTime: '',
    dataStats: {
      fridgeItems: 0,
      customFoods: 0,
      weightRecords: 0
    },
    menstrualSettings: {
      lastPeriodDate: '',
      currentPhase: '',
      cycleDays: 28
    },
    isLoggedIn: false,
    version: 'V2.1.0',
    showPrivacyModal: false,
    showResetConfirm: false,
    showBindPartnerModal: false,
    inviteCode: '',
    isGeneratingCode: false,
    isBinding: false
  },

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

  onShow() {
    this.loadSettings()
  },

  loadSettings() {
    // 检查登录状态
    const userProfile = storageAdapter.get('userProfile') || {}
    const isLoggedIn = !!(userProfile.nickname && userProfile.localAvatarPath)

    // 用户信息
    this.setData({
      isLoggedIn,
      userInfo: {
        nickname: userProfile.nickname || '我',
        avatar: userProfile.localAvatarPath || userProfile.nickname?.charAt(0) || '我',
        localAvatarPath: userProfile.localAvatarPath || ''
      }
    })

    // 同步状态
    const partnerId = wx.getStorageSync('partnerId')
    this.setData({
      partnerInfo: {
        nickname: wx.getStorageSync('partnerNickname') || 'TA',
        connected: !!partnerId
      },
      syncStatus: partnerId ? 'connected' : 'disconnected',
      lastSyncTime: wx.getStorageSync('lastSyncTime') || ''
    })

    // 数据统计
    const fridgeItems = storageAdapter.get('fridgeItems')?.length || 0
    const customFoods = storageAdapter.get('customFoods')?.length || 0
    const weightRecords = storageAdapter.get('weightRecords')?.length || 0
    this.setData({
      dataStats: { fridgeItems, customFoods, weightRecords }
    })

    // 生理期设置
    const menstrualSettings = storageAdapter.get('menstrualSettings') || {}
    this.setData({ menstrualSettings })
  },

  handleUserCardTap() {
    // 如果已登录，点击用户卡片无特殊操作
    // 如果未登录，触发登录按钮点击
    if (!this.data.isLoggedIn) {
      // 查找登录按钮并触发点击
      const loginBtn = this.selectComponent('.btn-login')
      // 实际上不需要，因为 button 的 open-type 会自动处理
    }
  },

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

  showEditNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          const userProfile = storageAdapter.get('userProfile') || {}
          userProfile.nickname = res.content
          storageAdapter.set('userProfile', userProfile)
          this.setData({
            'userInfo.nickname': res.content,
            'userInfo.avatar': res.content.charAt(0)
          })
          wx.showToast({ title: '昵称已修改', icon: 'success' })
        }
      }
    })
  },

  syncData() {
    wx.showToast({ title: '正在同步...', icon: 'loading' })

    // 触发全量同步
    storageAdapter.syncAll()

    setTimeout(() => {
      const now = new Date().toLocaleString()
      wx.setStorageSync('lastSyncTime', now)
      this.setData({ lastSyncTime: now, syncStatus: 'connected' })
      wx.showToast({ title: '同步成功', icon: 'success' })
    }, 1500)
  },

  exportData() {
    const data = {
      fridgeItems: wx.getStorageSync('fridgeItems') || [],
      customFoods: wx.getStorageSync('customFoods') || [],
      healthProfile: wx.getStorageSync('healthProfile') || {},
      weightRecords: wx.getStorageSync('weightRecords') || [],
      menstrualSettings: wx.getStorageSync('menstrualSettings') || {},
      todayMenu: wx.getStorageSync('todayMenu') || {}
    }

    const content = JSON.stringify(data, null, 2)
    const fileName = `family-meal-data-${new Date().toISOString().split('T')[0]}.json`

    wx.getFileSystemManager().writeFile({
      filePath: wx.env.USER_DATA_PATH + '/' + fileName,
      data: content,
      encoding: 'utf8',
      success: () => {
        wx.showModal({
          title: '导出成功',
          content: `文件已保存: ${fileName}`,
          showCancel: false
        })
      },
      fail: () => {
        // 降级：显示JSON内容
        wx.setClipboardData({
          data: content,
          success: () => {
            wx.showToast({ title: '数据已复制到剪贴板', icon: 'success' })
          }
        })
      }
    })
  },

  showPrivacy() {
    this.setData({ showPrivacyModal: true })
  },

  closePrivacyModal() {
    this.setData({ showPrivacyModal: false })
  },

  showResetConfirm() {
    wx.showModal({
      title: '确认重置',
      content: '此操作将清除所有本地数据，包括冰箱库存、健康记录等，确定要继续吗？',
      success: (res) => {
        if (res.confirm) {
          this.resetAllData()
        }
      }
    })
  },

  resetAllData() {
    // 清除所有本地存储
    wx.clearStorageSync()
    this.loadSettings()
    wx.showToast({ title: '数据已重置', icon: 'success' })
  },

  getSyncStatusText(status) {
    const texts = {
      'connected': '已连接',
      'syncing': '同步中',
      'disconnected': '未连接'
    }
    return texts[status] || '未知'
  },

  getPhaseText(phase) {
    const phases = {
      'menstruation': '经期',
      'follicular': '卵泡期',
      'ovulation': '排卵期',
      'luteal': '黄体期'
    }
    return phases[phase] || '未设置'
  },

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

  preventBubble() {
    // 阻止冒泡
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
})
