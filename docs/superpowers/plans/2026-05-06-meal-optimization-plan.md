# 菜品精简 + 水果分类 + DeepSeek评估 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将点餐页面精简为4道菜，冰箱增加水果分类，确认菜单时调用DeepSeek实时评估食材风险

**Architecture:**
- 修改 foods.js 精简内置菜品
- 修改 fridge 页面添加水果分类
- 修改 today 页面在确认菜单时调用云函数评估风险
- 在 generateDietPlan 云函数中新增 evaluateRisks action

**Tech Stack:** 微信小程序 + 云开发 + DeepSeek API

---

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `miniprogram/utils/foods.js` | 修改 | 精简为4道菜，新增水果分类 |
| `miniprogram/pages/fridge/fridge.wxml` | 修改 | 更新分类卡片emoji |
| `miniprogram/pages/fridge/fridge.js` | 修改 | 更新categories数组 |
| `cloudfunctions/generateDietPlan/index.js` | 修改 | 新增evaluateRisks action |
| `miniprogram/pages/today/today.js` | 修改 | 新增评估逻辑 |
| `miniprogram/pages/today/today.wxml` | 修改 | 更新确认对话框显示风险 |

---

## Task 1: 精简 foods.js 内置菜品

**Files:**
- Modify: `miniprogram/utils/foods.js:1-280`

- [ ] **Step 1: 编辑 foods.js，保留4道菜**

找到 foods 数组（第2-280行），替换为：

```javascript
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
```

- [ ] **Step 2: 更新 ingredientCategories，新增水果分类**

找到 ingredientCategories（约第410行），替换为：

```javascript
const ingredientCategories = [
  { value: 'meat', label: '肉类' },
  { value: 'vegetable', label: '蔬菜类' },
  { value: 'fruit', label: '水果类' },
  { value: 'seasoning', label: '调料类' }
]
```

- [ ] **Step 3: 更新 nutritionMap，添加常见水果**

找到 nutritionMap（约第347行），在膳食纤维部分添加：

```javascript
  // 膳食纤维
  '西兰花': 'fiber', '黄瓜': 'fiber', '番茄': 'fiber', '胡萝卜': 'fiber',
  '洋葱': 'fiber', '菠菜': 'fiber', '生菜': 'fiber', '白菜': 'fiber',
  '芹菜': 'fiber', '青椒': 'fiber', '茄子': 'fiber', '藕': 'fiber',
  '姜': 'fiber', '蒜': 'fiber', '葱': 'fiber',
  // 水果映射到脂肪（果糖）
  '苹果': 'fat', '香蕉': 'fat', '橙子': 'fat', '葡萄': 'fat', '西瓜': 'fat',
  '草莓': 'fat', '蓝莓': 'fat', '芒果': 'fat', '梨': 'fat', '桃': 'fat'
```

- [ ] **Step 4: 提交**

```bash
git add miniprogram/utils/foods.js
git commit -m "feat: 精简内置菜品为4道(碳水/蛋白质/脂肪/膳食纤维)，新增水果分类"
```

---

## Task 2: 修改冰箱页面支持水果分类

**Files:**
- Modify: `miniprogram/pages/fridge/fridge.wxml:14-24`
- Modify: `miniprogram/pages/fridge/fridge.js`

- [ ] **Step 1: 修改 fridge.wxml 分类卡片emoji**

找到 category-card 模板（约第14-24行），替换为：

```html
    <view
      class="category-card"
      wx:for="{{categories}}"
      wx:key="value"
      data-category="{{item.value}}"
      bindtap="switchFilter"
    >
      <text class="category-emoji">{{item.value === 'all' ? '📦' : item.value === 'meat' ? '🥩' : item.value === 'vegetable' ? '🥬' : item.value === 'fruit' ? '🍎' : '🧂'}}</text>
      <text class="category-name">{{item.label}}</text>
      <text class="category-count">{{item.count}}种</text>
    </view>
```

- [ ] **Step 2: 修改 fridge.wxml 物品卡片emoji**

找到 item-category-tag（约第58行），替换为：

```html
            <text class="item-category-tag">{{subItem.category === 'meat' ? '🥩' : subItem.category === 'vegetable' ? '🥬' : subItem.category === 'fruit' ? '🍎' : '🧂'}}</text>
```

- [ ] **Step 3: 修改 fridge.wxml 添加食材弹窗中的水果选项**

找到 radio-group（约第99-103行），替换为：

```html
            <radio-group name="category">
              <label><radio value="meat" /> 🥩 肉类</label>
              <label><radio value="vegetable" /> 🥬 蔬菜类</label>
              <label><radio value="fruit" /> 🍎 水果类</label>
              <label><radio value="seasoning" /> 🧂 调料类</label>
            </radio-group>
```

- [ ] **Step 4: 修改 fridge.js categories数组**

找到 categories 定义，替换为：

```javascript
const categories = [
  { value: 'all', label: '全部', count: 0 },
  { value: 'meat', label: '肉类', count: 0 },
  { value: 'vegetable', label: '蔬菜类', count: 0 },
  { value: 'fruit', label: '水果类', count: 0 },
  { value: 'seasoning', label: '调料类', count: 0 }
]
```

- [ ] **Step 5: 提交**

```bash
git add miniprogram/pages/fridge/fridge.wxml miniprogram/pages/fridge/fridge.js
git commit -m "feat(fridge): 支持水果分类"
```

---

## Task 3: 云函数新增 evaluateRisks action

**Files:**
- Modify: `cloudfunctions/generateDietPlan/index.js`

- [ ] **Step 1: 查看当前云函数结构**

```bash
cat cloudfunctions/generateDietPlan/index.js
```

找到 switch 语句部分，添加新的 case。

- [ ] **Step 2: 添加 evaluateRisks case**

在 switch 语句中添加：

```javascript
case 'evaluateRisks':
  const { menu } = data;
  if (!menu || typeof menu !== 'object') {
    return { success: false, error: '缺少菜单数据' };
  }

  // 收集所有食材
  const allIngredients = [];
  const mealNames = [];

  for (const [meal, foods] of Object.entries(menu)) {
    if (Array.isArray(foods) && foods.length > 0) {
      mealNames.push(`${meal}：${foods.map(f => f.name).join('、')}`);
      foods.forEach(food => {
        if (food.ingredients) {
          food.ingredients.forEach(ing => {
            if (ing.name && !allIngredients.includes(ing.name)) {
              allIngredients.push(ing.name);
            }
          });
        }
      });
    }
  }

  const riskPrompt = `你是一个食材安全专家。请分析以下食材搭配是否存在风险：

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

如果没有风险，回复：安全，无已知风险搭配`;

  const messages = [
    { role: 'system', content: '你是一个专业的食材安全专家，只分析食材搭配风险，回复简洁准确。' },
    { role: 'user', content: riskPrompt }
  ];

  try {
    const response = await callDeepSeek(messages, 0.3);
    const riskText = response.choices?.[0]?.message?.content || '';

    // 解析风险
    const risks = [];
    const riskPattern = /风险\d+：涉及食材(.+?)，等级(.+?)，说明(.+?)(?=风险\d+|$)/gi;
    let match;
    while ((match = riskPattern.exec(riskText)) !== null) {
      risks.push({
        ingredients: match[1].trim(),
        level: match[2].trim(),
        description: match[3].trim()
      });
    }

    // 检查是否安全
    const isSafe = riskText.includes('安全') || risks.length === 0;

    return {
      success: true,
      isSafe,
      risks,
      rawResponse: riskText
    };
  } catch (error) {
    return { success: false, error: error.message || '评估服务暂时不可用' };
  }
```

- [ ] **Step 3: 提交**

```bash
git add cloudfunctions/generateDietPlan/index.js
git commit -m "feat(cloud): generateDietPlan支持evaluateRisks action"
```

---

## Task 4: 修改今日菜单页面集成风险评估

**Files:**
- Modify: `miniprogram/pages/today/today.js`
- Modify: `miniprogram/pages/today/today.wxml`

- [ ] **Step 1: 查看 today.js 结构**

```bash
head -100 miniprogram/pages/today/today.js
```

找到 confirmMenu 或相关确认函数。

- [ ] **Step 2: 在 today.js 中新增 evaluateMenuRisks 函数**

在 Page({}) 之前添加：

```javascript
// 评估菜单风险
async function evaluateMenuRisks(menu) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'generateDietPlan',
      data: {
        action: 'evaluateRisks',
        menu: menu
      }
    });

    if (result.result && result.result.success) {
      return result.result;
    }
    return { isSafe: true, risks: [] };
  } catch (e) {
    console.error('风险评估失败', e);
    return { isSafe: true, risks: [], error: '评估服务暂时不可用' };
  }
}
```

- [ ] **Step 3: 修改 confirmMenu 函数，添加风险评估**

找到 confirmMenu 函数，修改为：

```javascript
async function confirmMenu() {
  // 显示加载状态
  that.setData({ isEvaluating: true, riskResult: null });

  // 收集当前菜单
  const menu = {
    '早餐': that.data.breakfastMenu,
    '午餐': that.data.lunchMenu,
    '晚餐': that.data.dinnerMenu
  };

  // 评估风险
  const riskResult = await evaluateMenuRisks(menu);

  that.setData({
    isEvaluating: false,
    riskResult: riskResult,
    showConfirmModal: true
  });
}
```

- [ ] **Step 4: 在 today.js data 中新增字段**

找到 data 对象，添加：

```javascript
isEvaluating: false,
riskResult: null,
```

- [ ] **Step 5: 修改 today.wxml 确认弹窗显示风险**

找到确认弹窗部分（showConfirmModal），在早餐标题上方添加风险显示：

```html
<!-- 确认菜单弹窗 -->
<view class="modal" wx:if="{{showConfirmModal}}" bindtap="closeConfirmModal">
  <view class="modal-content" catchtap="">

    <!-- 风险提示区域 -->
    <view class="risk-alert" wx:if="{{riskResult && !riskResult.isSafe && riskResult.risks.length > 0}}">
      <view class="risk-header">
        <text class="risk-icon">⚠️</text>
        <text class="risk-title">食材搭配风险提示</text>
      </view>
      <view class="risk-list">
        <view class="risk-item" wx:for="{{riskResult.risks}}" wx:key="index">
          <text class="risk-ingredients">{{item.ingredients}}</text>
          <text class="risk-level {{item.level === '危险' ? 'danger' : 'warning'}}">等级：{{item.level}}</text>
          <text class="risk-desc">{{item.description}}</text>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="evaluating-status" wx:if="{{isEvaluating}}">
      <text>🤖 AI正在分析食材搭配风险...</text>
    </view>

    <!-- 早餐 -->
    <view class="meal-section">
      <view class="meal-header">早餐 · {{breakfastMenu.length}}道菜</view>
      ...
```

添加样式（在 today.wxss 中）：

```css
/* 风险提示样式 */
.risk-alert {
  background: #FFF5F5;
  border: 1rpx solid #FFCCCC;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.risk-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.risk-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.risk-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #C45C5C;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.risk-item {
  background: white;
  border-radius: 12rpx;
  padding: 16rpx;
}

.risk-ingredients {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.risk-level {
  font-size: 24rpx;
  display: inline-block;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-right: 12rpx;
}

.risk-level.danger {
  background: #FFE5E5;
  color: #C45C5C;
}

.risk-level.warning {
  background: #FFF4E5;
  color: #D4881C;
}

.risk-desc {
  font-size: 24rpx;
  color: #666;
}

.evaluating-status {
  text-align: center;
  padding: 24rpx;
  color: #999;
  font-size: 26rpx;
}
```

- [ ] **Step 6: 提交**

```bash
git add miniprogram/pages/today/today.js miniprogram/pages/today/today.wxml miniprogram/pages/today/today.wxss
git commit -m "feat(today): 确认菜单时调用DeepSeek评估食材风险"
```

---

## Task 5: 最终验证

- [ ] **Step 1: 验证 foods.js 只包含4道菜**

```bash
grep -c "id:" miniprogram/utils/foods.js
```

预期输出：4

- [ ] **Step 2: 验证云函数包含 evaluateRisks**

```bash
grep "evaluateRisks" cloudfunctions/generateDietPlan/index.js
```

预期输出：包含 case 'evaluateRisks'

- [ ] **Step 3: 验证冰箱页面包含水果选项**

```bash
grep "fruit" miniprogram/pages/fridge/fridge.js
```

预期输出：包含 fruit 分类定义

---

## 执行方式

**Plan complete and saved to `docs/superpowers/plans/2026-05-06-meal-optimization-plan.md`**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**