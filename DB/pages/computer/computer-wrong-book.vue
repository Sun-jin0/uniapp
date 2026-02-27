<template>
  <view class="container" :style="{ paddingTop: statusBarHeight + 'px' }">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="back-icon" @tap="goBack">
        <SvgIcon name="left" size="44" fill="#333" />
      </view>
      <view class="nav-title">错题本</view>
      <view class="clear-btn" @tap="showClearConfirm">
        <text>清空</text>
      </view>
    </view>

    <!-- 统计信息 -->
    <view class="stats-card" id="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ wrongQuestions.length }}</text>
        <text class="stat-label">错题总数</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ masteredCount }}</text>
        <text class="stat-label">已掌握</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ wrongQuestions.length - masteredCount }}</text>
        <text class="stat-label">待复习</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons" id="action-buttons">
      <view class="action-btn primary" @tap="startPractice">
        <SvgIcon name="edit" size="24" fill="#fff" />
        <text>开始错题重做</text>
      </view>
      <view class="action-btn secondary" @tap="shufflePractice">
        <SvgIcon name="refresh" size="24" fill="#2196f3" />
        <text>随机练习</text>
      </view>
    </view>

    <!-- 错题列表 -->
    <scroll-view 
      class="question-list" 
      scroll-y 
      @scrolltolower="loadMore"
      :style="{ height: scrollHeight }"
    >
      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>
      <view v-else-if="wrongQuestions.length > 0">
        <view 
          v-for="(question, index) in wrongQuestions" 
          :key="question.id || question.question_id"
          class="question-item"
          @tap="goToQuestion(question, index)"
        >
          <view class="question-header">
            <view class="question-index">
              <text>{{ index + 1 }}</text>
            </view>
            <view class="question-type">
              <text>{{ getQuestionTypeLabel(question.exercise_type) }}</text>
            </view>
            <view v-if="question.is_correct === 1" class="status-badge">
              <text>已做对</text>
            </view>
            <view class="question-date">
              <text>{{ formatDate(question.CreatedAt) }}</text>
            </view>
          </view>
          <view class="question-content">
            <view class="question-stem" v-html="question.processedStem"></view>
          </view>
          <view class="question-footer">
            <view class="question-info">
              <text v-if="question.chapter_name" class="info-tag">{{ question.chapter_name }}</text>
              <text v-if="question.major_name" class="info-tag">{{ question.major_name }}</text>
            </view>
            <view class="question-actions">
              <view class="action-btn-small" @tap.stop="removeFromWrongBook(question)">
                <SvgIcon name="delete" size="20" fill="#ff4d4f" />
              </view>
            </view>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <view class="empty-icon">🎉</view>
        <text class="empty-text">暂无错题</text>
        <text class="empty-desc">继续保持，你很棒！</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { request } from '@/api/request';
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue';
import { processStem } from '../../utils/questionUtils';

const statusBarHeight = ref(0);
const scrollHeight = ref('0px');
const loading = ref(true);
const wrongQuestions = ref([]);
const masteredCount = ref(0);

onMounted(async () => {
  const systemInfo = uni.getSystemInfoSync();
  statusBarHeight.value = systemInfo.statusBarHeight;
  await fetchWrongQuestions();
  // 等待 DOM 更新后计算高度
  nextTick(() => {
    calculateScrollHeight();
  });
});

const calculateScrollHeight = () => {
  const query = uni.createSelectorQuery();
  query.select('.nav-header').boundingClientRect();
  query.select('#stats-card').boundingClientRect();
  query.select('#action-buttons').boundingClientRect();
  
  query.exec((res) => {
    if (res[0] && res[1] && res[2]) {
      const systemInfo = uni.getSystemInfoSync();
      const navHeight = res[0].height;
      const statsHeight = res[1].height;
      const actionHeight = res[2].height;
      const windowHeight = systemInfo.windowHeight;
      const statusBar = systemInfo.statusBarHeight;
      
      // 计算剩余高度: 窗口高度 - 状态栏 - 导航栏 - 统计卡片 - 间距 - 操作按钮
      // 注意: margin 也要考虑进去
      const calculatedHeight = windowHeight - statusBar - navHeight - statsHeight - actionHeight - 60; // 60 是大致的 margin 补偿
      scrollHeight.value = `${calculatedHeight}px`;
    } else {
      // 降级方案
      const systemInfo = uni.getSystemInfoSync();
      scrollHeight.value = `${systemInfo.windowHeight - 250}px`;
    }
  });
};

const fetchWrongQuestions = async () => {
  loading.value = true;
  try {
    const userId = uni.getStorageSync('userId');
    if (!userId) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    const res = await request({
      url: '/computer1/wrong-book',
      method: 'GET',
      data: { userId }
    });

    if (res.code === 0 && res.data) {
      const questions = res.data.questions || [];
      questions.forEach(q => {
        // 优先使用 stem，如果没有则使用 question
        const originalContent = q.stem || q.question || '';
        if (originalContent) {
          q.processedStem = processStem(originalContent);
        } else {
          q.processedStem = '';
        }
      });
      wrongQuestions.value = questions;
      masteredCount.value = res.data.masteredCount || 0;
      
      // 数据更新后重新计算高度
      nextTick(() => {
        calculateScrollHeight();
      });
    }
  } catch (error) {
    console.error('获取错题失败:', error);
    uni.showToast({
      title: '获取错题失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

const getQuestionTypeLabel = (type) => {
  const typeLabels = {
    1: '单选题',
    2: '多选题',
    3: '填空题',
    4: '解答题',
    5: '判断题',
    6: '算法题',
    7: '应用题'
  };
  return typeLabels[type] || '题目';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
  
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const goToQuestion = (question, index) => {
  const questionId = question.question_id || question.id;
  const url = `/pages/computer/computer-practice?questionId=${questionId}&mode=wrong_book&wrongBookIndex=${index}`;
  uni.navigateTo({ url });
};

const startPractice = () => {
  if (wrongQuestions.value.length === 0) {
    uni.showToast({
      title: '暂无错题',
      icon: 'none'
    });
    return;
  }
  
  const questionId = wrongQuestions.value[0].question_id || wrongQuestions.value[0].id;
  const url = `/pages/computer/computer-practice?questionId=${questionId}&mode=wrong_book&wrongBookIndex=0`;
  uni.navigateTo({ url });
};

const shufflePractice = () => {
  if (wrongQuestions.value.length === 0) {
    uni.showToast({
      title: '暂无错题',
      icon: 'none'
    });
    return;
  }
  
  const shuffled = [...wrongQuestions.value].sort(() => Math.random() - 0.5);
  const questionId = shuffled[0].question_id || shuffled[0].id;
  
  uni.showLoading({ title: '准备中...' });
  
  setTimeout(() => {
    uni.hideLoading();
    const url = `/pages/computer/computer-practice?questionId=${questionId}&mode=wrong_book&shuffle=true`;
    uni.navigateTo({ url });
  }, 500);
};

const removeFromWrongBook = async (question) => {
  const questionId = question.question_id || question.id;
  
  uni.showModal({
    title: '确认移除',
    content: '确定要将这道题从错题本中移除吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const userId = uni.getStorageSync('userId');
          const removeRes = await request({
            url: '/computer1/wrong-book/remove',
            method: 'POST',
            data: {
              userId,
              questionId
            }
          });

          if (removeRes.code === 0) {
            uni.showToast({
              title: '移除成功',
              icon: 'success'
            });
            await fetchWrongQuestions();
          }
        } catch (error) {
          console.error('移除错题失败:', error);
          uni.showToast({
            title: '移除失败',
            icon: 'none'
          });
        }
      }
    }
  });
};

const showClearConfirm = () => {
  if (wrongQuestions.value.length === 0) {
    uni.showToast({
      title: '错题本已为空',
      icon: 'none'
    });
    return;
  }

  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有错题吗？此操作不可恢复！',
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        try {
          const userId = uni.getStorageSync('userId');
          const clearRes = await request({
            url: '/computer1/wrong-book/clear',
            method: 'POST',
            data: { userId }
          });

          if (clearRes.code === 0) {
            uni.showToast({
              title: '清空成功',
              icon: 'success'
            });
            await fetchWrongQuestions();
          }
        } catch (error) {
          console.error('清空错题失败:', error);
          uni.showToast({
            title: '清空失败',
            icon: 'none'
          });
        }
      }
    }
  });
};

const loadMore = () => {
};

const goBack = () => {
  uni.navigateBack();
};
</script>

<style lang="scss" scoped>
.container {
  height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 20rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #f0f0f0;
  
  .nav-title {
    font-size: 34rpx;
    font-weight: 600;
    color: #333;
  }
  
  .back-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60rpx;
    height: 60rpx;
  }
  
  .clear-btn {
    padding: 10rpx 20rpx;
    font-size: 28rpx;
    color: #ff4d4f;
  }
}

.stats-card {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background-color: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .stat-value {
      font-size: 48rpx;
      font-weight: 700;
      color: #2196f3;
      margin-bottom: 8rpx;
    }
    
    .stat-label {
      font-size: 24rpx;
      color: #999;
    }
  }
  
  .stat-divider {
    width: 1rpx;
    height: 60rpx;
    background-color: #f0f0f0;
  }
}

.action-buttons {
  flex-shrink: 0;
  display: flex;
  gap: 20rpx;
  padding: 0 20rpx 20rpx;
  
  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 88rpx;
    border-radius: 44rpx;
    font-size: 30rpx;
    font-weight: 600;
    
    text {
      margin-left: 12rpx;
    }
    
    &.primary {
      background: linear-gradient(135deg, #2196f3, #1976d2);
      color: #fff;
      box-shadow: 0 4rpx 12rpx rgba(33, 150, 243, 0.3);
    }
    
    &.secondary {
      background-color: #fff;
      color: #2196f3;
      border: 2rpx solid #2196f3;
    }
  }
}

.question-list {
  flex: 1;
  padding: 0 20rpx 20rpx;
}

.question-item {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  }
  
  .question-header {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
    
    .question-index {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16rpx;
      
      text {
        color: #fff;
        font-size: 24rpx;
        font-weight: 600;
      }
    }
    
    .question-type {
      flex: 1;
      padding: 4rpx 16rpx;
      background-color: #fff3e0;
      border-radius: 20rpx;
      
      text {
        font-size: 24rpx;
        color: #ff9800;
      }
    }
    
    .status-badge {
      padding: 4rpx 16rpx;
      background-color: #e8f5e9;
      border-radius: 20rpx;
      margin-left: 16rpx;
      
      text {
        font-size: 24rpx;
        color: #4caf50;
      }
    }
    
    .question-date {
      font-size: 24rpx;
      color: #999;
    }
  }
  
  .question-content {
    margin-bottom: 16rpx;
    
    .question-stem {
      font-size: 28rpx;
      color: #333;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      word-break: break-all;

      :deep(p) {
        margin: 0;
        display: inline;
      }

      :deep(.blank-placeholder) {
        display: inline-flex;
        align-items: baseline;
        margin: 0 8rpx;
        color: #2196f3;
        vertical-align: middle;
      }

      :deep(.blank-index) {
        font-size: 24rpx;
        font-weight: normal;
        margin-right: 4rpx;
        color: #666;
      }

      :deep(.blank-underline) {
        border-bottom: 2rpx solid #2196f3;
        min-width: 60rpx;
        display: inline-block;
        height: 2rpx;
        margin-bottom: 2rpx;
      }
    }
  }
  
  .question-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .question-info {
      display: flex;
      flex-wrap: wrap;
      gap: 8rpx;
      
      .info-tag {
        padding: 4rpx 12rpx;
        background-color: #f5f5f5;
        border-radius: 12rpx;
        font-size: 22rpx;
        color: #666;
      }
    }
    
    .question-actions {
      display: flex;
      gap: 12rpx;
      
      .action-btn-small {
        width: 56rpx;
        height: 56rpx;
        border-radius: 50%;
        background-color: #fff1f0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 20rpx;
  
  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 30rpx;
  }
  
  .empty-text {
    font-size: 32rpx;
    color: #333;
    font-weight: 600;
    margin-bottom: 12rpx;
  }
  
  .empty-desc {
    font-size: 26rpx;
    color: #999;
  }
}
</style>