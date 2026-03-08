<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    <view class="frame-list">
      <view 
        v-for="frame in avatarFrames" 
        :key="frame.id" 
        class="frame-item"
        :class="{ 'frame-selected': selectedFrameId === frame.id, 'frame-locked': !frame.is_available }"
        @click="selectFrame(frame)"
      >
        <view class="frame-preview">
          <image 
            class="frame-image" 
            :class="{ 'frame-locked-image': !frame.is_available }"
            :src="frame.image_url || defaultFrame" 
            mode="aspectFit"
          ></image>
          <view v-if="selectedFrameId === frame.id" class="selected-badge">
            <text class="check-icon">[已选]</text>
          </view>
          <view v-if="!frame.is_available" class="lock-overlay">
            <text class="lock-icon">[锁定]</text>
            <text class="lock-text">{{ frame.unavailable_reason }}</text>
          </view>
        </view>
        <view class="frame-info">
          <text class="frame-name" :class="{ 'frame-locked-text': !frame.is_available }">{{ frame.name }}</text>
          <text class="frame-desc" v-if="frame.description">{{ frame.description }}</text>
          <text class="frame-lock-reason" v-if="!frame.is_available">{{ frame.unavailable_reason }}</text>
        </view>
      </view>

      <view 
        class="frame-item"
        :class="{ 'frame-selected': selectedFrameId === 0 }"
        @click="selectFrame({ id: 0 })"
      >
        <view class="frame-preview">
          <image 
            class="frame-image" 
            :src="defaultFrame" 
            mode="aspectFit"
          ></image>
          <view v-if="selectedFrameId === 0" class="selected-badge">
            <text class="check-icon">[已选]</text>
          </view>
        </view>
        <view class="frame-info">
          <text class="frame-name">不使用头像框</text>
        </view>
      </view>
    </view>

    <view v-if="loading" class="loading-container">
      <text class="loading-text">加载中...</text>
    </view>

    <view v-if="!loading && avatarFrames.length === 0" class="empty-container">
      <text class="empty-text">暂无可用头像框</text>
    </view>

    <view class="bottom-action">
      <button 
        class="confirm-btn" 
        :disabled="submitting"
        @click="confirmSelection"
      >
        {{ submitting ? '保存中...' : '确认选择' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getCurrentInstance } from 'vue';

const instance = getCurrentInstance();

const isDarkMode = ref(false);
const loading = ref(false);
const submitting = ref(false);
const avatarFrames = ref([]);
const selectedFrameId = ref(0);
const currentAvatarFrameId = ref(null);

const defaultFrame = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

onMounted(() => {
  const currentTheme = uni.getStorageSync('themeMode') || 'light';
  isDarkMode.value = currentTheme === 'dark';
  
  loadUserInfo();
  loadAvatarFrames();
});

const loadUserInfo = async () => {
  try {
    const res = await instance.appContext.config.globalProperties.$api.userApi.getUserInfo();
    if (res.code === 0) {
      currentAvatarFrameId.value = res.data.avatar_frame_id || null;
      selectedFrameId.value = res.data.avatar_frame_id || 0;
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

const loadAvatarFrames = async () => {
  loading.value = true;
  try {
    const res = await instance.appContext.config.globalProperties.$api.userApi.getUserAvatarFrames();
    if (res.code === 0) {
      avatarFrames.value = res.data || [];
    }
  } catch (error) {
    console.error('获取头像框列表失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

const selectFrame = (frame) => {
  // 检查是否有权限使用
  if (frame.is_available === false) {
    uni.showToast({
      title: frame.unavailable_reason || '暂无权限使用此头像框',
      icon: 'none',
      duration: 2000
    });
    return;
  }
  selectedFrameId.value = frame.id;
};

const confirmSelection = async () => {
  if (submitting.value) return;
  
  submitting.value = true;
  try {
    const res = await instance.appContext.config.globalProperties.$api.userApi.setUserAvatarFrame({
      avatar_frame_id: selectedFrameId.value
    });
    
    if (res.code === 0) {
      uni.showToast({
        title: '设置成功',
        icon: 'success'
      });
      
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      uni.showToast({
        title: res.message || '设置失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('设置头像框失败:', error);
    uni.showToast({
      title: '设置失败',
      icon: 'none'
    });
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
}

.dark-mode .container {
  background-color: #1a1a1a;
}

.frame-list {
  padding: 20rpx;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300rpx, 1fr));
  gap: 20rpx;
}

.frame-item {
  background-color: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.dark-mode .frame-item {
  background-color: #2d2d2d;
}

.frame-selected {
  border: 4rpx solid #667eea;
}

.dark-mode .frame-selected {
  border-color: #818cf8;
}

.frame-locked {
  opacity: 0.7;
}

.frame-locked-image {
  filter: grayscale(100%);
  opacity: 0.5;
}

.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 16rpx;
}

.lock-icon {
  font-size: 24rpx;
  color: #ffffff;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-bottom: 8rpx;
}

.lock-text {
  font-size: 22rpx;
  color: #ffffff;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.frame-locked-text {
  color: #999;
}

.frame-lock-reason {
  font-size: 22rpx;
  color: #ff6b6b;
  margin-top: 4rpx;
}

.dark-mode .frame-lock-reason {
  color: #ff8585;
}

.frame-preview {
  width: 100%;
  height: 180rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f8f8;
  position: relative;
}

.dark-mode .frame-preview {
  background-color: #1a1a1a;
}

.frame-image {
  max-width: 90%;
  max-height: 90%;
}

.selected-badge {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 40rpx;
  height: 40rpx;
  background-color: #667eea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: bold;
}

.frame-info {
  padding: 20rpx;
}

.frame-name {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
  display: block;
}

.dark-mode .frame-name {
  color: #ffffff;
}

.frame-desc {
  font-size: 24rpx;
  color: #999999;
  margin-top: 8rpx;
  display: block;
}

.loading-container,
.empty-container {
  padding: 100rpx 0;
  text-align: center;
}

.loading-text,
.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #ffffff;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.dark-mode .bottom-action {
  background-color: #2d2d2d;
}

.confirm-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  border-radius: 44rpx;
}

.confirm-btn[disabled] {
  background: #cccccc;
}
</style>
