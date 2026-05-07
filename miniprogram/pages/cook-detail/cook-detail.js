const app = getApp()
const storageAdapter = require('../../utils/storageAdapter.js')

Page({
  data: {
    recordId: '',
    record: null,
    showMoreMenu: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ recordId: options.id })
      this.loadRecord()
    }
  },

  loadRecord() {
    const records = storageAdapter.get('cookingRecords') || []
    const record = records.find(r => r.id === this.data.recordId)
    if (record) {
      const date = new Date(record.createdAt)
      record.displayDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
      record.displayTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      this.setData({ record })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  showMoreMenu() {
    this.setData({ showMoreMenu: true })
  },

  hideMoreMenu() {
    this.setData({ showMoreMenu: false })
  },

  goToEdit() {
    wx.navigateTo({
      url: `/pages/cook-edit/cook-edit?id=${this.data.recordId}`
    })
  },

  deleteRecord() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          const records = storageAdapter.get('cookingRecords') || []
          const filtered = records.filter(r => r.id !== this.data.recordId)
          storageAdapter.set('cookingRecords', filtered)
          wx.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
        this.hideMoreMenu()
      }
    })
  },

  getMealLabel(meal) {
    const labels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }
    return labels[meal] || meal
  }
})