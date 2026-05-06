# 设置页面 - 手动同步功能设计

## 需求
在设置页面添加手动同步功能，让用户可以立即触发与伴侣的数据同步，而不必等待30秒自动轮询。

## 位置
现有"数据统计"区域下方，新增"数据同步"区块

## 界面设计

### 同步状态卡片
| 元素 | 说明 |
|------|------|
| 状态指示器 | 圆点 + 文字（已连接/连接中/未连接） |
| 最后同步时间 | 显示相对时间，如"刚刚"、"30秒前"、"5分钟前" |
| 手动同步按钮 | 点击立即触发同步 |

### 状态逻辑
- **未配对**：不显示同步区块
- **已配对**：显示同步状态和按钮
- **同步中**：按钮显示loading状态，禁止重复点击
- **同步成功**：更新最后同步时间，显示toast提示
- **同步失败**：toast提示错误

## 数据流程

```
用户点击"立即同步"
    ↓
调用 storageAdapter.manualSync()
    ↓
1. 先推送本地变更到云端 (syncToPartner)
2. 再拉取伴侣最新数据 (checkPartnerUpdates)
    ↓
更新 lastSyncTime 到本地
    ↓
通知页面更新 UI
```

## 涉及文件

### miniprogram/pages/settings/settings.js
- 新增 `manualSync()` 方法
- 新增 `getSyncTimeText()` 格式化时间方法
- 新增 `syncStatus` 数据字段

### miniprogram/pages/settings/settings.wxml
- 在"数据统计"区块下方添加"数据同步"区块

### miniprogram/utils/storageAdapter.js
- 新增 `manualSync()` 方法：立即执行同步，跳过轮询等待

## 同步范围
与自动同步一致：
- `fridgeItems` - 冰箱食材
- `customFoods` - 自定义菜品
- `todayMenu` - 今日菜单

## 视觉风格
与现有 Pop Style 保持一致，使用玫瑰盐粉主题色。