<template>
  <view class="app-container">
    <header class="top-bar">
      <div class="back-btn" @click="goBack">❮</div>
      <div class="top-bar-title">我的组卷</div>
    </header>

    <main class="main-content">
      <section class="papers-section">
        <div class="papers-list" v-if="generatedPapers.length > 0">
          <div v-for="paper in generatedPapers" :key="paper.PaperID" class="paper-item" @click="goToPaper(paper.PaperID)">
            <div class="paper-info">
              <h3 class="paper-title">{{ paper.Title }}</h3>
              <p class="paper-meta">
                <span>{{ formatDate(paper.CreatedAt) }}</span>
                <span class="meta-divider">|</span>
                <span>{{ paper.QuestionCount }} 道题目</span>
              </p>
            </div>
            <div class="paper-action">
              <span class="action-btn">练习 ❯</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">📝</div>
          <p>暂无智能组卷记录</p>
          <navigator url="/pages/math/math-bookshelf" open-type="reLaunch" class="go-study-btn">去组卷</navigator>
        </div>
      </section>
    </main>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { request } from '@/api/request';

const generatedPapers = ref([]);

const fetchGeneratedPapers = async () => {
  const subjectId = uni.getStorageSync('math_selected_subject_id');
  try {
    const res = await request({
      url: '/math/smart-papers',
      data: { subjectId }
    });
    generatedPapers.value = res.data || [];
  } catch (error) {
    console.error('获取组卷列表失败:', error);
  }
};

const goToPaper = (paperId) => {
  const paper = generatedPapers.value.find(p => p.PaperID === paperId);
  if (paper) {
    // 保存为最近练习科目，以便在首页显示
    const practiceItem = {
      id: paperId,
      title: `数学 - ${paper.Title}`,
      url: '/pages/math/math-my-papers',
      icon: 'math'
    };
    uni.setStorageSync('lastPracticeSubject', practiceItem);
  }

  uni.navigateTo({
    url: `/pages/math/math-generated-paper?paperId=${paperId}`
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

onMounted(() => {
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

.action-btn {
  font-size: 26rpx;
  color: #007aff;
  font-weight: 500;
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
