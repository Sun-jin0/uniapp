<template>
  <view class="admin-container">
    <view class="top-bar">
      <view class="back-btn" @click="goBack">❮</view>
      <view class="top-bar-title">计算机刷题后台管理</view>
    </view>

    <view class="main-content">
      <view class="admin-card">
        <view class="card-header">
          <text class="card-icon">⚙️</text>
          <text class="card-title">管理选项</text>
        </view>
        <view class="admin-menu">
          <view class="menu-item" @click="goToQuestionManage">
            <text class="menu-icon">⚙️</text>
            <view class="menu-info">
              <text class="menu-title">题目管理</text>
              <text class="menu-desc">搜索、修改和删除题库中的题目</text>
            </view>
            <text class="menu-arrow">❯</text>
          </view>
          <view class="menu-item" @click="goToFeedbackManage">
            <text class="menu-icon">💬</text>
            <view class="menu-info">
              <text class="menu-title">反馈管理</text>
              <text class="menu-desc">查看并处理用户提交的题目纠错反馈</text>
            </view>
            <text class="menu-arrow">❯</text>
          </view>
          <view class="menu-item" @click="goToImport">
            <text class="menu-icon">📥</text>
            <view class="menu-info">
              <text class="menu-title">题目批量导入</text>
              <text class="menu-desc">通过 JSON 文件批量导入题目数据</text>
            </view>
            <text class="menu-arrow">❯</text>
          </view>
          <view class="menu-item" @click="goToPaperImport">
            <text class="menu-icon">📝</text>
            <view class="menu-info">
              <text class="menu-title">试卷结构导入</text>
              <text class="menu-desc">导入真题或模拟题的固定试卷结构</text>
            </view>
            <text class="menu-arrow">❯</text>
          </view>
          <view class="menu-item disabled">
            <text class="menu-icon">📈</text>
            <view class="menu-info">
              <text class="menu-title">数据分析 (开发中)</text>
              <text class="menu-desc">查看计算机刷题数据统计</text>
            </view>
            <text class="menu-arrow">❯</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
const goBack = () => {
  uni.navigateBack();
};

const goToImport = () => {
  uni.navigateTo({
    url: '/pages/computer/computer-question-import'
  });
};

const goToQuestionManage = () => {
  uni.navigateTo({
    url: '/pages/computer/computer-question-manage'
  });
};

const goToFeedbackManage = () => {
  uni.navigateTo({
    url: '/pages/computer/computer-feedback-manage'
  });
};

const goToPaperImport = () => {
  uni.navigateTo({
    url: '/pages/computer/computer-paper-import'
  });
};
</script>

<style scoped>
.admin-container {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.top-bar {
  background: #fff;
  padding: 44px 30rpx 20rpx;
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  font-size: 40rpx;
  color: #333;
  padding-right: 30rpx;
  cursor: pointer;
}

.top-bar-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.main-content {
  padding: 30rpx;
}

.admin-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.card-icon {
  font-size: 40rpx;
  margin-right: 15rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.admin-menu {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f9f9f9;
  cursor: pointer;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: #fcfcfc;
}

.menu-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.menu-icon {
  font-size: 44rpx;
  margin-right: 25rpx;
}

.menu-info {
  flex: 1;
}

.menu-title {
  display: block;
  font-size: 30rpx;
  color: #333;
  margin-bottom: 4rpx;
}

.menu-desc {
  font-size: 24rpx;
  color: #999;
}

.menu-arrow {
  font-size: 28rpx;
  color: #ccc;
}
</style>
