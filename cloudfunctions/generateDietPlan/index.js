// 云函数：generateDietPlan
// 生成AI个性化饮食计划

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// DeepSeek API配置 - 从环境变量读取
const API_KEY = process.env.DEEPSEEK_API_KEY
const API_URL = 'https://api.deepseek.com/v1/chat/completions'

if (!API_KEY) {
  throw new Error('缺少环境变量 DEEPSEEK_API_KEY，请联系管理员配置')
}

exports.main = async (event, context) => {
  const { action, ...rest } = event

  // 如果是每日建议请求
  if (action === 'dailyAdvice') {
    return await generateDailyAdvice(rest)
  }

  // 如果是风险评估请求
  if (action === 'evaluateRisks') {
    return await evaluateFoodRisks(rest)
  }

  // 原有阶段性计划逻辑（保持不变）
  const { dietGoal, activityLevel, allergies, currentPhase, targetWeight } = event

  // 构建Prompt
  const prompt = `你是专业营养师，请为用户生成个性化饮食计划。

用户信息：
- 目标：${dietGoal === 'lose' ? '减脂' : dietGoal === 'maintain' ? '维持体重' : '增肌'}
- 活动水平：${activityLevel === 'sedentary' ? '久坐少动' : activityLevel === 'moderate' ? '适度活动' : '运动较多'}
- 过敏食物：${allergies || '无'}
- 生理期阶段：${currentPhase === 'menstruation' ? '经期' : currentPhase === 'follicular' ? '卵泡期' : currentPhase === 'ovulation' ? '排卵期' : '黄体期'}
- 目标体重：${targetWeight || '未设定'}kg

请按以下JSON格式返回（必须严格遵守格式，不要添加任何额外文字）：
{
  "phases": [
    {
      "name": "适应期",
      "duration": "1-2周",
      "calories": "1800-2000kcal",
      "focus": "调整饮食结构，逐步减少高热量食物",
      "weeklyMenus": [
        {
          "week": 1,
          "days": [
            {
              "breakfast": {"name": "xxx", "effect": "功效说明", "ingredients": ["食材1", "食材2"]},
              "lunch": {"name": "xxx", "effect": "功效说明", "ingredients": ["食材1", "食材2"]},
              "dinner": {"name": "xxx", "effect": "功效说明", "ingredients": ["食材1", "食材2"]},
              "snacks": [{"name": "xxx", "time": "上午/下午/睡前"}]
            },
            {
              "breakfast": {"name": "xxx", "effect": "功效说明", "ingredients": ["食材1", "食材2"]},
              "lunch": {"name": "xxx", "effect": "功效说明", "ingredients": ["食材1", "食材2"]},
              "dinner": {"name": "xxx", "effect": "功效说明", "ingredients": ["食材1", "食材2"]},
              "snacks": [{"name": "xxx", "time": "上午/下午/睡前"}]
            }
          ]
        }
      ],
      "shoppingList": [
        {"name": "食材名", "amount": "数量+单位", "period": "2天"}
      ]
    },
    {
      "name": "强化期",
      "duration": "3-8周",
      "calories": "1400-1600kcal",
      "focus": "严格控制热量，增加蛋白质摄入",
      "weeklyMenus": [
        {
          "week": 1,
          "days": [
            {
              "breakfast": {"name": "xxx", "effect": "功效说明", "ingredients": ["食材1", "食材2"]},
              "lunch": {"name": "xxx", "effect": "功效说明", "ingredients": ["食材1", "食材2"]},
              "dinner": {"name": "xxx", "effect": "功效说明", "ingredients": ["食材1", "食材2"]},
              "snacks": [{"name": "xxx", "time": "上午/下午/睡前"}]
            }
          ]
        }
      ],
      "shoppingList": [
        {"name": "食材名", "amount": "数量+单位", "period": "2天"}
      ]
    },
    {
      "name": "巩固期",
      "duration": "2-4周",
      "calories": "1600-1800kcal",
      "focus": "稳定体重，养成健康饮食习惯",
      "weeklyMenus": [
        {
          "week": 1,
          "days": [
            {
              "breakfast": {"name": "xxx", "effect": "功效说明", "ingredients": ["食材1", "食材2"]},
              "lunch": {"name": "xxx", "effect": "功效说明", "ingredients": ["食材1", "食材2"]},
              "dinner": {"name": "xxx", "effect": "功效说明", "ingredients": ["食材1", "食材2"]},
              "snacks": [{"name": "xxx", "time": "上午/下午/睡前"}]
            }
          ]
        }
      ],
      "shoppingList": [
        {"name": "食材名", "amount": "数量+单位", "period": "2天"}
      ]
    }
  ]
}`

  try {
    // 调用DeepSeek API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位专业营养师，擅长根据用户身体状况和目标制定个性化饮食计划。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    })

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('API返回内容为空')
    }

    // 解析JSON响应
    // 尝试提取JSON（处理可能的前后缀文字）
    let jsonStr = content
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    const plan = JSON.parse(jsonStr)
    return { success: true, data: plan }

  } catch (error) {
    console.error('生成饮食计划失败:', error)
    return { success: false, error: error.message }
  }
}

// 生成每日饮食建议
async function generateDailyAdvice({ dietGoal, activityLevel, allergies, currentPhase, targetWeight, currentWeight, dietHistory, availableFoods }) {
  // 构建Prompt
  const prompt = `你是专业营养师，请根据用户近7天饮食历史，分析营养摄入情况，给出明日饮食建议。

用户信息：
- 目标：${dietGoal === 'lose' ? '减脂' : dietGoal === 'maintain' ? '维持体重' : '增肌'}
- 当前体重：${currentWeight || '未记录'}kg
- 目标体重：${targetWeight || '未设定'}kg
- 活动水平：${activityLevel === 'sedentary' ? '久坐少动' : activityLevel === 'moderate' ? '适度活动' : '运动较多'}
- 过敏食物：${allergies || '无'}
- 生理期阶段：${currentPhase === 'menstruation' ? '经期' : currentPhase === 'follicular' ? '卵泡期' : currentPhase === 'ovulation' ? '排卵期' : currentPhase === 'luteal' ? '黄体期' : '未知'}

近7天饮食历史：
${JSON.stringify(dietHistory, null, 2)}

现有菜品库：
${JSON.stringify(availableFoods.map(f => ({ id: f.id, name: f.name, emoji: f.emoji, nutritionTypes: f.nutritionTypes })), null, 2)}

请按以下JSON格式返回（必须严格遵守格式，不要添加任何额外文字）：
{
  "tomorrowMenu": {
    "breakfast": [{"id": "菜品id", "name": "菜品名", "emoji": "emoji", "nutritionTypes": ["protein"], "reason": "推荐理由"}],
    "lunch": [...],
    "dinner": [...]
  },
  "analysis": {
    "summary": "近7天饮食分析：...",
    "needsMore": [
      {"type": "protein", "reason": "原因", "suggestions": [{"id": "f003", "name": "西兰花炒鸡胸肉", "emoji": "🥦"}]}
    ],
    "needsLess": [
      {"type": "carbs", "reason": "原因", "currentAvg": "45%", "suggested": "35%"}
    ]
  },
  "nutritionPrediction": {
    "carbsCount": 2,
    "proteinCount": 3,
    "fatCount": 1,
    "fiberCount": 2
  }
}`

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位专业营养师，擅长分析饮食历史并给出针对性建议，只从提供的菜品库中选择菜品。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    })

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('API返回内容为空')
    }

    let jsonStr = content
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    const data = JSON.parse(jsonStr)
    return { success: true, data }

  } catch (error) {
    console.error('生成每日建议失败:', error)
    return { success: false, error: error.message }
  }
}

// 评估食材搭配风险
async function evaluateFoodRisks({ menu, menuItems }) {
  // 参数校验
  if (!menu || typeof menu !== 'object') {
    return { success: false, error: '缺少有效的菜单数据' }
  }

  // 收集所有菜品的食材
  const allIngredients = []
  const mealNames = []

  // 处理菜单结构：{ '早餐': [...], '午餐': [...], '晚餐': [...] }
  const meals = ['早餐', '午餐', '晚餐']
  for (const meal of meals) {
    const dishes = menu[meal] || []
    for (const dish of dishes) {
      if (!dish || !dish.name) continue
      mealNames.push(`${meal}：${dish.name}`)

      // 如果有完整菜品信息，使用其食材
      if (dish.ingredients && dish.ingredients.length > 0) {
        for (const ing of dish.ingredients) {
          if (ing.name && !allIngredients.includes(ing.name)) {
            allIngredients.push(ing.name)
          }
        }
      } else if (menuItems && menuItems.length > 0) {
        // 通过菜品库查找食材
        const found = menuItems.find(m => m.name === dish.name)
        if (found && found.ingredients) {
          for (const ing of found.ingredients) {
            if (ing.name && !allIngredients.includes(ing.name)) {
              allIngredients.push(ing.name)
            }
          }
        }
      }
    }
  }

  if (allIngredients.length === 0) {
    return { success: true, isSafe: true, risks: [] }
  }

  const prompt = `你是一个食材安全专家。请分析以下食材搭配是否存在风险：

食材列表：${allIngredients.join('、')}

已选菜品：
${mealNames.join('\n')}

请检查以下方面：
1. 食材相克（化学反应）- 如虾+维生素C水果会产生砒霜
2. 营养冲突（搭配禁忌）- 如菠菜+豆腐影响钙吸收
3. 特殊人群注意事项

如果存在风险，请按以下格式回复：
风险1：涉及食材[具体食材]，等级[危险/警告]，说明[具体说明]

如果多个风险，换行分隔。

如果没有风险，回复：安全，无已知风险搭配`

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位专业食材安全专家，擅长分析食材搭配的风险。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('API返回内容为空')
    }

    // 解析风险评估结果
    const risks = []
    const isSafe = content.includes('安全，无已知风险搭配')

    if (!isSafe) {
      // 使用正则匹配多种格式：风险1：涉及食材xxx，等级危险，说明xxx
      // 或者：涉及食材xxx，等级危险，说明xxx（可能在多行中）
      const riskPattern = /涉及食材(.+?)，等级(危险|警告)，说明(.+?)(?=风险|$)/gi
      let match
      while ((match = riskPattern.exec(content)) !== null) {
        risks.push({
          ingredients: match[1].split('、'),
          level: match[2] === '危险' ? 'danger' : 'warning',
          description: match[3].trim()
        })
      }
    }

    // 如果解析失败但AI没有说安全，应该标记为需要人工确认
    if (!isSafe && risks.length === 0) {
      return {
        success: true,
        isSafe: false,
        risks: [],
        needsReview: true,
        rawResponse: content
      }
    }

    return { success: true, isSafe, risks }

  } catch (error) {
    console.error('评估食材风险失败:', error)
    return { success: false, error: error.message }
  }
}