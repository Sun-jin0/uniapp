<template>
  <view class="container">
    <!-- 考试列表 -->
    <scroll-view class="exam-list" scroll-y @scrolltolower="loadMore" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <!-- 考试统计卡片 -->
      <view class="stats-card" v-if="examStats">
        <view class="stats-header">
          <text class="stats-title">我的考试数据</text>
        </view>
        <view class="stats-grid">
          <view class="stats-item">
            <text class="stats-num">{{ examStats.participatedCount || 0 }}</text>
            <text class="stats-label">参与考试</text>
          </view>
          <view class="stats-item">
            <text class="stats-num">{{ examStats.passedCount || 0 }}</text>
            <text class="stats-label">及格次数</text>
          </view>
          <view class="stats-item">
            <text class="stats-num">{{ examStats.averageScore || 0 }}</text>
            <text class="stats-label">平均分</text>
          </view>
          <view class="stats-item">
            <text class="stats-num">{{ examStats.bestRank || '-' }}</text>
            <text class="stats-label">最佳排名</text>
          </view>
        </view>
      </view>

      <!-- 考试类型筛选 -->
      <view class="filter-bar">
        <scroll-view scroll-x class="filter-scroll">
          <view class="filter-list">
            <view 
              class="filter-item" 
              :class="{ active: currentFilter === 'all' }"
              @tap="setFilter('all')"
            >
              <text>全部</text>
            </view>
            <view 
              class="filter-item" 
              :class="{ active: currentFilter === 'ongoing' }"
              @tap="setFilter('ongoing')"
            >
              <text>进行中</text>
            </view>
            <view 
              class="filter-item" 
              :class="{ active: currentFilter === 'upcoming' }"
              @tap="setFilter('upcoming')"
            >
              <text>即将开始</text>
            </view>
            <view 
              class="filter-item" 
              :class="{ active: currentFilter === 'completed' }"
              @tap="setFilter('completed')"
            >
              <text>已结束</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 考试列表 -->
      <view class="exam-items">
        <view v-if="loading && exams.length === 0" class="loading-state">
          <text>加载中...</text>
        </view>
        <view v-else-if="exams.length === 0" class="empty-state">
          <text class="empty-icon">📝</text>
          <text class="empty-text">暂无考试</text>
          <text class="empty-sub">请稍后再来查看</text>
        </view>
        <view 
          v-else
          v-for="exam in filteredExams" 
          :key="exam.id" 
          class="exam-card"
          :class="exam.examStatus"
          @tap="handleExamClick(exam)"
        >
          <!-- 考试状态标签 -->
          <view class="status-tag" :class="exam.examStatus">
            {{ getStatusText(exam.examStatus) }}
          </view>

          <view class="exam-header">
            <text class="exam-title">{{ exam.title }}</text>
            <text class="exam-desc" v-if="exam.description">{{ exam.description }}</text>
          </view>

          <view class="exam-info">
            <view class="info-item">
              <text class="info-text">{{ formatTime(exam.start_time) }} - {{ formatTime(exam.end_time) }} | 考试时长 {{ exam.duration }} 分钟</text>
            </view>
            <view class="info-item" v-if="exam.source_paper_name">
              <text class="info-text">{{ exam.source_paper_name }}</text>
            </view>
          </view>

          <view class="exam-footer">
            <view class="participants">
              <text class="participant-text">{{ exam.participant_count || 0 }} 人参与</text>
            </view>
            
            <!-- 根据状态显示不同按钮 -->
            <view class="action-btn" :class="exam.examStatus" v-if="!exam.isParticipated">
              <text v-if="exam.examStatus === 'ongoing'">立即参加</text>
              <text v-else-if="exam.examStatus === 'upcoming'">等待开始</text>
              <text v-else>已结束</text>
            </view>
            <view class="action-btn completed" v-else-if="exam.isParticipated">
              <text v-if="exam.is_graded">查看成绩</text>
              <text v-else>评分中...</text>
            </view>
          </view>

          <!-- 用户成绩展示 -->
          <view class="user-score" v-if="exam.isParticipated && exam.is_graded">
            <view class="score-display">
              <text class="score-num">{{ exam.user_score }}</text>
              <text class="score-label">分</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadingMore" class="loading-more">
        <text>加载更多...</text>
      </view>
      <view v-if="noMore && exams.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { request } from '@/api/request';

const loading = ref(true);
const refreshing = ref(false);
const loadingMore = ref(false);
const noMore = ref(false);
const currentFilter = ref('all');

const exams = ref([]);
const examStats = ref(null);
const page = ref(1);
const pageSize = 10;

// 筛选后的考试列表
const filteredExams = computed(() => {
  if (currentFilter.value === 'all') {
    return exams.value;
  }
  return exams.value.filter(exam => exam.examStatus === currentFilter.value);
});

onMounted(() => {
  fetchExams();
  fetchExamStats();
});

// 获取考试列表
const fetchExams = async (isRefresh = false) => {
  if (isRefresh) {
    page.value = 1;
    noMore.value = false;
  }
  
  if (isRefresh) {
    loading.value = true;
  } else {
    loadingMore.value = true;
  }

  try {
    const res = await request({
      url: '/online-exam/exams/available',
      data: {
        page: page.value,
        pageSize: pageSize
      }
    });

    console.log('获取考试列表响应:', res);
    if (res.code === 0) {
      const list = res.data?.list || res.data || [];
      console.log('考试数据:', JSON.stringify(list, null, 2));
      console.log('第一个考试的participant_count:', list[0]?.participant_count);
      if (isRefresh) {
        exams.value = list;
      } else {
        exams.value = [...exams.value, ...list];
      }
      
      if (list.length < pageSize) {
        noMore.value = true;
      }
    }
  } catch (error) {
    console.error('获取考试列表失败:', error);
    uni.showToast({
      title: '获取考试列表失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
    loadingMore.value = false;
    refreshing.value = false;
  }
};

// 获取考试统计
const fetchExamStats = async () => {
  try {
    const res = await request({
      url: '/online-exam/user/stats'
    });
    if (res.code === 0) {
      examStats.value = res.data;
    }
  } catch (error) {
    console.error('获取考试统计失败:', error);
  }
};

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true;
  fetchExams(true);
  fetchExamStats();
};

// 加载更多
const loadMore = () => {
  if (noMore.value || loadingMore.value) return;
  page.value++;
  fetchExams();
};

// 设置筛选
const setFilter = (filter) => {
  currentFilter.value = filter;
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'upcoming': '即将开始',
    'ongoing': '进行中',
    'completed': '已结束',
    'missed': '已错过'
  };
  return statusMap[status] || status;
};

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 处理考试点击
const handleExamClick = (exam) => {
  if (exam.examStatus === 'ongoing' && !exam.isParticipated) {
    // 进入考试
    uni.navigateTo({
      url: `/pages/computer/computer-exam-detail?examId=${exam.id}`
    });
  } else if (exam.isParticipated) {
    // 查看结果
    uni.navigateTo({
      url: `/pages/computer/computer-exam-result?recordId=${exam.record_id}`
    });
  } else if (exam.examStatus === 'upcoming') {
    uni.showToast({
      title: '考试尚未开始',
      icon: 'none'
    });
  } else {
    uni.showToast({
      title: '考试已结束',
      icon: 'none'
    });
  }
};
</script>

<style lang="scss" scoped>
.container {
  height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  --primary-color: #2196F3;
  --primary-light: #e3f2fd;
}

.exam-list {
  flex: 1;
  padding: 16rpx;
}

// 统计卡片
.stats-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
  margin-bottom: 16rpx;
  border: 1rpx solid #e8e8e8;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

  .stats-header {
    margin-bottom: 16rpx;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid #f0f0f0;

    .stats-title {
      font-size: 28rpx;
      font-weight: 600;
      color: #333;
      position: relative;
      padding-left: 16rpx;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 6rpx;
        height: 20rpx;
        background: #2196F3;
        border-radius: 3rpx;
      }
    }
  }

  .stats-grid {
    display: flex;
    justify-content: space-around;

    .stats-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      position: relative;
      padding: 8rpx;

      &:not(:last-child)::after {
        content: '';
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 1rpx;
        height: 32rpx;
        background: #e0e0e0;
      }

      .stats-num {
        font-size: 36rpx;
        font-weight: bold;
        color: #2196F3;
        margin-bottom: 8rpx;
      }

      .stats-label {
        font-size: 22rpx;
        color: #666;
      }
    }
  }
}

// 筛选栏
.filter-bar {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
  margin-bottom: 16rpx;
  border: 1rpx solid #e8e8e8;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

  .filter-scroll {
    white-space: nowrap;
  }

  .filter-list {
    display: flex;
    gap: 12rpx;

    .filter-item {
      padding: 8rpx 20rpx;
      background-color: #f5f7fa;
      border-radius: 24rpx;
      transition: all 0.3s ease;
      border: 1rpx solid transparent;

      text {
        font-size: 24rpx;
        color: #666;
      }

      &:active {
        transform: scale(0.95);
      }

      &.active {
        background: linear-gradient(135deg, #2196F3, #1976D2);
        border-color: #2196F3;
        box-shadow: 0 4rpx 12rpx rgba(33, 150, 243, 0.3);

        text {
          color: #fff;
          font-weight: 600;
        }
      }
    }
  }
}

// 考试列表
.exam-items {
  .exam-card {
      background-color: #fff;
      border-radius: 8rpx;
      padding: 12rpx 16rpx;
      margin-bottom: 12rpx;
      position: relative;
      background: #fff;
      border: 1rpx solid #f0f0f0;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;

      &:active {
        transform: translateY(2rpx);
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
      }

      &.ongoing {
        border-left: 4rpx solid #2196F3;
      }

      &.upcoming {
        border-left: 4rpx solid #ff9800;
      }

      &.completed, &.missed {
        border-left: 4rpx solid #9e9e9e;
        background: #fafafa;
      }

      .status-tag {
        position: absolute;
        top: 12rpx;
        right: 12rpx;
        padding: 6rpx 12rpx;
        border-radius: 20rpx;
        font-size: 20rpx;
        font-weight: 600;

        &.ongoing {
          background: linear-gradient(135deg, #2196F3, #1976D2);
          color: #fff;
        }

        &.upcoming {
          background: linear-gradient(135deg, #ff9800, #f57c00);
          color: #fff;
        }

        &.completed {
          background: #e0e0e0;
          color: #666;
        }

        &.missed {
          background: #e0e0e0;
          color: #999;
        }
      }

      .paper-type-tag {
        position: absolute;
        top: 12rpx;
        right: 120rpx;
        padding: 4rpx 10rpx;
        border-radius: 16rpx;
        font-size: 18rpx;
        font-weight: 500;

      &.type-1, &.type-2, &.type-3 {
        background: #e3f2fd;
        color: #2196F3;
      }
    }

    .exam-header {
      margin-bottom: 8rpx;
      padding-right: 120rpx;

      .exam-title {
        font-size: 28rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 4rpx;
        display: block;
      }

      .exam-desc {
        font-size: 22rpx;
        color: #999;
        display: block;
      }
    }

    .exam-info {
      margin-bottom: 8rpx;

      .info-item {
        display: flex;
        align-items: center;
        margin-bottom: 4rpx;

        &:last-child {
          margin-bottom: 0;
        }

        .info-icon {
          font-size: 22rpx;
          margin-right: 8rpx;
        }

        .info-text {
          font-size: 22rpx;
          color: #666;
        }
      }
    }

    .exam-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 8rpx;
      border-top: 1rpx solid #f0f0f0;

      .participants {
        display: flex;
        align-items: center;

        .participant-icon {
          font-size: 22rpx;
          margin-right: 6rpx;
        }

        .participant-text {
          font-size: 20rpx;
          color: #999;
        }
      }

      .action-btn {
        padding: 6rpx 16rpx;
        border-radius: 20rpx;
        font-size: 22rpx;
        font-weight: 500;

        &.ongoing {
          background: #2196F3;
          color: #fff;
        }

        &.upcoming {
          background-color: #fff3e0;
          color: #ff9800;
        }

        &.completed, &.missed {
          background-color: #f5f5f5;
          color: #666;
        }
      }
    }
    
    .user-score {
      position: absolute;
      top: 50%;
      right: 12rpx;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;

      .score-display {
        display: flex;
        align-items: baseline;

        .score-num {
          font-size: 36rpx;
          font-weight: bold;
          color: #ff5252;
        }

        .score-label {
          font-size: 20rpx;
          color: #999;
          margin-left: 4rpx;
        }
      }

      .score-result {
        margin-top: 8rpx;
        padding: 6rpx 16rpx;
        border-radius: 20rpx;
        font-size: 20rpx;
        background-color: #ff5252;
        color: #fff;

        &.pass {
          background-color: #4caf50;
        }
      }
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
  
  .empty-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }
  
  .empty-text {
    font-size: 32rpx;
    color: #333;
    margin-bottom: 12rpx;
  }
  
  .empty-sub {
    font-size: 26rpx;
    color: #999;
  }
}

.loading-state, .loading-more, .no-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}
</style>
