// cloudfunctions/pairPartner/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 生成配对码（4位数字）
function generatePinCode() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// 发送配对请求（写入请求方信息，等待对方确认）
async function register(data) {
  const { nickname, pin } = data
  if (!nickname || !pin || pin.length !== 4) {
    return { success: false, error: '昵称和4位PIN码不能为空' }
  }

  // 查找是否已存在该昵称的用户
  const existing = await db.collection('shared_users').where({ nickname }).field({ _id: true }).get()

  if (existing.data.length > 0) {
    // 已存在，更新PIN（允许修改昵称为空则忽略）
    await db.collection('shared_users').doc(existing.data[0]._id).update({
      data: {
        pin,
        updateTime: Date.now()
      }
    })
    return { success: true, action: 'updated', nickname }
  }

  // 新建
  await db.collection('shared_users').add({
    data: {
      nickname,
      pin,
      partnerNickname: '',
      paired: false,
      createTime: Date.now(),
      updateTime: Date.now()
    }
  })
  return { success: true, action: 'created', nickname }
}

// 搜索伴侣（昵称 + PIN 验证）
async function findPartner(data) {
  const { nickname, pin } = data
  if (!nickname || !pin) {
    return { success: false, error: '请输入伴侣昵称和PIN码' }
  }

  const users = await db.collection('shared_users').where({ nickname }).get()
  if (users.data.length === 0) {
    return { success: false, error: '未找到该用户，请确认昵称是否正确' }
  }

  const user = users.data[0]
  if (user.pin !== pin) {
    return { success: false, error: 'PIN码错误' }
  }

  return {
    success: true,
    found: true,
    nickname: user.nickname,
    paired: user.paired,
    partnerNickname: user.partnerNickname
  }
}

// 发起配对请求（写入双方信息）
async function pair(data) {
  const { myNickname, myPin, partnerNickname, partnerPin } = data

  // 验证双方身份
  const myUsers = await db.collection('shared_users').where({ nickname: myNickname }).get()
  if (myUsers.data.length === 0) {
    return { success: false, error: '我的信息未注册，请先注册' }
  }
  if (myUsers.data[0].pin !== myPin) {
    return { success: false, error: '我的PIN码错误' }
  }

  const partnerUsers = await db.collection('shared_users').where({ nickname: partnerNickname }).get()
  if (partnerUsers.data.length === 0) {
    return { success: false, error: '未找到伴侣信息，请确认昵称和PIN码' }
  }
  if (partnerUsers.data[0].pin !== partnerPin) {
    return { success: false, error: '伴侣PIN码错误' }
  }

  const partnerUser = partnerUsers.data[0]

  // 检查是否已被其他用户配对
  if (partnerUser.paired && partnerUser.partnerNickname !== myNickname) {
    return { success: false, error: '该用户已与其他账号配对' }
  }

  const now = Date.now()

  // 互相写入配对关系
  await db.collection('shared_users').doc(myUsers.data[0]._id).update({
    data: {
      partnerNickname,
      paired: true,
      updateTime: now
    }
  })

  await db.collection('shared_users').doc(partnerUsers.data[0]._id).update({
    data: {
      partnerNickname: myNickname,
      paired: true,
      updateTime: now
    }
  })

  return { success: true, pairedNickname: partnerNickname }
}

// 获取共享数据（配对双方共用）
async function getSharedData(data) {
  const { nickname, pin } = data

  const users = await db.collection('shared_users').where({ nickname }).get()
  if (users.data.length === 0 || users.data[0].pin !== pin) {
    return { success: false, error: '身份验证失败' }
  }

  const user = users.data[0]
  if (!user.paired) {
    return { success: false, error: '尚未配对', paired: false }
  }

  // 获取以双方昵称排序后作为key的共享数据
  const partnerNick = user.partnerNickname
  const [name1, name2] = [nickname, partnerNick].sort()

  const sharedDataList = await db.collection('shared_data').where({
    pairKey: name1 + '_' + name2
  }).get()

  if (sharedDataList.data.length > 0) {
    return {
      success: true,
      paired: true,
      partnerNickname: partnerNick,
      data: sharedDataList.data[0].content || {}
    }
  }

  return {
    success: true,
    paired: true,
    partnerNickname: partnerNick,
    data: {}
  }
}

// 更新共享数据
async function updateSharedData(data) {
  const { nickname, pin, content } = data

  const users = await db.collection('shared_users').where({ nickname }).get()
  if (users.data.length === 0 || users.data[0].pin !== pin) {
    return { success: false, error: '身份验证失败' }
  }

  const user = users.data[0]
  if (!user.paired) {
    return { success: false, error: '尚未配对' }
  }

  const partnerNick = user.partnerNickname
  const [name1, name2] = [nickname, partnerNick].sort()
  const pairKey = name1 + '_' + name2

  const existing = await db.collection('shared_data').where({ pairKey }).get()

  const now = Date.now()
  if (existing.data.length > 0) {
    await db.collection('shared_data').doc(existing.data[0]._id).update({
      data: {
        content,
        updateTime: now
      }
    })
  } else {
    await db.collection('shared_data').add({
      data: {
        pairKey,
        content,
        createTime: now,
        updateTime: now
      }
    })
  }

  return { success: true }
}

// 解除配对
async function unpair(data) {
  const { nickname, pin } = data

  const users = await db.collection('shared_users').where({ nickname }).get()
  if (users.data.length === 0 || users.data[0].pin !== pin) {
    return { success: false, error: '身份验证失败' }
  }

  const user = users.data[0]
  if (!user.paired) {
    return { success: false, error: '尚未配对' }
  }

  const partnerNick = user.partnerNickname
  const now = Date.now()

  // 清除自己的配对
  await db.collection('shared_users').doc(users.data[0]._id).update({
    data: {
      partnerNickname: '',
      paired: false,
      updateTime: now
    }
  })

  // 查找并更新伴侣的配对状态
  const partnerUsers = await db.collection('shared_users').where({ nickname: partnerNick }).get()
  if (partnerUsers.data.length > 0) {
    await db.collection('shared_users').doc(partnerUsers.data[0]._id).update({
      data: {
        partnerNickname: '',
        paired: false,
        updateTime: now
      }
    })
  }

  // 删除共享数据
  const [name1, name2] = [nickname, partnerNick].sort()
  const sharedDataList = await db.collection('shared_data').where({
    pairKey: name1 + '_' + name2
  }).get()
  if (sharedDataList.data.length > 0) {
    await db.collection('shared_data').doc(sharedDataList.data[0]._id).remove()
  }

  return { success: true }
}

// 验证配对状态
async function checkStatus(data) {
  const { nickname, pin } = data

  const users = await db.collection('shared_users').where({ nickname }).get()
  if (users.data.length === 0 || users.data[0].pin !== pin) {
    return { success: false, registered: false }
  }

  const user = users.data[0]
  return {
    success: true,
    registered: true,
    paired: user.paired,
    partnerNickname: user.partnerNickname || ''
  }
}

// 分析食材并返回营养素分类
async function classifyDishNutrition(data) {
  const { dish } = data

  if (!dish || !dish.ingredients || dish.ingredients.length === 0) {
    return { success: false, error: '缺少食材信息' }
  }

  const nutritionMap = {
    carbs: ['大米', '米饭', '土豆', '红薯', '面条', '面粉', '饺子', '蒸饺', '馒头', '包子', '面条', '冰糖'],
    protein: ['牛肉', '鸡胸肉', '鸡蛋', '虾', '排骨', '鱼肉', '鲈鱼', '螃蟹', '猪肉', '虾仁', '豆腐', '牛奶', '豆浆'],
    fat: ['油脂', '五花肉', '培根', '肥肉', '香油', '蚝油'],
    fiber: ['西兰花', '黄瓜', '番茄', '胡萝卜', '洋葱', '菠菜', '生菜', '白菜', '芹菜', '青椒', '茄子', '藕', '姜', '蒜', '葱']
  }

  const ingredientNames = dish.ingredients.map(i => i.name)
  const nutritionCounts = { carbs: 0, protein: 0, fat: 0, fiber: 0 }

  ingredientNames.forEach(name => {
    for (const [type, ingredients] of Object.entries(nutritionMap)) {
      if (ingredients.some(ing => name.includes(ing) || ing.includes(name))) {
        nutritionCounts[type]++
      }
    }
  })

  const maxCount = Math.max(...Object.values(nutritionCounts))
  const nutritionType = Object.keys(nutritionCounts).find(k => nutritionCounts[k] === maxCount) || 'protein'

  const nutritionTypesList = []
  if (nutritionCounts.carbs > 0) nutritionTypesList.push('carbs')
  if (nutritionCounts.protein > 0) nutritionTypesList.push('protein')
  if (nutritionCounts.fat > 0) nutritionTypesList.push('fat')
  if (nutritionCounts.fiber > 0) nutritionTypesList.push('fiber')

  const nutritionLabels = { carbs: '碳水', protein: '蛋白质', fat: '脂肪', fiber: '膳食纤维' }

  return {
    success: true,
    nutritionType,
    nutritionTypes: nutritionTypesList.length > 0 ? nutritionTypesList : ['protein'],
    nutritionLabel: nutritionLabels[nutritionType]
  }
}

exports.main = async (event) => {
  const { action, ...data } = event

  try {
    switch (action) {
      case 'register':
        return await register(data)
      case 'findPartner':
        return await findPartner(data)
      case 'pair':
        return await pair(data)
      case 'getSharedData':
        return await getSharedData(data)
      case 'updateSharedData':
        return await updateSharedData(data)
      case 'unpair':
        return await unpair(data)
      case 'checkStatus':
        return await checkStatus(data)
      case 'classifyDishNutrition':
        return await classifyDishNutrition(data)
      default:
        return { success: false, error: '未知操作' }
    }
  } catch (err) {
    console.error('pairPartner error:', err)
    return { success: false, error: err.message || '服务器错误' }
  }
}
