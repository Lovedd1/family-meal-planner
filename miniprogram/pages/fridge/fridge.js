// pages/fridge/fridge.js
const app = getApp()
const storageAdapter = require('../../utils/storageAdapter.js')

Page({
  data: {
    categories: [
      { value: 'meat', label: '肉类', count: 0 },
      { value: 'vegetable', label: '蔬菜类', count: 0 },
      { value: 'seasoning', label: '调料类', count: 0 }
    ],
    filterCategory: 'all',
    items: [],
    showAddModal: false,
    showRecommendModal: false,
    recommendations: [],
    syncStatus: '已连接'
  },

  onLoad() {
    this.loadItems()
  },

  onShow() {
    this.loadItems()
  },

  loadItems() {
    const items = storageAdapter.get('fridgeItems') || []
    this.setData({ items })
    this.updateCategoryCounts()
  },

  updateCategoryCounts() {
    const items = this.data.items
    const categories = this.data.categories.map(cat => ({
      ...cat,
      count: items.filter(item => item.category === cat.value).length
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
    this.closeAddModal()
    wx.showToast({ title: '添加成功', icon: 'success' })
  },

  deleteItem(e) {
    const index = e.currentTarget.dataset.index
    const items = [...this.data.items]
    items.splice(index, 1)
    storageAdapter.set('fridgeItems', items)
    this.setData({ items })
    this.updateCategoryCounts()
  },

  showRecommendations() {
    // 智能搭配推荐
    const recommendations = []
    const items = this.data.items

    // TODO: 根据冰箱库存匹配菜品
    this.setData({
      recommendations,
      showRecommendModal: true
    })
  },

  closeRecommendModal() {
    this.setData({ showRecommendModal: false })
  },

  addToDinner(food) {
    const menu = app.getTodayMenu()
    menu.dinner.push(food)
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
