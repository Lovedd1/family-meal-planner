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
    weightChartMin: 0,
    weightChartMax: 100,
    weightChartMid: 50,
    weightChartData: [],
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
    actualDates: [], // 生理周期每天对应的实际日期

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

    // 饮食记录详情
    showDietDetailModal: false,
    dietDetailData: null,

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

    // 绘制柱状图
    this.drawWeightChart()

    // 加载生理期设置
    const menstrual = storageAdapter.get('menstrualSettings') || {}
    const menstrualSettings = {
      lastPeriodDate: menstrual.lastPeriodDate || '',
      cycleDays: menstrual.cycleDays || 28,
      periodDays: menstrual.periodDays || 5
    }
    // 计算实际日期数组
    const actualDates = this.computeActualDates(menstrualSettings)
    this.setData({ menstrualSettings, actualDates })
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

  // 绘制体重柱状图（CSS版本）
  drawWeightChart() {
    const records = this.data.weightRecords
    if (records.length === 0) return

    // 取最近30天数据
    const recentRecords = records.slice(-30)

    // 计算体重范围
    const weights = recentRecords.map(r => r.weight)
    const minWeight = Math.min(...weights) - 1
    const maxWeight = Math.max(...weights) + 1
    const weightRange = maxWeight - minWeight || 1

    // 柱子高度范围：50px - 200px
    const minBarHeight = 50
    const maxBarHeight = 200

    // 构建图表数据
    const chartData = recentRecords.map((record, index) => {
      // 计算柱子高度
      const barHeightRatio = (record.weight - minWeight) / weightRange
      const barHeight = minBarHeight + barHeightRatio * (maxBarHeight - minBarHeight)

      // 计算颜色
      let color = '#C48B8B'  // 默认粉色
      if (index === 0) {
        color = '#E8D5D8'  // 第一天灰色
      } else {
        const prevWeight = recentRecords[index - 1].weight
        if (record.weight > prevWeight) {
          color = '#C45C5C'  // 上涨红色
        } else if (record.weight < prevWeight) {
          color = '#5A8A6A'  // 下降绿色
        }
      }

      // 日期标签
      const date = new Date(record.date)
      const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`

      return {
        date: record.date,
        weight: record.weight,
        barHeight: Math.round(barHeight),
        color,
        dateLabel
      }
    })

    // 计算Y轴刻度
    const midWeight = ((maxWeight + minWeight) / 2).toFixed(1)

    this.setData({
      weightChartData: chartData,
      weightChartMin: minWeight.toFixed(1),
      weightChartMax: maxWeight.toFixed(1),
      weightChartMid: midWeight
    })
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
          // 重新绘制柱状图
          this.drawWeightChart()
          wx.showToast({ title: '体重已记录', icon: 'success' })
        }
      }
    })
  },

  calculateMenstrualPhase(settings) {
    const menstrualSettings = settings || this.data.menstrualSettings
    const { lastPeriodDate, cycleDays = 28, periodDays = 5 } = menstrualSettings

    if (!lastPeriodDate) return

    // 确保lastPeriodDate是有效日期
    const lastPeriod = new Date(lastPeriodDate)
    if (isNaN(lastPeriod.getTime())) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    lastPeriod.setHours(0, 0, 0, 0)

    const daysSince = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24))

    // 如果daysSince为负数，说明设置日期在今天之后，不计算
    if (daysSince < 0) {
      this.setData({
        currentPhase: 'follicular',
        phaseDay: 1
      })
      return
    }

    const cyclePosition = daysSince % cycleDays

    let phase, phaseDay
    if (cyclePosition < periodDays) {
      phase = 'menstruation'
      phaseDay = cyclePosition + 1
    } else if (cyclePosition < periodDays + 9) {
      phase = 'follicular'
      phaseDay = cyclePosition - periodDays + 1
    } else if (cyclePosition < periodDays + 14) {
      phase = 'ovulation'
      phaseDay = cyclePosition - (periodDays + 9) + 1
    } else {
      phase = 'luteal'
      phaseDay = cyclePosition - (periodDays + 14) + 1
    }

    this.setData({
      currentPhase: phase,
      phaseDay
    })
  },

  computeActualDates(menstrualSettings) {
    const { lastPeriodDate, cycleDays = 28 } = menstrualSettings
    if (!lastPeriodDate) return []

    const dates = []
    const lastPeriod = new Date(lastPeriodDate)
    lastPeriod.setHours(0, 0, 0, 0)

    for (let i = 0; i < cycleDays; i++) {
      const date = new Date(lastPeriod)
      date.setDate(lastPeriod.getDate() + i)
      const month = date.getMonth() + 1
      const day = date.getDate()
      dates.push(`${month}/${day}`)
    }
    return dates
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
    // 计算新的实际日期数组
    const actualDates = this.computeActualDates(settings)
    // 先关闭弹窗，再更新数据并计算，避免setData异步问题
    this.closeMenstrualSettings()
    this.setData({ menstrualSettings: settings, actualDates })
    // 传入settings确保计算使用新值
    this.calculateMenstrualPhase(settings)
    wx.showToast({ title: '已保存', icon: 'success' })
  },

  generateDietPlan() {
    wx.showLoading({ title: '正在分析...' })

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

    // 调用云函数生成一日分析
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
      },
      success: (res) => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          const analysis = res.result.data
          this.setData({ aiAnalysis: analysis, showDietPlan: true })

          // 保存到历史记录
          const history = storageAdapter.get('dietPlanHistory') || []
          const historyItem = {
            id: 'plan_' + Date.now(),
            name: '一日分析',
            date: new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            plan: analysis
          }
          history.unshift(historyItem)
          const trimmedHistory = history.slice(0, 5)
          storageAdapter.set('dietPlanHistory', trimmedHistory)
          this.setData({ dietPlanHistory: trimmedHistory })
          wx.showToast({ title: '分析完成', icon: 'success' })
        } else {
          wx.showModal({
            title: '分析失败',
            content: res.result?.error || '请稍后重试',
            showCancel: false
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showModal({
          title: '分析失败',
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
    // 经期：第1天到periodDays天（periodDays默认为5）
    if (periodDays && day <= periodDays) {
      classes.push('period')
    }
    // 易孕期：第11-16天（假设周期第14天排卵，前后5天为易孕期）
    if (day >= 10 && day <= 16) {
      classes.push('fertile')
    }
    // 今天是第phaseDay天（phaseDay从1开始）
    if (phaseDay && day === phaseDay) {
      classes.push('today')
    }
    return classes.join(' ')
  },

  getDateCellClass(day, phaseDay, periodDays, cycleDays, actualDate) {
    const classes = []
    // 经期：第1天到periodDays天
    if (periodDays && day <= periodDays) {
      classes.push('period')
    }
    // 易孕期：第10-16天（排卵日前后）
    if (day >= 10 && day <= 16) {
      classes.push('fertile')
    }
    // 今天是第phaseDay天
    if (phaseDay && day === phaseDay) {
      classes.push('today')
    }
    return classes.join(' ')
  },

  viewDietPlan(e) {
    const id = e.currentTarget.dataset.id
    const history = this.data.dietPlanHistory
    const item = history.find(h => h.id === id)
    if (item && item.plan) {
      this.setData({ aiAnalysis: item.plan, showDietPlan: true, currentPlanPhase: 0 })
    }
  },

  deleteDietPlan(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除确认',
      content: '确定要删除这条分析记录吗？',
      success: (res) => {
        if (res.confirm) {
          const history = this.data.dietPlanHistory.filter(h => h.id !== id)
          storageAdapter.set('dietPlanHistory', history)
          this.setData({ dietPlanHistory: history })
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
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
  },

  showDietDetail(e) {
    const index = e.currentTarget.dataset.index
    const dietHistory = this.data.dietHistory
    if (index >= 0 && index < dietHistory.length) {
      const item = dietHistory[index]
      // 格式化日期显示
      const dateObj = new Date(item.date)
      const formattedDate = dateObj.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      this.setData({
        showDietDetailModal: true,
        dietDetailData: {
          ...item,
          date: formattedDate
        }
      })
    }
  },

  closeDietDetailModal() {
    this.setData({ showDietDetailModal: false, dietDetailData: null })
  },

  closePlateauAlert() {
    this.setData({ showPlateauAlert: false })
  }
})