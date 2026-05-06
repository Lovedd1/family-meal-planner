// 内置菜品数据
const foods = [
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
    id: 'f002',
    name: '番茄炒蛋',
    emoji: '🍳',
    category: '素菜',
    heatMethod: 'microwave_safe',
    ingredients: [
      { name: '番茄', amount: '200g' },
      { name: '鸡蛋', amount: '2个' },
      { name: '葱', amount: '10g' }
    ],
    steps: [
      '番茄切块，鸡蛋打散',
      '热油炒鸡蛋至凝固盛出',
      '另起油锅炒番茄出汁',
      '加入鸡蛋翻炒均匀',
      '调味出锅'
    ],
    isCustom: false,
    nutritionType: 'protein',
    nutritionTypes: ['protein', 'fiber'],
    nutritionLabel: '蛋白质'
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
  },
  {
    id: 'f004',
    name: '清蒸鲈鱼',
    emoji: '🐟',
    category: '荤菜',
    heatMethod: 'steam_only',
    ingredients: [
      { name: '鲈鱼', amount: '1条' },
      { name: '葱', amount: '20g' },
      { name: '姜', amount: '15g' },
      { name: '蒸鱼豉油', amount: '20ml' }
    ],
    steps: [
      '鲈鱼处理干净，两面划刀',
      '鱼身铺上葱姜',
      '水开后蒸8-10分钟',
      '取出倒掉汤汁',
      '淋上蒸鱼豉油即可'
    ],
    isCustom: false,
    nutritionType: 'protein',
    nutritionTypes: ['protein', 'fiber'],
    nutritionLabel: '蛋白质'
  },
  {
    id: 'f005',
    name: '水煮蛋',
    emoji: '🥚',
    category: '荤菜',
    heatMethod: 'fire_only',
    ingredients: [
      { name: '鸡蛋', amount: '2个' }
    ],
    steps: [
      '鸡蛋洗净',
      '冷水下锅',
      '水开后煮8分钟',
      '捞出过凉水',
      '剥壳食用'
    ],
    isCustom: false,
    nutritionType: 'protein',
    nutritionTypes: ['protein'],
    nutritionLabel: '蛋白质'
  },
  {
    id: 'f006',
    name: '白灼虾',
    emoji: '🦐',
    category: '荤菜',
    heatMethod: 'fire_only',
    ingredients: [
      { name: '虾', amount: '300g' },
      { name: '姜', amount: '15g' },
      { name: '葱', amount: '10g' },
      { name: '料酒', amount: '10ml' }
    ],
    steps: [
      '虾洗净去虾线',
      '锅中加水、姜、葱、料酒',
      '水开后放入虾',
      '变色弯曲后捞出',
      '蘸料食用'
    ],
    isCustom: false,
    nutritionType: 'protein',
    nutritionTypes: ['protein', 'fiber'],
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
    nutritionType: 'fiber',
    nutritionTypes: ['fiber', 'fat'],
    nutritionLabel: '膳食纤维'
  },
  {
    id: 'f008',
    name: '番茄牛肉汤',
    emoji: '🍲',
    category: '汤品',
    heatMethod: 'microwave_safe',
    ingredients: [
      { name: '番茄', amount: '200g' },
      { name: '牛肉', amount: '100g' },
      { name: '土豆', amount: '100g' },
      { name: '洋葱', amount: '30g' }
    ],
    steps: [
      '牛肉切块焯水',
      '番茄、土豆切块',
      '锅中加水炖牛肉1小时',
      '加入番茄、土豆继续炖30分钟',
      '调味出锅'
    ],
    isCustom: false,
    nutritionType: 'protein',
    nutritionTypes: ['carbs', 'protein', 'fiber'],
    nutritionLabel: '蛋白质'
  },
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
    id: 'f010',
    name: '红烧排骨',
    emoji: '🍖',
    category: '荤菜',
    heatMethod: 'microwave_safe',
    ingredients: [
      { name: '排骨', amount: '300g' },
      { name: '冰糖', amount: '20g' },
      { name: '生抽', amount: '20ml' },
      { name: '老抽', amount: '10ml' }
    ],
    steps: [
      '排骨切段焯水',
      '冰糖炒糖色',
      '加入排骨翻炒上色',
      '加水没过排骨',
      '大火烧开转小火炖40分钟收汁'
    ],
    isCustom: false,
    nutritionType: 'protein',
    nutritionTypes: ['carbs', 'protein'],
    nutritionLabel: '蛋白质'
  },
  {
    id: 'f011',
    name: '蒜蓉西兰花',
    emoji: '🧄',
    category: '素菜',
    heatMethod: 'microwave_safe',
    ingredients: [
      { name: '西兰花', amount: '300g' },
      { name: '蒜', amount: '15g' },
      { name: '蚝油', amount: '15ml' }
    ],
    steps: [
      '西兰花切小朵焯水',
      '蒜切末',
      '热油爆香蒜末',
      '加入西兰花翻炒',
      '加蚝油调味出锅'
    ],
    isCustom: false,
    nutritionType: 'fiber',
    nutritionTypes: ['fiber'],
    nutritionLabel: '膳食纤维'
  },
  {
    id: 'f012',
    name: '蒸饺',
    emoji: '🥟',
    category: '主食',
    heatMethod: 'steam_only',
    ingredients: [
      { name: '饺子', amount: '8个' },
      { name: '水', amount: '适量' }
    ],
    steps: [
      '饺子摆入蒸笼',
      '水开后放入蒸笼',
      '中火蒸10分钟',
      '关火焖2分钟',
      '取出食用'
    ],
    isCustom: false,
    nutritionType: 'carbs',
    nutritionTypes: ['carbs'],
    nutritionLabel: '碳水'
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
  { value: 'seasoning', label: '调料类' }
]

// 检测食材相克
function checkFoodConflict(ingredients) {
  const warnings = []
  const ingredientNames = ingredients.map(i => i.name)

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
