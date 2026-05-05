# 云开发数据库集成设计

## 1. 数据层架构

```
┌─────────────────────────────────────────────────────────┐
│                      业务页面                             │
│   (fridge.js, health.js, order.js, settings.js)          │
└─────────────────────┬───────────────────────────────────┘
                      │ wx.getStorageSync / setStorageSync
                      ▼ (保持兼容，业务层无感知)
┌─────────────────────────────────────────────────────────┐
│                 StorageAdapter 数据适配层                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ LocalCache  │  │ CloudDB     │  │ SyncManager     │  │
│  │ 本地缓存     │  │ 云端读写    │  │ 离线队列+冲突处理 │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │ 实际读写
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   微信本地存储                            │
│         wx.setStorageSync / wx.getStorageSync            │
└─────────────────────────────────────────────────────────┘
```

## 2. StorageAdapter 核心接口

### 统一存储接口
```javascript
StorageAdapter.get(key)       // 读取
StorageAdapter.set(key, value) // 写入
StorageAdapter.sync(key)     // 手动触发同步
StorageAdapter.syncAll()     // 同步全部
```

### 读写逻辑（离线优先）

**get(key):**
1. 读本地缓存 → 返回
2. 本地无 → 读云端 → 写入本地 → 返回

**set(key, value):**
1. 写入本地
2. 加入待同步队列
3. 网络可用 → 同步到云端

## 3. Collection 字段设计

### fridge_items - 冰箱食材
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 云数据库ID |
| name | string | 食材名称 |
| category | string | 分类(meat/vegetable/seasoning) |
| daysLeft | number | 剩余保质天数 |
| amount | string | 数量描述 |
| addDate | string | 添加日期 YYYY-MM-DD |
| userId | string | 用户ID |
| updatedAt | number | 更新时间戳 |

### menu_items - 菜品库
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 云数据库ID |
| name | string | 菜品名称 |
| emoji | string | 表情图标 |
| category | string | 分类(荤菜/素菜/汤品/主食) |
| heatMethod | string | 加热方式 |
| ingredients | array | 食材列表 [{name, amount}] |
| steps | array | 步骤列表 |
| isCustom | boolean | 是否自定义 |
| userId | string | 用户ID |
| updatedAt | number | 更新时间戳 |

### health_records - 健康档案
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 云数据库ID |
| userId | string | 用户ID |
| dietGoal | string | 饮食目标(lose/maintain/gain) |
| currentWeight | string | 当前体重 |
| targetWeight | string | 目标体重 |
| height | string | 身高 |
| activityLevel | string | 活动水平 |
| allergies | string | 过敏原 |
| updatedAt | number | 更新时间戳 |

### weight_records - 体重记录
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 云数据库ID |
| userId | string | 用户ID |
| date | string | 日期 YYYY-MM-DD |
| weight | number | 体重(kg) |
| updatedAt | number | 更新时间戳 |

### menstrual_records - 生理期记录
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 云数据库ID |
| userId | string | 用户ID |
| lastPeriodDate | string | 上次月经日期 |
| cycleDays | number | 周期天数 |
| periodDays | number | 经期天数 |
| updatedAt | number | 更新时间戳 |

### user_profiles - 用户信息
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 云数据库ID |
| nickname | string | 昵称 |
| partnerId | string | 伴侣ID(预留) |
| createdAt | number | 创建时间戳 |
| updatedAt | number | 更新时间戳 |

### diet_plans - AI饮食计划
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 云数据库ID |
| userId | string | 用户ID |
| phases | array | 阶段计划 [{phase, meals, shoppingList}] |
| generatedAt | number | 生成时间戳 |

## 4. 离线队列与冲突处理

### 待同步队列 (syncQueue)
```javascript
[
  { key: 'fridgeItems', action: 'set', data: [...], timestamp: Date.now() },
  { key: 'weightRecords', action: 'set', data: [...], timestamp: Date.now() }
]
```

### 同步时机
- 数据写入时自动尝试同步
- App onShow 时触发全量同步
- 网络恢复时触发

### 冲突处理（最后写入获胜）
```javascript
// 写入前检查：
if (cloud.updatedAt > local.updatedAt) {
  // 云端更新，用云端覆盖本地
  localCache = cloudData
} else {
  // 本地更新，写入云端
  writeToCloud(localData)
}
```

## 5. 安全规则

所有 collection 采用统一安全规则：
```json
{
  "read": "auth.uid != null",
  "write": "auth.uid == doc.userId"
}
```

## 6. 实现步骤

### Step 1: 创建 StorageAdapter
- 新建 `miniprogram/utils/storageAdapter.js`
- 实现 get/set/sync 核心方法
- 实现离线队列管理

### Step 2: 数据库初始化
- 使用云开发MCP创建7个collection
- 配置安全规则

### Step 3: 改造现有页面
- 将 `wx.getStorageSync` 替换为 `StorageAdapter.get`
- 将 `wx.setStorageSync` 替换为 `StorageAdapter.set`
- 顺序：fridge → health → order → settings → app.js

### Step 4: 双人同步预留
- user_profiles 表增加 partnerId 字段
- 安全规则支持按 partnerId 查询

## 7. 存储Key映射

| Storage Key | Collection |
|-------------|------------|
| fridgeItems | fridge_items |
| customFoods | menu_items |
| healthProfile | health_records |
| weightRecords | weight_records |
| menstrualSettings | menstrual_records |
| userProfile | user_profiles |
| dietPlan | diet_plans |
