// 根据运行环境设置基础 URL
const getBaseUrl = () => {
  // #ifdef H5
  // H5 环境使用本地后端
  return 'http://localhost:3000/api';
  // #endif
  
  // #ifdef MP-WEIXIN
  // 微信小程序使用本地后端（需要配置不校验域名）
  return 'http://localhost:3000/api';
  // #endif
  
  // 默认使用本地后端
  return 'http://localhost:3000/api';
};

export const BASE_URL = getBaseUrl();

const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token') || ''
    
    // 检查请求是否被中止
    let isAborted = false;
    
    const fullUrl = BASE_URL + options.url;
    console.log('Request URL:', fullUrl);
    console.log('Request method:', options.method || 'GET');
    console.log('Request data:', options.data || {});
    
    const requestTask = uni.request({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data || {},
      timeout: 10000, // 增加 10s 超时
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      success: (res) => {
        if (isAborted) return;
        if (res.statusCode === 200) {
          if (res.data.code === 0) {
            resolve(res.data)
          } else {
            if (!options.noToast) {
              uni.showToast({
                title: res.data.message || '请求失败',
                icon: 'none'
              })
            }
            reject(res.data)
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          // 处理 Token 过期或无权限
          if (!options.noToast) {
            uni.showToast({
              title: res.statusCode === 401 ? '未授权，请重新登录' : '权限不足',
              icon: 'none'
            })
          }
          uni.removeStorageSync('token')
          uni.removeStorageSync('userId')
          // 避免重复跳转
          const pages = getCurrentPages();
          const currentPage = pages[pages.length - 1]?.route;
          if (currentPage !== 'pages/login/login') {
            setTimeout(() => {
              uni.navigateTo({
                url: '/pages/login/login'
              })
            }, 1500)
          }
          reject(res.data)
        } else {
          if (!options.noToast) {
            uni.showToast({
              title: res.data.message || '网络错误',
              icon: 'none'
            })
          }
          reject(res.data)
        }
      },
      fail: (err) => {
        if (isAborted) return;
        console.error('API 请求失败详情:', {
          url: fullUrl,
          error: err
        })
        
        // 区分中止错误和其他网络错误
        if (err.errMsg && (err.errMsg.includes('abort') || err.errMsg.includes('timeout'))) {
           // 显示详细的连接失败提示
           console.error('连接超时，请检查:');
           console.error('1. 手机和电脑是否在同一 WiFi 网络');
           console.error('2. 电脑的 IP 地址是否正确');
           console.error('3. 后端服务是否已启动');
           console.error('4. Windows 防火墙是否允许 3000 端口');
           
           uni.showToast({
             title: '连接超时，请检查网络和服务端',
             icon: 'none',
             duration: 3000
           });
        } else {
          // 其他网络错误
          console.error('请求失败:', err);
          uni.showToast({
            title: '网络错误，请稍后重试',
            icon: 'none',
            duration: 2000
          });
        }
        
        reject(err)
      }
    });
    
    // 保存请求任务以便需要时可以中止
    options.requestTask = requestTask;
  });
};

// 添加便捷方法
request.get = (url, params = {}) => {
  return request({
    url,
    method: 'GET',
    data: params
  });
};

request.post = (url, data = {}) => {
  return request({
    url,
    method: 'POST',
    data
  });
};

export default request;
export { request };
