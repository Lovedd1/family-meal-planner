// pages/fridge/fridge.js
const app = getApp()
const storageAdapter = require('../../utils/storageAdapter.js')
const { foods } = require('../../utils/foods.js')

Page({
  data: {
    categories: [
      { value: 'all', label: '全部', count: 0 },
      { value: 'meat', label: '肉类', count: 0 },
      { value: 'vegetable', label: '蔬菜类', count: 0 },
      { value: 'seasoning', label: '调料类', count: 0 }
    ],
    filterCategory: 'all',
    items: [],
    groupedItems: [],
    showAddModal: false,
    showRecommendModal: false,
    recommendations: [],
    syncStatus: '已连接',
    partnerNickname: ''
  },

  onLoad() {
    this.loadItems()
  },

  onShow() {
    this.loadPartnerInfo()
    this.loadItems()
  },

  loadPartnerInfo() {
    const partnerNickname = wx.getStorageSync('partnerNickname') || ''
    this.setData({ partnerNickname })
  },

  loadItems() {
    const items = storageAdapter.get('fridgeItems') || []
    this.setData({ items })
    this.updateCategoryCounts()
    this.groupItemsByExpiry(items)
  },

  groupItemsByExpiry(items) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const groups = {
      today: { label: '今日到期', labelEn: 'Today', items: [], class: 'expire-today' },
      tomorrow: { label: '明天到期', labelEn: 'Tomorrow', items: [], class: 'expire-tomorrow' },
      thisWeek: { label: '本周到期', labelEn: 'This Week', items: [], class: 'expire-week' },
      later: { label: '稍后提醒', labelEn: 'Later', items: [], class: 'expire-later' }
    }

    items.forEach(item => {
      const daysLeft = item.daysLeft
      if (daysLeft <= 0) {
        groups.today.items.push(item)
      } else if (daysLeft === 1) {
        groups.tomorrow.items.push(item)
      } else if (daysLeft <= 7) {
        groups.thisWeek.items.push(item)
      } else {
        groups.later.items.push(item)
      }
    })

    // Sort items within each group by daysLeft ascending (most urgent first)
    Object.keys(groups).forEach(key => {
      groups[key].items.sort((a, b) => a.daysLeft - b.daysLeft)
    })

    // Build array for wxml, only include groups with items
    const groupedItems = []
    if (groups.today.items.length > 0) groupedItems.push(groups.today)
    if (groups.tomorrow.items.length > 0) groupedItems.push(groups.tomorrow)
    if (groups.thisWeek.items.length > 0) groupedItems.push(groups.thisWeek)
    if (groups.later.items.length > 0) groupedItems.push(groups.later)

    this.setData({ groupedItems })
  },

  updateCategoryCounts() {
    const items = this.data.items
    const categories = this.data.categories.map(cat => ({
      ...cat,
      count: cat.value === 'all' ? items.length : items.filter(item => item.category === cat.value).length
    }))
    this.setData({ categories })
  },

  switchFilter(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ filterCategory: category })
  },

  showAddModal() {
    this.setData({ showAddModal: true })
  },

  closeAddModal() {
    this.setData({ showAddModal: false })
  },

  preventBubble() {
    // 阻止冒泡
  },

  addItem(e) {
    const form = e.detail.value
    if (!form.name || !form.category) {
      wx.showToast({ title: '请填写完整', icon: 'none' })
      return
    }

    const newItem = {
      id: Date.now().toString(),
      name: form.name,
      category: form.category,
      daysLeft: parseInt(form.daysLeft) || 7,
      amount: form.amount || '1份',
      addDate: new Date().toISOString().split('T')[0]
    }

    const items = [...this.data.items, newItem]
    storageAdapter.set('fridgeItems', items)
    this.setData({ items })
    this.updateCategoryCounts()
    this.groupItemsByExpiry(items)
    this.closeAddModal()
    wx.showToast({ title: '添加成功', icon: 'success' })
  },

  deleteItem(e) {
    const id = e.currentTarget.dataset.id
    const items = this.data.items.filter(item => item.id !== id)
    storageAdapter.set('fridgeItems', items)
    this.setData({ items })
    this.updateCategoryCounts()
    this.groupItemsByExpiry(items)
  },

  showRecommendations() {
    const recommendations = this.generateRecommendations()
    this.setData({
      recommendations,
      showRecommendModal: true
    })
  },

  generateRecommendations() {
    const fridgeItems = this.data.items
    if (fridgeItems.length === 0) return []

    // Build lowercase name set for fast lookup
    const fridgeNameSet = new Set(fridgeItems.map(item => item.name.toLowerCase()))
    // Map lowercase name to original item (for urgency score)
    const fridgeMap = {}
    fridgeItems.forEach(item => {
      fridgeMap[item.name.toLowerCase()] = item
    })

    const scored = []

    foods.forEach(dish => {
      const matchedIngredients = []
      const missingIngredients = []
      let urgencyScore = 0

      dish.ingredients.forEach(ing => {
        const ingNameLower = ing.name.toLowerCase()
        // Check if any fridge item name matches (case-insensitive)
        const foundItem = fridgeItems.find(item =>
          item.name.toLowerCase().includes(ingNameLower) ||
          ingNameLower.includes(item.name.toLowerCase())
        )
        if (foundItem) {
          matchedIngredients.push(ing.name)
          // Lower daysLeft = higher urgency
          // Weight: items expiring today (0) get max urgency, items with more days get lower
          urgencyScore += Math.max(0, 10 - (foundItem.daysLeft || 7))
        } else {
          missingIngredients.push(ing.name)
        }
      })

      // Only recommend if at least 50% ingredients are available
      const matchRatio = matchedIngredients.length / dish.ingredients.length
      if (matchRatio >= 0.5) {
        scored.push({
          id: dish.id,
          name: dish.name,
          emoji: dish.emoji,
          category: dish.category,
          heatMethod: dish.heatMethod,
          matchRatio: Math.round(matchRatio * 100),
          matchedCount: matchedIngredients.length,
          totalCount: dish.ingredients.length,
          matchedIngredients: matchedIngredients.join('、'),
          missingIngredients: missingIngredients.join('、'),
          urgencyScore,
          ingredients: dish.ingredients
        })
      }
    })

    // Sort by: match ratio (desc), then urgency score (desc)
    scored.sort((a, b) => {
      if (b.matchRatio !== a.matchRatio) return b.matchRatio - a.matchRatio
      return b.urgencyScore - a.urgencyScore
    })

    return scored.slice(0, 6)
  },

  closeRecommendModal() {
    this.setData({ showRecommendModal: false })
  },

  addToDinner(e) {
    const food = e.currentTarget.dataset.food
    const menu = app.getTodayMenu()
    menu.dinner.push({
      id: food.id,
      name: food.name,
      emoji: food.emoji,
      category: food.category
    })
    app.updateTodayMenu(menu)
    wx.showToast({ title: '已加入晚餐', icon: 'success' })
    this.closeRecommendModal()
  },

  getDaysLeftClass(daysLeft) {
    if (daysLeft <= 1) return 'danger'
    if (daysLeft <= 3) return 'warning'
    return ''
  }
})
