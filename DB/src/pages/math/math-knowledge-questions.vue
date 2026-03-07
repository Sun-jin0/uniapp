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
  uni.navigateTo({
    url: `/pages/math/math-question-detail?questionId=${q.QuestionID}&singleMode=true`
  });
};

const startPractice = () => {
  if (filteredQuestions.value.length === 0) return;
  const ids = filteredQuestions.value.map(q => q.QuestionID).join(',');
  uni.navigateTo({
    url: `/pages/math/math-question-detail?ids=${ids}&singleMode=true`
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
  background: #f7f8fa;
}

.filter-bar {
  background: #fff;
  padding: 10px 16px;
}

.filter-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-size: 13px;
  color: #646566;
  width: 48px;
  flex-shrink: 0;
}

.filter-scroll {
  flex: 1;
  overflow: hidden;
}

.filter-options {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.filter-item {
  padding: 5px 14px;
  font-size: 13px;
  color: #646566;
  background: #f2f3f5;
  border-radius: 4px;
  flex-shrink: 0;
}

.filter-item.active {
  color: #fff;
  background: #576b95;
}

.content {
  height: calc(100vh - 140px);
}

.loading, .empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #969799;
  font-size: 14px;
}

.question-list {
  padding: 12px 16px;
}

.question-item {
  background: #fff;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.question-top {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.question-num {
  font-size: 14px;
  font-weight: 500;
  color: #576b95;
  margin-right: 10px;
}

.question-tags {
  display: flex;
  gap: 6px;
}

.tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 2px;
}

.type-tag {
  background: #fff3e0;
  color: #e65100;
}

.book-tag {
  background: #ecf5ff;
  color: #576b95;
}

.question-content {
  min-height: 60px;
}

.question-img {
  width: 100%;
  border-radius: 4px;
}

.question-text {
  font-size: 14px;
  color: #323233;
  line-height: 1.6;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #fff;
  border-top: 1px solid #ebedf0;
}

.total-text {
  font-size: 14px;
  color: #646566;
}

.start-btn {
  padding: 8px 24px;
  background: #576b95;
  color: #fff;
  font-size: 14px;
  border-radius: 4px;
}
</style>
