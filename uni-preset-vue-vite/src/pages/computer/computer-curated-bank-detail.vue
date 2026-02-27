<template>
  <view class="detail-container">
    <view class="header-card">
      <view class="back-btn" @click="goBack">←</view>
      <view class="header-info">
        <view class="bank-title">{{ bankTitle }}</view>
        <view class="bank-stats">
          <text>{{ chapters.length }} 个章节</text>
          <text class="divider">|</text>
          <text>{{ totalQuestions }} 道题目</text>
        </view>
      </view>
      <view class="add-chapter-btn" @click="showAddChapter = true">
        <text>+ 章节</text>
      </view>
    </view>

    <!-- 章节列表 -->
    <view v-if="chapters.length > 0" class="chapter-list">
      <view v-for="(chapter, index) in chapters" :key="chapter.ChapterID" class="chapter-item">
        <view class="chapter-header" @click="toggleChapter(index)">
          <view class="chapter-title-row">
            <text class="expand-icon" :class="{ expanded: expandedChapters[index] }">▶</text>
            <text class="chapter-name">{{ chapter.Title }}</text>
          </view>
          <view class="chapter-actions" @click.stop>
            <text class="action-icon edit" @click="editChapter(chapter)">✎</text>
            <text class="action-icon delete" @click="confirmDeleteChapter(chapter)">×</text>
            <view class="add-q-btn" @click="addQuestions(chapter)">+ 题目</view>
          </view>
        </view>

        <view v-if="expandedChapters[index]" class="question-list">
          <view v-if="chapterQuestions[chapter.ChapterID] && chapterQuestions[chapter.ChapterID].length > 0">
            <view v-for="q in chapterQuestions[chapter.ChapterID]" :key="q.ID" class="question-card" @click="viewQuestion(q)">
              <view class="q-type-badge">{{ q.QuestionType }}</view>
              <view class="q-content">{{ formatContent(q.QuestionText) }}</view>
              <view class="q-footer">
                <text class="q-difficulty" :class="getDifficultyClass(q.Difficulty)">{{ q.Difficulty || '中等' }}</text>
                <view class="remove-q" @click.stop="removeQuestion(q, chapter.ChapterID)">移除</view>
              </view>
            </view>
          </view>
          <view v-else class="empty-questions">
            <text>该章节暂无题目</text>
            <text class="add-link" @click="addQuestions(chapter)">立即添加</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <view class="empty-icon">📂</view>
      <view class="empty-text">还没有创建章节</view>
      <view class="empty-sub">创建章节来更好地组织您的题目</view>
      <view class="create-chapter-btn" @click="showAddChapter = true">新建第一个章节</view>
    </view>

    <!-- 章节弹窗 -->
    <view v-if="showAddChapter || showEditChapter" class="modal-mask" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ showEditChapter ? '编辑章节' : '新建章节' }}</text>
          <text class="modal-close" @click="closeModal">×</text>
        </view>
        <view class="modal-body">
          <view class="input-group">
            <view class="label">章节名称</view>
            <input v-model="chapterForm.title" type="text" placeholder="请输入章节名称" class="input" />
          </view>
          <view class="input-group">
            <view class="label">排序 (数字越小越靠前)</view>
            <input v-model.number="chapterForm.sortOrder" type="number" placeholder="0" class="input" />
          </view>
        </view>
        <view class="modal-footer">
          <view class="btn cancel" @click="closeModal">取消</view>
          <view class="btn confirm" @click="submitChapter">确定</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { request } from '../../api/request';

const bankId = ref(null);
const bankTitle = ref('');
const chapters = ref([]);
const chapterQuestions = ref({});
const expandedChapters = ref([]);
const totalQuestions = ref(0);

const showAddChapter = ref(false);
const showEditChapter = ref(false);
const editingChapter = ref(null);
const chapterForm = ref({
  title: '',
  sortOrder: 0
});

onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  bankId.value = currentPage.options.bankId;
  bankTitle.value = decodeURIComponent(currentPage.options.title || '题库详情');
  fetchChapters();
});

const fetchChapters = async () => {
  try {
    const res = await request({
      url: `/computer1/curated-banks/${bankId.value}/chapters`,
      method: 'GET'
    });
    if (res.code === 0) {
      chapters.value = res.data;
      expandedChapters.value = new Array(chapters.value.length).fill(false);
      
      // Reset question count
      totalQuestions.value = 0;
      
      // Auto expand first chapter if exists
      if (chapters.value.length > 0) {
        toggleChapter(0);
      }
    }
  } catch (error) {
    console.error('获取章节失败:', error);
  }
};

const toggleChapter = async (index) => {
  expandedChapters.value[index] = !expandedChapters.value[index];
  if (expandedChapters.value[index]) {
    const chapter = chapters.value[index];
    if (!chapterQuestions.value[chapter.ChapterID]) {
      fetchQuestions(chapter.ChapterID);
    }
  }
};

const fetchQuestions = async (chapterId) => {
  try {
    const res = await request({
      url: `/computer1/curated-chapters/${chapterId}/questions`,
      method: 'GET'
    });
    if (res.code === 0) {
      chapterQuestions.value[chapterId] = res.data;
      updateTotalCount();
    }
  } catch (error) {
    console.error('获取题目失败:', error);
  }
};

const updateTotalCount = () => {
  let count = 0;
  Object.values(chapterQuestions.value).forEach(qs => {
    count += qs.length;
  });
  totalQuestions.value = count;
};

const closeModal = () => {
  showAddChapter.value = false;
  showEditChapter.value = false;
  editingChapter.value = null;
  chapterForm.value = { title: '', sortOrder: 0 };
};

const submitChapter = async () => {
  if (!chapterForm.value.title) {
    uni.showToast({ title: '请输入章节名称', icon: 'none' });
    return;
  }

  try {
    const url = showEditChapter.value 
      ? `/computer1/curated-chapters/${editingChapter.value.ChapterID}`
      : `/computer1/curated-banks/${bankId.value}/chapters`;
    const method = showEditChapter.value ? 'PUT' : 'POST';

    const res = await request({
      url,
      method,
      data: chapterForm.value
    });

    if (res.code === 0) {
      uni.showToast({ title: showEditChapter.value ? '更新成功' : '创建成功', icon: 'success' });
      closeModal();
      fetchChapters();
    }
  } catch (error) {
    console.error('提交失败:', error);
  }
};

const editChapter = (chapter) => {
  editingChapter.value = chapter;
  chapterForm.value = {
    title: chapter.Title,
    sortOrder: chapter.SortOrder
  };
  showEditChapter.value = true;
};

const confirmDeleteChapter = (chapter) => {
  uni.showModal({
    title: '提示',
    content: `确定要删除章节“${chapter.Title}”吗？其中的题目关联也将被移除。`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const deleteRes = await request({
            url: `/computer1/curated-chapters/${chapter.ChapterID}`,
            method: 'DELETE'
          });
          if (deleteRes.code === 0) {
            uni.showToast({ title: '已删除', icon: 'success' });
            fetchChapters();
          }
        } catch (error) {
          console.error('删除失败:', error);
        }
      }
    }
  });
};

const removeQuestion = (q, chapterId) => {
  uni.showModal({
    title: '提示',
    content: '确定要从该章节中移除此题目吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const deleteRes = await request({
            url: `/computer1/curated-questions/${q.ID}`,
            method: 'DELETE'
          });
          if (deleteRes.code === 0) {
            uni.showToast({ title: '已移除', icon: 'success' });
            fetchQuestions(chapterId);
          }
        } catch (error) {
          console.error('移除失败:', error);
        }
      }
    }
  });
};

const addQuestions = (chapter) => {
  // 获取当前科目的 ID (可以从题库详情中获取，或者从页面参数中获取)
  // 这里假设 bankId 关联的题库已经知道其所属科目
  // 我们跳转到章节选择页，然后进入题目列表
  uni.navigateTo({
    url: `/pages/computer/computer-chapter-select?mode=select&targetChapterId=${chapter.ChapterID}`
  });
};

const viewQuestion = (q) => {
  // 保存为最近练习科目，以便在首页显示
  const practiceItem = {
    id: bankId.value,
    title: `计算机 - ${bankTitle.value}`,
    url: '/pages/computer/computer-curated-bank',
    icon: 'computer'
  };
  uni.setStorageSync('lastPracticeSubject', practiceItem);

  uni.navigateTo({
    url: `/pages/computer/computer-question-detail?questionId=${q.QuestionID}`
  });
};

const goBack = () => {
  uni.navigateBack();
};

const formatContent = (text) => {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').substring(0, 100) + (text.length > 100 ? '...' : '');
};

const getDifficultyClass = (diff) => {
  if (diff === '简单') return 'easy';
  if (diff === '困难') return 'hard';
  return 'medium';
};
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 50rpx;
}

.header-card {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  padding: 80rpx 40rpx 60rpx;
  color: white;
  display: flex;
  align-items: center;
  position: relative;
}

.back-btn {
  font-size: 40rpx;
  margin-right: 30rpx;
  padding: 10rpx;
}

.header-info {
  flex: 1;
}

.bank-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.bank-stats {
  font-size: 24rpx;
  opacity: 0.9;
  display: flex;
  align-items: center;
}

.divider {
  margin: 0 16rpx;
}

.add-chapter-btn {
  background: rgba(255, 255, 255, 0.2);
  padding: 12rpx 24rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.chapter-list {
  padding: 30rpx;
}

.chapter-item {
  background: white;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.chapter-header {
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f8f9fa;
}

.chapter-title-row {
  display: flex;
  align-items: center;
  flex: 1;
}

.expand-icon {
  font-size: 20rpx;
  color: #bdc3c7;
  margin-right: 16rpx;
  transition: transform 0.3s;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.chapter-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #2c3e50;
}

.chapter-actions {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.action-icon {
  font-size: 32rpx;
  color: #bdc3c7;
  padding: 10rpx;
}

.action-icon.edit:active { color: #2196f3; }
.action-icon.delete:active { color: #e74c3c; }

.add-q-btn {
  font-size: 24rpx;
  color: #2196f3;
  background: rgba(33, 150, 243, 0.1);
  padding: 8rpx 20rpx;
  border-radius: 30rpx;
}

.question-list {
  background: #fdfdfe;
  padding: 20rpx;
}

.question-card {
  background: white;
  border: 1px solid #f0f2f5;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.question-card:active {
  background: #f8f9fa;
}

.q-type-badge {
  display: inline-block;
  font-size: 20rpx;
  color: #2196f3;
  background: rgba(33, 150, 243, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  margin-bottom: 16rpx;
}

.q-content {
  font-size: 28rpx;
  color: #2c3e50;
  line-height: 1.5;
  margin-bottom: 20rpx;
}

.q-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.q-difficulty {
  font-size: 22rpx;
  padding: 2rpx 12rpx;
  border-radius: 4rpx;
}

.q-difficulty.easy { color: #2ecc71; background: rgba(46, 204, 113, 0.1); }
.q-difficulty.medium { color: #f1c40f; background: rgba(241, 196, 15, 0.1); }
.q-difficulty.hard { color: #e74c3c; background: rgba(231, 76, 60, 0.1); }

.remove-q {
  font-size: 24rpx;
  color: #95a5a6;
  padding: 10rpx;
}

.empty-questions {
  padding: 40rpx;
  text-align: center;
  color: #bdc3c7;
  font-size: 26rpx;
}

.add-link {
  color: #2196f3;
  margin-left: 10rpx;
  text-decoration: underline;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 150rpx;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 30rpx;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 12rpx;
}

.empty-sub {
  font-size: 24rpx;
  color: #7f8c8d;
  margin-bottom: 40rpx;
}

.create-chapter-btn {
  background: #2196f3;
  color: white;
  padding: 20rpx 60rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
}

/* Modal Styles - Reuse from previous page */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  width: 600rpx;
  border-radius: 24rpx;
  overflow: hidden;
}

.modal-header {
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
}

.modal-close {
  font-size: 48rpx;
  color: #bdc3c7;
  padding: 10rpx;
}

.modal-body {
  padding: 40rpx 30rpx;
}

.input-group {
  margin-bottom: 30rpx;
}

.label {
  font-size: 28rpx;
  color: #34495e;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.input {
  width: 100%;
  height: 80rpx;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.modal-footer {
  padding: 30rpx;
  display: flex;
  gap: 20rpx;
  border-top: 1px solid #eee;
}

.btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.btn.cancel {
  background: #f8f9fa;
  color: #7f8c8d;
}

.btn.confirm {
  background: #2196f3;
  color: white;
}
</style>
