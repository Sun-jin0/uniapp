// 根据运行环境设置基础URL
const getBaseUrl = () => {
  // 网页环境使用代理
  return '/api';
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
    console.log('Request data:', options.data);
    
    const requestConfig = {
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data || {},
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      }
    }
    
    // 处理 GET 请求的参数
    let fetchUrl = requestConfig.url;
    let fetchOptions = {
      method: requestConfig.method,
      headers: requestConfig.headers
    };
    
    if (requestConfig.method === 'GET' && requestConfig.data) {
      const queryString = new URLSearchParams(requestConfig.data).toString();
      fetchUrl = `${requestConfig.url}?${queryString}`;
    } else if (requestConfig.method !== 'GET') {
      fetchOptions.body = JSON.stringify(requestConfig.data);
    }
    
    // 使用原生 fetch API
    fetch(fetchUrl, fetchOptions)
    .then(response => response.json())
    .then(res => {
      if (isAborted) return;
      if (res.code === 0) {
        resolve(res)
      } else {
        if (!options.noToast) {
          uni.showToast({
            title: res.message || '请求失败',
            icon: 'none'
          })
        }
        reject(res)
      }
    })
    .catch(err => {
      if (isAborted) return;
      console.error('API 请求失败详情:', {
        url: fullUrl,
        error: err
      })
      
      uni.showToast({
        title: '网络请求失败',
        icon: 'none'
      })
      reject(err)
    })
  })
}

// 为 request 函数添加常用的快捷方法
request.get = (url, data, options = {}) => {
  return request({ url, method: 'GET', data, ...options });
};

request.post = (url, data, options = {}) => {
  return request({ url, method: 'POST', data, ...options });
};

request.put = (url, data, options = {}) => {
  return request({ url, method: 'PUT', data, ...options });
};

request.delete = (url, data, options = {}) => {
  return request({ url, method: 'DELETE', data, ...options });
};

export default request
export {
  request
}
