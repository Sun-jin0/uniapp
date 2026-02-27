<script setup>
import { ref, onMounted } from 'vue';
import { request } from '../../api/request';
import { processStem } from '../../utils/questionUtils';

const statusBarHeight = ref(0);
const keyword = ref('');
const questions = ref([]);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const selectedType = ref('全部');
const questionTypes = ['全部', '单选题', '多选题', '判断题', '填空题', '解答题'];

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync();
  statusBarHeight.value = systemInfo.statusBarHeight || 0;
  searchQuestions();
});

const searchQuestions = async (reset = true) => {
  if (reset) {
    page.value = 1;
    questions.value = [];
  }
  
  loading.value = true;
  try {
    const res = await request({
      url: '/computer1/admin/questions',
      data: {
        keyword: keyword.value,
        type: selectedType.value,
        page: page.value,
        size: 20
      }
    });
    
    const newQuestions = res.data.questions.map(q => ({
      ...q,
      stem: processStem(q.stem)
    }));
    
    questions.value = [...questions.value, ...newQuestions];
    total.value = res.data.total;
  } catch (error) {
    console.error('搜索题目失败:', error);
    uni.showToast({ title: '搜索失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  if (questions.value.length < total.value && !loading.value) {
    page.value++;
    searchQuestions(false);
  }
};

const goToEdit = (questionId) => {
  uni.navigateTo({
    url: `/pages/computer/computer-question-edit?questionId=${questionId}`
  });
};

const deleteQuestion = (questionId) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这道题目吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({
            url: `/computer1/admin/questions/${questionId}`,
            method: 'DELETE'
          });
          uni.showToast({ title: '删除成功' });
          searchQuestions();
        } catch (error) {
          console.error('删除失败:', error);
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
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
        <view class="nav-title">题目管理</view>
      </view>
      <view class="search-bar">
        <input 
          v-model="keyword" 
          placeholder="搜索题目内容或ID" 
          confirm-type="search"
          @confirm="searchQuestions(true)"
        />
        <view class="search-btn" @click="searchQuestions(true)">搜索</view>
      </view>
      <scroll-view class="type-filter" scroll-x show-scrollbar="false">
        <view 
          v-for="type in questionTypes" 
          :key="type"
          class="type-item"
          :class="{ active: selectedType === type }"
          @click="selectedType = type; searchQuestions(true)"
        >
          {{ type }}
        </view>
      </scroll-view>
    </view>

    <scroll-view 
      class="question-list" 
      scroll-y 
      @scrolltolower="loadMore"
      :style="{ marginTop: (statusBarHeight + 140) + 'px' }"
    >
      <view v-if="questions.length === 0 && !loading" class="no-data">
        暂无符合条件的题目
      </view>
      <view 
        v-for="q in questions" 
        :key="q.question_id" 
        class="question-card"
      >
        <view class="card-header">
          <text class="q-id">ID: {{ q.question_id }}</text>
          <text class="q-type">{{ q.exercise_type_name }}</text>
        </view>
        <view class="card-body" v-html="q.stem"></view>
        <view class="card-footer">
          <text class="q-time">{{ new Date(q.create_time).toLocaleDateString() }}</text>
          <view class="actions">
            <view class="edit-btn" @click="goToEdit(q.question_id)">编辑</view>
            <view class="delete-btn" @click="deleteQuestion(q.question_id)">删除</view>
          </view>
        </view>
      </view>
      <view v-if="loading" class="loading">加载中...</view>
      <view v-if="questions.length >= total && questions.length > 0" class="no-more">没有更多了</view>
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

.search-bar {
  padding: 20rpx 30rpx;
  display: flex;
  gap: 20rpx;
}

.search-bar input {
  flex: 1;
  background: #f1f3f5;
  height: 72rpx;
  border-radius: 36rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
}

.search-bar .search-btn {
  width: 140rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: #1976d2;
  color: #fff;
  font-size: 28rpx;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.type-filter {
  white-space: nowrap;
  padding: 10rpx 20rpx 20rpx;
}

.type-item {
  display: inline-block;
  padding: 12rpx 30rpx;
  margin: 0 10rpx;
  font-size: 26rpx;
  background: #f1f3f5;
  border-radius: 30rpx;
  color: #666;
  cursor: pointer;
}

.type-item.active {
  background: #1976d2;
  color: #fff;
}

.question-list {
  height: calc(100vh - 140px);
}

.question-card {
  background: #fff;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
  font-size: 24rpx;
  color: #999;
}

.q-type {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.card-body {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  max-height: 200rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1rpx solid #eee;
  padding-top: 20rpx;
}

.q-time {
  font-size: 24rpx;
  color: #999;
}

.actions {
  display: flex;
  gap: 20rpx;
}

.actions .edit-btn, .actions .delete-btn {
  font-size: 24rpx;
  padding: 0 24rpx;
  height: 56rpx;
  line-height: 56rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.edit-btn {
  background: #4caf50;
  color: #fff;
}

.delete-btn {
  background: #f44336;
  color: #fff;
}

.loading, .no-more, .no-data {
  text-align: center;
  padding: 40rpx;
  font-size: 26rpx;
  color: #999;
}
</style>