// pages/settings/settings.js
const storageAdapter = require('../../utils/storageAdapter.js')

const LAST_SYNC_KEY = 'lastSyncTime'

Page({
  data: {
    myNickname: '',
    myPin: '',
    partnerConnected: false,
    partnerNickname: '',
    version: 'V2.2.0',

    // 同步状态
    syncStatus: 'disconnected', // disconnected | connected | syncing
    lastSyncTime: null,
    syncing: false,

    // 弹窗
    showMyInfoModal: false,
    showPairModal: false,
    showPrivacyModal: false,
    showResetConfirm: false,
    savingInfo: false,
    pairing: false,

    // 临时表单数据
    tempMyNickname: '',
    tempMyPin: '',
    tempPartnerNickname: '',
    tempPartnerPin: '',

    // 数据统计
    dataStats: {
      fridgeItems: 0,
      customFoods: 0,
      weightRecords: 0
    },

    // 生理期
    menstrualSettings: {
      lastPeriodDate: '',
      currentPhase: '',
      cycleDays: 28
    }
  },

  onLoad() {
    this.loadSettings()
  },

  onShow() {
    this.loadSettings()
  },

  loadSettings() {
    const myNickname = wx.getStorageSync('myNickname') || ''
    const myPin = wx.getStorageSync('myPin') || ''
    const partnerNickname = wx.getStorageSync('partnerNickname') || ''
    const partnerConnected = !!(myNickname && partnerNickname)
    const lastSyncTime = wx.getStorageSync(LAST_SYNC_KEY) || null

    // 数据统计
    const fridgeItems = (wx.getStorageSync('fridgeItems') || []).length
    const customFoods = (wx.getStorageSync('customFoods') || []).length
    const weightRecords = (wx.getStorageSync('weightRecords') || []).length

    // 生理期
    const menstrualSettings = wx.getStorageSync('menstrualSettings') || {}

    this.setData({
      myNickname,
      myPin,
      partnerNickname,
      partnerConnected,
      dataStats: { fridgeItems, customFoods, weightRecords },
      menstrualSettings,
      syncStatus: partnerConnected ? 'connected' : 'disconnected',
      lastSyncTime
    })

    // 如果有昵称和PIN，检查云端配对状态
    if (myNickname && myPin) {
      this.checkPairStatus()
    }
  },

  // ========== 手动同步 ==========
  async manualSync() {
    if (this.data.syncing) return
    if (!this.data.partnerConnected) {
      wx.showToast({ title: '请先配对伴侣', icon: 'none' })
      return
    }

    this.setData({ syncing: true, syncStatus: 'syncing' })

    try {
      const result = await storageAdapter.manualSync()
      if (result.success) {
        this.setData({
          lastSyncTime: result.syncTime,
          syncStatus: 'connected',
          syncing: false
        })
        wx.showToast({ title: '同步成功', icon: 'success' })
      } else {
        this.setData({ syncStatus: 'connected', syncing: false })
        wx.showToast({ title: result.error || '同步失败', icon: 'none' })
      }
    } catch (err) {
      this.setData({ syncStatus: 'connected', syncing: false })
      wx.showToast({ title: '同步失败', icon: 'none' })
    }
  },

  // 获取同步时间文本
  getSyncTimeText(timestamp) {
    if (!timestamp) return '从未同步'
    const diff = Date.now() - timestamp
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    return new Date(timestamp).toLocaleDateString()
  },

  // 检查云端配对状态
  async checkPairStatus() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'pairPartner',
        data: {
          action: 'checkStatus',
          nickname: this.data.myNickname,
          pin: this.data.myPin
        }
      })
      if (res.result && res.result.success) {
        const { registered, paired, partnerNickname } = res.result
        if (registered) {
          wx.setStorageSync('partnerNickname', partnerNickname || '')
          this.setData({
            partnerConnected: paired,
            partnerNickname: partnerNickname || ''
          })
        }
      }
    } catch (err) {
      console.error('检查配对状态失败', err)
    }
  },

  // ========== 我的信息弹窗 ==========
  openMyInfoModal() {
    this.setData({
      showMyInfoModal: true,
      tempMyNickname: this.data.myNickname || '',
      tempMyPin: this.data.myPin || ''
    })
  },

  closeMyInfoModal() {
    this.setData({ showMyInfoModal: false })
  },

  onNicknameInput(e) {
    this.setData({ tempMyNickname: e.detail.value })
  },

  onPinInput(e) {
    this.setData({ tempMyPin: e.detail.value })
  },

  async saveMyInfo() {
    const { tempMyNickname, tempMyPin } = this.data
    if (!tempMyNickname || tempMyNickname.trim().length === 0) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (!tempMyPin || tempMyPin.length !== 4) {
      wx.showToast({ title: '请输入4位PIN码', icon: 'none' })
      return
    }

    this.setData({ savingInfo: true })

    // 本地存储
    const nickname = tempMyNickname.trim()
    const pin = tempMyPin
    wx.setStorageSync('myNickname', nickname)
    wx.setStorageSync('myPin', pin)

    // 云端注册
    try {
      await wx.cloud.callFunction({
        name: 'pairPartner',
        data: { action: 'register', nickname, pin }
      })
    } catch (err) {
      console.error('注册云端失败', err)
    }

    this.setData({
      savingInfo: false,
      myNickname: nickname,
      myPin: pin,
      showMyInfoModal: false
    })
    wx.showToast({ title: '已保存', icon: 'success' })
  },

  // ========== 配对弹窗 ==========
  openPairModal() {
    if (!this.data.myNickname || !this.data.myPin) {
      wx.showToast({ title: '请先设置我的信息', icon: 'none' })
      this.openMyInfoModal()
      return
    }
    this.setData({
      showPairModal: true,
      tempPartnerNickname: '',
      tempPartnerPin: ''
    })
  },

  closePairModal() {
    this.setData({ showPairModal: false, pairing: false })
  },

  onPartnerNicknameInput(e) {
    this.setData({ tempPartnerNickname: e.detail.value })
  },

  onPartnerPinInput(e) {
    this.setData({ tempPartnerPin: e.detail.value })
  },

  async doPair() {
    const { myNickname, myPin, tempPartnerNickname, tempPartnerPin } = this.data

    if (!tempPartnerNickname || tempPartnerNickname.trim().length === 0) {
      wx.showToast({ title: '请输入伴侣昵称', icon: 'none' })
      return
    }
    if (!tempPartnerPin || tempPartnerPin.length !== 4) {
      wx.showToast({ title: '请输入4位PIN码', icon: 'none' })
      return
    }

    this.setData({ pairing: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'pairPartner',
        data: {
          action: 'pair',
          myNickname,
          myPin,
          partnerNickname: tempPartnerNickname.trim(),
          partnerPin: tempPartnerPin
        }
      })

      if (res.result && res.result.success) {
        wx.setStorageSync('partnerNickname', tempPartnerNickname.trim())
        this.setData({
          partnerConnected: true,
          partnerNickname: tempPartnerNickname.trim(),
          pairing: false,
          showPairModal: false
        })
        wx.showToast({ title: '配对成功', icon: 'success' })
      } else {
        wx.showToast({ title: res.result?.error || '配对失败', icon: 'none' })
        this.setData({ pairing: false })
      }
    } catch (err) {
      wx.showToast({ title: '配对失败，请稍后重试', icon: 'none' })
      this.setData({ pairing: false })
    }
  },

  // ========== 解除配对 ==========
  async unpairPartner() {
    const { myNickname, myPin } = this.data
    if (!myNickname || !myPin) return

    const confirm = await wx.showModal({
      title: '确认解除',
      content: '确定要解除与' + this.data.partnerNickname + '的绑定吗？',
      confirmText: '解除'
    })

    if (!confirm.confirm) return

    try {
      await wx.cloud.callFunction({
        name: 'pairPartner',
        data: { action: 'unpair', nickname: myNickname, pin: myPin }
      })
      wx.removeStorageSync('partnerNickname')
      this.setData({
        partnerConnected: false,
        partnerNickname: ''
      })
      wx.showToast({ title: '已解除绑定', icon: 'success' })
    } catch (err) {
      wx.showToast({ title: '解除失败', icon: 'none' })
    }
  },

  // ========== 跳转做饭记录 ==========
  goToCookingRecord() {
    wx.navigateTo({
      url: '/pages/cook/cook'
    })
  },

  // ========== 导出数据 ==========
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
        wx.setClipboardData({
          data: content,
          success: () => {
            wx.showToast({ title: '数据已复制到剪贴板', icon: 'success' })
          }
        })
      }
    })
  },

  // ========== 重置数据 ==========
  showResetConfirm() {
    wx.showModal({
      title: '确认重置',
      content: '此操作将清除所有本地数据，确定要继续吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          this.loadSettings()
          wx.showToast({ title: '数据已重置', icon: 'success' })
        }
      }
    })
  },

  // ========== 隐私声明 ==========
  showPrivacy() {
    this.setData({ showPrivacyModal: true })
  },

  closePrivacyModal() {
    this.setData({ showPrivacyModal: false })
  },

  // ========== 工具函数 ==========
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
