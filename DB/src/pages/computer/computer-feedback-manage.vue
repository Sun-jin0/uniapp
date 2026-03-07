<script setup>
import { ref, onMounted } from 'vue';
import { request } from '../../api/request';

const statusBarHeight = ref(0);
const feedbacks = ref([]);
const loading = ref(false);
const status = ref(1); // 1: 待处理, 2: 已处理

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync();
  statusBarHeight.value = systemInfo.statusBarHeight || 0;
  fetchFeedbacks();
});

const fetchFeedbacks = async () => {
  loading.value = true;
  try {
    const res = await request({
      url: '/computer1/feedbacks',
      data: { status: status.value }
    });
    feedbacks.value = res.data.list || [];
  } catch (error) {
    console.error('获取反馈失败:', error);
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (feedbackId, newStatus) => {
  try {
    await request({
      url: `/computer1/feedbacks/${feedbackId}`,
      method: 'PUT',
      data: { status: newStatus }
    });
    uni.showToast({ title: '已处理' });
    fetchFeedbacks();
  } catch (error) {
    console.error('更新反馈状态失败:', error);
  }
};

const goToEdit = (questionId) => {
  uni.navigateTo({
    url: `/pages/computer/computer-question-edit?questionId=${questionId}`
  });
};

const goBack = () => {
  uni.navigateBack();
};
</script>

<template>
  <view class="container">
    <view class="custom-nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <view class="back-btn" @click="goBack">❮</view>
        <view class="nav-title">反馈管理</view>
      </view>
      <view class="tab-bar">
        <view class="tab-item" :class="{ active: status === 1 }" @click="status = 1; fetchFeedbacks()">待处理</view>
        <view class="tab-item" :class="{ active: status === 2 }" @click="status = 2; fetchFeedbacks()">已处理</view>
      </view>
    </view>

    <scroll-view 
      class="feedback-list" 
      scroll-y 
      :style="{ marginTop: (statusBarHeight + 88) + 'px' }"
    >
      <view v-if="feedbacks.length === 0 && !loading" class="no-data">暂无反馈数据</view>
      <view v-for="item in feedbacks" :key="item.ID" class="feedback-card">
        <view class="card-header">
          <text class="type-tag">{{ item.Type }}</text>
          <text class="time">{{ new Date(item.CreatedAt).toLocaleString() }}</text>
        </view>
        <view class="q-info">
          <text class="label">对应题目 (ID: {{ item.QuestionID }}):</text>
          <view class="q-stem" v-html="item.stem"></view>
        </view>
        <view class="feedback-content">
          <text class="label">反馈内容:</text>
          <view class="content-text">{{ item.Content }}</view>
        </view>
        <view class="card-footer">
          <button class="edit-btn" @click="goToEdit(item.QuestionID)">去修改题目</button>
          <button v-if="item.Status === 1" class="done-btn" @click="updateStatus(item.ID, 2)">标记为已处理</button>
        </view>
      </view>
      <view v-if="loading" class="loading">加载中...</view>
    </scroll-view>
  </view>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.custom-nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fff;
  z-index: 100;
  border-bottom: 1rpx solid #eee;
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
}

.back-btn {
  font-size: 40rpx;
  padding-right: 30rpx;
}

.nav-title {
  font-size: 34rpx;
  font-weight: bold;
}

.tab-bar {
  display: flex;
  height: 44px;
  border-top: 1rpx solid #f1f3f5;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #1976d2;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 4rpx;
  background: #1976d2;
  border-radius: 2rpx;
}

.feedback-list {
  padding: 20rpx;
  box-sizing: border-box;
}

.feedback-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.type-tag {
  background: #fff3e0;
  color: #ff9800;
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.time {
  font-size: 24rpx;
  color: #999;
}

.label {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 10rpx;
}

.q-info {
  background: #f8f9fa;
  padding: 20rpx;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}

.q-stem {
  font-size: 26rpx;
  color: #666;
  max-height: 100rpx;
  overflow: hidden;
  line-height: 1.5;
}

.content-text {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 30rpx;
  line-height: 1.6;
}

.card-footer {
  display: flex;
  gap: 20rpx;
  border-top: 1rpx solid #eee;
  padding-top: 30rpx;
}

.card-footer button {
  flex: 1;
  font-size: 26rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 36rpx;
}

.edit-btn {
  background: #e3f2fd;
  color: #1976d2;
}

.done-btn {
  background: #4caf50;
  color: #fff;
}

.loading, .no-data {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 26rpx;
}
</style>