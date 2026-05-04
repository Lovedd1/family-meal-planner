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
    if (deduction) {
      const parsed = parseAmount(item.amount)
      const newAmount = Math.max(0, parsed.value - deduction.deduct)
      return {
        ...item,
        amount: newAmount + item.amount.replace(/^[\d.]+/, '').replace(/^\s+/, '') || newAmount + item.unit || newAmount + '个'
      }
    }
    return item
  })

  // 对于完全没有的食材，不添加（保持冰箱数据干净）
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
    deductionList: []
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
