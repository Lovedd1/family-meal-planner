# 双人实时同步设计

## 1. 连接架构

```
┌──────────────┐         ┌──────────────┐
│   用户A       │◄───────►│   用户B       │
│  (openid A)   │  邀请码   │ (openid B)   │
└──────┬───────┘  配对    └──────┬───────┘
       │                          │
       │    ┌─────────────────┐   │
       └───►│  user_profiles  │◄─┘
            │  partnerId 字段  │
            └─────────────────┘
```

## 2. 邀请码机制

### 生成邀请码
- 用户A点击"绑定伴侣" → 生成6位数字字母混合码
- 邀请码写入 `user_profiles.codes[code] = { createdAt, used: false }`
- 有效期24小时

### 使用邀请码
- 用户B输入邀请码 → 验证有效性 → 建立双向绑定
- B的 `partnerId` = A的 `userId`
- A的 `partnerId` = B的 `userId`

## 3. 数据共享策略

配对成功后，双方共享以下数据：

| 数据 | 共享方式 |
|------|----------|
| 冰箱食材 | 双向同步 |
| 今日菜单 | 双向同步 |
| 健康档案 | 各自独立 |
| 体重记录 | 各自独立 |
| 生理期 | 各自独立 |

### 冰箱共享逻辑
- 双方看到相同的冰箱食材列表
- 任何一方添加/删除，另一方自动更新
- 采用最后写入获胜 + timestamp比较

## 4. 实时同步方案

### 同步时机
- App onShow 时主动拉取
- 写入自己数据后，自动拉取伴侣最新数据
- 每30秒后台轮询一次（如果小程序在前台）

### 冲突处理
- 最后写入获胜
- 比较 `updatedAt` timestamp
- 更新本地缓存 + 通知UI刷新

## 5. StorageAdapter 新增接口

```javascript
// 伴侣相关
bindPartner(inviteCode)       // 绑定伴侣
unbindPartner()               // 解除绑定
getPartnerData(key)           // 获取伴侣数据
subscribePartnerUpdates()     // 订阅更新
pullPartnerData()             // 主动拉取伴侣数据

// 邀请码相关
generateInviteCode()          // 生成邀请码
validateInviteCode(code)      // 验证邀请码
```

## 6. user_profiles Collection 更新

### 字段变更
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 云数据库ID (即 openid) |
| nickname | string | 昵称 |
| partnerId | string | 伴侣ID (双向绑定) |
| codes | object | 邀请码映射 { code: { createdAt, used } } |
| createdAt | number | 创建时间戳 |
| updatedAt | number | 更新时间戳 |

## 7. 实现步骤

### Step 1: 改造 user_profiles 数据结构
- 现有用户数据的 codes 字段初始化
- partnerId 字段支持

### Step 2: 实现邀请码功能
- generateInviteCode()
- validateInviteCode()
- bindPartner()

### Step 3: 实现伴侣数据同步
- pullPartnerData()
- subscribePartnerUpdates()
- 冲突处理逻辑

### Step 4: 改造 settings 页面 UI
- 添加"绑定伴侣"按钮
- 生成/输入邀请码界面
- 显示伴侣信息

### Step 5: 集成到 StorageAdapter
- 冰箱数据写入时同步到伴侣
- 拉取伴侣数据合并到本地

## 8. 存储Key映射

| Storage Key | Collection | 共享 |
|-------------|------------|------|
| fridgeItems | fridge_items | 是 |
| customFoods | menu_items | 是 |
| healthProfile | health_records | 否 |
| weightRecords | weight_records | 否 |
| menstrualSettings | menstrual_records | 否 |
| userProfile | user_profiles | 是 |
| dietPlan | diet_plans | 否 |
| todayMenu | 本地 | 是 |
