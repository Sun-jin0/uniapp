<template>
  <div class="login-container">
    <div class="login-card">
      <h1>数学刷题系统</h1>
      <p class="subtitle">登录以继续使用</p>
      
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>正在登录...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button @click="retryLogin" class="retry-btn">重试</button>
      </div>
      
      <div v-else class="login-form">
        <div class="form-group">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="请输入用户名" />
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" />
        </div>
        
        <button @click="handleLogin" class="login-btn" :disabled="!username || !password">
          登录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const wechatToken = urlParams.get('token')
  
  if (wechatToken) {
    autoLogin(wechatToken)
  }
})

const autoLogin = async (token) => {
  loading.value = true
  try {
    const response = await fetch('/api/user/wechat-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: token })
    })
    const data = await response.json()
    
    if (data.code === 0) {
      localStorage.setItem('token', data.data.token)
      localStorage.setItem('userId', data.data.userId)
      localStorage.setItem('username', data.data.username)
      localStorage.setItem('wechatToken', token)
      router.push('/pages/math/math-bookshelf')
    } else {
      error.value = data.message || '自动登录失败，请手动登录'
      loading.value = false
    }
  } catch (e) {
    error.value = '网络错误，请手动登录'
    loading.value = false
  }
}

const handleLogin = async () => {
  console.log('Login attempt:', { username: username.value, password: password.value })
  loading.value = true
  try {
    const response = await fetch('/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response data:', data)
    
    if (data.code === 0) {
      localStorage.setItem('token', data.data.token)
      localStorage.setItem('userId', data.data.userId)
      localStorage.setItem('username', data.data.username)
      router.push('/pages/math/math-bookshelf')
    } else {
      ElMessage.error(data.message || '登录失败')
      loading.value = false
    }
  } catch (e) {
    console.error('Login error:', e)
    ElMessage.error('网络错误')
    loading.value = false
  }
}

const retryLogin = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const wechatToken = urlParams.get('token')
  if (wechatToken) {
    autoLogin(wechatToken)
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h1 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 28px;
}

.subtitle {
  margin: 0 0 30px 0;
  color: #666;
  font-size: 14px;
}

.loading-state, .error-state {
  text-align: center;
  padding: 40px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #f56c6c;
  margin-bottom: 20px;
}

.retry-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.login-btn:hover {
  background: #5568d3;
}

.login-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
