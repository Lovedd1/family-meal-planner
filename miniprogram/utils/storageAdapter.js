/**
 * StorageAdapter - 离线优先的存储适配层
 * 统一封装本地存储和云端数据库的读写
 */

const STORAGE_KEY_MAP = {
  fridgeItems: 'fridge_items',
  customFoods: 'menu_items',
  healthProfile: 'health_records',
  weightRecords: 'weight_records',
  menstrualSettings: 'menstrual_records',
  userProfile: 'user_profiles',
  dietPlan: 'diet_plans',
  todayMenu: null, // 今日菜单不同步到云端
}

const SYNC_QUEUE_KEY = 'syncQueue'
const LAST_SYNC_KEY = 'lastSyncTime'

class StorageAdapter {
  constructor() {
    this.syncQueue = wx.getStorageSync(SYNC_QUEUE_KEY) || []
    this.isSyncing = false
    this.db = null
  }

  /**
   * 初始化云数据库
   */
  initCloudDB() {
    if (!this.db) {
      this.db = wx.cloud.database()
    }
    return this.db
  }

  /**
   * 检查网络是否可用
   */
  isNetworkAvailable() {
    return wx.getNetworkType() !== 'none'
  }

  /**
   * 读取数据 - 离线优先
   * @param {string} key - 存储键名
   * @returns {any} 数据
   */
  get(key) {
    // 先读本地
    const localData = wx.getStorageSync(key)
    if (localData !== '') {
      return localData
    }
    return null
  }

  /**
   * 写入数据 - 离线优先
   * @param {string} key - 存储键名
   * @param {any} value - 数据
   */
  set(key, value) {
    // 直接写本地
    wx.setStorageSync(key, value)

    // 加入同步队列
    this.addToSyncQueue(key, 'set', value)

    // 尝试同步到云端
    this.trySync(key)
  }

  /**
   * 添加到同步队列
   */
  addToSyncQueue(key, action, data) {
    // 移除同一key的旧操作
    this.syncQueue = this.syncQueue.filter(item => item.key !== key)

    // 添加新操作
    this.syncQueue.push({
      key,
      action,
      data,
      timestamp: Date.now()
    })

    // 保存队列
    wx.setStorageSync(SYNC_QUEUE_KEY, this.syncQueue)
  }

  /**
   * 尝试同步到云端
   */
  trySync(key) {
    if (!this.isNetworkAvailable()) {
      return
    }

    const collectionName = STORAGE_KEY_MAP[key]
    if (!collectionName) {
      return // 不需要同步的key
    }

    this.syncToCloud(key, collectionName)
  }

  /**
   * 同步到云端
   */
  async syncToCloud(key, collectionName) {
    if (!this.db) {
      this.initCloudDB()
    }

    const localData = wx.getStorageSync(key)
    if (localData === '') {
      return
    }

    const userId = this.getUserId()
    if (!userId) {
      return
    }

    try {
      const collection = this.db.collection(collectionName)

      // 查询云端现有数据
      const cloudData = await collection.where({ userId }).get()

      if (cloudData.data && cloudData.data.length > 0) {
        // 已有数据，更新
        const cloudRecord = cloudData.data[0]
        const cloudUpdatedAt = cloudRecord.updatedAt || 0
        const localUpdatedAt = localData.updatedAt || 0

        // 冲突处理：最后写入获胜
        if (cloudUpdatedAt > localUpdatedAt) {
          // 云端更新，用云端覆盖本地
          wx.setStorageSync(key, cloudRecord)
        } else {
          // 本地更新，写入云端
          await collection.doc(cloudRecord._id).update({
            data: {
              ...this.prepareForCloud(localData),
              updatedAt: Date.now()
            }
          })
        }
      } else {
        // 无数据，新增
        await collection.add({
          data: {
            ...this.prepareForCloud(localData),
            userId,
            updatedAt: Date.now()
          }
        })
      }

      // 从队列移除
      this.syncQueue = this.syncQueue.filter(item => item.key !== key)
      wx.setStorageSync(SYNC_QUEUE_KEY, this.syncQueue)

    } catch (err) {
      console.error(`同步 ${key} 失败:`, err)
    }
  }

  /**
   * 准备数据用于云端存储
   */
  prepareForCloud(data) {
    if (Array.isArray(data)) {
      return { items: data }
    }
    return data
  }

  /**
   * 从云端恢复数据
   */
  async restoreFromCloud(key) {
    if (!this.isNetworkAvailable()) {
      return null
    }

    const collectionName = STORAGE_KEY_MAP[key]
    if (!collectionName) {
      return null
    }

    if (!this.db) {
      this.initCloudDB()
    }

    const userId = this.getUserId()
    if (!userId) {
      return null
    }

    try {
      const collection = this.db.collection(collectionName)
      const result = await collection.where({ userId }).get()

      if (result.data && result.data.length > 0) {
        const cloudData = result.data[0]
        // 恢复时移除云端字段
        const { _id, _openid, userId: uid, updatedAt, ...rest } = cloudData
        const localData = rest.items || rest
        wx.setStorageSync(key, localData)
        return localData
      }
    } catch (err) {
      console.error(`从云端恢复 ${key} 失败:`, err)
    }

    return null
  }

  /**
   * 同步单个key
   */
  sync(key) {
    const collectionName = STORAGE_KEY_MAP[key]
    if (!collectionName) {
      return
    }
    this.syncToCloud(key, collectionName)
  }

  /**
   * 同步全部队列
   */
  syncAll() {
    if (this.isSyncing) {
      return
    }

    this.isSyncing = true

    const syncPromises = this.syncQueue.map(item => {
      const collectionName = STORAGE_KEY_MAP[item.key]
      if (!collectionName) {
        return Promise.resolve()
      }
      return this.syncToCloud(item.key, collectionName)
    })

    Promise.all(syncPromises).finally(() => {
      this.isSyncing = false
      wx.setStorageSync(LAST_SYNC_KEY, Date.now())
    })
  }

  /**
   * 获取用户ID
   */
  getUserId() {
    return wx.getStorageSync('userId') || null
  }

  /**
   * 设置用户ID
   */
  setUserId(userId) {
    wx.setStorageSync('userId', userId)
  }

  /**
   * 监听网络状态变化
   */
  onNetworkStatusChange(callback) {
    wx.onNetworkStatusChange((res) => {
      if (res.isConnected) {
        // 网络恢复，触发同步
        this.syncAll()
      }
      if (callback) {
        callback(res)
      }
    })
  }

  /**
   * 获取同步队列状态
   */
  getSyncStatus() {
    return {
      pendingCount: this.syncQueue.length,
      lastSyncTime: wx.getStorageSync(LAST_SYNC_KEY) || null
    }
  }

  /**
   * 清理同步队列
   */
  clearSyncQueue() {
    this.syncQueue = []
    wx.setStorageSync(SYNC_QUEUE_KEY, [])
  }
}

// 导出单例
module.exports = new StorageAdapter()
