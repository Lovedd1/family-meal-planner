// pages/today/today.js
const foods = require('../../utils/foods.js')

Page({
  data: {
    currentDate: '',
    currentTab: 'breakfast',
    tabs: [
      { key: 'breakfast', label: '🌅 早餐', count: 0 },
      { key: 'lunch', label: '☀️ 午餐', count: 0 },
      { key: 'dinner', label: '🌙 晚餐', count: 0 }
    ],
    menu: {
      breakfast: [],
      lunch: [],
      dinner: []
    },
    conflicts: [],
    showConfirmModal: false,
    showRecipeModal: false,
    currentRecipe: null,
    deductionList: []
  },

  onLoad() {
    this.setDate()
    this.loadMenu()
  },

  onShow() {
    this.loadMenu()
  },

  setDate() {
    const now = new Date()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`
    this.setData({ currentDate: dateStr })
  },

  loadMenu() {
    const menu = wx.getStorageSync('todayMenu') || {
      breakfast: [],
      lunch: [],
      dinner: []
    }
    this.setData({ menu })
    this.updateTabCounts()
    this.checkConflicts()
  },

  updateTabCounts() {
    const tabs = this.data.tabs.map(tab => ({
      ...tab,
      count: this.data.menu[tab.key].length
    }))
    this.setData({ tabs })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
  },

  checkConflicts() {
    const allDishes = [
      ...this.data.menu.breakfast,
      ...this.data.menu.lunch,
      ...this.data.menu.dinner
    ]
    const allIngredients = allDishes.flatMap(dish => dish.ingredients)
    const conflicts = foods.checkFoodConflict(allIngredients)
    this.setData({ conflicts })
  },

  showRecipe(e) {
    const dish = e.currentTarget.dataset.dish
    this.setData({
      currentRecipe: dish,
      showRecipeModal: true
    })
  },

  closeRecipeModal() {
    this.setData({ showRecipeModal: false })
  },

  removeDish(e) {
    const { tab, index } = e.currentTarget.dataset
    const menu = { ...this.data.menu }
    menu[tab].splice(index, 1)
    this.setData({ menu })
    wx.setStorageSync('todayMenu', menu)
    this.updateTabCounts()
    this.checkConflicts()
  },

  showConfirm() {
    const allDishes = [
      ...this.data.menu.breakfast,
      ...this.data.menu.lunch,
      ...this.data.menu.dinner
    ]
    if (allDishes.length === 0) return

    // 计算食材扣减列表
    const ingredientMap = new Map()
    allDishes.forEach(dish => {
      dish.ingredients.forEach(ing => {
        if (ingredientMap.has(ing.name)) {
          // TODO: 需要解析数量并累加
        } else {
          ingredientMap.set(ing.name, ing.amount)
        }
      })
    })

    this.setData({ showConfirmModal: true })
  },

  closeConfirmModal() {
    this.setData({ showConfirmModal: false })
  },

  confirmMenu() {
    // 扣减冰箱库存
    // 清空菜单
    const emptyMenu = {
      breakfast: [],
      lunch: [],
      dinner: []
    }
    this.setData({ menu: emptyMenu })
    wx.setStorageSync('todayMenu', emptyMenu)
    this.updateTabCounts()
    this.closeConfirmModal()
    wx.showToast({ title: '已确认菜单', icon: 'success' })
  }
})
