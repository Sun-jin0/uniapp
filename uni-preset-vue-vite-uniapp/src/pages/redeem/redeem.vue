<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    <view class="bg-decoration"></view>
    <view class="content-wrapper">
      <!-- 兑换区域 -->
      <view class="header-section">
        <!-- 左上角角色 -->
        <svg class="character-left" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 头发 -->
          <path d="M30 35 Q20 20 35 15 Q50 10 65 15 Q80 20 70 35 Q75 40 70 50 L65 55 L35 55 L30 50 Q25 40 30 35" fill="#81d4fa" stroke="#4fc3f7" stroke-width="2"/>
          <!-- 脸部 -->
          <ellipse cx="50" cy="45" rx="18" ry="20" fill="#ffe0bd"/>
          <!-- 眼睛 -->
          <circle cx="42" cy="42" r="5" fill="#424242"/>
          <circle cx="58" cy="42" r="5" fill="#424242"/>
          <circle cx="43" cy="40" r="2" fill="white"/>
          <circle cx="59" cy="40" r="2" fill="white"/>
          <!-- 腮红 -->
          <ellipse cx="35" cy="48" rx="3" ry="2" fill="#ffab91" opacity="0.6"/>
          <ellipse cx="65" cy="48" rx="3" ry="2" fill="#ffab91" opacity="0.6"/>
          <!-- 嘴巴 -->
          <path d="M46 52 Q50 56 54 52" stroke="#ef5350" stroke-width="2" fill="none" stroke-linecap="round"/>
          <!-- 头发细节 -->
          <path d="M35 20 Q40 25 45 20" stroke="#4fc3f7" stroke-width="2" fill="none"/>
          <path d="M55 20 Q60 25 65 20" stroke="#4fc3f7" stroke-width="2" fill="none"/>
          <!-- 呆毛 -->
          <path d="M50 15 Q55 5 50 8" stroke="#81d4fa" stroke-width="3" fill="none" stroke-linecap="round"/>
          <!-- 身体 -->
          <path d="M35 60 L30 85 L70 85 L65 60 Z" fill="white" stroke="#e0e0e0" stroke-width="1"/>
          <!-- 领带 -->
          <path d="M50 60 L45 75 L50 80 L55 75 Z" fill="#42a5f5"/>
          <!-- 手 -->
          <circle cx="25" cy="70" r="6" fill="#ffe0bd"/>
          <circle cx="75" cy="70" r="6" fill="#ffe0bd"/>
        </svg>

        <!-- 右上角控制按钮 -->
        <!-- 删除控制按钮 -->

        <!-- 兑换卡片 -->
        <view class="exchange-card">
          <view class="card-title">
            <text class="title-bg">APP兑换中心</text>
          </view>

          <view class="input-wrapper">
            <input type="text" class="code-input" placeholder="请输入兑换码" v-model="redeemCode" maxlength="20" placeholder-class="input-placeholder" />
          </view>

          <button class="exchange-btn" @click="submitRedeem" :disabled="!redeemCode.trim()">
            <text class="btn-text">立即兑换</text>
          </button>

          <!-- 右下角角色 -->
          <svg class="character-right" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- 头发 -->
            <path d="M30 35 Q20 20 35 15 Q50 10 65 15 Q80 20 70 35 Q75 40 70 50 L65 55 L35 55 L30 50 Q25 40 30 35" fill="#81d4fa" stroke="#4fc3f7" stroke-width="2"/>
            <!-- 脸部 -->
            <ellipse cx="50" cy="45" rx="18" ry="20" fill="#ffe0bd"/>
            <!-- 眼睛 -->
            <circle cx="42" cy="42" r="5" fill="#424242"/>
            <circle cx="58" cy="42" r="5" fill="#424242"/>
            <circle cx="43" cy="40" r="2" fill="white"/>
            <circle cx="59" cy="40" r="2" fill="white"/>
            <!-- 腮红 -->
            <ellipse cx="35" cy="48" rx="3" ry="2" fill="#ffab91" opacity="0.6"/>
            <ellipse cx="65" cy="48" rx="3" ry="2" fill="#ffab91" opacity="0.6"/>
            <!-- 嘴巴 -->
            <path d="M46 52 Q50 56 54 52" stroke="#ef5350" stroke-width="2" fill="none" stroke-linecap="round"/>
            <!-- 头发细节 -->
            <path d="M35 20 Q40 25 45 20" stroke="#4fc3f7" stroke-width="2" fill="none"/>
            <path d="M55 20 Q60 25 65 20" stroke="#4fc3f7" stroke-width="2" fill="none"/>
            <!-- 呆毛 -->
            <path d="M50 15 Q55 5 50 8" stroke="#81d4fa" stroke-width="3" fill="none" stroke-linecap="round"/>
            <!-- 身体 -->
            <path d="M35 60 L30 85 L70 85 L65 60 Z" fill="white" stroke="#e0e0e0" stroke-width="1"/>
            <!-- 领带 -->
            <path d="M50 60 L45 75 L50 80 L55 75 Z" fill="#42a5f5"/>
            <!-- 手 -->
            <circle cx="25" cy="70" r="6" fill="#ffe0bd"/>
            <circle cx="75" cy="70" r="6" fill="#ffe0bd"/>
          </svg>
        </view>
      </view>

      <!-- 记录区域 -->
      <view class="record-card">
        <view class="record-title">
          <text class="record-title-bg">兑换记录</text>
        </view>

        <scroll-view scroll-y class="record-list">
          <view class="record-item" v-for="record in redeemRecords" :key="record.id" @click="goVideoDetail(record)">
            <view class="checkbox" :class="{ checked: record.status === 'success' }"></view>
            <view class="record-text">
              <text class="record-date">{{ formatDateShort(record.time) }}</text>
              <text class="record-content"> 兑换成功：<text class="gift-name">{{ record.desc }}</text></text>
            </view>
          </view>
          <view v-if="redeemRecords.length === 0" class="no-record">
            <text class="no-record-text">暂无兑换记录</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getCurrentInstance } from 'vue';
import { BASE_URL } from '@/api/request';

const instance = getCurrentInstance();
const videoApi = instance.appContext.config.globalProperties.$api.videoApi || instance.appContext.config.globalProperties.$api.wrongBookApi;

// 主题状态
const isDarkMode = ref(false);

// 兑换码
const redeemCode = ref('');

// 兑换记录
const redeemRecords = ref([]);

onMounted(() => {
  fetchRecords();
});

const fetchRecords = async () => {
  try {
    console.log('Fetching redeemed records...');
    const res = await videoApi.getMyVideos('redeemed');
    console.log('Redeem records response:', res);
    if (res.code === 0 && res.data) {
      const records = [];
      
      // 处理合集记录
      if (res.data.collections && Array.isArray(res.data.collections)) {
        res.data.collections.forEach(collection => {
          records.push({
            id: 'col-' + collection.id,
            collectionId: collection.id,
            code: '***',
            desc: collection.name,
            status: 'success',
            statusText: '兑换成功',
            time: collection.access_time,
            itemType: 'collection'
          });
        });
      }
      
      // 处理单个视频记录
      if (res.data.individualVideos && Array.isArray(res.data.individualVideos)) {
        res.data.individualVideos.forEach(video => {
          records.push({
            id: 'vid-' + video.id,
            vid: video.vid,
            code: '***',
            desc: video.title || '未知课程',
            status: 'success',
            statusText: '兑换成功',
            time: video.access_time,
            itemType: 'video'
          });
        });
      }
      
      redeemRecords.value = records;
    } else {
      console.warn('Invalid response format for redeemed records:', res);
    }
  } catch (e) {
    console.error('Error fetching redeem records:', e);
  }
};

const formatDateShort = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const goVideoDetail = (record) => {
  // 点击兑换记录进入我的视频页面
  uni.navigateTo({ url: '/pages/video/my-videos' });
};

const submitRedeem = async () => {
  if (!redeemCode.value.trim()) {
    uni.showToast({ title: '请输入兑换码', icon: 'none' });
    return;
  }
  
  // 先检查网络状态
  uni.getNetworkType({
    success: async (networkRes) => {
      console.log('Network type:', networkRes.networkType);
      if (networkRes.networkType === 'none') {
        uni.showToast({ title: '网络连接失败，请检查网络', icon: 'none' });
        return;
      }
      
      // 网络正常，执行兑换
      await doRedeem();
    },
    fail: () => {
      uni.showToast({ title: '无法检测网络状态', icon: 'none' });
    }
  });
};

const doRedeem = async () => {
  try {
    uni.showLoading({ title: '兑换中...', mask: true });
    console.log('Submitting redeem code:', redeemCode.value);
    console.log('Base URL:', BASE_URL);
    
    const res = await videoApi.redeem({ code: redeemCode.value });
    console.log('Redeem response:', res);
    
    if (res.code === 0) {
      uni.hideLoading();
      uni.showToast({ title: '兑换成功', icon: 'success' });
      redeemCode.value = '';
      await fetchRecords();
      // 1.5秒后跳转到我的课程
      setTimeout(() => {
        uni.navigateTo({ url: '/pages/video/my-videos' });
      }, 1500);
    } else {
      uni.hideLoading();
      uni.showToast({ title: res.message || '兑换失败', icon: 'none' });
    }
  } catch (e) {
    uni.hideLoading();
    console.error('Redeem error:', e);
    // 更详细的错误提示
    let errorMsg = '兑换失败';
    if (e.errMsg && e.errMsg.includes('fail')) {
      errorMsg = '网络请求失败，请检查网络连接';
    } else if (e.message) {
      errorMsg = e.message;
    }
    uni.showToast({ title: errorMsg, icon: 'none' });
  }
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
  background: linear-gradient(180deg, #e3f2fd 0%, #bbdefb 100%);
  min-height: 100vh;
  padding: 40rpx 40rpx;
  position: relative;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 背景装饰 */
.bg-decoration {
  position: fixed;
  top: -100rpx;
  right: -100rpx;
  width: 400rpx;
  height: 400rpx;
  background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.content-wrapper {
  max-width: 960rpx;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* 顶部区域 */
.header-section {
  position: relative;
  margin-bottom: 60rpx;
}

/* 左上角动漫角色 */
.character-left {
  position: absolute;
  top: -20rpx;
  left: -20rpx;
  width: 200rpx;
  height: 200rpx;
  z-index: 10;
  filter: drop-shadow(0 8rpx 16rpx rgba(0,0,0,0.1));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}

@keyframes shine {
  0% { transform: translateX(-100%) rotate(30deg); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateX(100%) rotate(30deg); opacity: 0; }
}

/* 兑换卡片 */
.exchange-card {
  background: rgba(255,255,255,0.95);
  border-radius: 48rpx;
  padding: 80rpx 48rpx 60rpx;
  margin-top: 80rpx;
  box-shadow: 
    0 16rpx 64rpx rgba(33,150,243,0.15),
    inset 0 0 0 6rpx rgba(255,255,255,0.8),
    inset 0 0 0 10rpx rgba(144,202,249,0.3);
  position: relative;
}

/* 标题 */
.card-title {
  text-align: center;
  margin-bottom: 60rpx;
  position: relative;
}

.title-bg {
  display: inline-block;
  background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
  color: white;
  padding: 20rpx 72rpx;
  border-radius: 60rpx;
  font-size: 44rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  text-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
  box-shadow: 
    0 8rpx 30rpx rgba(33,150,243,0.3),
    inset 0 -4rpx 0 rgba(0,0,0,0.1);
  border: 6rpx solid rgba(255,255,255,0.5);
}

/* 输入框 */
.input-wrapper {
  margin-bottom: 48rpx;
  position: relative;
}

.code-input {
  width: 100%;
  height: 112rpx;
  padding: 0 40rpx;
  border: 6rpx solid #81d4fa;
  border-radius: 32rpx;
  font-size: 32rpx;
  outline: none;
  transition: all 0.3s;
  background: rgba(255,255,255,0.9);
  color: #424242;
  box-sizing: border-box;
}

.input-placeholder {
  color: #9e9e9e;
  font-size: 32rpx;
}

.code-input:focus {
  border-color: #29b6f6;
  box-shadow: 0 0 0 8rpx rgba(41,182,246,0.1);
  background: white;
}

/* 兑换按钮 */
.exchange-btn {
  width: 100%;
  height: 112rpx;
  background: linear-gradient(135deg, #f48fb1 0%, #f06292 100%);
  border: none;
  border-radius: 60rpx;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 12rpx 40rpx rgba(244,143,177,0.4),
    inset 0 -6rpx 0 rgba(0,0,0,0.1);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.btn-text {
  font-size: 40rpx;
  font-weight: 800;
  letter-spacing: 8rpx;
  text-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.exchange-btn::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255,255,255,0.3) 50%,
    transparent 70%
  );
  transform: rotate(30deg);
  transition: all 0.6s;
  opacity: 0;
}

.exchange-btn:not(:disabled):active {
  transform: translateY(4rpx);
  box-shadow: 0 6rpx 20rpx rgba(244,143,177,0.4);
}

.exchange-btn:disabled {
  background: #cccccc;
  box-shadow: none;
  opacity: 0.8;
}

/* 右侧动漫角色 */
.character-right {
  position: absolute;
  bottom: -40rpx;
  right: -20rpx;
  width: 180rpx;
  height: 180rpx;
  z-index: 10;
  filter: drop-shadow(0 8rpx 16rpx rgba(0,0,0,0.1));
  animation: float 3s ease-in-out infinite;
  animation-delay: 0.5s;
}

/* 记录卡片 */
.record-card {
  background: rgba(255,255,255,0.95);
  border-radius: 48rpx;
  padding: 80rpx 40rpx 40rpx;
  margin-top: 40rpx;
  box-shadow: 
    0 16rpx 64rpx rgba(33,150,243,0.15),
    inset 0 0 0 6rpx rgba(255,255,255,0.8),
    inset 0 0 0 10rpx rgba(144,202,249,0.3);
  position: relative;
}

.record-title {
  text-align: center;
  margin-bottom: 40rpx;
  position: relative;
  margin-top: -100rpx;
}

.record-title-bg {
  display: inline-block;
  background: linear-gradient(135deg, #81d4fa 0%, #4fc3f7 100%);
  color: white;
  padding: 20rpx 72rpx;
  border-radius: 60rpx;
  font-size: 40rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  text-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
  box-shadow: 
    0 8rpx 30rpx rgba(33,150,243,0.3),
    inset 0 -4rpx 0 rgba(0,0,0,0.1);
  border: 6rpx solid rgba(255,255,255,0.5);
}

/* 记录列表 */
.record-list {
  max-height: 640rpx;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 28rpx 16rpx;
  border-bottom: 2rpx solid rgba(0,0,0,0.06);
  transition: all 0.2s;
}

.record-item:last-child {
  border-bottom: none;
}

.record-item:active {
  background: rgba(33,150,243,0.05);
  border-radius: 16rpx;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid #81d4fa;
  border-radius: 12rpx;
  margin-right: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.checkbox.checked {
  background: #29b6f6;
  border-color: #29b6f6;
}

.checkbox.checked::after {
  content: '✓';
  color: white;
  font-size: 28rpx;
  font-weight: bold;
}

.record-text {
  flex: 1;
  font-size: 30rpx;
  color: #424242;
  line-height: 1.5;
}

.record-date {
  color: #757575;
  font-weight: 500;
  margin-right: 12rpx;
}

.gift-name {
  color: #f06292;
  font-weight: 600;
}

.no-record {
  padding: 60rpx 0;
  text-align: center;
}

.no-record-text {
  color: #9e9e9e;
  font-size: 28rpx;
}

/* 夜间模式样式 */
.dark-mode .container {
  background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%);
}

.dark-mode .bg-decoration {
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
}

.dark-mode .exchange-card,
.dark-mode .record-card {
  background: rgba(45,45,45,0.95);
  box-shadow: 0 16rpx 64rpx rgba(0,0,0,0.4);
  inset: 0 0 0 6rpx rgba(255,255,255,0.05);
}

.dark-mode .exchange-card,
.dark-mode .record-card {
  background: rgba(45,45,45,0.95);
  box-shadow: 0 16rpx 64rpx rgba(0,0,0,0.4);
  inset: 0 0 0 6rpx rgba(255,255,255,0.05);
}

.dark-mode .code-input {
  background: rgba(64,64,64,0.9);
  color: #ffffff;
  border-color: #404040;
}

.dark-mode .record-text {
  color: #cccccc;
}

.dark-mode .record-date {
  color: #999999;
}

.dark-mode .record-item {
  border-bottom-color: rgba(255,255,255,0.1);
}

.dark-mode .record-item:active {
  background: rgba(255,255,255,0.05);
}
</style>