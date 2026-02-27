<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 登录表单 -->
    <view class="login-form">
      <!-- 用户名登录 -->
      <view class="username-login">
        <view class="form-group">
          <view class="input-wrapper">
            <input class="login-input" type="text" placeholder="请输入用户名/学号" v-model="username" />
          </view>
        </view>
        
        <view class="form-group">
          <view class="input-wrapper">
            <input class="login-input" type="password" placeholder="请输入密码" v-model="password" />
          </view>
        </view>
        
        <button class="login-btn" @click="usernameLogin" :disabled="!username || !password">登录</button>
      </view>

      <!-- 微信登录 -->
      <view class="divider">
        <view class="divider-line"></view>
        <view class="divider-text">其他登录方式</view>
        <view class="divider-line"></view>
      </view>

      <view class="wechat-login-section">
        <button class="wechat-btn" @click="handleWechatLogin">
          <view class="wechat-icon-placeholder"></view>
          <text>微信一键登录</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getCurrentInstance } from 'vue';

const instance = getCurrentInstance();

const isDarkMode = ref(false);

const username = ref('');
const password = ref('');

const usernameLogin = async () => {
  if (!username.value) {
    uni.showToast({
      title: '请输入用户名',
      icon: 'none'
    });
    return;
  }
  
  if (!password.value) {
    uni.showToast({
      title: '请输入密码',
      icon: 'none'
    });
    return;
  }
  
  if (password.value.length < 6) {
    uni.showToast({
      title: '密码长度不能少于6位',
      icon: 'none'
    });
    return;
  }
  
  uni.showLoading({
    title: '登录中...',
    mask: true
  });
  
  try {
    // 检查是否为学号登录（简单判断：如果全是数字且长度较长，或者是特定格式）
    // 也可以直接统一传给后端，由后端判断
    const loginParams = {
      password: password.value
    };
    
    // 如果是纯数字，认为是学号，否则认为是用户名
    // 或者按照后端要求，可以同时传两个字段，后端优先取值
    if (/^\d+$/.test(username.value)) {
      loginParams.studentId = username.value;
      loginParams.username = username.value; // 同时传 username 以防万一
    } else {
      loginParams.username = username.value;
    }

    const res = await instance.appContext.config.globalProperties.$api.userApi.login(loginParams);
    
    uni.hideLoading();
    
    if (res.code === 0) {
      handleLoginSuccess(res.data);
    }
  } catch (error) {
    uni.hideLoading();
    console.error('登录失败:', error);
  }
};

const handleWechatLogin = async () => {
  // #ifndef MP-WEIXIN
  uni.showToast({
    title: '请在微信小程序环境中使用此功能',
    icon: 'none'
  });
  return;
  // #endif

  uni.showLoading({
    title: '登录中...',
    mask: true
  });

  try {
    // 1. 获取登录 code
    const loginRes = await new Promise((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: (res) => resolve(res),
        fail: (err) => reject(err)
      });
    });

    if (!loginRes.code) {
      throw new Error('获取微信登录凭证失败');
    }

    // 2. 获取用户信息 (可选，取决于是否需要头像昵称)
    let userInfo = null;
    try {
      const userProfileRes = await new Promise((resolve) => {
        uni.getUserProfile({
          desc: '用于完善会员资料',
          success: (res) => resolve(res.userInfo),
          fail: () => resolve(null)
        });
      });
      userInfo = userProfileRes;
    } catch (e) {
      console.log('获取用户信息失败或用户拒绝', e);
    }

    // 3. 调用后端微信登录接口
    const res = await instance.appContext.config.globalProperties.$api.userApi.wechatLogin({
      code: loginRes.code,
      userInfo: userInfo
    });

    uni.hideLoading();

    if (res.code === 0) {
      handleLoginSuccess(res.data);
    } else {
      uni.showToast({
        title: res.message || '微信登录失败',
        icon: 'none'
      });
    }

  } catch (error) {
    uni.hideLoading();
    console.error('微信登录失败:', error);
    uni.showToast({
      title: '微信登录异常: ' + (error.message || '未知错误'),
      icon: 'none'
    });
  }
};

const handleLoginSuccess = (userData) => {
  uni.setStorageSync('token', userData.token);
  uni.setStorageSync('userId', userData.userId);
  uni.setStorageSync('username', userData.username);
  uni.setStorageSync('role', userData.role);
  if (userData.avatar) {
    uni.setStorageSync('avatar', userData.avatar);
  }
  
  uni.showToast({
    title: '登录成功',
    icon: 'success'
  });
  
  setTimeout(() => {
    uni.switchTab({
      url: '/pages/index/index'
    });
  }, 1500);
};

// 初始化主题状态
onMounted(() => {
  // 从本地存储获取当前主题模式，默认白天模式
  const currentTheme = uni.getStorageSync('themeMode') || 'light';
  isDarkMode.value = currentTheme === 'dark';
  
  // 监听主题变化事件
  uni.$on('themeChange', (darkMode) => {
    isDarkMode.value = darkMode;
  });
});
</script>

<style>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 登录表单 */
.login-form {
  flex: 1;
  padding: 40rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 用户名登录 */
.username-login {
  width: 100%;
  max-width: 600rpx;
  background-color: #ffffff;
  padding: 40rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 30rpx;
}

.input-wrapper {
  display: flex;
  align-items: center;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 0 20rpx;
  transition: all 0.3s;
}

.input-wrapper:focus-within {
  border-color: #6666ff;
}

.login-input {
  flex: 1;
  height: 80rpx;
  font-size: 28rpx;
  color: #333333;
}

.login-input::placeholder {
  color: #999999;
}

.login-btn {
  width: 100%;
  height: 80rpx;
  background-color: #6666ff;
  color: #ffffff;
  font-size: 28rpx;
  border: none;
  border-radius: 8rpx;
  margin-top: 20rpx;
}

.login-btn:disabled {
  background-color: #cccccc;
}

/* 微信登录 */
.divider {
  width: 100%;
  max-width: 600rpx;
  display: flex;
  align-items: center;
  margin: 60rpx 0 40rpx;
}

.divider-line {
  flex: 1;
  height: 2rpx;
  background-color: #e0e0e0;
}

.divider-text {
  padding: 0 30rpx;
  font-size: 24rpx;
  color: #999999;
}

.wechat-login-section {
  width: 100%;
  max-width: 600rpx;
}

.wechat-btn {
  width: 100%;
  height: 88rpx;
  background-color: #07c160;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 44rpx;
  font-size: 30rpx;
  border: none;
}

.wechat-icon-placeholder {
  width: 40rpx;
  height: 40rpx;
  margin-right: 16rpx;
  background-color: #ffffff;
  border-radius: 50%;
  position: relative;
}

.wechat-icon-placeholder::before {
  content: "W";
  color: #07c160;
  font-size: 24rpx;
  font-weight: bold;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 夜间模式样式 */
.dark-mode .container {
  background-color: #1a1a1a;
}

.dark-mode .username-login {
  background-color: #2d2d2d;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
}

.dark-mode .input-wrapper {
  border-color: #404040;
  background-color: #1a1a1a;
}

.dark-mode .input-wrapper:focus-within {
  border-color: #8888ff;
}

.dark-mode .login-input {
  color: #ffffff;
  background-color: transparent;
}

.dark-mode .send-code {
  color: #8888ff;
  border-left-color: #404040;
}

.dark-mode .send-code.disabled {
  color: #666666;
}

.dark-mode .login-btn {
  background-color: #8888ff;
}
</style>