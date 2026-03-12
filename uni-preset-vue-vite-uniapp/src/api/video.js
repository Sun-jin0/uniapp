import { request } from './request.js'

export default {
  // 获取学科分类树
  getSubjects() {
    return request({
      url: '/video/subjects',
      method: 'GET'
    })
  },
  
  // 获取视频列表
  getVideos(params) {
    return request({
      url: '/video/list',
      method: 'GET',
      data: params
    })
  },
  
  // 获取视频详情
  getVideoDetail(id) {
    return request({
      url: `/video/detail/${id}`,
      method: 'GET'
    })
  },
  
  // 获取播放链接
  getPlayUrl(id, index) {
    return request({
      url: `/video/play-url/${id}/${index}`,
      method: 'GET'
    })
  },
  
  // 兑换视频
  redeem(data) {
    return request({
      url: '/video/redeem',
      method: 'POST',
      data: data
    })
  },
  
  // 收藏/取消收藏
  toggleFavorite(resourceId) {
    return request({
      url: '/video/favorite',
      method: 'POST',
      data: { resourceId }
    })
  },
  
  // 提交反馈
  submitFeedback(data) {
    return request({
      url: '/video/feedback',
      method: 'POST',
      data: data
    })
  },
  
  // 获取我的视频
  getMyVideos(type) {
    return request({
      url: '/video/my-videos',
      method: 'GET',
      data: { type }
    })
  },
  
  // 获取合集视频
  getCollectionVideos(collectionId) {
    return request({
      url: `/video/collection/${collectionId}/videos`,
      method: 'GET'
    })
  },
  
  // 更新视频进度
  updateProgress(data) {
    return request({
      url: '/video/progress',
      method: 'POST',
      data: data
    })
  },
  
  // 推荐视频
  recommendVideo(data) {
    return request({
      url: '/video/recommend',
      method: 'POST',
      data: data
    })
  }
}
