import { request } from './request.js'

export default {
  dailyCheckin: () => {
    return request({
      url: '/checkin',
      method: 'POST',
      noToast: true
    })
  },

  getCheckinRecords: () => {
    return request({
      url: '/checkin/records',
      method: 'GET',
      noToast: true
    })
  }
}
