// 家庭饮食健康管家
// app.js
const foods = require('./utils/foods.js')
const storageAdapter = require('./utils/storageAdapter.js')

App({
  globalData: {
    userId: null,
    partnerId: null,
    todayMenu: {
      breakfast: [],
      lunch: [],
      dinner: []
    },
    loginPromise: null
  },

  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-d1gse71xxaad6c670',
        traceUser: true,
      })
    }

    // 初始化存储适配器
    storageAdapter.initCloudDB()

    // 检查登录状态
    this.checkLogin()

    // 监听网络状态变化，自动同步
    storageAdapter.onNetworkStatusChange()
  },

  onShow() {
    // 每次进入小程序尝试同步
    storageAdapter.syncAll()
    // 启动伴侣轮询
    storageAdapter.startPartnerPolling()
  },

  onHide() {
    // 停止伴侣轮询
    storageAdapter.stopPartnerPolling()
  },

  checkLogin() {
    const userId = wx.getStorageSync('userId')
    if (userId) {
      this.globalData.userId = userId
    } else {
      // 如果没有userId，获取openid作为userId
      this.loginPromise = this.login()
    }
  },

  login() {
    if (!wx.cloud) return Promise.resolve()
    return wx.cloud.callFunction({
      name: 'login',
      data: {},
    }).then(res => {
      if (res.result && res.result.openid) {
        this.setUserId(res.result.openid)
      }
      return res
    }).catch(err => {
      console.error('login failed:', err)
      return Promise.reject(err)
    })
  },

  setUserId(id) {
    this.globalData.userId = id
    wx.setStorageSync('userId', id)
  },

  // 获取伴侣ID
  getPartnerId() {
    return this.globalData.partnerId
  },

  // 设置伴侣ID
  setPartnerId(id) {
    this.globalData.partnerId = id
    wx.setStorageSync('partnerId', id)
  },

  // 更新今日菜单
  updateTodayMenu(menu) {
    this.globalData.todayMenu = menu
    // todayMenu 不同步到云端，但通过storageAdapter保持一致性
    storageAdapter.set('todayMenu', menu)
  },

  // 获取今日菜单
  getTodayMenu() {
    const menu = storageAdapter.get('todayMenu')
    if (menu && Array.isArray(menu.breakfast) && Array.isArray(menu.lunch) && Array.isArray(menu.dinner)) {
      return menu
    }
    return {
      breakfast: [],
      lunch: [],
      dinner: []
    }
  }
})
