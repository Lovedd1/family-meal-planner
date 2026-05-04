// pages/health/health.js
const app = getApp()

Page({
  data: {
    // 我的健康档案
    dietGoal: 'maintain', // lose/lose_weight, maintain, gain
    currentWeight: '',
    targetWeight: '',
    height: '',
    activityLevel: 'moderate', // sedentary, moderate, active
    allergies: '',
    showEditProfile: false,

    // 伴侣健康档案
    partnerProfile: null,

    // 体重记录
    weightRecords: [],
    chartData: [],
    allergyList: [],
    weightStats: {
      current: 0,
      target: 0,
      progress: 0,
      diff: 0
    },

    // 生理期追踪
    menstrualSettings: {
      lastPeriodDate: '',
      cycleDays: 28,
      periodDays: 5
    },
    currentPhase: 'follicular', // menstruation, follicular, ovulation, luteal
    phaseDay: 0,

    // 饮食计划
    dietPlan: null,
    showDietPlan: false,
    currentPlanPhase: 0,

    // 平台期提醒
    showPlateauAlert: false
  },

  onLoad() {
    this.loadHealthData()
  },

  onShow() {
    this.loadHealthData()
  },

  loadHealthData() {
    // 加载健康档案
    const profile = wx.getStorageSync('healthProfile') || {}
    const allergies = profile.allergies || ''
    const allergyList = allergies ? allergies.split(',').map(s => s.trim()).filter(s => s) : []
    this.setData({
      dietGoal: profile.dietGoal || 'maintain',
      currentWeight: profile.currentWeight || '',
      targetWeight: profile.targetWeight || '',
      height: profile.height || '',
      activityLevel: profile.activityLevel || 'moderate',
      allergies: allergies,
      allergyList: allergyList
    })

    // 加载体重记录
    const records = wx.getStorageSync('weightRecords') || []
    this.setData({ weightRecords: records })
    this.updateWeightStats()

    // 加载生理期设置
    const menstrual = wx.getStorageSync('menstrualSettings') || {}
    this.setData({
      menstrualSettings: {
        lastPeriodDate: menstrual.lastPeriodDate || '',
        cycleDays: menstrual.cycleDays || 28,
        periodDays: menstrual.periodDays || 5
      }
    })
    this.calculateMenstrualPhase()
  },

  updateWeightStats() {
    const records = this.data.weightRecords
    if (records.length === 0) return

    const current = records[records.length - 1]?.weight || 0
    const target = parseFloat(this.data.targetWeight) || 0
    const initial = records[0]?.weight || current

    // 计算图表数据
    const displayRecords = records.slice(-14)
    const maxWeight = Math.max(...displayRecords.map(r => r.weight))
    const minWeight = Math.min(...displayRecords.map(r => r.weight))
    const range = maxWeight - minWeight || 1
    const chartData = displayRecords.map(record => ({
      weight: record.weight,
      height: Math.round(((record.weight - minWeight + 10) / range) * 50) + 20
    }))

    this.setData({
      weightStats: {
        current,
        target,
        progress: target > 0 ? Math.round(((initial - current) / (initial - target)) * 100) : 0,
        diff: current - target
      },
      chartData: chartData
    })

    // 检测平台期
    this.checkPlateau(records)
  },

  checkPlateau(records) {
    if (records.length < 3) return

    const last3 = records.slice(-3)
    const max = Math.max(...last3.map(r => r.weight))
    const min = Math.min(...last3.map(r => r.weight))

    if (max - min < 0.3 && this.data.targetWeight && Math.abs(parseFloat(this.data.currentWeight) - parseFloat(this.data.targetWeight)) > 0.5) {
      this.setData({ showPlateauAlert: true })
    }
  },

  setDietGoal(e) {
    const goal = e.currentTarget.dataset.goal
    this.setData({ dietGoal: goal })
  },

  showEditProfile() {
    this.setData({ showEditProfile: true })
  },

  closeEditProfile() {
    this.setData({ showEditProfile: false })
  },

  saveProfile(e) {
    const form = e.detail.value
    const profile = {
      dietGoal: this.data.dietGoal,
      currentWeight: form.currentWeight,
      targetWeight: form.targetWeight,
      height: form.height,
      activityLevel: this.data.activityLevel,
      allergies: form.allergies
    }
    wx.setStorageSync('healthProfile', profile)
    this.setData({ ...profile })
    this.updateWeightStats()
    this.closeEditProfile()
    wx.showToast({ title: '保存成功', icon: 'success' })
  },

  setActivityLevel(e) {
    this.setData({ activityLevel: e.currentTarget.dataset.level })
  },

  recordWeight() {
    wx.showModal({
      title: '记录体重',
      editable: true,
      placeholderText: '请输入当前体重(kg)',
      success: (res) => {
        if (res.confirm && res.content) {
          const weight = parseFloat(res.content)
          if (isNaN(weight)) {
            wx.showToast({ title: '请输入有效数字', icon: 'none' })
            return
          }

          const record = {
            date: new Date().toISOString().split('T')[0],
            weight: weight
          }

          const records = [...this.data.weightRecords, record]
          wx.setStorageSync('weightRecords', records)
          this.setData({
            weightRecords: records,
            currentWeight: weight.toString()
          })
          this.updateWeightStats()
          wx.showToast({ title: '体重已记录', icon: 'success' })
        }
      }
    })
  },

  calculateMenstrualPhase() {
    const { lastPeriodDate, cycleDays } = this.data.menstrualSettings
    if (!lastPeriodDate) return

    const today = new Date()
    const lastPeriod = new Date(lastPeriodDate)
    const daysSince = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24))
    const cyclePosition = daysSince % cycleDays

    let phase, phaseDay
    if (cyclePosition < 5) {
      phase = 'menstruation'
      phaseDay = cyclePosition + 1
    } else if (cyclePosition < 14) {
      phase = 'follicular'
      phaseDay = cyclePosition - 4
    } else if (cyclePosition < 19) {
      phase = 'ovulation'
      phaseDay = cyclePosition - 13
    } else {
      phase = 'luteal'
      phaseDay = cyclePosition - 18
    }

    this.setData({
      currentPhase: phase,
      phaseDay
    })
  },

  showMenstrualSettings() {
    wx.showModal({
      title: '设置生理期',
      editable: true,
      placeholderText: '上次月经开始日期(YYYY-MM-DD)',
      success: (res) => {
        if (res.confirm && res.content) {
          const settings = {
            ...this.data.menstrualSettings,
            lastPeriodDate: res.content
          }
          wx.setStorageSync('menstrualSettings', settings)
          this.setData({ menstrualSettings: settings })
          this.calculateMenstrualPhase()
          wx.showToast({ title: '已保存', icon: 'success' })
        }
      }
    })
  },

  generateDietPlan() {
    // 检查健康档案是否完整
    if (!this.data.currentWeight || !this.data.targetWeight) {
      wx.showModal({
        title: '提示',
        content: '请先完善健康档案（当前体重和目标体重），然后再生成饮食计划',
        showCancel: true,
        confirmText: '去完善',
        success: (res) => {
          if (res.confirm) {
            this.showEditProfile()
          }
        }
      })
      return
    }

    wx.showLoading({ title: '正在生成饮食计划...' })

    // 调用云函数生成饮食计划
    wx.cloud.callFunction({
      name: 'generateDietPlan',
      data: {
        dietGoal: this.data.dietGoal,
        activityLevel: this.data.activityLevel,
        allergies: this.data.allergies,
        currentPhase: this.data.currentPhase,
        targetWeight: this.data.targetWeight
      },
      success: (res) => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          const plan = res.result.data
          // 为每个阶段的购物清单检查库存
        if (plan.phases) {
          plan.phases.forEach(phase => {
            if (phase.shoppingList) {
              phase.shoppingList = this.checkFridgeStock(phase.shoppingList)
            }
          })
        }

        this.setData({ dietPlan: plan, showDietPlan: true, currentPlanPhase: 0 })
          // 保存到本地
          wx.setStorageSync('dietPlan', plan)
          wx.showToast({ title: '生成成功', icon: 'success' })
        } else {
          wx.showModal({
            title: '生成失败',
            content: res.result?.error || '请稍后重试',
            showCancel: false
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showModal({
          title: '生成失败',
          content: '网络错误，请检查网络连接后重试',
          showCancel: false
        })
        console.error('调用云函数失败:', err)
      }
    })
  },

  closeDietPlan() {
    this.setData({ showDietPlan: false, currentPlanPhase: 0 })
  },

  switchPlanPhase(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentPlanPhase: index })
  },

  // 检查冰箱库存，返回购物清单是否充足
  checkFridgeStock(shoppingList) {
    const fridgeItems = wx.getStorageSync('fridgeItems') || []
    const fridgeNames = fridgeItems.map(item => item.name)

    return shoppingList.map(item => {
      // 简单检查：冰箱是否有同名食材
      const inStock = fridgeNames.some(name =>
        item.name.includes(name) || name.includes(item.name)
      )
      return { ...item, inStock }
    })
  },

  getPhaseLabel(phase) {
    const labels = {
      'menstruation': '经期',
      'follicular': '卵泡期',
      'ovulation': '排卵期',
      'luteal': '黄体期'
    }
    return labels[phase] || ''
  },

  getDietGoalLabel(goal) {
    const labels = {
      'lose': '📉 减肥',
      'maintain': '⚖️ 维持',
      'gain': '📈 增重'
    }
    return labels[goal] || ''
  },

  getActivityLabel(level) {
    const labels = {
      'sedentary': '久坐少动',
      'moderate': '适度活动',
      'active': '运动较多'
    }
    return labels[level] || ''
  }
})
