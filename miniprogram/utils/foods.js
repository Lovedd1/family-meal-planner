// 内置菜品数据（精简为4道，按营养类型：碳水/蛋白质/脂肪/膳食纤维）
const foods = [
  {
    id: 'f009',
    name: '米饭',
    emoji: '🍚',
    category: '主食',
    heatMethod: 'microwave_safe',
    ingredients: [
      { name: '大米', amount: '150g' }
    ],
    steps: [
      '大米淘洗干净',
      '加水1:1.2比例',
      '电饭煲煮饭模式',
      '跳闸后焖5分钟',
      '盛出食用'
    ],
    isCustom: false,
    nutritionType: 'carbs',
    nutritionTypes: ['carbs'],
    nutritionLabel: '碳水'
  },
  {
    id: 'f001',
    name: '土豆炖牛肉',
    emoji: '🥘',
    category: '荤菜',
    heatMethod: 'microwave_safe',
    ingredients: [
      { name: '土豆', amount: '200g' },
      { name: '牛肉', amount: '150g' },
      { name: '胡萝卜', amount: '50g' },
      { name: '洋葱', amount: '30g' }
    ],
    steps: [
      '牛肉切块焯水去血沫',
      '土豆、胡萝卜切块备用',
      '锅中加水，放入牛肉炖1小时',
      '加入土豆、胡萝卜继续炖30分钟',
      '调味出锅'
    ],
    isCustom: false,
    nutritionType: 'protein',
    nutritionTypes: ['carbs', 'protein', 'fiber'],
    nutritionLabel: '蛋白质'
  },
  {
    id: 'f007',
    name: '凉拌黄瓜',
    emoji: '🥒',
    category: '素菜',
    heatMethod: 'microwave_safe',
    ingredients: [
      { name: '黄瓜', amount: '300g' },
      { name: '蒜', amount: '10g' },
      { name: '醋', amount: '15ml' },
      { name: '香油', amount: '5ml' }
    ],
    steps: [
      '黄瓜拍碎切块',
      '蒜切末',
      '加入调料拌匀',
      '放入冰箱冷藏',
      '取出食用'
    ],
    isCustom: false,
    nutritionType: 'fat',
    nutritionTypes: ['fiber', 'fat'],
    nutritionLabel: '脂肪'
  },
  {
    id: 'f003',
    name: '西兰花炒鸡胸肉',
    emoji: '🥦',
    category: '荤菜',
    heatMethod: 'microwave_safe',
    ingredients: [
      { name: '西兰花', amount: '200g' },
      { name: '鸡胸肉', amount: '150g' },
      { name: '蒜', amount: '10g' }
    ],
    steps: [
      '西兰花切小朵焯水',
      '鸡胸肉切丁加料酒腌制',
      '热油炒鸡胸肉至变色',
      '加入西兰花翻炒',
      '调味出锅'
    ],
    isCustom: false,
    nutritionType: 'fiber',
    nutritionTypes: ['fiber', 'protein'],
    nutritionLabel: '膳食纤维'
  }
]

// 食物相克规则
const foodConflicts = [
  {
    ingredients: ['虾', '维C水果'],
    level: 'danger',
    description: '可能产生有害物质'
  },
  {
    ingredients: ['螃蟹', '梨', '柿子'],
    level: 'danger',
    description: '易引起腹泻'
  },
  {
    ingredients: ['葱', '洋葱', '蜂蜜'],
    level: 'danger',
    description: '可能引起肠胃不适'
  },
  {
    ingredients: ['鸡蛋', '豆浆'],
    level: 'warning',
    description: '影响蛋白质吸收'
  },
  {
    ingredients: ['牛肉', '栗子'],
    level: 'warning',
    description: '可能引起消化不良'
  },
  {
    ingredients: ['牛奶', '橙子', '柠檬'],
    level: 'warning',
    description: '影响消化吸收'
  },
  {
    ingredients: ['菠菜', '豆腐'],
    level: 'warning',
    description: '影响钙吸收'
  }
]

// 加热方式配置
const heatMethods = {
  microwave_safe: { label: '✅ 微波安全', class: 'tag-microwave-safe' },
  microwave_none: { label: '🔴 禁微波', class: 'tag-microwave-none' },
  steam_only: { label: '🟢 仅蒸制', class: 'tag-steam-only' },
  fire_only: { label: '🟠 仅明火', class: 'tag-fire-only' }
}

// 分类配置
const categories = [
  { value: 'all', label: '全部' },
  { value: '荤菜', label: '荤菜' },
  { value: '素菜', label: '素菜' },
  { value: '主食', label: '主食' },
  { value: '汤品', label: '汤品' }
]

// 营养素分类定义
const nutritionTypes = [
  { value: 'carbs', label: '碳水', emoji: '🥖', color: '#D4A828' },
  { value: 'protein', label: '蛋白质', emoji: '🥩', color: '#C45C5C' },
  { value: 'fat', label: '脂肪', emoji: '🥑', color: '#7A8AA0' },
  { value: 'fiber', label: '膳食纤维', emoji: '🥬', color: '#5A8A6A' }
]

// 食材→营养素映射表
const nutritionMap = {
  // 碳水化合物
  '大米': 'carbs', '米饭': 'carbs', '土豆': 'carbs', '红薯': 'carbs',
  '面条': 'carbs', '面粉': 'carbs', '饺子': 'carbs', '蒸饺': 'carbs',
  '馒头': 'carbs', '包子': 'carbs', '冰糖': 'carbs',
  // 蛋白质
  '牛肉': 'protein', '鸡胸肉': 'protein', '鸡蛋': 'protein', '虾': 'protein',
  '排骨': 'protein', '鱼肉': 'protein', '鲈鱼': 'protein', '螃蟹': 'protein',
  '猪肉': 'protein', '虾仁': 'protein', '豆腐': 'protein', '牛奶': 'protein',
  // 脂肪
  '油脂': 'fat', '五花肉': 'fat', '培根': 'fat', '肥肉': 'fat', '香油': 'fat',
  '花生': 'fat', '核桃': 'fat', '杏仁': 'fat', '芝麻': 'fat',
  // 水果类
  '苹果': 'fat', '香蕉': 'fat', '橙子': 'fat', '葡萄': 'fat', '西瓜': 'fat',
  '草莓': 'fat', '蓝莓': 'fat', '芒果': 'fat', '菠萝': 'fat', '梨': 'fat',
  // 膳食纤维
  '西兰花': 'fiber', '黄瓜': 'fiber', '番茄': 'fiber', '胡萝卜': 'fiber',
  '洋葱': 'fiber', '菠菜': 'fiber', '生菜': 'fiber', '白菜': 'fiber',
  '芹菜': 'fiber', '青椒': 'fiber', '茄子': 'fiber', '藕': 'fiber',
  '姜': 'fiber', '蒜': 'fiber', '葱': 'fiber',
  // 调料（不计入主要营养素）
  '蚝油': 'seasoning', '酱油': 'seasoning', '盐': 'seasoning', '料酒': 'seasoning',
  '生抽': 'seasoning', '老抽': 'seasoning', '蒸鱼豉油': 'seasoning', '醋': 'seasoning'
}

// 获取菜品营养素分类
function getDishNutrition(dish) {
  if (!dish || !dish.ingredients || dish.ingredients.length === 0) {
    return { nutritionType: 'protein', nutritionTypes: ['protein'], nutritionLabel: '蛋白质' }
  }

  const ingredientNames = dish.ingredients.map(i => i.name)
  const nutritionCounts = { carbs: 0, protein: 0, fat: 0, fiber: 0 }

  ingredientNames.forEach(name => {
    const nutrition = nutritionMap[name]
    if (nutrition === 'carbs') nutritionCounts.carbs++
    else if (nutrition === 'protein') nutritionCounts.protein++
    else if (nutrition === 'fat') nutritionCounts.fat++
    else if (nutrition === 'fiber') nutritionCounts.fiber++
  })

  // 找出最多的营养素
  const maxCount = Math.max(...Object.values(nutritionCounts))
  if (maxCount === 0) {
    return { nutritionType: 'protein', nutritionTypes: ['protein'], nutritionLabel: '蛋白质' }
  }

  const nutritionType = Object.keys(nutritionCounts).find(k => nutritionCounts[k] === maxCount) || 'protein'
  const nutritionTypeObj = nutritionTypes.find(n => n.value === nutritionType)
  const nutritionLabel = nutritionTypeObj?.label || '蛋白质'

  // 所有有分类的营养素
  const nutritionTypesList = []
  if (nutritionCounts.carbs > 0) nutritionTypesList.push('carbs')
  if (nutritionCounts.protein > 0) nutritionTypesList.push('protein')
  if (nutritionCounts.fat > 0) nutritionTypesList.push('fat')
  if (nutritionCounts.fiber > 0) nutritionTypesList.push('fiber')

  return {
    nutritionType,
    nutritionTypes: nutritionTypesList.length > 0 ? nutritionTypesList : ['protein'],
    nutritionLabel
  }
}

// 食材分类
const ingredientCategories = [
  { value: 'meat', label: '肉类' },
  { value: 'vegetable', label: '蔬菜类' },
  { value: 'fruit', label: '水果类' },
  { value: 'seasoning', label: '调料类' }
]

// 检测食材相克
function checkFoodConflict(ingredients) {
  const warnings = []
  // 过滤无效食材
  const validIngredients = ingredients.filter(i => i && i.name)
  const ingredientNames = validIngredients.map(i => i.name)

  for (const conflict of foodConflicts) {
    const matched = conflict.ingredients.filter(ing => ingredientNames.includes(ing))
    if (matched.length >= 2) {
      warnings.push({
        ...conflict,
        matched: matched
      })
    }
  }

  return warnings
}

// 获取菜品加热标签
function getHeatMethodLabel(heatMethod) {
  return heatMethods[heatMethod] || heatMethods.microwave_safe
}

// 按分类筛选
function filterByCategory(foodList, category) {
  if (category === 'all') return foodList
  return foodList.filter(f => f.category === category)
}

// 搜索菜品
function searchFoods(foodList, keyword) {
  if (!keyword) return foodList
  const kw = keyword.toLowerCase()
  return foodList.filter(f =>
    f.name.toLowerCase().includes(kw) ||
    f.ingredients.some(i => i.name.toLowerCase().includes(kw))
  )
}

module.exports = {
  foods,
  foodConflicts,
  heatMethods,
  categories,
  ingredientCategories,
  nutritionTypes,
  checkFoodConflict,
  getHeatMethodLabel,
  filterByCategory,
  searchFoods,
  getDishNutrition
}
