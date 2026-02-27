<template>
  <view class="app-container">
    <header class="top-bar">
      <div class="top-bar-tabs">
        <navigator url="/pages/math/math-bookshelf" open-type="reLaunch" class="back-btn">
          <span class="back-icon">❮</span>
        </navigator>
        <div class="tab-switcher">
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'mock' }"
            @click="activeTab = 'mock'"
          >
            模考卷
          </div>
          <div 
            class="tab-item" 
            :class="{ active: activeTab === 'real' }"
            @click="activeTab = 'real'"
          >
            真题圈
          </div>
        </div>
        <div class="action-btn" @click="toggleSelectionMode" v-if="filteredMocks.length > 0 || filteredReals.length > 0">
          {{ selectionMode ? '取消' : '加入书架' }}
        </div>
      </div>
    </header>

    <main class="main-content" :class="{ 'has-bottom-bar': selectionMode && selectedBookIds.length > 0 }">
      <!-- 模考卷列表 -->
      <section class="bookshelf-section" v-if="activeTab === 'mock'">
        <div class="section-header">
          <h2>模考卷</h2>
          <span class="count-badge">{{ filteredMocks.length }} 份试卷</span>
        </div>
        <div class="paper-list" v-if="filteredMocks.length > 0">
          <div v-for="book in filteredMocks" :key="book.BookID" class="paper-item style-blue" :class="{ 'selected': isSelected(book.BookID) }" @click="handleBookClick(book)">
            <div v-if="book.IsNew" class="new-banner">NEW</div>
            <div v-if="selectionMode" class="selection-box">
              <div class="checkbox" :class="{ 'checked': isSelected(book.BookID), 'disabled': isInBookshelf(book.BookID) }">
                <span v-if="isSelected(book.BookID) || isInBookshelf(book.BookID)">✓</span>
              </div>
            </div>
            <div class="paper-content" :class="{ 'dimmed': selectionMode && isInBookshelf(book.BookID) }">
              <div class="paper-icon">📝</div>
              <div class="paper-info">
                <div class="paper-title-row">
                  <span class="paper-title">{{ book.BookTitle }}</span>
                  <span class="paper-tag" v-if="isInBookshelf(book.BookID)">已在书架</span>
                </div>
                <div class="paper-meta">
                  <span class="paper-version">{{ book.VersionInfo || '2026' }}</span>
                  <span class="paper-learner" v-if="book.LearnerCount">{{ book.LearnerCount }}人参与</span>
                </div>
              </div>
              <div class="paper-arrow" v-if="!selectionMode">❯</div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">📝</div>
          <p>暂无模考卷</p>
        </div>
      </section>

      <!-- 真题圈列表 -->
      <section class="bookshelf-section" v-if="activeTab === 'real'">
        <div class="section-header">
          <h2>真题圈</h2>
          <span class="count-badge">{{ filteredReals.length }} 份试卷</span>
        </div>
        <div class="paper-list" v-if="filteredReals.length > 0">
          <div v-for="book in filteredReals" :key="book.BookID" class="paper-item style-yellow" :class="{ 'selected': isSelected(book.BookID) }" @click="handleBookClick(book)">
            <div v-if="book.IsNew" class="new-banner">NEW</div>
            <div v-if="selectionMode" class="selection-box">
              <div class="checkbox" :class="{ 'checked': isSelected(book.BookID), 'disabled': isInBookshelf(book.BookID) }">
                <span v-if="isSelected(book.BookID) || isInBookshelf(book.BookID)">✓</span>
              </div>
            </div>
            <div class="paper-content" :class="{ 'dimmed': selectionMode && isInBookshelf(book.BookID) }">
              <div class="paper-icon">📜</div>
              <div class="paper-info">
                <div class="paper-title-row">
                  <span class="paper-title">{{ book.BookTitle }}</span>
                  <span class="paper-tag" v-if="isInBookshelf(book.BookID)">已在书架</span>
                </div>
                <div class="paper-meta">
                  <span class="paper-version">{{ book.VersionInfo || '2026' }}</span>
                  <span class="paper-learner" v-if="book.LearnerCount">{{ book.LearnerCount }}人参与</span>
                </div>
              </div>
              <div class="paper-arrow" v-if="!selectionMode">❯</div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">📜</div>
          <p>暂无真题圈</p>
        </div>
      </section>

      <!-- 批量操作栏 -->
      <div v-if="selectionMode && selectedBookIds.length > 0" class="bottom-action-bar">
        <div class="selection-info">
          已选 <span class="highlight">{{ selectedBookIds.length }}</span> 本
        </div>
        <button class="add-to-bookshelf-btn" :disabled="submitting" @click="confirmBatchAdd">
          {{ submitting ? '正在添加...' : '加入书架' }}
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载内容...</p>
      </div>
    </main>

    <nav class="bottom-nav">
      <navigator url="/pages/math/math-bookshelf" open-type="reLaunch" class="nav-item">
        <div class="nav-icon-wrapper">📖</div>
        <span class="nav-text">学习</span>
      </navigator>
      <div class="nav-item active">
        <div class="nav-icon-wrapper">✍️</div>
        <span class="nav-text">练习</span>
      </div>
      <navigator url="/pages/math/profile-math" class="nav-item" aria-label="我的">
        <div class="nav-icon-wrapper">👤</div>
        <span class="nav-text">我的</span>
      </navigator>
    </nav>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../api/request';

const subjects = ref(uni.getStorageSync('math_subjects') || []);
const selectedSubjectId = ref(uni.getStorageSync('math_selected_subject_id') || null);
const activeTab = ref('mock'); // 'mock' or 'real'
const books = ref([]);
const userBookshelf = ref([]);
const loading = ref(false);
const submitting = ref(false);

// 选择模式相关
const selectionMode = ref(false);
const selectedBookIds = ref([]);

const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value;
  if (!selectionMode.value) {
    selectedBookIds.value = [];
  }
};

const isSelected = (bookId) => {
  return selectedBookIds.value.includes(bookId);
};

const isInBookshelf = (bookId) => {
  return userBookshelf.value.some(b => b.BookID === bookId);
};

const handleBookClick = (book) => {
  if (selectionMode.value) {
    if (isInBookshelf(book.BookID)) return;
    
    const index = selectedBookIds.value.indexOf(book.BookID);
    if (index > -1) {
      selectedBookIds.value.splice(index, 1);
    } else {
      selectedBookIds.value.push(book.BookID);
    }
  } else {
    // 保存为最近练习科目，以便在首页显示
    const practiceItem = {
      id: book.BookID,
      title: `数学 - ${book.BookTitle}`,
      url: '/pages/math/math-practice',
      icon: 'math'
    };
    uni.setStorageSync('lastPracticeSubject', practiceItem);

    uni.navigateTo({
      url: `/pages/math/math-book-detail?bookId=${book.BookID}&bookTitle=${encodeURIComponent(book.BookTitle)}`
    });
  }
};

const confirmBatchAdd = async () => {
  if (selectedBookIds.value.length === 0) return;
  submitting.value = true;
  try {
    await request({
      url: '/math/bookshelf/batch-add',
      method: 'POST',
      data: { bookIds: selectedBookIds.value }
    });
    uni.showToast({ title: '已加入书架', icon: 'success' });
    await fetchUserBookshelf();
    selectionMode.value = false;
    selectedBookIds.value = [];
  } catch (error) {
    console.error('Failed to add books to bookshelf:', error);
    uni.showToast({ title: '添加失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};

const fetchUserBookshelf = async () => {
  try {
    const response = await request({
      url: '/math/bookshelf',
      method: 'GET'
    });
    userBookshelf.value = response.data;
  } catch (error) {
    console.error('Failed to fetch user bookshelf:', error);
  }
};

const displaySubjects = computed(() => {
  if (!subjects.value) return [];
  const order = { '考研数学(一)': 1, '考研数学(二)': 2, '考研数学(三)': 3 };
  return subjects.value
    .filter(s => s && s.name && order[s.name])
    .sort((a, b) => {
      return (order[a.name] || 99) - (order[b.name] || 99);
    });
});

const currentSubjectName = computed(() => {
  const subject = subjects.value.find(s => s.id == selectedSubjectId.value);
  return subject ? subject.name : '数学';
});

const filteredMocks = computed(() => {
  return books.value
    .filter(book => book.ContentType === 'mock_paper')
    .sort((a, b) => (b.VersionInfo || '').localeCompare(a.VersionInfo || ''));
});

const filteredReals = computed(() => {
  return books.value
    .filter(book => book.ContentType === 'real_paper')
    .sort((a, b) => (b.VersionInfo || '').localeCompare(a.VersionInfo || ''));
});

const selectSubject = async (subject) => {
  if (selectedSubjectId.value === subject.id) return;
  selectedSubjectId.value = subject.id;
  await fetchBookshelf(subject.id);
  uni.setStorageSync('math_selected_subject_id', subject.id);
  uni.setStorageSync('math_selected_subject_name', subject.name);
};

const fetchSubjects = async () => {
  try {
    const response = await request({
      url: '/math/subjects',
      method: 'GET'
    });
    subjects.value = response.data;
    uni.setStorageSync('math_subjects', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
    return [];
  }
};

const fetchBookshelf = async (subjectId) => {
  if (!subjectId) return;
  loading.value = true;
  try {
    const response = await request({
      url: `/math/books-by-subject?subjectId=${subjectId}&contentType=practice`,
      method: 'GET'
    });
    books.value = response.data;
  } catch (error) {
    console.error('Failed to fetch bookshelf:', error);
    books.value = [];
  } finally {
    loading.value = false;
  }
};

onShow(async () => {
  // 从缓存同步最新的科目数据
  const cachedSubjects = uni.getStorageSync('math_subjects');
  if (cachedSubjects && JSON.stringify(cachedSubjects) !== JSON.stringify(subjects.value)) {
    subjects.value = cachedSubjects;
  }

  // 获取用户信息并同步后端选中的科目
  try {
    const userRes = await request({ url: '/user/info' });
    if (userRes.data && userRes.data.selectedSubjectId) {
      const backendSubjectId = userRes.data.selectedSubjectId;
      if (backendSubjectId && backendSubjectId != selectedSubjectId.value) {
        selectedSubjectId.value = backendSubjectId;
        uni.setStorageSync('math_selected_subject_id', backendSubjectId);
        await fetchBookshelf(backendSubjectId);
      }
    }
  } catch (error) {
    console.error('Failed to fetch user info for subject sync:', error);
  }

  // 从缓存同步最新的科目 ID (作为兜底)
  const storedSubjectId = uni.getStorageSync('math_selected_subject_id');
  if (storedSubjectId && storedSubjectId != selectedSubjectId.value) {
    selectedSubjectId.value = storedSubjectId;
    if (selectedSubjectId.value) {
      await fetchBookshelf(selectedSubjectId.value);
    }
  }
  await fetchUserBookshelf();
});

onMounted(async () => {
  const subjectsData = await fetchSubjects();
  await fetchUserBookshelf();
  
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options || {};
  
  if (options.tab) {
    activeTab.value = options.tab;
  }
  
  if (subjectsData.length > 0) {
    let defaultSubjectId = options.subjectId;
    
    if (!defaultSubjectId) {
      defaultSubjectId = uni.getStorageSync('math_selected_subject_id');
    }
    
    if (!defaultSubjectId) {
      const mathOne = subjectsData.find(s => s && s.name && s.name.includes("数一"));
      const defaultSubject = mathOne || subjectsData[0];
      if (defaultSubject) {
        defaultSubjectId = defaultSubject.id;
        uni.setStorageSync('math_selected_subject_id', defaultSubject.id);
        uni.setStorageSync('math_selected_subject_name', defaultSubject.name);
        
        // 同步到后端
        try {
          await request({
            url: '/user/selected-subject',
            method: 'POST',
            data: { subjectId: defaultSubjectId }
          });
        } catch (error) {
          console.error('Failed to sync default subject to backend:', error);
        }
      }
    }
    
    selectedSubjectId.value = defaultSubjectId;
    if (defaultSubjectId) {
      await fetchBookshelf(defaultSubjectId);
    }
  }
});
</script>

<style scoped>
.app-container {
  max-width: 480px;
  margin: 0 auto;
  background-color: #fff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-bar {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 10px 15px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.top-bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-icon {
  font-size: 18px;
  color: #333;
}

.top-bar-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.action-btn {
  font-size: 14px;
  color: #007aff;
  font-weight: 500;
  padding: 4px 12px;
  background: #f0f7ff;
  border-radius: 14px;
}

.main-content.has-bottom-bar {
  padding-bottom: 100px;
}

.bottom-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 -2px 15px rgba(0, 0, 0, 0.08);
  z-index: 1000;
}

.selection-info {
  font-size: 15px;
  color: #666;
}

.selection-info .highlight {
  color: #007aff;
  font-weight: 700;
  font-size: 20px;
  margin: 0 4px;
}

.add-to-bookshelf-btn {
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 25px;
  padding: 10px 30px;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  transition: all 0.3s ease;
}

.add-to-bookshelf-btn:disabled {
  background: #ccc;
  box-shadow: none;
}


.tab-switcher {
  flex: 1;
  display: flex;
  background: #f0f0f0;
  padding: 4px;
  border-radius: 12px;
  gap: 4px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 6px 0;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.tab-item.active {
  background: #fff;
  color: #007aff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.main-content {
  flex: 1;
  padding: 15px;
  padding-bottom: 100px;
}

.bookshelf-section {
  margin-bottom: 25px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.count-badge {
  font-size: 12px;
  color: #999;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
}

.paper-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.paper-item {
  position: relative;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden; /* 确保丝带不会超出圆角 */
}

.new-banner {
  position: absolute;
  top: 0;
  left: 0;
  background-color: #ff3b30;
  color: white;
  padding: 3px 0;
  width: 36px;
  text-align: center;
  font-size: 8px;
  font-weight: 800;
  clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
  z-index: 2;
  letter-spacing: 0.5px;
}

.paper-item.selected {
  background: #f0f7ff;
  border-color: rgba(0, 122, 255, 0.2);
}

.selection-box {
  margin-right: 12px;
}

.paper-content {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.paper-content.dimmed {
  opacity: 0.6;
}

.paper-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-right: 12px;
  flex-shrink: 0;
}

.style-blue .paper-icon {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
}

.style-yellow .paper-icon {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.paper-info {
  flex: 1;
  min-width: 0;
}

.paper-title-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.paper-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 8px;
}

.paper-tag {
  font-size: 10px;
  color: #007aff;
  background: #e6f2ff;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.paper-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.paper-version {
  font-size: 13px;
  color: #007aff;
  font-weight: 500;
}

.paper-learner {
  font-size: 12px;
  color: #999;
}

.paper-arrow {
  color: #ccc;
  font-size: 14px;
  margin-left: 8px;
}

.checkbox {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #ddd;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  font-size: 12px;
  transition: all 0.2s ease;
}

.checkbox.checked {
  background: #007aff;
  border-color: #007aff;
  color: #fff;
}

.checkbox.disabled {
  background: #f5f5f5;
  border-color: #eee;
  color: #ccc;
  opacity: 0.8;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #999;
}

.empty-icon {
  font-size: 64rpx;
  margin-bottom: 16px;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 480px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid #eee;
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: #999;
}

.nav-item.active {
  color: #007aff;
}

.nav-icon-wrapper {
  font-size: 18px;
}

.nav-text {
  font-size: 11px;
}
</style>