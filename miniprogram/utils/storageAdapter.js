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
    this._networkListenerRegistered = false
    this.partnerPollingTimer = null
    this.partnerUpdateListeners = []
  }

  /**
   * 初始化云数据库
   */
  initCloudDB() {
    if (!this.db) {
      this.db = wx.cloud.database()
    }
    // 启动伴侣轮询
    this.startPartnerPolling()
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

    // 尝试同步到伴侣（共享数据）
    const sharedKeys = ['fridgeItems', 'customFoods', 'todayMenu']
    if (sharedKeys.includes(key)) {
      this.syncToPartner(key, value)
    }
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
  async syncAll() {
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

    await Promise.all(syncPromises).finally(() => {
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
    if (this._networkListenerRegistered) {
      return
    }
    this._networkListenerRegistered = true
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

  /**
   * 生成6位邀请码
   */
  generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * 初始化用户档案
   */
  async initUserProfile() {
    if (!this.db) {
      this.initCloudDB()
    }

    const userId = this.getUserId()
    if (!userId) {
      return null
    }

    const collection = this.db.collection('user_profiles')
    const result = await collection.where({ _id: userId }).get()

    if (result.data && result.data.length > 0) {
      return result.data[0]
    }

    const profile = {
      _id: userId,
      nickname: '我',
      partnerId: '',
      codes: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await collection.add({ data: profile })
    return profile
  }

  /**
   * 验证邀请码
   */
  async validateInviteCode(code) {
    if (!this.db) {
      this.initCloudDB()
    }

    const collection = this.db.collection('user_profiles')
    const allUsers = await collection.limit(100).get()

    for (const user of allUsers.data) {
      if (user.codes && user.codes[code]) {
        const codeInfo = user.codes[code]
        if (!codeInfo.used && (Date.now() - codeInfo.createdAt) < 24 * 60 * 60 * 1000) {
          return { valid: true, userId: user._id, nickname: user.nickname }
        }
      }
    }
    return { valid: false }
  }

  /**
   * 绑定伴侣
   */
  async bindPartner(inviteCode) {
    if (!this.db) {
      this.initCloudDB()
    }

    const codeInfo = await this.validateInviteCode(inviteCode)
    if (!codeInfo.valid) {
      throw new Error('邀请码无效或已过期')
    }

    const myUserId = this.getUserId()
    if (myUserId === codeInfo.userId) {
      throw new Error('不能绑定自己')
    }

    const collection = this.db.collection('user_profiles')

    await collection.doc(myUserId).update({
      data: { partnerId: codeInfo.userId, updatedAt: Date.now() }
    })

    await collection.doc(codeInfo.userId).update({
      data: { partnerId: myUserId, updatedAt: Date.now() }
    })

    const partnerProfile = await collection.doc(codeInfo.userId).get()
    if (partnerProfile.data) {
      const codes = partnerProfile.data.codes || {}
      codes[inviteCode] = { ...codes[inviteCode], used: true }
      await collection.doc(codeInfo.userId).update({ data: { codes } })
    }

    wx.setStorageSync('partnerId', codeInfo.userId)
    wx.setStorageSync('partnerNickname', codeInfo.nickname)

    return { success: true, partnerId: codeInfo.userId }
  }

  /**
   * 解绑伴侣
   */
  async unbindPartner() {
    if (!this.db) {
      this.initCloudDB()
    }

    const myUserId = this.getUserId()
    const partnerId = wx.getStorageSync('partnerId')
    if (!partnerId) {
      return { success: false }
    }

    const collection = this.db.collection('user_profiles')

    await collection.doc(myUserId).update({
      data: { partnerId: '', updatedAt: Date.now() }
    })

    await collection.doc(partnerId).update({
      data: { partnerId: '', updatedAt: Date.now() }
    })

    wx.removeStorageSync('partnerId')
    wx.removeStorageSync('partnerNickname')

    return { success: true }
  }

  /**
   * 获取Storage Key对应的Collection名称
   */
  getCollectionName(key) {
    const map = {
      fridgeItems: 'fridge_items',
      customFoods: 'menu_items',
      todayMenu: null
    }
    return map[key]
  }

  /**
   * 拉取伴侣数据
   */
  async pullPartnerData(key) {
    if (!this.db) this.initCloudDB()

    const partnerId = wx.getStorageSync('partnerId')
    if (!partnerId) return null

    const collectionName = this.getCollectionName(key)
    if (!collectionName) return null

    try {
      const collection = this.db.collection(collectionName)
      const result = await collection.doc(partnerId).get()

      if (result.data) {
        const { _id, _openid, userId, updatedAt, ...data } = result.data
        return data.items || data
      }
    } catch (err) {
      console.error('拉取伴侣数据失败:', key, err)
    }
    return null
  }

  /**
   * 同步数据到伴侣
   */
  async syncToPartner(key, data) {
    if (!this.db) this.initCloudDB()

    const partnerId = wx.getStorageSync('partnerId')
    if (!partnerId) return

    const collectionName = this.getCollectionName(key)
    if (!collectionName) return

    try {
      const collection = this.db.collection(collectionName)

      const partnerData = await collection.doc(partnerId).get()

      if (partnerData.data) {
        await collection.doc(partnerId).update({
          data: {
            ...this.prepareForCloud(data),
            updatedAt: Date.now()
          }
        })
      } else {
        await collection.doc(partnerId).set({
          data: {
            ...this.prepareForCloud(data),
            userId: partnerId,
            updatedAt: Date.now()
          }
        })
      }
    } catch (err) {
      console.error('同步到伴侣失败:', key, err)
    }
  }

  /**
   * 伴侣更新事件监听器
   */
  onPartnerUpdate(callback) {
    this.partnerUpdateListeners.push(callback)
  }

  /**
   * 触发伴侣更新事件
   */
  emitPartnerUpdate(key, data) {
    this.partnerUpdateListeners.forEach(cb => cb(key, data))
  }

  /**
   * 启动伴侣数据轮询
   */
  startPartnerPolling() {
    if (this.partnerPollingTimer) return

    this.partnerPollingTimer = setInterval(() => {
      this.checkPartnerUpdates()
    }, 30000) // 30秒轮询
  }

  /**
   * 停止伴侣数据轮询
   */
  stopPartnerPolling() {
    if (this.partnerPollingTimer) {
      clearInterval(this.partnerPollingTimer)
      this.partnerPollingTimer = null
    }
  }

  /**
   * 检查伴侣数据更新
   */
  async checkPartnerUpdates() {
    const partnerId = wx.getStorageSync('partnerId')
    if (!partnerId) return

    const sharedKeys = ['fridgeItems', 'customFoods', 'todayMenu']

    for (const key of sharedKeys) {
      try {
        const partnerData = await this.pullPartnerData(key)
        if (partnerData) {
          const localData = wx.getStorageSync(key)
          if (JSON.stringify(partnerData) !== JSON.stringify(localData)) {
            wx.setStorageSync(key, partnerData)
            this.emitPartnerUpdate(key, partnerData)
          }
        }
      } catch (err) {
        console.error('检查伴侣更新失败:', key, err)
      }
    }
  }

  /**
   * 创建邀请码
   */
  async createInviteCode() {
    if (!this.db) {
      this.initCloudDB()
    }

    const userId = this.getUserId()
    if (!userId) {
      throw new Error('用户未登录')
    }

    let code = this.generateInviteCode()
    // 确保邀请码唯一性
    const allUsers = await this.db.collection('user_profiles').limit(100).get()
    for (const user of allUsers.data) {
      if (user.codes && user.codes[code]) {
        const codeInfo = user.codes[code]
        if (!codeInfo.used && (Date.now() - codeInfo.createdAt) < 24 * 60 * 60 * 1000) {
          code = this.generateInviteCode()
        }
      }
    }

    const collection = this.db.collection('user_profiles')

    const profile = await collection.doc(userId).get()
    if (!profile.data) {
      throw new Error('用户档案不存在')
    }

    const codes = profile.data.codes || {}
    codes[code] = { createdAt: Date.now(), used: false }
    await collection.doc(userId).update({
      data: { codes, updatedAt: Date.now() }
    })

    return { code, expiresAt: Date.now() + 24 * 60 * 60 * 1000 }
  }
}

// 导出单例
module.exports = new StorageAdapter()
