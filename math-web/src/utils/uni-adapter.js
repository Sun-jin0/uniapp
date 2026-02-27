import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'
import request from './request'

const uni = {
  navigateTo: (options) => {
    if (options.url) {
      const url = options.url.startsWith('/') ? options.url : '/' + options.url
      const [path, query] = url.split('?')
      const params = {}
      if (query) {
        query.split('&').forEach(param => {
          const [key, value] = param.split('=')
          params[key] = decodeURIComponent(value || '')
        })
      }
      router.push({ path, query: params })
    }
  },

  redirectTo: (options) => {
    if (options.url) {
      const url = options.url.startsWith('/') ? options.url : '/' + options.url
      router.replace(url)
    }
  },

  switchTab: (options) => {
    if (options.url) {
      const url = options.url.startsWith('/') ? options.url : '/' + options.url
      router.replace(url)
    }
  },

  navigateBack: (options) => {
    router.back()
  },

  showToast: (options) => {
    ElMessage({
      message: options.title || options.message,
      type: options.icon === 'success' ? 'success' : options.icon === 'error' ? 'error' : 'info',
      duration: options.duration || 2000
    })
  },

  showModal: (options) => {
    ElMessageBox.confirm(options.content || options.message, options.title || '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      if (options.success) {
        options.success({ confirm: true })
      }
    }).catch(() => {
      if (options.success) {
        options.success({ confirm: false })
      }
    })
  },

  setStorageSync: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (e) {
      localStorage.setItem(key, data)
    }
  },

  getStorageSync: (key) => {
    try {
      const data = localStorage.getItem(key)
      if (data) {
        return JSON.parse(data)
      }
      return null
    } catch (e) {
      return localStorage.getItem(key)
    }
  },

  removeStorageSync: (key) => {
    localStorage.removeItem(key)
  },

  request: (options) => {
    return new Promise((resolve, reject) => {
      const url = options.url.startsWith('http') ? options.url : '/api' + options.url
      const method = options.method || 'GET'
      
      const config = {
        url,
        method,
        headers: options.header || {}
      }

      if (method === 'GET') {
        config.params = options.data
      } else {
        config.data = options.data
      }

      request(config)
        .then(response => {
          if (options.success) {
            options.success(response)
          }
          resolve(response)
        })
        .catch(error => {
          if (options.fail) {
            options.fail(error)
          }
          if (options.complete) {
            options.complete(error)
          }
          reject(error)
        })
    })
  },

  showLoading: (options) => {
    ElMessage({
      message: options.title || '加载中...',
      type: 'info',
      duration: 0,
      showClose: false
    })
  },

  hideLoading: () => {
    ElMessage.closeAll()
  },

  chooseImage: (options) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file && options.success) {
        const reader = new FileReader()
        reader.onload = (event) => {
          options.success({
            tempFilePaths: [event.target.result],
            tempFiles: [file]
          })
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  },

  getCurrentPages: () => {
    if (typeof window !== 'undefined' && router) {
      const currentRoute = router.currentRoute.value
      return [{
        route: currentRoute,
        options: currentRoute.query || {}
      }]
    }
    return []
  }
}

if (typeof window !== 'undefined') {
  window.uni = uni
}

export default uni
