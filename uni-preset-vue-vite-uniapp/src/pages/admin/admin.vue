<template>
  <view class="admin-container">
    <view class="top-bar">
      <view class="back-btn" @click="goBack">❮</view>
      <view class="top-bar-title">管理员后台</view>
    </view>

    <view class="main-content">
      <view class="admin-card">
        <view class="card-header">
          <text class="card-icon">⚙️</text>
          <text class="card-title">管理选项</text>
        </view>
        <view class="admin-menu">
          <view class="menu-item" @click="goToAccountManage">
            <text class="menu-icon">👥</text>
            <view class="menu-info">
              <text class="menu-title">账号管理</text>
              <text class="menu-desc">创建和管理用户账号</text>
            </view>
            <text class="menu-arrow">❯</text>
          </view>
          <view class="menu-item" @click="goToUserManage">
            <text class="menu-icon">📝</text>
            <view class="menu-info">
              <text class="menu-title">用户管理</text>
              <text class="menu-desc">查看和管理所有用户信息</text>
            </view>
            <text class="menu-arrow">❯</text>
          </view>
          <view class="menu-item" @click="goToQuestionManage">
            <text class="menu-icon">📚</text>
            <view class="menu-info">
              <text class="menu-title">题目管理</text>
              <text class="menu-desc">管理题库中的题目</text>
            </view>
            <text class="menu-arrow">❯</text>
          </view>
          <view class="menu-item" @click="goToFeedbackManage">
            <text class="menu-icon">💬</text>
            <view class="menu-info">
              <text class="menu-title">反馈管理</text>
              <text class="menu-desc">查看并处理用户反馈</text>
            </view>
            <text class="menu-arrow">❯</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onMounted } from 'vue';

// 检查管理员权限 (role为1时是管理员)
const checkAdminPermission = () => {
  const role = uni.getStorageSync('role');
  if (role !== 1 && role !== '1') {
    uni.showToast({
      title: '无权限访问',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
    return false;
  }
  return true;
};

onMounted(() => {
  checkAdminPermission();
});

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 跳转到账号管理
const goToAccountManage = () => {
  uni.navigateTo({
    url: '/pages/admin/account-manage'
  });
};

// 跳转到用户管理
const goToUserManage = () => {
  uni.navigateTo({
    url: '/pages/admin/user-manage'
  });
};

// 跳转到题目管理
const goToQuestionManage = () => {
  uni.navigateTo({
    url: '/pages/computer/computer-question-manage'
  });
};

// 跳转到反馈管理
const goToFeedbackManage = () => {
  uni.navigateTo({
    url: '/pages/computer/computer-feedback-manage'
  });
};
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.top-bar {
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx 30rpx;
  position: relative;
}

.back-btn {
  font-size: 40rpx;
  color: #fff;
  padding: 10rpx 20rpx;
  position: absolute;
  left: 20rpx;
}

.top-bar-title {
  flex: 1;
  text-align: center;
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
}

.main-content {
  padding: 20rpx 30rpx;
}

.admin-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
  padding-bottom: 30rpx;
  border-bottom: 2rpx solid #f3f4f6;
}

.card-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.card-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1f2937;
}

.admin-menu {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background: #f9fafb;
  border-radius: 16rpx;
  transition: all 0.3s ease;
}

.menu-item:active {
  background: #f3f4f6;
  transform: scale(0.98);
}

.menu-icon {
  font-size: 48rpx;
  margin-right: 24rpx;
}

.menu-info {
  flex: 1;
}

.menu-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8rpx;
}

.menu-desc {
  display: block;
  font-size: 26rpx;
  color: #6b7280;
}

.menu-arrow {
  font-size: 32rpx;
  color: #9ca3af;
}
</style>
