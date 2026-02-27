<template>
  <view class="app-container">
    <header class="top-bar">
      <div class="back-btn" @click="goBack">❮</div>
      <div class="top-bar-title">我的组卷</div>
    </header>

    <main class="main-content">
      <section class="papers-section">
        <div class="papers-list" v-if="generatedPapers.length > 0">
          <div v-for="paper in generatedPapers" :key="paper.id" class="paper-item" @click="goToPaper(paper.id)">
            <div class="paper-info">
              <h3 class="paper-title">{{ paper.title }}</h3>
              <p class="paper-meta">
                <span>{{ formatDate(paper.create_time) }}</span>
                <span class="meta-divider">|</span>
                <span>{{ paper.question_count || 0 }} 题</span>
                <span class="meta-divider">|</span>
                <span>难度: {{ paper.average_difficulty?.toFixed(1) || '3.0' }}</span>
              </p>
            </div>
            <div class="paper-actions">
              <span class="action-btn">练习 ❯</span>
              <div class="delete-btn" @click.stop="confirmDelete(paper.id)">🗑</div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">📝</div>
          <p>暂无智能组卷记录</p>
          <navigator url="/pages/computer/computer-main" open-type="reLaunch" class="go-study-btn">去组卷</navigator>
        </div>
      </section>
    </main>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../api/request';

const generatedPapers = ref([]);

const fetchGeneratedPapers = async () => {
  try {
    const res = await request({
      url: '/computer1/smart-papers'
    });
    generatedPapers.value = res.data || [];
  } catch (error) {
    console.error('获取组卷列表失败:', error);
  }
};

const goToPaper = (paperId) => {
  const paper = generatedPapers.value.find(p => p.id === paperId);
  if (paper) {
    // 保存为最近练习科目，以便在首页显示
    const practiceItem = {
      id: paperId,
      title: `计算机 - ${paper.title}`,
      url: '/pages/computer/computer-my-papers',
      icon: 'computer'
    };
    uni.setStorageSync('lastPracticeSubject', practiceItem);
  }

  uni.navigateTo({
    url: `/pages/computer/computer-generated-paper?paperId=${paperId}`
  });
};

const confirmDelete = (paperId) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除这张试卷吗？',
    confirmColor: '#dd524d',
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({
            url: `/computer1/smart-papers/${paperId}`,
            method: 'DELETE'
          });
          uni.showToast({ title: '已删除', icon: 'success' });
          fetchGeneratedPapers();
        } catch (err) {
          console.error('Delete paper error:', err);
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const goBack = () => {
  uni.navigateBack();
};

onShow(() => {
  fetchGeneratedPapers();
});
</script>

<style scoped>
.app-container {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.top-bar {
  background: #fff;
  padding: 20rpx 30rpx;
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
}

.top-bar-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.main-content {
  padding: 30rpx;
}

.papers-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.paper-item {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.paper-info {
  flex: 1;
}

.paper-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.paper-meta {
  font-size: 24rpx;
  color: #999;
  display: flex;
  align-items: center;
}

.meta-divider {
  margin: 0 15rpx;
  color: #eee;
}

.paper-actions {
  display: flex;
  align-items: center;
  gap: 30rpx;
}

.action-btn {
  font-size: 26rpx;
  color: #007aff;
  font-weight: 500;
}

.delete-btn {
  font-size: 32rpx;
  color: #ff3b30;
  padding: 10rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  color: #999;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}

.go-study-btn {
  margin-top: 40rpx;
  padding: 20rpx 60rpx;
  background: #007aff;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
}
</style>
