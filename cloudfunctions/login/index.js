// 云函数：login
// 获取用户openid
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  return {
    success: true,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
  }
}