// pages/cook/cook.js
const app = getApp()
const storageAdapter = require('../../utils/storageAdapter.js')

// 获取所有菜品（今日菜单 + 自定义菜品）
function getAllDishes() {
  const todayMenu = storageAdapter.get('todayMenu') || { breakfast: [], lunch: [], dinner: [] }
  const customFoods = storageAdapter.get('customFoods') || []

  const dishes = []
  const addDishes = (list) => {
    list.forEach(dish => {
      if (!dishes.find(d => d.id === dish.id)) {
        dishes.push(dish)
      }
    })
  }

  addDishes(todayMenu.breakfast || [])
  addDishes(todayMenu.lunch || [])
  addDishes(todayMenu.dinner || [])
  addDishes(customFoods)

  return dishes
}

// 根据时间自动识别餐次
function getAutoMeal() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 10) return 'breakfast'
  if (hour >= 10 && hour < 14) return 'lunch'
  if (hour >= 17 && hour < 21) return 'dinner'
  return 'breakfast'
}

// 生成唯一ID
function generateId() {
  return 'cr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 格式化月份显示
function formatMonth(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

// 获取记录分组标签
function getRecordLabel(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const recordDate = new Date(dateStr)
  recordDate.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今日'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return '本周'
  return '更早'
}

Page({
  data: {
    currentTab: 'record',
    displayMonth: '',
    currentMonth: null,
    records: [],
    groupedRecords: [],
    stats: {
      monthCount: 0,
      topDishes: [],
      avgRating: 0
    },

    // 拍照弹窗
    showCameraModal: false,
    tempRecord: {
      imagePath: '',
      menuItemId: '',
      menuItemName: '',
      emoji: '',
      meal: 'breakfast',
      rating: 0,
      notes: ''
    },

    // 菜品选择器
    showDishPicker: false,
    dishSearchKey: '',
    filteredDishes: [],

    // 详情弹窗
    showDetailModal: false,
    currentRecord: null
  },

  onLoad() {
    this.initMonth()
    this.loadRecords()
  },

  onShow() {
    this.loadRecords()
  },

  initMonth() {
    const now = new Date()
    this.setData({
      currentMonth: now,
      displayMonth: formatMonth(now)
    })
  },

  loadRecords() {
    const records = storageAdapter.get('cookingRecords') || []
    // 按日期降序排序
    records.sort((a, b) => b.createdAt - a.createdAt)

    // 添加显示用字段
    records.forEach(r => {
      const date = new Date(r.createdAt)
      r.displayTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    })

    this.setData({ records })
    this.groupRecordsByDate()
    this.calculateStats()
  },

  groupRecordsByDate() {
    const { records, currentMonth } = this.data

    // 过滤当月记录
    const monthRecords = records.filter(r => {
      const recordDate = new Date(r.date)
      return recordDate.getFullYear() === currentMonth.getFullYear() &&
             recordDate.getMonth() === currentMonth.getMonth()
    })

    // 按日期分组
    const groups = {}
    monthRecords.forEach(r => {
      if (!groups[r.date]) {
        groups[r.date] = []
      }
      groups[r.date].push(r)
    })

    // 转换为数组并排序
    const grouped = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a)).map(date => ({
      label: getRecordLabel(date),
      date,
      records: groups[date]
    }))

    this.setData({ groupedRecords: grouped })
  },

  calculateStats() {
    const { records, currentMonth } = this.data

    // 本月记录
    const monthRecords = records.filter(r => {
      const recordDate = new Date(r.date)
      return recordDate.getFullYear() === currentMonth.getFullYear() &&
             recordDate.getMonth() === currentMonth.getMonth()
    })

    // 本月做菜数
    const monthCount = monthRecords.length

    // 最爱菜品 TOP3
    const dishCount = {}
    monthRecords.forEach(r => {
      const key = r.menuItemName
      if (!dishCount[key]) {
        dishCount[key] = { name: r.menuItemName, emoji: r.emoji, count: 0 }
      }
      dishCount[key].count++
    })
    const topDishes = Object.values(dishCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    // 平均评分
    let avgRating = 0
    if (monthRecords.length > 0) {
      const sum = monthRecords.reduce((acc, r) => acc + (r.rating || 0), 0)
      avgRating = Math.round((sum / monthRecords.length) * 10) / 10
    }

    this.setData({
      stats: { monthCount, topDishes, avgRating }
    })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
  },

  prevMonth() {
    const newMonth = new Date(this.data.currentMonth)
    newMonth.setMonth(newMonth.getMonth() - 1)
    this.setData({
      currentMonth: newMonth,
      displayMonth: formatMonth(newMonth)
    })
    this.groupRecordsByDate()
    this.calculateStats()
  },

  nextMonth() {
    const newMonth = new Date(this.data.currentMonth)
    newMonth.setMonth(newMonth.getMonth() + 1)
    this.setData({
      currentMonth: newMonth,
      displayMonth: formatMonth(newMonth)
    })
    this.groupRecordsByDate()
    this.calculateStats()
  },

  showCameraModal() {
    this.setData({
      showCameraModal: true,
      tempRecord: {
        imagePath: '',
        menuItemId: '',
        menuItemName: '',
        emoji: '',
        meal: getAutoMeal(),
        rating: 0,
        notes: ''
      }
    })
  },

  closeCameraModal() {
    this.setData({ showCameraModal: false })
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const tempPath = res.tempFilePaths[0]
        // 保存到本地用户数据目录
        const userDataPath = wx.env.USER_DATA_PATH
        const fileName = `cook_${Date.now()}.jpg`
        const savePath = `${userDataPath}/${fileName}`

        wx.saveFile({
          tempFilePath: tempPath,
          savedFilePath: savePath,
          success: (saveRes) => {
            this.setData({
              'tempRecord.imagePath': saveRes.savedFilePath
            })
          }
        })
      }
    })
  },

  showDishPicker() {
    const dishes = getAllDishes()
    this.setData({
      showDishPicker: true,
      dishSearchKey: '',
      filteredDishes: dishes
    })
  },

  closeDishPicker() {
    this.setData({ showDishPicker: false })
  },

  searchDish(e) {
    const key = e.detail.value.toLowerCase()
    const dishes = getAllDishes()
    if (!key) {
      this.setData({ filteredDishes: dishes })
      return
    }
    const filtered = dishes.filter(d =>
      d.name.toLowerCase().includes(key) ||
      (d.emoji && d.emoji.includes(key))
    )
    this.setData({ filteredDishes: filtered })
  },

  selectDish(e) {
    const dish = e.currentTarget.dataset.dish
    this.setData({
      'tempRecord.menuItemId': dish.id,
      'tempRecord.menuItemName': dish.name,
      'tempRecord.emoji': dish.emoji || '',
      showDishPicker: false
    })
  },

  setMeal(e) {
    this.setData({
      'tempRecord.meal': e.currentTarget.dataset.meal
    })
  },

  setRating(e) {
    this.setData({
      'tempRecord.rating': e.currentTarget.dataset.rating
    })
  },

  inputNotes(e) {
    this.setData({
      'tempRecord.notes': e.detail.value
    })
  },

  saveRecord() {
    const { tempRecord } = this.data

    // 验证
    if (!tempRecord.imagePath) {
      wx.showToast({ title: '请先拍照', icon: 'none' })
      return
    }
    if (!tempRecord.menuItemId) {
      wx.showToast({ title: '请选择关联菜品', icon: 'none' })
      return
    }
    if (tempRecord.rating === 0) {
      wx.showToast({ title: '请评分', icon: 'none' })
      return
    }

    // 创建记录
    const now = new Date()
    const record = {
      id: generateId(),
      date: `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`,
      meal: tempRecord.meal,
      imagePath: tempRecord.imagePath,
      menuItemId: tempRecord.menuItemId,
      menuItemName: tempRecord.menuItemName,
      emoji: tempRecord.emoji,
      rating: tempRecord.rating,
      notes: tempRecord.notes,
      createdAt: Date.now()
    }

    // 保存到存储
    const records = storageAdapter.get('cookingRecords') || []
    records.unshift(record)
    storageAdapter.set('cookingRecords', records)

    // 关闭弹窗并刷新
    this.setData({ showCameraModal: false })
    this.loadRecords()

    wx.showToast({ title: '保存成功', icon: 'success' })
  },

  showRecordDetail(e) {
    const record = e.currentTarget.dataset.record
    this.setData({
      showDetailModal: true,
      currentRecord: record
    })
  },

  closeDetailModal() {
    this.setData({ showDetailModal: false })
  },

  deleteRecord() {
    const { currentRecord } = this.data
    if (!currentRecord) return

    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          const records = storageAdapter.get('cookingRecords') || []
          const filtered = records.filter(r => r.id !== currentRecord.id)
          storageAdapter.set('cookingRecords', filtered)

          this.setData({ showDetailModal: false })
          this.loadRecords()

          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  getMealLabel(meal) {
    const labels = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐'
    }
    return labels[meal] || meal
  }
})