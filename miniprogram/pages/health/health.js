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
    // TODO: 调用云函数生成饮食计划
    wx.showToast({ title: '正在生成...', icon: 'loading' })

    // 模拟计划内容
    const plan = {
      phases: [
        {
          name: '适应期',
          duration: '1-2周',
          calories: '1800-2000kcal',
          focus: '调整饮食结构，逐步减少高热量食物'
        },
        {
          name: '强化期',
          duration: '3-8周',
          calories: '1400-1600kcal',
          focus: '严格控制热量，增加蛋白质摄入'
        },
        {
          name: '巩固期',
          duration: '2-4周',
          calories: '1600-1800kcal',
          focus: '稳定体重，养成健康饮食习惯'
        }
      ],
      recommendations: [
        '增加蔬菜摄入量',
        '选择低脂蛋白质',
        '适量补充复合碳水'
      ]
    }

    this.setData({ dietPlan: plan, showDietPlan: true })
  },

  closeDietPlan() {
    this.setData({ showDietPlan: false })
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
