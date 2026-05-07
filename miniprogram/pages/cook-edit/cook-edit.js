const app = getApp()
const storageAdapter = require('../../utils/storageAdapter.js')
const { foods } = require('../../utils/foods.js')

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

  // 合并内置菜品
  foods.forEach(food => {
    if (!dishes.find(d => d.id === food.id)) {
      dishes.push(food)
    }
  })

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

Page({
  data: {
    isEdit: false,
    recordId: '',
    dishSearchKey: '',
    filteredDishes: [],
    canSave: false,
    tempRecord: {
      imagePath: '',
      menuItemId: '',
      menuItemName: '',
      emoji: '',
      meal: 'breakfast',
      rating: 0,
      notes: ''
    }
  },

  onLoad(options) {
    const allDishes = getAllDishes()
    this.setData({ filteredDishes: allDishes })

    if (options.id) {
      // 编辑模式
      this.setData({ isEdit: true, recordId: options.id })
      wx.setNavigationBarTitle({ title: '编辑记录' })
      this.loadRecord(options.id)
    } else {
      // 新增模式
      this.setData({
        isEdit: false,
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
    }
  },

  loadRecord(id) {
    const records = storageAdapter.get('cookingRecords') || []
    const record = records.find(r => r.id === id)
    if (record) {
      this.setData({
        tempRecord: {
          imagePath: record.imagePath,
          menuItemId: record.menuItemId,
          menuItemName: record.menuItemName,
          emoji: record.emoji,
          meal: record.meal,
          rating: record.rating,
          notes: record.notes || ''
        }
      })
      this.checkCanSave()
    }
  },

  cancel() {
    wx.navigateBack()
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const tempPath = res.tempFilePaths[0]
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
            this.checkCanSave()
          }
        })
      }
    })
  },

  searchDish(e) {
    const key = e.detail.value.toLowerCase()
    const dishes = getAllDishes()
    if (!key) {
      this.setData({ filteredDishes: dishes, dishSearchKey: '' })
      return
    }
    const filtered = dishes.filter(d =>
      d.name.toLowerCase().includes(key) ||
      (d.emoji && d.emoji.includes(key))
    )
    this.setData({ filteredDishes: filtered, dishSearchKey: key })
  },

  selectDish(e) {
    const dish = e.currentTarget.dataset.dish
    this.setData({
      'tempRecord.menuItemId': dish.id,
      'tempRecord.menuItemName': dish.name,
      'tempRecord.emoji': dish.emoji || '',
      dishSearchKey: ''
    })
    this.checkCanSave()
  },

  setMeal(e) {
    this.setData({
      'tempRecord.meal': e.currentTarget.dataset.meal
    })
    this.checkCanSave()
  },

  setRating(e) {
    const rating = e.currentTarget.dataset.rating
    // 如果点击的是已选中的星级，则取消选择（设为0）
    if (this.data.tempRecord.rating === rating) {
      this.setData({
        'tempRecord.rating': 0
      })
    } else {
      this.setData({
        'tempRecord.rating': rating
      })
    }
    this.checkCanSave()
  },

  inputNotes(e) {
    this.setData({
      'tempRecord.notes': e.detail.value
    })
  },

  checkCanSave() {
    const { tempRecord } = this.data
    const canSave = !!(
      tempRecord.imagePath &&
      tempRecord.menuItemId &&
      tempRecord.meal
    )
    this.setData({ canSave })
  },

  saveRecord() {
    const { tempRecord, isEdit, recordId } = this.data

    // 验证
    if (!tempRecord.imagePath) {
      wx.showToast({ title: '请先选择图片', icon: 'none' })
      return
    }
    if (!tempRecord.menuItemId) {
      wx.showToast({ title: '请选择关联菜品', icon: 'none' })
      return
    }
    if (!tempRecord.meal) {
      wx.showToast({ title: '请选择餐次', icon: 'none' })
      return
    }

    const now = new Date()
    let records = storageAdapter.get('cookingRecords') || []

    if (isEdit) {
      // 更新现有记录
      records = records.map(r => {
        if (r.id === recordId) {
          return {
            ...r,
            imagePath: tempRecord.imagePath,
            menuItemId: tempRecord.menuItemId,
            menuItemName: tempRecord.menuItemName,
            emoji: tempRecord.emoji,
            meal: tempRecord.meal,
            rating: tempRecord.rating,
            notes: tempRecord.notes,
            updatedAt: Date.now()
          }
        }
        return r
      })
    } else {
      // 新增记录
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
      records.unshift(record)
    }

    storageAdapter.set('cookingRecords', records)
    wx.showToast({ title: '保存成功', icon: 'success' })

    // 返回上一页（主页或详情页）
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        // 如果有详情页，就返回详情页让它刷新
        const prevPage = pages[pages.length - 2]
        if (prevPage && prevPage.route.includes('cook-detail')) {
          prevPage.loadRecord && prevPage.loadRecord()
        }
      }
      wx.navigateBack()
    }, 1500)
  }
})
