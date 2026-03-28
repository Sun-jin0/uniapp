<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 隐私协议弹窗 -->
    <view class="privacy-modal" v-if="showPrivacyModal">
      <view class="privacy-content">
        <view class="privacy-title">隐私保护指引</view>
        <view class="privacy-body">
          <text class="privacy-text">
            在使用本小程序前，请您仔细阅读并同意{{ privacyContractName }}。
          </text>
          <view class="privacy-items">
            <view class="privacy-item">
              <text class="item-dot">•</text>
              <text class="item-text">我们可能会收集您的微信昵称、头像，用于用户身份识别</text>
            </view>
            <view class="privacy-item">
              <text class="item-dot">•</text>
              <text class="item-text">我们可能会收集您的学习记录，用于提供学习进度跟踪服务</text>
            </view>
          </view>
          <text class="privacy-link" @click="openPrivacyContract">查看完整隐私协议</text>
        </view>
        <view class="privacy-actions">
          <button class="privacy-btn disagree" @click="handleDisagree">不同意</button>
          <button 
            class="privacy-btn agree" 
            open-type="agreePrivacyAuthorization" 
            @agreeprivacyauthorization="handleAgreePrivacy"
            id="agree-btn"
          >同意</button>
        </view>
      </view>
    </view>

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
        
        <button class="login-btn" @click="usernameLogin" :disabled="!username || !password || !agreeAllPrivacy">登录</button>
      </view>

      <!-- 微信登录 -->
      <view class="divider">
        <view class="divider-line"></view>
        <view class="divider-text">其他登录方式</view>
        <view class="divider-line"></view>
      </view>

      <view class="wechat-login-section">
        <button class="wechat-btn" @click="handleWechatLogin" :disabled="!agreeAllPrivacy">
          <view class="wechat-icon-placeholder"></view>
          <text>微信一键登录</text>
        </button>
      </view>

      <!-- 隐私政策勾选 -->
      <view class="privacy-checkbox-section">
        <view class="checkbox-item">
          <checkbox :checked="agreeAllPrivacy" @click="toggleAllPrivacy" color="#4a90e2" />
          <text class="checkbox-text">
            已阅读并同意
            <text class="link-text" @click.stop="openAppPrivacy">《用户服务协议》</text>
            和
            <text class="link-text" @click.stop="openMiniProgramPrivacy">《研大师刷研题小程序隐私保护指引》</text>
          </text>
        </view>
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
const agreeAllPrivacy = ref(false);
const showPrivacyModal = ref(false);
const privacyContractName = ref('《小程序隐私保护指引》');
const needPrivacyAuthorization = ref(false);

// 切换隐私政策勾选（同时同意两个协议）
const toggleAllPrivacy = () => {
  agreeAllPrivacy.value = !agreeAllPrivacy.value;
};

// 打开官方隐私协议页面
const openPrivacyContract = () => {
  // #ifdef MP-WEIXIN
  wx.openPrivacyContract({
    success: () => {
      console.log('打开隐私协议成功');
    },
    fail: (err) => {
      console.error('打开隐私协议失败', err);
    }
  });
  // #endif
};

// 打开研大师刷研题小程序隐私保护指引
const openMiniProgramPrivacy = () => {
  uni.navigateTo({
    url: '/pages/privacy/mini-program-privacy'
  });
};

// 打开用户服务协议
const openAppPrivacy = () => {
  uni.navigateTo({
    url: '/pages/privacy/app-privacy'
  });
};

// 检查隐私协议状态
const checkPrivacySetting = () => {
  // #ifdef MP-WEIXIN
  if (wx.getPrivacySetting) {
    wx.getPrivacySetting({
      success: (res) => {
        console.log('隐私协议状态:', res);
        needPrivacyAuthorization.value = res.needAuthorization;
        privacyContractName.value = res.privacyContractName || '《小程序隐私保护指引》';
        if (res.needAuthorization) {
          showPrivacyModal.value = true;
        }
      },
      fail: (err) => {
        console.error('获取隐私协议状态失败:', err);
      }
    });
  }
  // #endif
};

// 不同意隐私协议
const handleDisagree = () => {
  uni.showModal({
    title: '提示',
    content: '您需要同意隐私保护指引才能继续使用本小程序。',
    showCancel: false,
    confirmText: '知道了'
  });
};

// 同意隐私协议
const handleAgreePrivacy = () => {
  console.log('用户同意隐私协议');
  showPrivacyModal.value = false;
  agreeAllPrivacy.value = true;
};

// 打开完整隐私政策
const openPrivacyPolicy = () => {
  uni.navigateTo({
    url: '/pages/privacy/privacy'
  });
};

// 页面加载时检查是否已登录
onMounted(() => {
  // 检查是否有token
  const token = uni.getStorageSync('token');
  if (token) {
    // 已登录，跳转到首页
    uni.switchTab({
      url: '/pages/index/index'
    });
    return;
  }
  
  // 检查隐私协议状态
  checkPrivacySetting();
  
  // 从本地存储获取当前主题模式，默认白天模式
  const currentTheme = uni.getStorageSync('themeMode') || 'light';
  isDarkMode.value = currentTheme === 'dark';
  
  // 监听主题变化事件
  uni.$on('themeChange', (darkMode) => {
    isDarkMode.value = darkMode;
  });
});

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

/* 隐私协议弹窗样式 */
.privacy-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.privacy-content {
  background: #fff;
  border-radius: 16rpx;
  width: 80%;
  max-width: 600rpx;
  padding: 40rpx;
}

.privacy-title {
  font-size: 36rpx;
  font-weight: 700;
  text-align: center;
  margin-bottom: 30rpx;
  color: #333;
}

.privacy-body {
  max-height: 600rpx;
  overflow-y: auto;
  margin-bottom: 30rpx;
}

.privacy-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  display: block;
  margin-bottom: 20rpx;
}

.privacy-items {
  margin-bottom: 20rpx;
}

.privacy-item {
  display: flex;
  margin-bottom: 16rpx;
}

.item-dot {
  font-size: 28rpx;
  color: #333;
  margin-right: 10rpx;
  flex-shrink: 0;
}

.item-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
  flex: 1;
}

.privacy-link {
  font-size: 28rpx;
  color: #4a90e2;
  text-decoration: underline;
  display: block;
  text-align: center;
}

.privacy-actions {
  display: flex;
  gap: 20rpx;
}

.privacy-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.privacy-btn.disagree {
  background: #f5f5f5;
  color: #666;
}

.privacy-btn.agree {
  background: #4a90e2;
  color: #fff;
}

.dark-mode .privacy-content {
  background: #2c2c2c;
}

.dark-mode .privacy-title {
  color: #fff;
}

.dark-mode .privacy-text,
.dark-mode .item-text {
  color: #ccc;
}

.dark-mode .item-dot {
  color: #fff;
}

.dark-mode .privacy-btn.disagree {
  background: #444;
  color: #ccc;
}

/* 隐私政策勾选区域 */
.privacy-checkbox-section {
  margin: 30rpx 0;
  display: flex;
  justify-content: center;
}

.checkbox-item {
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-text {
  font-size: 26rpx;
  color: #999;
  margin-left: 10rpx;
  line-height: 1.4;
}

.link-text {
  color: #4a90e2;
}

.dark-mode .checkbox-text {
  color: #999;
}

.dark-mode .link-text {
  color: #6bb3ff;
}
</style>