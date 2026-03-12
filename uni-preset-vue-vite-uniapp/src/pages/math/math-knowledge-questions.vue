<template>
  <view class="page">
    <view class="filter-bar">
      <view class="filter-row">
        <text class="filter-label">题型：</text>
        <scroll-view scroll-x class="filter-scroll">
          <view class="filter-options">
            <view 
              v-for="type in questionTypes" 
              :key="type.value"
              class="filter-item"
              :class="{ active: selectedQuestionType === type.value }"
              @tap="selectedQuestionType = type.value"
            >
              {{ type.label }}
            </view>
          </view>
        </scroll-view>
      </view>
      <view class="filter-row">
        <text class="filter-label">来源：</text>
        <scroll-view scroll-x class="filter-scroll">
          <view class="filter-options">
            <view 
              v-for="type in bookTypes" 
              :key="type.value"
              class="filter-item"
              :class="{ active: selectedBookType === type.value }"
              @tap="selectedBookType = type.value"
            >
              {{ type.label }}
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <scroll-view class="content" scroll-y>
      <view v-if="loading" class="loading">加载中...</view>
      
      <view v-else-if="filteredQuestions.length === 0" class="empty">
        <text>暂无题目</text>
      </view>

      <view v-else class="question-list">
        <view 
          v-for="(q, index) in filteredQuestions" 
          :key="q.QuestionID"
          class="question-item"
          @tap="goToQuestion(q)"
        >
          <view class="question-top">
            <text class="question-num">{{ index + 1 }}</text>
            <view class="question-tags">
              <text class="tag type-tag">{{ q.QuestionType }}</text>
              <text v-if="q.bookType" class="tag book-tag">{{ getBookTypeText(q.bookType) }}</text>
            </view>
          </view>
          <view class="question-content">
            <image 
              v-if="q.QuestionImg" 
              :src="q.QuestionImg.replace('http://', 'https://')" 
              class="question-img" 
              mode="widthFix"
            />
            <view v-else class="question-text">{{ formatText(q.QuestionText) }}</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="filteredQuestions.length > 0" class="bottom-bar">
      <text class="total-text">共{{ filteredQuestions.length }}题</text>
      <view class="start-btn" @tap="startPractice">开始练习</view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { request } from '@/api/request';

const pointId = ref('');
const pointName = ref('');
const selectedBookType = ref('all');
const selectedQuestionType = ref('all');
const bookTypes = [
  { label: '全部', value: 'all' },
  { label: '书籍', value: 'book' },
  { label: '模拟卷', value: 'mock_paper' },
  { label: '真题卷', value: 'real_paper' }
];
const questionTypes = ref([
  { label: '全部', value: 'all' }
]);
const questions = ref([]);
const loading = ref(false);

const filteredQuestions = computed(() => {
  let result = questions.value;
  
  if (selectedBookType.value !== 'all') {
    result = result.filter(q => (q.bookType || q.ContentType) === selectedBookType.value);
  }
  
  if (selectedQuestionType.value !== 'all') {
    result = result.filter(q => q.QuestionType === selectedQuestionType.value);
  }
  
  return result;
});

const fetchQuestions = async () => {
  if (!pointId.value) return;
  try {
    loading.value = true;
    const res = await request({
      url: `/math/questions/by-knowledge-point?knowledgePointId=${pointId.value}`,
      method: 'GET'
    });
    questions.value = res.data || [];
    
    const typeSet = new Set();
    questions.value.forEach(q => {
      if (q.QuestionType) typeSet.add(q.QuestionType);
    });
    questionTypes.value = [
      { label: '全部', value: 'all' },
      ...Array.from(typeSet).map(t => ({ label: t, value: t }))
    ];
  } catch (err) {
    console.error('获取题目失败:', err);
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const goToQuestion = (q) => {
  // 点击单个题目时，也传递所有题目的 ids，以便可以切换题目
  const ids = filteredQuestions.value.map(q => q.QuestionID).join(',');
  uni.navigateTo({
    url: `/pages/math/math-question-detail?ids=${ids}&questionId=${q.QuestionID}`
  });
};

const startPractice = () => {
  if (filteredQuestions.value.length === 0) return;
  const ids = filteredQuestions.value.map(q => q.QuestionID).join(',');
  uni.navigateTo({
    url: `/pages/math/math-question-detail?ids=${ids}`
  });
};

const formatText = (text) => {
  if (!text) return '';
  const plain = text.replace(/<[^>]+>/g, '');
  return plain.length > 100 ? plain.slice(0, 100) + '...' : plain;
};

const getBookTypeText = (type) => {
  const map = { book: '书籍', mock_paper: '模拟卷', real_paper: '真题卷' };
  return map[type] || type;
};

onMounted(() => {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1];
  const options = current.$page?.options || current.options || {};
  pointId.value = options.pointId || '';
  pointName.value = decodeURIComponent(options.pointName || '考点题目');
  uni.setNavigationBarTitle({ title: pointName.value });
  fetchQuestions();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f8f9fa;
}

/* 筛选栏样式优化 */
.filter-bar {
  background: linear-gradient(135deg, #4db6ac 0%, #26a69a 100%);
  padding: 20rpx 30rpx;
}

.filter-row {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  width: 80rpx;
  flex-shrink: 0;
  font-weight: 500;
}

.filter-scroll {
  flex: 1;
  overflow: hidden;
}

.filter-options {
  display: flex;
  gap: 16rpx;
  white-space: nowrap;
}

.filter-item {
  padding: 10rpx 24rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.15);
  border-radius: 30rpx;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.filter-item.active {
  color: #4db6ac;
  background: #fff;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
}

.content {
  height: calc(100vh - 200rpx);
}

.loading, .empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
  color: #999;
  font-size: 28rpx;
}

/* 题目列表样式 */
.question-list {
  padding: 20rpx;
}

.question-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  transition: all 0.25s ease;
}

.question-item:active {
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.question-top {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.question-num {
  font-size: 28rpx;
  font-weight: 600;
  color: #4db6ac;
  margin-right: 16rpx;
  background: rgba(77, 182, 172, 0.1);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  min-width: 48rpx;
  text-align: center;
}

.question-tags {
  display: flex;
  gap: 12rpx;
}

.tag {
  font-size: 22rpx;
  padding: 6rpx 14rpx;
  border-radius: 8rpx;
}

.type-tag {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  color: #e65100;
}

.book-tag {
  background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%);
  color: #00695c;
}

.question-content {
  min-height: 100rpx;
}

.question-img {
  width: 100%;
  border-radius: 12rpx;
}

.question-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

/* 底部栏样式 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: #fff;
  border-top: 1rpx solid #f0f0f0;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.total-text {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
}

.start-btn {
  padding: 16rpx 40rpx;
  background: linear-gradient(135deg, #4db6ac 0%, #26a69a 100%);
  color: #fff;
  font-size: 28rpx;
  border-radius: 40rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba(77, 182, 172, 0.3);
  transition: all 0.25s ease;
}

.start-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(77, 182, 172, 0.2);
}
</style>
