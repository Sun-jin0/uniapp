<template>
  <view class="app-container">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @click="goBack">
        <SvgIcon name="back" size="44" fill="#fff" />
      </view>
      <text class="nav-title">题目搜索</text>
    </view>

    <!-- 搜索区域 -->
    <view class="search-section">
      <view class="search-box">
        <input
          v-model="searchId"
          type="number"
          placeholder="请输入题目ID"
          class="search-input"
          @confirm="searchQuestion"
        />
        <view class="search-btn" @click="searchQuestion">
          <text class="search-btn-text">搜索</text>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <view class="loading-spinner"></view>
      <text>正在加载题目...</text>
    </view>

    <!-- 错误提示 -->
    <view v-else-if="error" class="error-state">
      <text>{{ error }}</text>
      <view class="retry-btn" @click="searchQuestion">重新加载</view>
    </view>

    <!-- 题目内容 -->
    <scroll-view v-else-if="questionData" class="question-scroll" scroll-y>
      <view class="question-content">
        <!-- 题目类型标签 -->
        <view class="question-type-tag">{{ questionType }}</view>

        <!-- 题目文本 -->
        <view class="question-text" v-html="transformContextString(displayQuestionText)"></view>

        <!-- 选项（如果是选择题） -->
        <view v-if="questionType === '选择题' && extractedOptions.length > 0" class="options-container">
          <view
            v-for="option in extractedOptions"
            :key="option.label"
            class="option-item"
            :class="{
              'selected': userAnswer === option.label,
              'correct': showAnswer && option.isCorrect,
              'wrong': showAnswer && userAnswer === option.label && !option.isCorrect
            }"
            @click="selectOption(option.label)"
          >
            <view class="option-label">{{ option.label }}</view>
            <view class="option-content" v-html="transformContextString(option.content)"></view>
          </view>
        </view>

        <!-- 查看答案按钮 -->
        <view v-if="!showAnswer" class="action-btn" @click="showAnswer = true">
          查看答案
        </view>

        <!-- 答案解析 -->
        <view v-if="showAnswer" class="analysis-section">
          <view class="analysis-title">答案解析</view>
          <view class="correct-answer">
            <text>正确答案：{{ correctAnswer }}</text>
          </view>
          <view
            v-for="(item, index) in analysisContent"
            :key="index"
            class="analysis-item"
          >
            <view class="analysis-item-title" v-html="transformContextString(getDetailHeader(item))"></view>
            <view class="analysis-item-content" v-html="transformContextString(item.Context)"></view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <view class="empty-icon">
        <SvgIcon name="search" size="80" fill="#ccc" />
      </view>
      <text class="empty-text">请输入题目ID进行搜索</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue';
import request from '@/utils/request';
import { transformContextString, katexRenderWithRetry } from '@/utils/latex';

const route = useRoute();
const router = useRouter();

// 状态
const searchId = ref(route.query.id || '');
const loading = ref(false);
const error = ref('');
const questionData = ref(null);
const userAnswer = ref('');
const showAnswer = ref(false);

// 题目类型
const questionType = computed(() => {
  if (!questionData.value?.first_request?.[0]?.QuestionTypeName) return '';
  return questionData.value.first_request[0].QuestionTypeName;
});

// 显示的题目文本
const displayQuestionText = computed(() => {
  if (!questionData.value?.first_request?.[0]?.QuestionText) return '';
  let text = questionData.value.first_request[0].QuestionText;

  // 如果是选择题，移除选项部分
  if (questionType.value === '选择题') {
    const firstOptionMatch = text.match(/[A-D][\.\s\、\)]/);
    if (firstOptionMatch) {
      text = text.substring(0, firstOptionMatch.index).trim();
    }
  }

  return text;
});

// 提取选项
const extractedOptions = computed(() => {
  if (!questionData.value?.first_request?.[0]?.QuestionText) return [];

  const text = questionData.value.first_request[0].QuestionText;
  const options = [];

  // 匹配 A. B. C. D. 格式的选项
  const optionRegex = /([A-D])[\.\s\、\)]\s*([\s\S]*?)(?=(?:\s*[A-D][\.\s\、\)])|$)/g;
  let match;
  while ((match = optionRegex.exec(text)) !== null) {
    options.push({
      label: match[1],
      content: match[2].trim(),
      isCorrect: false
    });
  }

  // 查找正确答案
  const secondRequest = questionData.value.second_request;
  if (secondRequest && secondRequest.length > 0) {
    const answerText = JSON.stringify(secondRequest);
    const correctMatch = answerText.match(/【答案】\s*([A-D])/i);
    if (correctMatch) {
      const correctLabel = correctMatch[1].toUpperCase();
      options.forEach(opt => {
        if (opt.label === correctLabel) {
          opt.isCorrect = true;
        }
      });
    }
  }

  return options;
});

// 正确答案
const correctAnswer = computed(() => {
  const correct = extractedOptions.value.find(opt => opt.isCorrect);
  return correct ? correct.label : '';
});

// 解析内容
const analysisContent = computed(() => {
  if (!questionData.value?.second_request) return [];
  return questionData.value.second_request.filter(item => item.Context);
});

// 获取解析标题
const getDetailHeader = (item) => {
  if (item.DetailTypeName) return item.DetailTypeName;
  if (item.DetailType === 1) return '【答案】';
  if (item.DetailType === 2) return '【解析】';
  if (item.DetailType === 3) return '【点评】';
  return '';
};

// 搜索题目
const searchQuestion = async () => {
  console.log('searchQuestion called, searchId:', searchId.value);
  
  if (!searchId.value) {
    uni.showToast({
      title: '请输入题目ID',
      icon: 'none'
    });
    return;
  }

  loading.value = true;
  error.value = '';
  questionData.value = null;
  userAnswer.value = '';
  showAnswer.value = false;

  try {
    console.log('Sending request to:', `/math/questions/${searchId.value}`);
    const response = await request({
      url: `/math/questions/${searchId.value}`,
      method: 'GET'
    });
    console.log('Response:', response);

    if (response.data && response.data[searchId.value]) {
      questionData.value = response.data[searchId.value];

      // 渲染 LaTeX
      setTimeout(() => {
        const element = document.querySelector('.question-content');
        if (element) {
          katexRenderWithRetry(element);
        }
      }, 100);
    } else {
      error.value = '题目不存在';
    }
  } catch (err) {
    console.error('搜索题目失败:', err);
    error.value = '加载题目失败: ' + (err.message || '未知错误');
  } finally {
    loading.value = false;
  }
};

// 选择选项
const selectOption = (label) => {
  if (showAnswer.value) return;
  userAnswer.value = label;
};

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/pages/math/math-bookshelf');
  }
};

// 如果URL中有id参数，自动搜索
if (searchId.value) {
  searchQuestion();
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 导航栏 */
.nav-bar {
  background: linear-gradient(135deg, #4db6ac 0%, #26a69a 100%);
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}

.back-btn {
  padding: 10rpx;
}

.nav-title {
  flex: 1;
  text-align: center;
  color: #fff;
  font-size: 36rpx;
  font-weight: 500;
  margin-right: 60rpx;
}

/* 搜索区域 */
.search-section {
  padding: 30rpx;
  background-color: #fff;
  flex-shrink: 0;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.search-input {
  flex: 1;
  height: 80rpx;
  font-size: 32rpx;
  padding: 0 30rpx;
  background-color: #f5f5f5;
  border-radius: 40rpx;
  border: none;
}

.search-btn {
  height: 80rpx;
  padding: 0 40rpx;
  background: linear-gradient(135deg, #4db6ac 0%, #26a69a 100%);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn-text {
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  flex: 1;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #4db6ac;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 30rpx;
  color: #999;
  flex: 1;
}

.retry-btn {
  margin-top: 30rpx;
  padding: 20rpx 60rpx;
  background: linear-gradient(135deg, #4db6ac 0%, #26a69a 100%);
  color: #fff;
  border-radius: 40rpx;
  font-size: 32rpx;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 200rpx 0;
}

.empty-icon {
  margin-bottom: 30rpx;
}

.empty-text {
  color: #999;
  font-size: 32rpx;
}

/* 滚动区域 */
.question-scroll {
  flex: 1;
  overflow-y: auto;
}

/* 题目内容 */
.question-content {
  padding: 30rpx;
}

.question-type-tag {
  display: inline-block;
  padding: 10rpx 30rpx;
  background: linear-gradient(135deg, #4db6ac 0%, #26a69a 100%);
  color: #fff;
  border-radius: 30rpx;
  font-size: 28rpx;
  margin-bottom: 20rpx;
}

.question-text {
  background-color: #fff;
  padding: 30rpx;
  border-radius: 20rpx;
  font-size: 32rpx;
  line-height: 1.8;
  margin-bottom: 30rpx;
}

/* 选项 */
.options-container {
  margin-bottom: 30rpx;
}

.option-item {
  display: flex;
  align-items: flex-start;
  background-color: #fff;
  padding: 30rpx;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;
}

.option-item:active {
  opacity: 0.8;
}

.option-item.selected {
  border-color: #4db6ac;
  background-color: #e0f2f1;
}

.option-item.correct {
  border-color: #4caf50;
  background-color: #e8f5e9;
}

.option-item.wrong {
  border-color: #f44336;
  background-color: #ffebee;
}

.option-label {
  width: 60rpx;
  height: 60rpx;
  background: linear-gradient(135deg, #4db6ac 0%, #26a69a 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.option-content {
  flex: 1;
  font-size: 32rpx;
  line-height: 1.6;
}

/* 操作按钮 */
.action-btn {
  background: linear-gradient(135deg, #4db6ac 0%, #26a69a 100%);
  color: #fff;
  text-align: center;
  padding: 30rpx;
  border-radius: 40rpx;
  font-size: 36rpx;
  margin: 30rpx 0;
}

.action-btn:active {
  opacity: 0.9;
}

/* 解析区域 */
.analysis-section {
  background-color: #fff;
  padding: 30rpx;
  border-radius: 20rpx;
}

.analysis-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #4db6ac;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #e0e0e0;
}

.correct-answer {
  font-size: 32rpx;
  color: #4caf50;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.analysis-item {
  margin-bottom: 30rpx;
}

.analysis-item-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #4db6ac;
  margin-bottom: 10rpx;
}

.analysis-item-content {
  font-size: 30rpx;
  line-height: 1.8;
  color: #666;
}
</style>
