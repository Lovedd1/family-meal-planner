// pages/today/today.js
const foods = require('../../utils/foods.js')
const storageAdapter = require('../../utils/storageAdapter.js')

// 解析食材数量字符串，返回 { value, unit }
function parseAmount(amountStr) {
  if (!amountStr) return { value: 0, unit: '' }
  const match = amountStr.match(/^(\d+(?:\.\d+)?)\s*(g|kg|个|份|ml|L)?$/)
  if (match) {
    return { value: parseFloat(match[1]), unit: match[2] || '个' }
  }
  // 尝试解析纯数字
  const numMatch = amountStr.match(/^(\d+(?:\.\d+)?)/)
  if (numMatch) {
    return { value: parseFloat(numMatch[1]), unit: '个' }
  }
  return { value: 1, unit: '个' }
}

// 计算单日营养统计
function calculateDayNutrition(dishes) {
  const stats = { carbsCount: 0, proteinCount: 0, fatCount: 0, fiberCount: 0, totalCount: 0 }
  dishes.forEach(dish => {
    if (dish.nutritionTypes && Array.isArray(dish.nutritionTypes)) {
      dish.nutritionTypes.forEach(nType => {
        if (nType === 'carbs') stats.carbsCount++
        else if (nType === 'protein') stats.proteinCount++
        else if (nType === 'fat') stats.fatCount++
        else if (nType === 'fiber') stats.fiberCount++
      })
    }
  })
  stats.totalCount = stats.carbsCount + stats.proteinCount + stats.fatCount + stats.fiberCount
  return stats
}

// 计算食材扣减清单
function calculateDeductions(dishes, fridgeItems) {
  // 1. 累加所有菜品需要的食材
  const needed = new Map()
  dishes.forEach(dish => {
    dish.ingredients.forEach(ing => {
      const parsed = parseAmount(ing.amount)
      if (needed.has(ing.name)) {
        const existing = needed.get(ing.name)
        needed.set(ing.name, {
          name: ing.name,
          need: existing.need + parsed.value,
          unit: parsed.unit || existing.unit
        })
      } else {
        needed.set(ing.name, { name: ing.name, need: parsed.value, unit: parsed.unit || '个' })
      }
    })
  })

  // 2. 获取冰箱库存
  const fridgeMap = new Map()
  fridgeItems.forEach(item => {
    const parsed = parseAmount(item.amount)
    fridgeMap.set(item.name, {
      name: item.name,
      stock: parsed.value,
      unit: parsed.unit || item.unit || '个'
    })
  })

  // 3. 计算扣减结果
  const results = []
  needed.forEach((needInfo, name) => {
    const fridgeItem = fridgeMap.get(name)
    if (fridgeItem) {
      const canDeduct = Math.min(needInfo.need, fridgeItem.stock)
      const afterDeduct = Math.max(0, fridgeItem.stock - needInfo.need)
      results.push({
        name: name,
        need: needInfo.need,
        unit: needInfo.unit,
        stock: fridgeItem.stock,
        deduct: canDeduct,
        afterStock: afterDeduct,
        sufficient: needInfo.need <= fridgeItem.stock,
        needMore: Math.max(0, needInfo.need - fridgeItem.stock)
      })
    } else {
      // 冰箱里没有这种食材
      results.push({
        name: name,
        need: needInfo.need,
        unit: needInfo.unit,
        stock: 0,
        deduct: 0,
        afterStock: 0,
        sufficient: false,
        needMore: needInfo.need
      })
    }
  })

  return results
}

// 执行扣减冰箱库存
function performDeduction(deductionList, fridgeItems) {
  const newFridge = fridgeItems.map(item => {
    const deduction = deductionList.find(d => d.name === item.name)
    if (deduction && deduction.deduct > 0) {
      const parsed = parseAmount(item.amount)
      const newValue = Math.max(0, parsed.value - deduction.deduct)
      const unit = parsed.unit || item.unit || '个'
      return { ...item, amount: `${newValue}${unit}` }
    }
    return item
  })

  // 过滤掉数量为0或负数的食材
  return newFridge.filter(item => {
    const parsed = parseAmount(item.amount)
    return parsed.value > 0
  })
}

Page({
  data: {
    currentDate: '',
    currentTab: 'breakfast',
    tabs: [
      { key: 'breakfast', label: '🌅 早餐', count: 0 },
      { key: 'lunch', label: '☀️ 午餐', count: 0 },
      { key: 'dinner', label: '🌙 晚餐', count: 0 }
    ],
    menu: {
      breakfast: [],
      lunch: [],
      dinner: []
    },
    conflicts: [],
    showConfirmModal: false,
    showRecipeModal: false,
    currentRecipe: null,
    deductionList: [],
    nutritionStats: {
      carbsCount: 0,
      proteinCount: 0,
      fatCount: 0,
      fiberCount: 0
    },
    nutritionGroups: []
  },

  onLoad() {
    this.setDate()
    this.loadMenu()
  },

  onShow() {
    this.loadMenu()
  },

  setDate() {
    const now = new Date()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`
    this.setData({ currentDate: dateStr })
  },

  loadMenu() {
    const menu = storageAdapter.get('todayMenu') || {
      breakfast: [],
      lunch: [],
      dinner: []
    }
    this.setData({ menu })
    this.updateTabCounts()
    this.checkConflicts()
    this.calculateNutritionStats()
  },

  saveToDietHistory() {
    const history = storageAdapter.get('dietHistory') || []
    const todayMenu = this.data.menu

    const allDishes = [
      ...todayMenu.breakfast,
      ...todayMenu.lunch,
      ...todayMenu.dinner
    ]

    if (allDishes.length === 0) return

    const nutritionStats = calculateDayNutrition(allDishes)

    history.unshift({
      date: new Date().toISOString().split('T')[0],
      menu: todayMenu,
      nutritionStats
    })

    // 只保留7天
    const trimmed = history.slice(0, 7)
    storageAdapter.set('dietHistory', trimmed)
  },

  updateTabCounts() {
    const tabs = this.data.tabs.map(tab => ({
      ...tab,
      count: this.data.menu[tab.key].length
    }))
    this.setData({ tabs })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    // 切换到营养Tab时绘制饼图
    if (tab === 'nutrition') {
      setTimeout(() => {
        this.drawPieChart(this.data.nutritionStats)
      }, 100)
    }
  },

  checkConflicts() {
    const allDishes = [
      ...this.data.menu.breakfast,
      ...this.data.menu.lunch,
      ...this.data.menu.dinner
    ]
    const allIngredients = allDishes.flatMap(dish => dish.ingredients)
    const conflicts = foods.checkFoodConflict(allIngredients)
    this.setData({ conflicts })
  },

  calculateNutritionStats() {
    const allDishes = [
      ...this.data.menu.breakfast,
      ...this.data.menu.lunch,
      ...this.data.menu.dinner
    ]

    const stats = { carbsCount: 0, proteinCount: 0, fatCount: 0, fiberCount: 0, totalCount: 0 }
    const groups = [
      { type: 'carbs', label: '碳水化合物', emoji: '🥖', dishes: [] },
      { type: 'protein', label: '蛋白质', emoji: '🥩', dishes: [] },
      { type: 'fat', label: '脂肪', emoji: '🥑', dishes: [] },
      { type: 'fiber', label: '膳食纤维', emoji: '🥬', dishes: [] }
    ]

    allDishes.forEach(dish => {
      if (dish.nutritionTypes && Array.isArray(dish.nutritionTypes)) {
        dish.nutritionTypes.forEach(nType => {
          if (nType === 'carbs') stats.carbsCount++
          else if (nType === 'protein') stats.proteinCount++
          else if (nType === 'fat') stats.fatCount++
          else if (nType === 'fiber') stats.fiberCount++
        })

        // 按主要营养素分组
        const mainType = dish.nutritionType || 'protein'
        const group = groups.find(g => g.type === mainType)
        if (group && !group.dishes.find(d => d.id === dish.id)) {
          group.dishes.push(dish)
        }
      }
    })

    // 计算总数
    stats.totalCount = stats.carbsCount + stats.proteinCount + stats.fatCount + stats.fiberCount

    this.setData({
      nutritionStats: stats,
      nutritionGroups: groups
    })

    // 绘制饼图
    this.drawPieChart(stats)
  },

  drawPieChart(stats) {
    const total = stats.totalCount
    const ctx = wx.createCanvasContext('nutritionPieChart')
    const centerX = 80
    const centerY = 80
    const radius = 70
    const innerRadius = 40

    // 清除旧内容
    ctx.clearRect(0, 0, 160, 160)

    // 如果总数为0，绘制灰色背景圆环
    if (total === 0) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.setFillStyle('#E8E8E8')
      ctx.fill()
      ctx.beginPath()
      ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
      ctx.setFillStyle('#FFFFFF')
      ctx.fill()
      ctx.draw()
      return
    }

    // 计算各段角度（确保每个分类都能显示，即使为0）
    const segments = []
    // 碳水 - 金黄色
    const carbsAngle = (stats.carbsCount / total) * 2 * Math.PI
    if (carbsAngle > 0) {
      segments.push({ startAngle: 0, angle: carbsAngle, color: '#D4A828' })
    }
    // 蛋白质 - 红色
    const proteinAngle = (stats.proteinCount / total) * 2 * Math.PI
    if (proteinAngle > 0) {
      segments.push({ startAngle: carbsAngle, angle: proteinAngle, color: '#C45C5C' })
    }
    // 脂肪 - 灰色
    const fatAngle = (stats.fatCount / total) * 2 * Math.PI
    if (fatAngle > 0) {
      segments.push({ startAngle: carbsAngle + proteinAngle, angle: fatAngle, color: '#7A8AA0' })
    }
    // 纤维 - 绿色
    const fiberAngle = (stats.fiberCount / total) * 2 * Math.PI
    if (fiberAngle > 0) {
      segments.push({ startAngle: carbsAngle + proteinAngle + fatAngle, angle: fiberAngle, color: '#5A8A6A' })
    }

    // 绘制各段
    let currentAngle = -Math.PI / 2 // 从顶部开始

    segments.forEach(segment => {
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + segment.angle)
      ctx.closePath()
      ctx.setFillStyle(segment.color)
      ctx.fill()
      currentAngle += segment.angle
    })

    // 中心白色圆（形成环形）
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
    ctx.setFillStyle('#FFFFFF')
    ctx.fill()

    ctx.draw()
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

  removeDish(e) {
    const { tab, index } = e.currentTarget.dataset
    const menu = { ...this.data.menu }
    menu[tab].splice(index, 1)
    this.setData({ menu })
    storageAdapter.set('todayMenu', menu)
    this.updateTabCounts()
    this.checkConflicts()
  },

  showConfirm() {
    const allDishes = [
      ...this.data.menu.breakfast,
      ...this.data.menu.lunch,
      ...this.data.menu.dinner
    ]
    if (allDishes.length === 0) return

    // 获取冰箱库存
    const fridgeItems = storageAdapter.get('fridgeItems') || []

    // 计算扣减清单
    const deductionList = calculateDeductions(allDishes, fridgeItems)

    this.setData({
      showConfirmModal: true,
      deductionList: deductionList
    })
  },

  closeConfirmModal() {
    this.setData({ showConfirmModal: false })
  },

  confirmMenu() {
    const deductionList = this.data.deductionList

    // 获取冰箱库存并执行扣减
    let fridgeItems = storageAdapter.get('fridgeItems') || []
    fridgeItems = performDeduction(deductionList, fridgeItems)
    storageAdapter.set('fridgeItems', fridgeItems)

    // 存档到历史
    this.saveToDietHistory()

    // 清空菜单
    const emptyMenu = {
      breakfast: [],
      lunch: [],
      dinner: []
    }
    this.setData({ menu: emptyMenu })
    storageAdapter.set('todayMenu', emptyMenu)
    this.updateTabCounts()
    this.closeConfirmModal()

    // 检查是否有不足需要补充的
    const insufficientItems = deductionList.filter(d => !d.sufficient)
    if (insufficientItems.length > 0) {
      const names = insufficientItems.map(d => d.name).join('、')
      wx.showModal({
        title: '已确认菜单',
        content: `库存已扣减，但需要补充：${names}`,
        showCancel: false
      })
    } else {
      wx.showToast({ title: '已确认菜单', icon: 'success' })
    }
  }
})
