const app = getApp()
const storageAdapter = require('../../utils/storageAdapter.js')

// 格式化月份显示
function formatMonth(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

// 生成唯一ID
function generateId() {
  return 'cr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

Page({
  data: {
    records: [],
    groupedRecords: [],
    showDeleteMenu: false,
    selectedRecord: null
  },

  onLoad() {
    // do nothing, wait for onShow
  },

  onShow() {
    this.loadRecords()
  },

  loadRecords() {
    const records = storageAdapter.get('cookingRecords') || []

    // 按日期降序排序
    records.sort((a, b) => b.createdAt - a.createdAt)

    // 添加显示用字段
    records.forEach(r => {
      const date = new Date(r.createdAt)
      r.day = `${date.getMonth() + 1}月${date.getDate()}日`
      r.displayTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    })

    this.setData({ records })
    this.groupRecordsByMonth()
  },

  groupRecordsByMonth() {
    const { records } = this.data

    // 按月份分组
    const groups = {}
    records.forEach(r => {
      const date = new Date(r.createdAt)
      const monthKey = formatMonth(date)
      if (!groups[monthKey]) {
        groups[monthKey] = []
      }
      groups[monthKey].push(r)
    })

    // 转换为数组并排序（最新月在前）
    const grouped = Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(month => ({
        month,
        records: groups[month]
      }))

    this.setData({ groupedRecords: grouped })
  },

  goToDetail(e) {
    const record = e.currentTarget.dataset.record
    wx.navigateTo({
      url: `/pages/cook-detail/cook-detail?id=${record.id}`
    })
  },

  goToAdd() {
    wx.navigateTo({
      url: '/pages/cook-edit/cook-edit'
    })
  },

  goBack() {
    wx.navigateBack()
  },

  showDeleteMenu(e) {
    const record = e.currentTarget.dataset.record
    this.setData({
      showDeleteMenu: true,
      selectedRecord: record
    })
  },

  hideDeleteMenu() {
    this.setData({
      showDeleteMenu: false,
      selectedRecord: null
    })
  },

  deleteRecord() {
    const { selectedRecord } = this.data
    if (!selectedRecord) return

    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          const records = storageAdapter.get('cookingRecords') || []
          const filtered = records.filter(r => r.id !== selectedRecord.id)
          storageAdapter.set('cookingRecords', filtered)
          wx.showToast({ title: '已删除', icon: 'success' })
          this.hideDeleteMenu()
          this.loadRecords()
        } else {
          this.hideDeleteMenu()
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