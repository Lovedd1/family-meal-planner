// pages/health/health.js
const app = getApp()
const storageAdapter = require('../../utils/storageAdapter.js')
const foods = require('../../utils/foods.js')

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
    showMenstrualSettings: false,
    tempMenstrual: {
      lastPeriodDate: '',
      cycleDays: 28,
      periodDays: 5
    },
    currentPhase: 'follicular', // menstruation, follicular, ovulation, luteal
    phaseDay: 0,

    // 饮食计划
    dietPlan: null,
    dietPlanHistory: [],
    showDietPlan: false,
    currentPlanPhase: 0,

    // 健康报告
    healthReports: [],
    showReportModal: false,
    currentReport: null,

    // 平台期提醒
    showPlateauAlert: false,

    // 饮食历史
    dietHistory: [],
    showDietHistory: false,

    // AI分析结果
    aiAnalysis: null,
    isAnalyzing: false
  },

  onLoad() {
    this.loadHealthData()
  },

  onShow() {
    this.loadHealthData()
  },

  loadHealthData() {
    // 加载健康档案
    const profile = storageAdapter.get('healthProfile') || {}
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
    const records = storageAdapter.get('weightRecords') || []
    this.setData({ weightRecords: records })
    this.updateWeightStats()

    // 加载生理期设置
    const menstrual = storageAdapter.get('menstrualSettings') || {}
    const menstrualSettings = {
      lastPeriodDate: menstrual.lastPeriodDate || '',
      cycleDays: menstrual.cycleDays || 28,
      periodDays: menstrual.periodDays || 5
    }
    this.setData({ menstrualSettings })
    this.calculateMenstrualPhase(menstrualSettings)

    // 加载饮食计划历史
    const dietPlanHistory = storageAdapter.get('dietPlanHistory') || []
    this.setData({ dietPlanHistory })

    // 加载饮食历史
    const dietHistory = storageAdapter.get('dietHistory') || []
    this.setData({ dietHistory })

    // 如果数据足够，自动触发AI分析
    if (this.data.dietHistory.length >= 3) {
      this.generateDailyAdvice()
    }

    // 生成健康报告
    this.generateHealthReports()
  },

  updateWeightStats() {
    const records = this.data.weightRecords
    if (records.length === 0) return

    const current = records[records.length - 1]?.weight || 0
    const target = parseFloat(this.data.targetWeight) || 0
    const initial = records[0]?.weight || current

    this.setData({
      weightStats: {
        current,
        target,
        progress: target > 0 ? Math.round(((initial - current) / (initial - target)) * 100) : 0,
        diff: current - target,
        absDiff: Math.abs(current - target)
      }
    })

    // 检测平台期
    this.checkPlateau(records)
  },

  // 生成健康报告（基于体重记录和饮食计划）
  generateHealthReports() {
    const records = storageAdapter.get('weightRecords') || []
    const dietPlan = storageAdapter.get('dietPlan')
    const fridgeItems = storageAdapter.get('fridgeItems') || []
    const profile = storageAdapter.get('healthProfile') || {}

    const reports = []

    // 生成周报/月报（当有足够数据时）
    if (records.length >= 3) {
      const latest = records[records.length - 1]
      const weekAgo = records.slice(-7, -1)
      const monthAgo = records.slice(-14, -1)

      if (monthAgo.length >= 2) {
        const monthStart = monthAgo[0].weight
        const monthEnd = monthAgo[monthAgo.length - 1].weight
        const monthChange = (monthEnd - monthStart).toFixed(1)
        const avgWeight = (monthAgo.reduce((s, r) => s + r.weight, 0) / monthAgo.length).toFixed(1)

        // 评估饮食均衡度
        const veggieCount = fridgeItems.filter(i => i.category === 'vegetable').length
        const balanceScore = Math.min(100, 60 + veggieCount * 8)

        let summary = ''
        let tags = []
        let score = 70

        if (parseFloat(monthChange) < 0) {
          summary = `本月体重下降${Math.abs(monthChange)}kg，饮食控制效果良好。`
          tags.push('体重下降')
          score += 10
        } else if (parseFloat(monthChange) > 0) {
          summary = `本月体重上升${monthChange}kg，建议注意饮食控制。`
          tags.push('体重上升')
          score -= 5
        } else {
          summary = `本月体重持平，体脂率保持稳定。`
          tags.push('体重持平')
        }

        if (veggieCount >= 5) {
          tags.push('蔬果充足')
          score += 5
        } else if (veggieCount < 2) {
          tags.push('蔬菜不足')
          score -= 5
        }

        if (dietPlan) {
          tags.push('计划执行中')
          score += 3
        }

        reports.push({
          id: 'report_month_' + Date.now(),
          title: new Date().toLocaleDateString('zh-CN', { month: 'long' }) + '健康月报',
          date: latest.date,
          summary: summary + ` 平均体重${avgWeight}kg，蔬菜摄入${veggieCount}种。`,
          tags,
          score: Math.min(100, Math.max(50, score))
        })
      }

      // 最近一周报告
      if (weekAgo.length >= 2) {
        const weekStart = weekAgo[0].weight
        const weekEnd = weekAgo[weekAgo.length - 1].weight
        const weekChange = (weekEnd - weekStart).toFixed(1)
        const weekRecords = records.slice(-7)
        const avgWeight = (weekRecords.reduce((s, r) => s + r.weight, 0) / weekRecords.length).toFixed(1)

        let tags = []
        let score = 75

        if (parseFloat(weekChange) <= 0) {
          tags.push('体重下降')
          score += 8
        } else {
          tags.push('体重上升')
          score -= 3
        }

        if (weekRecords.length >= 5) {
          tags.push('记录完整')
          score += 5
        }

        reports.push({
          id: 'report_week_' + Date.now(),
          title: `第${Math.ceil(records.length / 7)}周健康报告`,
          date: weekRecords[weekRecords.length - 1].date,
          summary: `本周平均体重${avgWeight}kg，较上周${parseFloat(weekChange) >= 0 ? '上升' : '下降'}${Math.abs(parseFloat(weekChange))}kg。体重变化趋势${parseFloat(weekChange) >= 0 ? '需注意' : '良好'}。`,
          tags,
          score: Math.min(100, Math.max(50, score))
        })
      }
    }

    // 只保留最新3条
    this.setData({ healthReports: reports.slice(0, 3) })
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

  preventBubble() {
    // 阻止冒泡，防止点击输入框时关闭弹窗
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
    storageAdapter.set('healthProfile', profile)
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
          storageAdapter.set('weightRecords', records)
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

  calculateMenstrualPhase(settings) {
    const menstrualSettings = settings || this.data.menstrualSettings
    const { lastPeriodDate, cycleDays } = menstrualSettings
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

  openMenstrualSettings() {
    this.setData({
      showMenstrualSettings: true,
      tempMenstrual: { ...this.data.menstrualSettings }
    })
  },

  closeMenstrualSettings() {
    this.setData({ showMenstrualSettings: false })
  },

  bindPeriodDateChange(e) {
    this.setData({
      'tempMenstrual.lastPeriodDate': e.detail.value
    })
  },

  adjustCycleDays(e) {
    const delta = parseInt(e.currentTarget.dataset.delta) || 1
    const current = this.data.tempMenstrual.cycleDays || 28
    const newVal = Math.max(20, Math.min(45, current + delta))
    this.setData({ 'tempMenstrual.cycleDays': newVal })
  },

  inputCycleDays(e) {
    const val = parseInt(e.detail.value)
    if (!isNaN(val) && val >= 20 && val <= 45) {
      this.setData({ 'tempMenstrual.cycleDays': val })
    }
  },

  adjustPeriodDays(e) {
    const delta = parseInt(e.currentTarget.dataset.delta) || 1
    const current = this.data.tempMenstrual.periodDays || 5
    const newVal = Math.max(2, Math.min(10, current + delta))
    this.setData({ 'tempMenstrual.periodDays': newVal })
  },

  inputPeriodDays(e) {
    const val = parseInt(e.detail.value)
    if (!isNaN(val) && val >= 2 && val <= 10) {
      this.setData({ 'tempMenstrual.periodDays': val })
    }
  },

  saveMenstrualSettings() {
    const { lastPeriodDate, cycleDays, periodDays } = this.data.tempMenstrual
    if (!lastPeriodDate) {
      wx.showToast({ title: '请选择月经开始日期', icon: 'none' })
      return
    }
    const settings = { lastPeriodDate, cycleDays, periodDays }
    storageAdapter.set('menstrualSettings', settings)
    // 先关闭弹窗，再更新数据并计算，避免setData异步问题
    this.closeMenstrualSettings()
    this.setData({ menstrualSettings: settings })
    // 传入settings确保计算使用新值
    this.calculateMenstrualPhase(settings)
    wx.showToast({ title: '已保存', icon: 'success' })
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
            // Pre-compute joined ingredient strings
            if (phase.weeklyMenus) {
              phase.weeklyMenus.forEach(week => {
                week.days.forEach(day => {
                  if (day.breakfast && day.breakfast.ingredients) {
                    day.breakfast._ingredientsStr = day.breakfast.ingredients.map(i => i.name).join('、')
                  }
                  if (day.lunch && day.lunch.ingredients) {
                    day.lunch._ingredientsStr = day.lunch.ingredients.map(i => i.name).join('、')
                  }
                  if (day.dinner && day.dinner.ingredients) {
                    day.dinner._ingredientsStr = day.dinner.ingredients.map(i => i.name).join('、')
                  }
                })
              })
            }
          })
        }

        this.setData({ dietPlan: plan, showDietPlan: true, currentPlanPhase: 0 })
          // 保存到本地
          storageAdapter.set('dietPlan', plan)
          // 保存到历史记录
          const history = storageAdapter.get('dietPlanHistory') || []
          const historyItem = {
            id: 'plan_' + Date.now(),
            name: plan.phases && plan.phases[0] ? plan.phases[0].name : '饮食计划',
            date: new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }),
            plan: plan
          }
          history.unshift(historyItem)
          const trimmedHistory = history.slice(0, 3)
          storageAdapter.set('dietPlanHistory', trimmedHistory)
          this.setData({ dietPlanHistory: trimmedHistory })
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
    const fridgeItems = storageAdapter.get('fridgeItems') || []
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

  getDayClass(day, phaseDay, periodDays) {
    const classes = []
    // 经期：第1天到periodDays天
    if (day <= periodDays) {
      classes.push('period')
    }
    // 易孕期：第11-16天（假设周期第14天排卵，前后5天为易孕期）
    if (day >= 10 && day <= 16) {
      classes.push('fertile')
    }
    // 今天是第phaseDay天
    if (day === phaseDay) {
      classes.push('today')
    }
    return classes.join(' ')
  },

  viewDietPlan(e) {
    const id = e.currentTarget.dataset.id
    const history = this.data.dietPlanHistory
    const item = history.find(h => h.id === id)
    if (item && item.plan) {
      this.setData({ dietPlan: item.plan, showDietPlan: true, currentPlanPhase: 0 })
    }
  },

  generateDailyAdvice() {
    if (this.data.isAnalyzing) return
    this.setData({ isAnalyzing: true })

    wx.showLoading({ title: '分析中...' })

    const profile = storageAdapter.get('healthProfile') || {}
    const customFoods = storageAdapter.get('customFoods') || []
    const allFoods = [...foods.foods, ...customFoods]

    const availableFoods = allFoods.map(f => ({
      id: f.id,
      name: f.name,
      emoji: f.emoji,
      nutritionTypes: f.nutritionTypes || ['protein'],
      category: f.category,
      heatMethod: f.heatMethod
    }))

    wx.cloud.callFunction({
      name: 'generateDietPlan',
      data: {
        action: 'dailyAdvice',
        dietGoal: this.data.dietGoal,
        activityLevel: this.data.activityLevel,
        allergies: this.data.allergies || '',
        currentPhase: this.data.currentPhase,
        targetWeight: this.data.targetWeight,
        currentWeight: this.data.currentWeight,
        dietHistory: this.data.dietHistory,
        availableFoods: availableFoods
      }
    }).then(res => {
      wx.hideLoading()
      if (res.result && res.result.success) {
        this.setData({ aiAnalysis: res.result.data })
      } else {
        console.error('AI分析返回失败:', res.result)
        wx.showToast({ title: '分析失败，请重试', icon: 'none' })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('AI分析失败:', err)
    }).finally(() => {
      this.setData({ isAnalyzing: false })
    })
  },

  addRecommendedDish(e) {
    const dish = e.currentTarget.dataset.dish
    const meal = e.currentTarget.dataset.meal || 'breakfast'

    const menu = app.getTodayMenu()
    if (!menu[meal]) menu[meal] = []

    const exists = menu[meal].some(d => d.id === dish.id)
    if (exists) {
      wx.showToast({ title: '已在菜单中', icon: 'none' })
      return
    }

    menu[meal].push(dish)
    app.updateTodayMenu(menu)

    wx.showToast({ title: `已添加到${this.getMealName(meal)}`, icon: 'success' })
  },

  getMealName(meal) {
    const names = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' }
    return names[meal] || '菜单'
  },

  toggleDietHistory() {
    this.setData({ showDietHistory: !this.data.showDietHistory })
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
  },

  showReport(e) {
    const report = e.currentTarget.dataset.report
    this.setData({ currentReport: report, showReportModal: true })
  },

  closeReportModal() {
    this.setData({ showReportModal: false, currentReport: null })
  },

  getReportTagClass(tag) {
    if (['体重下降', '体重持平', '蔬果充足', '记录完整', '计划执行中', '目标达成', '睡眠良好', '饮水达标'].includes(tag)) {
      return ''
    }
    if (['体重上升', '体重持平', '蔬菜不足', '蛋白质不足'].includes(tag)) {
      return 'warning'
    }
    return ''
  }
})
