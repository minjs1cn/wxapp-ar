// pages/landpage.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  openApp() {
    wx.navigateToMiniProgram({
      appId: 'wx8f9d939eb5d03a20',
      appPath: 'package-pay/pages/book/book?channel_hash=ebc236234f908228da93b64ff8a96cdb'
    })
  }
})