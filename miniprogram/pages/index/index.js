//index.js
const app = getApp()

Page({
  data: {
    avatarUrl: '',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    choice: {},
    currentNum: 1,
    totalNum: 0,
    isShowCorrectAnswer: false,
    currentCorrectAnswer: '',
    isChecked: false,
  },
  onLoad: function() {
    var that = this
    wx.clearStorage()
    // 调用云函数获按钮背景图标
    wx.cloud.callFunction({
      name: 'getButtonImage',
      success: function(res) {
        that.setData({
          avatarUrl: res.result[0].tempFileURL
        })
      },
      fail: function(res) {
        console.log('fail res:', res)
      }
    })
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    })
    // 获取选择题信息，只执行一次即可。
    // 首先去查询数据库，看是否已经有了数据
    const db_ = wx.cloud.database()
    db_.collection('Choices').count({
      success: function(res) {
        if (res.total == 0) {
          wx.request({
            url: 'https://bk.tencent.com/exam/paper_query/',
            data: {
              field_id: 1,
              page: 1,
              page_size: 314,
              isAjax: 1
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success(res) {
              if (res.data.result) {
                // 保存到数据库
                for (let data of res.data.data) {
                  db_.collection("Choices").add({
                    data: data,
                    success: function(res) {}
                  })
                }
              }
            }
          })
        }
        that.setData({
          totalNum: res.total
        })
        db_.collection('Choices').limit(1).get().then(res => {
          that.setData({
            choice: res.data[0],
            currentCorrectAnswer: res.data[0].answers
          })
        })
      }
    })
  },

  onGetUserInfo: function(e) {
    var that = this
    if (!this.logged && e.detail.userInfo) {
      that.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
  },
  // 多选框处理函数
  checkboxChange: function(e) {
    // 先保存自己选项
    // console.log('checkbox value值为：', e)
  },
  // 点击上一题
  handleUp: function() {
    var that = this
    const db = wx.cloud.database()
    if (that.data.currentNum == 1) {
      wx.showModal({
        title: '提示',
        content: '当前已经是第一题',
      })
      return
    }
    var currentNum_ = that.data.currentNum - 2
    if (currentNum_ == 0) {
      db.collection('Choices').limit(1).get().then(res => {
        that.setData({
          choice: res.data[0],
          currentNum: that.data.currentNum - 1,
          isShowCorrectAnswer: false,
          currentCorrectAnswer: res.data[0].answers,
          isChecked: false
        })
      })
      return
    }
    db.collection('Choices').skip(currentNum_).limit(1).get().then(res => {
      that.setData({
        choice: res.data[0],
        currentNum: that.data.currentNum - 1,
        isShowCorrectAnswer: false,
        currentCorrectAnswer: res.data[0].answers,
        isChecked: false
      })
    })
  },
  // 点击下一题
  handleNext: function() {
    var that = this
    if (that.data.currentNum >= that.data.totalNum) {
      wx.showModal({
        title: '提示',
        content: '当前已经是最后一题',
      })
      return
    }
    const db = wx.cloud.database()
    db.collection('Choices').skip(that.data.currentNum).limit(1).get().then(res => {
      that.setData({
        choice: res.data[0],
        currentNum: that.data.currentNum + 1,
        isShowCorrectAnswer: false,
        currentCorrectAnswer: res.data[0].answers,
        isChecked: false
      })
    })
  },
  // 显示正确答案
  showCorrectAnswer: function() {
    var that = this
    that.setData({
      isShowCorrectAnswer: true
    })
  }
})