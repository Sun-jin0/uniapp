<script setup>
import { ref, onMounted } from 'vue';
import { request } from '../../api/request';

const statusBarHeight = ref(0);
const questionId = ref('');
const question = ref({
  stem: '',
  answer: '',
  analysis: '',
  level: 1,
  total_score: 0,
  exercise_type_name: '',
  options: [],
  subs: []
});
const loading = ref(true);

onMounted(async () => {
  const systemInfo = uni.getSystemInfoSync();
  statusBarHeight.value = systemInfo.statusBarHeight || 0;
  
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  questionId.value = currentPage.options.questionId;
  
  if (questionId.value) {
    await fetchQuestionDetail();
  }
});

const fetchQuestionDetail = async () => {
  loading.value = true;
  try {
    const res = await request({
      url: `/computer1/questions/${questionId.value}`
    });
    question.value = res.data;
    
    // 填空题答案处理
    if (question.value.exercise_type_name === '填空题' && typeof question.value.answer === 'string') {
      try {
        const parsed = JSON.parse(question.value.answer);
        if (Array.isArray(parsed)) {
          question.value.answer_list = parsed;
        }
      } catch (e) {
        question.value.answer_list = [question.value.answer];
      }
    }
  } catch (error) {
    console.error('获取详情失败:', error);
    uni.showToast({ title: '获取详情失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const addOption = () => {
  const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
  const nextKey = keys[question.value.options.length] || String.fromCharCode(65 + question.value.options.length);
  question.value.options.push({ option_key: nextKey, option_value: '' });
};

const removeOption = (index) => {
  question.value.options.splice(index, 1);
};

const addSub = () => {
  question.value.subs.push({ sub_stem: '', sub_answer: '', sub_analysis: '' });
};

const removeSub = (index) => {
  question.value.subs.splice(index, 1);
};

const saveQuestion = async () => {
  uni.showLoading({ title: '保存中...' });
  try {
    // 处理填空题答案
    if (question.value.exercise_type_name === '填空题' && question.value.answer_list) {
      question.value.answer = JSON.stringify(question.value.answer_list);
    }
    
    await request({
      url: `/computer1/admin/questions/${questionId.value}`,
      method: 'PUT',
      data: question.value
    });
    
    uni.hideLoading();
    uni.showToast({ title: '保存成功' });
    setTimeout(() => uni.navigateBack(), 1500);
  } catch (error) {
    uni.hideLoading();
    console.error('保存失败:', error);
    uni.showToast({ title: '保存失败', icon: 'none' });
  }
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
        <view class="nav-title">编辑题目 (ID: {{ questionId }})</view>
      </view>
    </view>

    <scroll-view 
      class="edit-form" 
      scroll-y 
      :style="{ marginTop: (statusBarHeight + 44) + 'px' }"
      v-if="!loading"
    >
      <view class="form-item">
        <text class="label">题型</text>
        <text class="value-text">{{ question.exercise_type_name }}</text>
      </view>

      <view class="form-item">
        <text class="label">题干</text>
        <textarea v-model="question.stem" auto-height maxlength="-1" class="editor"></textarea>
      </view>

      <!-- 选择题选项 -->
      <view class="options-section" v-if="['单选题', '多选题'].includes(question.exercise_type_name)">
        <view class="section-header">
          <text class="label">选项</text>
          <view class="add-btn" @click="addOption">+ 添加选项</view>
        </view>
        <view v-for="(opt, index) in question.options" :key="index" class="option-item">
          <input v-model="opt.option_key" class="opt-key" />
          <textarea v-model="opt.option_value" auto-height class="opt-value"></textarea>
          <text class="remove-btn" @click="removeOption(index)">×</text>
        </view>
      </view>

      <!-- 填空题答案 -->
      <view class="form-item" v-if="question.exercise_type_name === '填空题'">
        <text class="label">标准答案 (多个空请按顺序填写)</text>
        <view v-for="(ans, idx) in question.answer_list" :key="idx" class="blank-ans-item">
          <input v-model="question.answer_list[idx]" class="editor" />
        </view>
      </view>

      <!-- 普通答案 (非解答题且非填空题) -->
      <view class="form-item" v-if="!['解答题', '填空题'].includes(question.exercise_type_name)">
        <text class="label">正确答案</text>
        <input v-model="question.answer" class="editor" v-if="question.exercise_type_name === '判断题'" />
        <textarea v-model="question.answer" auto-height v-else class="editor"></textarea>
      </view>

      <view class="form-item">
        <text class="label">解析</text>
        <textarea v-model="question.analysis" auto-height maxlength="-1" class="editor"></textarea>
      </view>

      <!-- 解答题小题 -->
      <view class="subs-section" v-if="question.exercise_type_name === '解答题'">
        <view class="section-header">
          <text class="label">小题列表</text>
          <view class="add-btn" @click="addSub">+ 添加小题</view>
        </view>
        <view v-for="(sub, index) in question.subs" :key="index" class="sub-card">
          <view class="sub-header">
            <text>第 {{ index + 1 }} 小题</text>
            <text class="remove-btn" @click="removeSub(index)">删除</text>
          </view>
          <view class="form-item">
            <text class="label">小题题干</text>
            <textarea v-model="sub.sub_stem" auto-height maxlength="-1" class="editor"></textarea>
          </view>
          <view class="form-item">
            <text class="label">小题答案</text>
            <textarea v-model="sub.sub_answer" auto-height maxlength="-1" class="editor"></textarea>
          </view>
          <view class="form-item">
            <text class="label">小题解析</text>
            <textarea v-model="sub.sub_analysis" auto-height maxlength="-1" class="editor"></textarea>
          </view>
        </view>
      </view>

      <view class="form-row">
        <view class="form-item half">
          <text class="label">难度 (1-5)</text>
          <input type="number" v-model="question.level" class="editor" style="pointer-events: auto; position: relative; z-index: 10;" />
        </view>
        <view class="form-item half">
          <text class="label">分值</text>
          <input type="number" v-model="question.total_score" class="editor" style="pointer-events: auto; position: relative; z-index: 10;" />
        </view>
      </view>

      <view class="bottom-bar">
        <view class="save-btn" @click="saveQuestion">保存修改</view>
      </view>
    </scroll-view>
    
    <view v-else class="loading-box">加载中...</view>
  </view>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 120rpx;
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

.edit-form {
  padding: 30rpx;
  box-sizing: border-box;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-row {
  display: flex;
  gap: 30rpx;
}

.form-item.half {
  flex: 1;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
  font-weight: bold;
}

.editor {
  width: 100%;
  background: #fff;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

textarea.editor {
  min-height: 120rpx;
}

.value-text {
  font-size: 28rpx;
  color: #333;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.add-btn {
  font-size: 24rpx;
  background: #e3f2fd;
  color: #1976d2;
  margin: 0;
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 20rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.opt-key {
  width: 80rpx;
  height: 72rpx;
  text-align: center;
  background: #fff;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
}

.opt-value {
  flex: 1;
  background: #fff;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 16rpx;
}

.remove-btn {
  color: #f44336;
  font-size: 40rpx;
  padding: 10rpx;
}

.sub-card {
  background: #fff;
  border: 1rpx solid #eee;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
}

.sub-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
  font-size: 26rpx;
  font-weight: bold;
  color: #1976d2;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
}

.save-btn {
  background: #1976d2;
  color: #fff;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  cursor: pointer;
}

.loading-box {
  text-align: center;
  padding: 100rpx;
  color: #999;
}
</style>