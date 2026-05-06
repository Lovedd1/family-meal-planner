# 菜品精简 + 水果分类 + DeepSeek风险评估

## 概述

优化点餐页面为4道基础菜品，增加冰箱水果分类，添加DeepSeek实时食材风险评估功能。

## 需求1：点餐页面精简为4道菜

### 保留菜品

| 营养类型 | 菜品 | Emoji | 说明 |
|---------|------|-------|------|
| 碳水 | 米饭 | 🍚 | 主食 |
| 蛋白质 | 土豆炖牛肉 | 🥘 | 荤素搭配 |
| 脂肪 | 凉拌黄瓜 | 🥒 | 唯一脂肪主导 |
| 膳食纤维 | 西兰花炒鸡胸肉 | 🥦 | 荤素搭配 |

### 修改文件
- `miniprogram/utils/foods.js` - 修改 foods 数组，保留4道菜
- `miniprogram/pages/order/order.js` - 分类保持不变（4个分类，但各分类只有1道菜）

## 需求2：冰箱页面增加水果分类

### 新增分类
- `fruit` - 水果类，emoji 🍎

### 修改文件
- `miniprogram/pages/fridge/fridge.wxml` - 更新分类卡片emoji
- `miniprogram/pages/fridge/fridge.js` - 更新 categories 数组
- `miniprogram/utils/foods.js` - 更新 ingredientCategories

## 需求3：确认菜单时DeepSeek实时评估风险

### 评估逻辑
1. 用户点击"确认菜单"按钮
2. 收集当前今日菜单所有菜品（早+中+晚）
3. 提取所有菜品食材列表
4. 调用 DeepSeek API 进行风险评估
5. 显示确认对话框，顶部显示风险结果

### 显示位置
- 确认菜单对话框顶部
- 格式：`⚠️ 风险提示` + 风险描述
- 在"早餐 X道菜"标题上方

### 评估提示词设计
```
你是一个食材安全专家。请分析以下食材搭配是否存在风险：

食材列表：
- 早餐：米饭、鸡蛋
- 午餐：土豆炖牛肉（土豆、牛肉、胡萝卜、洋葱）、凉拌黄瓜
- 晚餐：西兰花炒鸡胸肉

请检查：
1. 食材相克（化学反应）
2. 营养冲突（搭配禁忌）
3. 食用注意事项

如果存在风险，请说明：
- 涉及食材
- 风险等级（危险/警告）
- 具体说明

如果没有风险，回复："安全，无已知风险搭配"
```

### 显示样式
```
┌─────────────────────────────────┐
│ ⚠️ 风险提示                       │
│ ─────────────────────────────── │
│ 🥩 虾 + 🍊 橙子：可能产生有害物质  │
│ 等级：危险                       │
│ 说明：...                        │
├─────────────────────────────────┤
│ 早餐 · 2道菜                     │
│ ...                             │
└─────────────────────────────────┘
```

### 加载状态
- 显示"🤖 AI正在分析食材搭配风险..."
- 评估完成后显示结果

### 修改文件
- `miniprogram/pages/today/today.js` - 新增 `evaluateFoodRisks` 函数
- `miniprogram/pages/today/today.wxml` - 更新确认对话框显示风险
- `cloudfunctions/generateDietPlan/` - 可复用云函数或新建 `evaluateRisks` 云函数

## 技术实现

### DeepSeek调用
- 使用现有 `generateDietPlan` 云函数（已部署）
- 新增 action：`evaluateRisks`
- 输入：`{ action: "evaluateRisks", ingredients: [...] }`
- 输出：`{ risks: [{ ingredients: [], level: "danger|warning", description: "" }] }`

### 错误处理
- API调用失败：显示"风险评估服务暂时不可用，请稍后再试"
- 超时（10秒）：显示"风险评估超时"

## 修改文件清单

1. `miniprogram/utils/foods.js` - 精简菜品、新增水果分类
2. `miniprogram/pages/fridge/fridge.wxml` - 更新emoji
3. `miniprogram/pages/fridge/fridge.js` - 更新categories
4. `cloudfunctions/generateDietPlan/index.js` - 新增evaluateRisks action
5. `miniprogram/pages/today/today.js` - 新增评估逻辑
6. `miniprogram/pages/today/today.wxml` - 更新确认对话框