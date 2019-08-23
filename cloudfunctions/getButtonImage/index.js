// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async(event, context) => {
  const fileList = ['cloud://cloud-development-ff1b93.636c-cloud-development-ff1b93-1258920006/buttonImage/timg.png']
  const result = await cloud.getTempFileURL({
    fileList: fileList,
  })
  return result.fileList
}