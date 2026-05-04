// pages/settings/settings.js
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
    version: 'V2.1.0',
    showPrivacyModal: false,
    showResetConfirm: false
  },

  onLoad() {
    this.loadSettings()
  },

  onShow() {
    this.loadSettings()
  },

  loadSettings() {
    // 用户信息
    const userProfile = wx.getStorageSync('userProfile') || {}
    this.setData({
      userInfo: {
        nickname: userProfile.nickname || '我',
        avatar: userProfile.nickname?.charAt(0) || '我'
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
    const fridgeItems = wx.getStorageSync('fridgeItems')?.length || 0
    const customFoods = wx.getStorageSync('customFoods')?.length || 0
    const weightRecords = wx.getStorageSync('weightRecords')?.length || 0
    this.setData({
      dataStats: { fridgeItems, customFoods, weightRecords }
    })

    // 生理期设置
    const menstrualSettings = wx.getStorageSync('menstrualSettings') || {}
    this.setData({ menstrualSettings })
  },

  showEditNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          const userProfile = wx.getStorageSync('userProfile') || {}
          userProfile.nickname = res.content
          wx.setStorageSync('userProfile', userProfile)
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

    // 模拟同步
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
  }
})
