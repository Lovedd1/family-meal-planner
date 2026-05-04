# 家庭饮食健康管家

## 技术栈
- 微信小程序 + 云开发
- AI: DeepSeek API
- Git: GitHub (https://github.com/Lovedd1/family-meal-planner)

## 项目结构
```
├── miniprogram/          # 小程序主体
│   ├── pages/
│   │   ├── today/        # 今日菜单 ✓
│   │   ├── health/       # 健康计划 ✓
│   │   ├── order/        # 点餐 ✓
│   │   ├── fridge/       # 我的冰箱 ✓
│   │   └── settings/     # 设置 ✓
│   ├── utils/
│   │   ├── foods.js      # 12道菜品 + 相克规则
│   │   └── storageAdapter.js  # 离线优先存储适配层
│   └── static/           # TabBar图标 (SVG/PNG)
├── cloudfunctions/       # 云函数
│   └── generateDietPlan/ # AI饮食计划生成
└── doc/                  # 文档
```

## 开发进度 (2026-05-04)

### 已完成 ✅
- [x] 方案设计 (方案.md)
- [x] 项目初始化
- [x] 今日菜单页面 (早中晚三餐Tab、菜品卡片、配方弹窗、确认扣减)
- [x] 点餐页面 (搜索、分类筛选、添加到菜单、自定义菜品、相克检测)
- [x] 我的冰箱页面 (分类统计、添加食材、剩余天数预警、删除)
- [x] 健康计划页面 (体重记录、趋势图、生理期追踪、AI饮食计划)
- [x] 设置页面 (用户信息、数据同步、导出、重置)
- [x] 12道内置菜品数据 + 食材相克规则
- [x] TabBar图标（简约线性风格，SVG + PNG格式）
- [x] 食材扣减逻辑（部分扣减，库存不足提示补充数量）
- [x] AI智能饮食计划（3阶段计划，每周菜单，2天采购清单）
- [x] 云函数 generateDietPlan（调用DeepSeek API，已部署至云端）
- [x] Git 提交
- [x] 云开发数据库集成（离线优先存储适配层 + 7个Collection）

### 待开发 📋
- [ ] 双人实时同步

## 技术决策
- 双人同步策略：最后写入获胜（MVP阶段）
- DeepSeek调用：云函数中转，限流+缓存
- 菜品数据：12道固定家常菜 + 用户自定义
- 存储方案：本地 wx.setStorageSync (暂未对接云开发)

## 已安装 Skills
- `cloudbase` - 腾讯云开发全套能力 (MCP工具)

## 内置菜品 (12道)
| 菜品 | 分类 | 加热 |
|------|------|------|
| 土豆炖牛肉 | 荤菜 | 微波安全 |
| 番茄炒蛋 | 素菜 | 微波安全 |
| 西兰花炒鸡胸肉 | 荤菜 | 微波安全 |
| 清蒸鲈鱼 | 荤菜 | 仅蒸制 |
| 水煮蛋 | 荤菜 | 禁微波 |
| 白灼虾 | 荤菜 | 仅明火 |
| 凉拌黄瓜 | 素菜 | 微波安全 |
| 番茄牛肉汤 | 汤品 | 微波安全 |
| 米饭 | 主食 | 微波安全 |
| 红烧排骨 | 荤菜 | 微波安全 |
| 蒜蓉西兰花 | 素菜 | 微波安全 |
| 蒸饺 | 主食 | 仅蒸制 |

## 云函数
- `generateDietPlan` - AI饮食计划生成（DeepSeek API，已部署至 `cloud1` 环境）

## 云环境
- 环境ID: `cloud1-d1gse71xxaad6c670`
- 区域: 上海 (ap-shanghai)
- DeepSeek API Key: 环境变量方式存储（`DEEPSEEK_API_KEY`）

## 云开发 Collection
- `fridge_items` - 冰箱食材 ✓
- `menu_items` - 菜品库(含自定义) ✓
- `health_records` - 健康档案 ✓
- `weight_records` - 体重记录 ✓
- `menstrual_records` - 生理期记录 ✓
- `user_profiles` - 用户信息 ✓
- `diet_plans` - AI饮食计划 ✓

## 食物相克规则
| 组合 | 级别 | 说明 |
|------|------|------|
| 虾 + 维C水果 | 危险 | 可能产生有害物质 |
| 螃蟹 + 梨/柿子 | 危险 | 易引起腹泻 |
| 葱/洋葱 + 蜂蜜 | 危险 | 可能引起肠胃不适 |
| 鸡蛋 + 豆浆 | 警告 | 影响蛋白质吸收 |
| 牛肉 + 栗子 | 警告 | 可能引起消化不良 |
| 牛奶 + 橙子/柠檬 | 警告 | 影响消化吸收 |
| 菠菜 + 豆腐 | 警告 | 影响钙吸收 |

## 本地存储 Key
| Key | 内容 |
|-----|------|
| `fridgeItems` | 冰箱食材列表 |
| `customFoods` | 自定义菜品 |
| `todayMenu` | 今日菜单 |
| `healthProfile` | 健康档案 |
| `weightRecords` | 体重记录 |
| `menstrualSettings` | 生理期设置 |
| `userProfile` | 用户信息 |
| `partnerId` | 伴侣ID |
| `dietPlan` | AI饮食计划 |