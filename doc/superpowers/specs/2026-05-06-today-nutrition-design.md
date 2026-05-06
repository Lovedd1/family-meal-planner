# 今日菜单页 - 营养素分类功能设计

## 需求
1. 给今日菜单页增加营养素分类（碳水、脂肪、蛋白质、膳食纤维）
2. 固定菜品用预设映射表判断营养素
3. 自定义新菜品由 DeepSeek API 自动分析食材并补充分类
4. UI 采用 Tab + 标签形式（新增"营养"Tab + 菜品卡片营养标签）

## 架构

### 营养素分类方案
- **固定菜品**：使用预设 `nutritionMap` 映射表
- **自定义新菜品**：保存时调用 `classifyDishNutrition` 云函数，AI 分析食材返回分类

### 营养素分类映射表示例

```javascript
const nutritionMap = {
  // 碳水化合物
  '大米': 'carbs', '米饭': 'carbs', '土豆': 'carbs', '红薯': 'carbs',
  '面条': 'carbs', '面粉': 'carbs', '饺子': 'carbs', '蒸饺': 'carbs',
  // 蛋白质
  '牛肉': 'protein', '鸡胸肉': 'protein', '鸡蛋': 'protein', '虾': 'protein',
  '排骨': 'protein', '鱼肉': 'protein', '鲈鱼': 'protein',
  // 脂肪
  '猪肉': 'fat', '五花肉': 'fat', '培根': 'fat', '油脂': 'fat',
  // 膳食纤维
  '西兰花': 'fiber', '黄瓜': 'fiber', '番茄': 'fiber', '胡萝卜': 'fiber',
  '洋葱': 'fiber', '菠菜': 'fiber', '生菜': 'fiber',
  // 混合类（多种营养素）
  '豆腐': 'protein', // 豆腐算蛋白质
  '牛奶': 'protein', // 牛奶算蛋白质
}
```

### 营养素定义

| 分类 | Key | Emoji | 说明 |
|------|-----|-------|------|
| 碳水化合物 | carbs | 🥖 | 米饭、土豆、红薯、面条等 |
| 蛋白质 | protein | 🥩 | 肉类、鸡蛋、虾、鱼等 |
| 脂肪 | fat | 🥑 | 油脂、五花肉等 |
| 膳食纤维 | fiber | 🥬 | 蔬菜类 |

## 改动范围

### 1. foods.js - 新增营养素分类

**新增内容：**
- `nutritionMap` - 食材→营养素映射表
- `nutritionTypes` - 营养素定义列表
- `getDishNutrition(dish)` - 获取菜品营养素分类
- `classifyDishNutrition(dish)` - 分类函数（本地+AI fallback）

**Dish 数据结构扩展：**
```javascript
{
  id: 'f001',
  name: '土豆炖牛肉',
  emoji: '🥘',
  category: '荤菜',
  heatMethod: 'microwave_safe',
  ingredients: [
    { name: '土豆', amount: '200g' },
    { name: '牛肉', amount: '150g' }
  ],
  nutritionType: 'protein', // 主要营养素类型
  nutritionTypes: ['carbs', 'protein'], // 所有营养素类型数组
  steps: [...],
  isCustom: false
}
```

### 2. pairPartner 云函数 - 新增 classifyDishNutrition

**输入：**
```json
{
  "action": "classifyDishNutrition",
  "dish": {
    "name": "番茄鸡蛋面",
    "ingredients": [
      { "name": "番茄", "amount": "200g" },
      { "name": "鸡蛋", "amount": "2个" },
      { "name": "面条", "amount": "100g" }
    ]
  }
}
```

**输出：**
```json
{
  "success": true,
  "nutritionType": "carbs",
  "nutritionTypes": ["carbs", "protein", "fiber"]
}
```

### 3. order.js - 新增菜品时调用分类

修改 `saveCustomFood` 方法：
1. 保存前调用 `classifyDishNutrition` 云函数
2. 将返回的 `nutritionType` 和 `nutritionTypes` 存入菜品数据
3. 如果调用失败，使用本地映射表 fallback

### 4. today.wxml - 新增营养 Tab

**Tab 栏扩展：**
```xml
<view class="tab-bar">
  <view class="tab-item {{currentTab === 'breakfast' ? 'active' : ''}}" data-tab="breakfast">🌅 早餐</view>
  <view class="tab-item {{currentTab === 'lunch' ? 'active' : ''}}" data-tab="lunch">☀️ 午餐</view>
  <view class="tab-item {{currentTab === 'dinner' ? 'active' : ''}}" data-tab="dinner">🌙 晚餐</view>
  <view class="tab-item {{currentTab === 'nutrition' ? 'active' : ''}}" data-tab="nutrition">📊 营养</view>
</view>
```

**营养 Tab 内容：**
```xml
<view class="nutrition-tab" wx:if="{{currentTab === 'nutrition'}}">
  <!-- 营养分布概览 -->
  <view class="nutrition-summary">
    <view class="nutrition-chart">
      <view class="chart-bar carbs" style="height: {{nutritionStats.carbsPercent}}%"></view>
      <view class="chart-bar protein" style="height: {{nutritionStats.proteinPercent}}%"></view>
      <view class="chart-bar fat" style="height: {{nutritionStats.fatPercent}}%"></view>
      <view class="chart-bar fiber" style="height: {{nutritionStats.fiberPercent}}%"></view>
    </view>
    <view class="nutrition-legend">
      <view class="legend-item"><text class="dot carbs"></text>碳水 {{nutritionStats.carbsCount}}道</view>
      <view class="legend-item"><text class="dot protein"></text>蛋白质 {{nutritionStats.proteinCount}}道</view>
      <view class="legend-item"><text class="dot fat"></text>脂肪 {{nutritionStats.fatCount}}道</view>
      <view class="legend-item"><text class="dot fiber"></text>膳食纤维 {{nutritionStats.fiberCount}}道</view>
    </view>
  </view>

  <!-- 分类列表 -->
  <view class="nutrition-list">
    <view class="nutrition-group" wx:for="{{nutritionGroups}}" wx:key="type">
      <view class="group-header {{item.type}}">
        <text class="group-emoji">{{item.emoji}}</text>
        <text class="group-name">{{item.label}}</text>
        <text class="group-count">{{item.dishes.length}}道菜</text>
      </view>
      <view class="group-dishes">
        <view class="mini-dish" wx:for="{{item.dishes}}" wx:key="id">
          <text>{{item.emoji}}</text>
          <text>{{item.name}}</text>
        </view>
      </view>
    </view>
  </view>
</view>
```

**菜品卡片扩展（其他Tab）：**
在 dish-name 旁边增加营养标签：
```xml
<view class="dish-name">
  <text>{{item.name}}</text>
  <view class="tag nutrition-tag {{item.nutritionType}}">{{item.nutritionLabel}}</view>
</view>
```

### 5. today.wxss - 新增营养 Tab 样式

- `.nutrition-tab` - 营养Tab容器
- `.nutrition-summary` - 营养概览卡片
- `.nutrition-chart` + `.chart-bar` - 柱状图样式
- `.nutrition-legend` + `.legend-item` - 图例样式
- `.nutrition-list` - 分类列表
- `.nutrition-group` - 分组样式
- `.nutrition-tag` - 菜品营养标签样式（按类型不同颜色）

### 6. today.js - 新增营养数据处理

**data 扩展：**
```javascript
data: {
  currentTab: 'breakfast',
  tabs: [
    { key: 'breakfast', label: '🌅 早餐', count: 0 },
    { key: 'lunch', label: '☀️ 午餐', count: 0 },
    { key: 'dinner', label: '🌙 晚餐', count: 0 },
    { key: 'nutrition', label: '📊 营养', count: 0 }
  ],
  nutritionStats: { carbsCount: 0, proteinCount: 0, fatCount: 0, fiberCount: 0 },
  nutritionGroups: [],
  // ... 其他现有data
}
```

**新增方法：**
- `calculateNutritionStats()` - 计算营养统计数据
- `groupDishesByNutrition()` - 按营养素分组菜品
- `switchTab()` - 扩展支持 nutrition tab

### 7. cloudfunctions/pairPartner - 新增 classifyDishNutrition action

使用 DeepSeek API 分析食材，返回营养素分类。

## 文件清单

| 文件 | 改动 |
|------|------|
| `miniprogram/utils/foods.js` | 新增 nutritionMap、nutritionTypes、getDishNutrition 函数 |
| `cloudfunctions/pairPartner/index.js` | 新增 classifyDishNutrition action |
| `miniprogram/pages/order/order.js` | saveCustomFood 时调用分类云函数 |
| `miniprogram/pages/today/today.wxml` | 新增营养Tab、菜品营养标签 |
| `miniprogram/pages/today/today.wxss` | 新增营养Tab样式 |
| `miniprogram/pages/today/today.js` | 新增营养数据处理逻辑 |

## 实施顺序

1. **foods.js** - 先加映射表和本地分类函数（不需要改云函数）
2. **today.js/wxml/wxss** - 先实现营养Tab UI（用现有数据）
3. **order.js** - 自定义菜品保存时调用云函数补充分类
4. **pairPartner 云函数** - 部署 classifyDishNutrition
