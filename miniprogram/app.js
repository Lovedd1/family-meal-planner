// 家庭饮食健康管家
// app.js
const foods = require('./utils/foods.js')

App({
  globalData: {
    userId: null,
    partnerId: null,
    todayMenu: {
      breakfast: [],
      lunch: [],
      dinner: []
    }
  },

  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'your-env-id', // 替换为你的云开发环境ID
        traceUser: true,
      })
    }

    // 检查登录状态
    this.checkLogin()
  },

  checkLogin() {
    const userId = wx.getStorageSync('userId')
    if (userId) {
      this.globalData.userId = userId
    }
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
    wx.setStorageSync('todayMenu', menu)
  },

  // 获取今日菜单
  getTodayMenu() {
    const menu = wx.getStorageSync('todayMenu')
    if (menu) {
      return menu
    }
    return {
      breakfast: [],
      lunch: [],
      dinner: []
    }
  }
})
