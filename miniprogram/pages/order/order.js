// pages/order/order.js
const foods = require('../../utils/foods.js')
const app = getApp()
const storageAdapter = require('../../utils/storageAdapter.js')

Page({
  data: {
    searchKeyword: '',
    currentCategory: 'all',
    categories: foods.categories,
    foodList: [],
    filteredList: [],
    currentTab: 'dinner',
    showRecipeModal: false,
    currentRecipe: null,
    showAddCustomModal: false,
    customForm: {
      name: '',
      emoji: '🍲',
      category: '荤菜',
      ingredients: '',
      steps: '',
      heatMethod: 'microwave_safe'
    },
    conflictWarnings: []
  },

  onLoad() {
    this.loadFoods()
  },

  onShow() {
    this.loadFoods()
  },

  loadFoods() {
    // 合并内置菜品和自定义菜品
    const customFoods = storageAdapter.get('customFoods') || []
    const allFoods = [...foods.foods, ...customFoods]
    // 添加食材摘要
    allFoods.forEach(food => {
      const names = food.ingredients.slice(0, 3).map(i => i.name)
      food.ingredientsSummary = names.join('、') + (food.ingredients.length > 3 ? '...' : '')
    })
    this.setData({
      foodList: allFoods,
      filteredList: allFoods
    })
  },

  onSearch(e) {
    const keyword = e.detail.value
    this.setData({ searchKeyword: keyword })
    this.filterFoods()
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ currentCategory: category })
    this.filterFoods()
  },

  switchTab(e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab })
  },

  filterFoods() {
    let list = this.data.foodList

    // 分类筛选
    if (this.data.currentCategory !== 'all') {
      list = foods.filterByCategory(list, this.data.currentCategory)
    }

    // 关键词搜索
    if (this.data.searchKeyword) {
      list = foods.searchFoods(list, this.data.searchKeyword)
    }

    // 检测相克
    const warnings = []
    list = list.map(food => {
      const hasConflict = this.checkDishConflict(food.ingredients)
      return { ...food, hasConflict }
    })

    this.setData({ filteredList: list })
  },

  checkDishConflict(ingredients) {
    const menu = app.getTodayMenu()
    const allDishes = [
      ...menu.breakfast,
      ...menu.lunch,
      ...menu.dinner
    ]
    const existingIngredients = allDishes.flatMap(d => d.ingredients).map(i => i.name)
    const newIngredients = ingredients.map(i => i.name)

    for (const conflict of foods.foodConflicts) {
      const matchedExisting = conflict.ingredients.filter(i => existingIngredients.includes(i))
      const matchedNew = conflict.ingredients.filter(i => newIngredients.includes(i))
      if (matchedExisting.length > 0 && matchedNew.length > 0) {
        return true
      }
    }
    return false
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

  addToMenu(e) {
    const dish = e.currentTarget.dataset.dish
    const tab = this.data.currentTab
    const menu = app.getTodayMenu()
    menu[tab].push(dish)
    app.updateTodayMenu(menu)
    wx.showToast({ title: '已加入' + this.getTabName(tab), icon: 'success' })
    this.loadFoods() // 刷新相克状态
  },

  removeFromMenu(e) {
    const dish = e.currentTarget.dataset.dish
    const tab = e.currentTarget.dataset.tab
    const menu = app.getTodayMenu()
    const index = menu[tab].findIndex(d => d.id === dish.id)
    if (index > -1) {
      menu[tab].splice(index, 1)
      app.updateTodayMenu(menu)
    }
    this.loadFoods()
  },

  getTabName(tab) {
    const names = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }
    return names[tab] || '菜单'
  },

  isAdded(dish) {
    const menu = app.getTodayMenu()
    return (
      menu.breakfast.some(d => d.id === dish.id) ||
      menu.lunch.some(d => d.id === dish.id) ||
      menu.dinner.some(d => d.id === dish.id)
    )
  },

  showAddCustomModal() {
    this.setData({ showAddCustomModal: true })
  },

  closeAddCustomModal() {
    this.setData({ showAddCustomModal: false })
  },

  updateCustomForm(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      customForm: { ...this.data.customForm, [field]: value }
    })
  },

  selectEmoji(e) {
    const emoji = e.currentTarget.dataset.emoji
    this.setData({
      customForm: { ...this.data.customForm, emoji }
    })
  },

  saveCustomFood(e) {
    const form = e.detail.value
    if (!form.name) {
      wx.showToast({ title: '请输入菜品名称', icon: 'none' })
      return
    }

    const customFood = {
      id: 'custom_' + Date.now(),
      name: form.name,
      emoji: this.data.customForm.emoji,
      category: form.category,
      heatMethod: form.heatMethod,
      ingredients: form.ingredients.split('\n').filter(l => l.trim()).map(l => {
        const parts = l.trim().split(/\s+/)
        return {
          name: parts[0],
          amount: parts.slice(1).join(' ') || '适量'
        }
      }),
      steps: form.steps.split('\n').filter(l => l.trim()),
      isCustom: true
    }

    const customFoods = storageAdapter.get('customFoods') || []
    customFoods.push(customFood)
    storageAdapter.set('customFoods', customFoods)

    this.loadFoods()
    this.closeAddCustomModal()
    wx.showToast({ title: '自定义菜品已保存', icon: 'success' })
  }
})
