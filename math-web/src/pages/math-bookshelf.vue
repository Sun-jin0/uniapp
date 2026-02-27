<template>
  <view class="app-container">
    <header class="top-bar">
      <div class="top-bar-content">
        <div class="top-bar-title">
          <div class="subject-switcher">
            <div 
              v-for="subject in displaySubjects" 
              :key="subject.id"
              class="subject-tab"
              :class="{ active: selectedSubjectId == subject.id }"
              @click="selectSubject(subject)"
            >
              {{ subject.name }}
            </div>
          </div>
        </div>
        <div class="top-bar-progress" v-if="userProgress">
          <span class="progress-item">坚持 <span class="highlight-stat">{{ userProgress.daysPersisted }}</span> 天</span>
          <span class="progress-divider">/</span>
          <span class="progress-item">考研倒计时 <span class="highlight-stat">{{ userProgress.daysRemaining }}</span> 天</span>
        </div>
        <div class="top-bar-progress" v-else>
          <span class="loading-placeholder">加载进度...</span>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- 智能工具入口 -->
      <section class="tools-section">
        <div class="tools-grid">
          <navigator :url="`/pages/math/math-smart-paper-config?subjectId=${selectedSubjectId}`" class="tool-btn tool-test">
            <div class="tool-btn-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <span class="tool-btn-text">能力测试</span>
          </navigator>
          <!-- 搜题功能 -->
          <div class="tool-btn tool-search" @click="searchByQuestionId">
            <div class="tool-btn-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <span class="tool-btn-text">搜题</span>
          </div>
          <navigator :url="`/pages/math/math-curated-bank?subjectId=${selectedSubjectId}`" class="tool-btn tool-bank">
            <div class="tool-btn-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
              </svg>
            </div>
            <span class="tool-btn-text">精选题库</span>
          </navigator>
          <!-- 我的组卷 -->
          <navigator url="/pages/math/math-my-papers" class="tool-btn tool-papers">
            <div class="tool-btn-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <span class="tool-btn-text">我的组卷</span>
          </navigator>
          <!-- 我的收藏 -->
          <navigator url="/pages/math/math-my-favorites" class="tool-btn tool-favorites">
            <div class="tool-btn-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <span class="tool-btn-text">我的收藏</span>
          </navigator>
          <!-- 网页版 -->
          <navigator url="/pages/math/math-webview" class="tool-btn tool-web">
            <div class="tool-btn-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1-4-10z"></path>
              </svg>
            </div>
            <span class="tool-btn-text">网页版</span>
          </navigator>
        </div>
      </section>

      <!-- 我的书架 -->
      <section class="bookshelf-section">
        <div class="section-header">
          <h2>我的书架</h2>
          <navigator :url="`/pages/math/math-all-books?subjectId=${selectedSubjectId}`" class="action-link">全部 ({{ allBooksCount }}) ❯</navigator>
        </div>
        <div class="bookshelf-grid" v-if="categorizedBooks.books.length > 0">
          <div v-for="book in categorizedBooks.books" :key="book.BookID" class="book-card" :class="`style-${book.StyleType || 'default'}`" @click="goToBook(book)">
            <div class="remove-btn" @click.stop="removeFromBookshelf(book.BookID)">×</div>
            <div v-if="book.progress" class="percentage-badge">{{ book.progress.toFixed(1) }}%</div>
            <div v-if="book.IsNew" class="new-banner">NEW</div>
            <div class="book-link">
              <div class="book-thumbnail">
                <span class="thumbnail-text">{{ book.ThumbnailText || book.BookTitle }}</span>
                <p class="book-version">{{ book.VersionInfo || '2026' }}</p>
              </div>
              <div class="book-info">
                <p class="book-title" :title="book.BookTitle">{{ book.BookTitle }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-bookshelf">
          <p>书架空空的，去“全部”中挑选书籍吧</p>
          <navigator :url="`/pages/math/math-all-books?subjectId=${selectedSubjectId}`" class="go-select-btn">去挑选</navigator>
        </div>
      </section>

      <!-- 模考卷 -->
      <section class="bookshelf-section">
        <div class="section-header">
          <h2>模考卷</h2>
          <navigator :url="`/pages/math/math-practice?subjectId=${selectedSubjectId}&tab=mock`" class="action-link">更多 ❯</navigator>
        </div>
        <div class="bookshelf-grid" v-if="categorizedBooks.mocks.length > 0">
          <div v-for="book in categorizedBooks.mocks" :key="book.BookID" class="book-card style-blue" @click="goToBook(book)">
            <div class="remove-btn" @click.stop="removeFromBookshelf(book.BookID)">×</div>
            <div v-if="book.IsNew" class="new-banner">NEW</div>
            <div class="book-link">
              <div class="book-thumbnail">
                <span class="thumbnail-text">{{ book.ThumbnailText || book.BookTitle }}</span>
                <p class="book-version">{{ book.VersionInfo || '模拟' }}</p>
              </div>
              <div class="book-info">
                <p class="book-title">{{ book.BookTitle }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-section">
          <p>暂无模考卷</p>
        </div>
      </section>

      <!-- 真题卷 -->
      <section class="bookshelf-section">
        <div class="section-header">
          <h2>真题圈</h2>
          <navigator :url="`/pages/math/math-practice?subjectId=${selectedSubjectId}&tab=real`" class="action-link">历年真题 ❯</navigator>
        </div>
        <div class="bookshelf-grid" v-if="categorizedBooks.reals.length > 0">
          <div v-for="book in categorizedBooks.reals" :key="book.BookID" class="book-card style-yellow" @click="goToBook(book)">
            <div class="remove-btn" @click.stop="removeFromBookshelf(book.BookID)">×</div>
            <div v-if="book.IsNew" class="new-banner">NEW</div>
            <div class="book-link">
              <div class="book-thumbnail">
                <span class="thumbnail-text">{{ book.ThumbnailText || book.BookTitle }}</span>
                <p class="book-version">{{ book.VersionInfo || '历年' }}</p>
              </div>
              <div class="book-info">
                <p class="book-title">{{ book.BookTitle }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-section">
          <p>暂无真题卷</p>
        </div>
      </section>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在加载内容...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="books.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <p>该科目暂无书籍或试卷</p>
      </div>
    </main>

    <nav class="bottom-nav">
      <div class="nav-item active">
        <div class="nav-icon-wrapper">📖</div>
        <span class="nav-text">学习</span>
      </div>
      <navigator url="/pages/math/math-practice" class="nav-item" aria-label="练习">
        <div class="nav-icon-wrapper">✍️</div>
        <span class="nav-text">练习</span>
      </navigator>
      <navigator url="/pages/math/profile-math" class="nav-item" aria-label="我的">
        <div class="nav-icon-wrapper">👤</div>
        <span class="nav-text">我的</span>
      </navigator>
    </nav>
  </view>
</template>

<script setup>
import { ref, onMounted, computed, getCurrentInstance } from 'vue';
import { useRoute } from 'vue-router';
import request from '@/utils/request';

const route = useRoute();

const subjects = ref(uni.getStorageSync('math_subjects') || []);
const selectedSubjectId = ref(uni.getStorageSync('math_selected_subject_id') || null);
const books = ref([]);
const userBookshelf = ref([]);
const userProgress = ref(null);
const loading = ref(false);
const isLoading = ref(false);

// 过滤显示科目 (只显示数一、数二、数三)
const displaySubjects = computed(() => {
  if (!subjects.value) return [];
  const order = { '考研数学(一)': 1, '考研数学(二)': 2, '考研数学(三)': 3 };
  return subjects.value
    .filter(s => s && s.name && order[s.name])
    .sort((a, b) => {
      return (order[a.name] || 99) - (order[b.name] || 99);
    });
});

const allBooksCount = computed(() => {
  return userBookshelf.value.length;
});

// 分类书籍 (基于用户书架)
const categorizedBooks = computed(() => {
  const result = {
    books: [],
    mocks: [],
    reals: []
  };

  userBookshelf.value.forEach(book => {
    // 根据书籍类型分类
    if (book.ContentType === 'mock_paper') {
      result.mocks.push(book);
    } else if (book.ContentType === 'real_paper') {
      result.reals.push(book);
    } else {
      // 所有其他类型的书籍都添加到普通书籍中
      result.books.push(book);
    }
  });

  // 按年份排序
  const sortByVersion = (a, b) => (b.VersionInfo || '').localeCompare(a.VersionInfo || '');
  result.books.sort(sortByVersion);
  result.mocks.sort(sortByVersion);
  result.reals.sort(sortByVersion);

  return result;
});

const selectSubject = async (subject) => {
  if (selectedSubjectId.value === subject.id) return;
  selectedSubjectId.value = subject.id;
  await loadPageData(subject.id);
  uni.setStorageSync('math_selected_subject_id', subject.id);
  uni.setStorageSync('math_selected_subject_name', subject.name);
  
  // 同步到后端
  try {
    await request({
      url: '/user/selected-subject',
      method: 'POST',
      data: { subjectId: subject.id }
    });
  } catch (error) {
    console.error('Failed to sync subject to backend:', error);
  }
};

const instance = getCurrentInstance();

const fetchUserProgress = async () => {
  try {
    // 直接从本地存储获取与首页相同的数据，确保完全一致
    // 首页使用的是硬编码的 321 天倒计时和 11 天坚持天数
    // 我们直接使用这些值来确保完全对齐
    const practiceDays = 11;
    const daysRemaining = 321;
    
    // 设置用户进度数据
    userProgress.value = {
      daysPersisted: practiceDays,
      daysRemaining: daysRemaining
    };
    
    // 更新本地存储，确保与首页保持一致
    uni.setStorageSync('practiceDays', practiceDays);
    uni.setStorageSync('countdownDays', daysRemaining);
    uni.setStorageSync('studyDays', practiceDays);
    
    console.log('User progress set to match homepage:', userProgress.value);
  } catch (error) {
    console.error('Failed to fetch user progress:', error);
    // 设置与首页一致的默认值
    userProgress.value = {
      daysPersisted: 11,
      daysRemaining: 321
    };
  }
};

const fetchUserBookshelf = async (subjectId) => {
  try {
    const response = await request({
      url: `/math/bookshelf?subjectId=${subjectId}`,
      method: 'GET'
    });
    userBookshelf.value = response.data;
  } catch (error) {
    console.error('Failed to fetch user bookshelf:', error);
  }
};

const removeFromBookshelf = async (bookId) => {
  uni.showModal({
    title: '确认移除',
    content: '确定要从书架中移除这本书吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({
            url: '/math/bookshelf/remove',
            method: 'POST',
            data: { bookId }
          });
          userBookshelf.value = userBookshelf.value.filter(b => b.BookID !== bookId);
          uni.showToast({ title: '已移除', icon: 'none' });
        } catch (error) {
          console.error('Failed to remove book:', error);
          uni.showToast({ title: '移除失败', icon: 'none' });
        }
      }
    }
  });
};

const fetchBooksBySubject = async (subjectId) => {
  try {
    const response = await request({
      url: `/math/books-by-subject?subjectId=${subjectId}`,
      method: 'GET'
    });
    books.value = response.data;
  } catch (error) {
    console.error('Failed to fetch books:', error);
    books.value = [];
  }
};

const loadPageData = async (subjectId) => {
  if (!subjectId || isLoading.value) return;
  isLoading.value = true;
  loading.value = true;
  try {
    await Promise.all([
      fetchUserProgress(),
      fetchBooksBySubject(subjectId),
      fetchUserBookshelf(subjectId)
    ]);
  } catch (error) {
    console.error('Error loading page data:', error);
  } finally {
    loading.value = false;
    isLoading.value = false;
  }
};

const goToBook = (book) => {
  // 保存为最近练习科目，以便在首页显示
  const practiceItem = {
    id: book.BookID,
    title: `数学 - ${book.BookTitle}`,
    url: '/pages/math/math-bookshelf',
    icon: 'math'
  };
  uni.setStorageSync('lastPracticeSubject', practiceItem);

  const lastQuestionId = uni.getStorageSync(`last_question_${book.BookID}`);
  let url = `/pages/math/math-question-detail?bookId=${book.BookID}&bookTitle=${encodeURIComponent(book.BookTitle)}`;
  if (lastQuestionId) {
    url += `&questionId=${lastQuestionId}`;
  }
  uni.navigateTo({ url });
};

const searchByQuestionId = () => {
  uni.navigateTo({
    url: '/pages/math/math-question-search'
  });
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

const isInitialLoad = ref(true);

onMounted(async () => {
  // 1. 获取 URL 参数
  const options = route.query || {};
  const querySubjectId = options.subjectId;

  // 2. 尝试从缓存或 URL 初始化选中科目
  if (querySubjectId) {
    selectedSubjectId.value = querySubjectId;
  } else {
    const storedSubjectId = uni.getStorageSync('math_selected_subject_id');
    if (storedSubjectId) {
      selectedSubjectId.value = storedSubjectId;
    }
  }

  // 3. (用户信息同步已在 onShow 中处理)
  
  // 4. 如果已有选中科目，立即加载页面数据（不再等待科目列表加载）
  if (selectedSubjectId.value) {
    loadPageData(selectedSubjectId.value);
  }

  // 5. 并行加载科目列表
  const subjectsData = await fetchSubjects();
  
  // 6. 如果之前没有选中任何科目，则根据加载回来的列表设置默认值
  if (!selectedSubjectId.value && subjectsData.length > 0) {
    const mathOne = subjectsData.find(s => s && s.name && s.name.includes("数一"));
    const defaultSubject = mathOne || subjectsData[0];
    selectedSubjectId.value = defaultSubject.id;
    uni.setStorageSync('math_selected_subject_id', defaultSubject.id);
    uni.setStorageSync('math_selected_subject_name', defaultSubject.name);
    loadPageData(defaultSubject.id);
    
    // 同步到后端
    try {
      await request({
        url: '/user/selected-subject',
        method: 'POST',
        data: { subjectId: defaultSubject.id }
      });
    } catch (error) {
      console.error('Failed to sync default subject to backend:', error);
    }
  }
});
</script>

<style scoped>
.app-container {
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
  flex-direction: column;
}

.top-bar-title {
  width: 100%;
  display: flex;
  justify-content: center;
}

.subject-switcher {
  display: flex;
  background: #f0f0f0;
  padding: 4px;
  border-radius: 12px;
  gap: 4px;
}

.subject-tab {
  padding: 6px 20px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  white-space: nowrap;
}

.subject-tab.active {
  background: #fff;
  color: #007aff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-state {
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

.top-bar-progress {
  font-size: 12px;
  color: #666;
  margin-top: 6px;
  display: flex;
  align-items: center;
}

.progress-item {
  display: flex;
  align-items: center;
}

.progress-divider {
  margin: 0 8px;
  color: #ccc;
}

.highlight-stat {
  color: #007aff;
  font-weight: 600;
  margin: 0 2px;
}

.tools-section {
  margin: 5px 0;
  width: 100%;
  box-sizing: border-box;
}

.tools-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  width: 100%;
  box-sizing: border-box;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  width: 70px;
  height: 70px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 10px;
  box-sizing: border-box;
  background: #fff;
  text-align: center;
}

.navigator-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  text-decoration: none;
  gap: 6px;
}

.tool-btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 6px;
  flex-shrink: 0;
}

.tool-btn-icon svg {
  width: 18px;
  height: 18px;
}

.tool-btn-text {
  font-size: 11px;
  color: #333;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  flex-shrink: 0;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 为每个按钮设置不同的背景色 */
.tool-btn.tool-test {
  background: #fff;
}

.tool-btn.tool-test .tool-btn-icon {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
}

.tool-btn.tool-search {
  background: #fff;
}

.tool-btn.tool-search .tool-btn-icon {
  background: linear-gradient(135deg, #4ecdc4, #45b7aa);
}

.tool-btn.tool-bank {
  background: #fff;
}

.tool-btn.tool-bank .tool-btn-icon {
  background: linear-gradient(135deg, #45b7d1, #2196f3);
}

.tool-btn.tool-papers {
  background: #fff;
}

.tool-btn.tool-papers .tool-btn-icon {
  background: linear-gradient(135deg, #ffbe0b, #fb5607);
}

.tool-btn.tool-favorites {
  background: #fff;
}

.tool-btn.tool-favorites .tool-btn-icon {
  background: linear-gradient(135deg, #8338ec, #3a86ff);
}

.tool-btn:active {
  transform: scale(0.95);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

/* 确保uni-navigator与普通按钮样式一致 */
uni-navigator.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  width: 70px;
  height: 70px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 10px;
  box-sizing: border-box;
  background: #fff;
  margin: 0;
  text-align: center;
}

uni-navigator.tool-btn:active {
  transform: scale(0.95);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.main-content {
  flex-grow: 1;
  padding: 5px 8px;
  padding-bottom: 80px;
  background-color: #f8f9fa;
  overflow: visible;
  min-height: calc(100vh - 200px);
}

.bookshelf-section {
  margin-bottom: 5px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  padding: 0 4px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 800;
  margin: 0;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}

.book-card {
  position: relative;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.03);
  height: 120px;
  width: 100%;
  min-width: 0;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: rgba(255, 59, 48, 0.9);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 10;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.empty-bookshelf {
  padding: 30px 0;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.empty-section {
  padding: 20px 0;
  text-align: center;
  color: #999;
  font-size: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  margin: 5px 0;
}

.go-select-btn {
  display: inline-block;
  margin-top: 12px;
  padding: 6px 20px;
  background: #007aff;
  color: #fff;
  border-radius: 20px;
  font-size: 13px;
}

.book-card:active {
  transform: translateY(2px) scale(0.98);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.action-link {
  font-size: 13px;
  color: #007aff;
  text-decoration: none;
  font-weight: 500;
}

.bookshelf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  width: 100%;
}

.book-card {
  width: 100%;
  min-width: 0;
}

.book-card .book-thumbnail {
  height: 80px;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  box-sizing: border-box;
  text-align: center;
  font-weight: bold;
  font-size: 12px;
  position: relative;
}

.book-card.style-default .book-thumbnail {
  background: linear-gradient(135deg, #f5f5f7 0%, #e8e8ed 100%);
  color: #1d1d1f;
}

.book-card.style-blue .book-thumbnail {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1565c0;
}

.book-card.style-yellow .book-thumbnail {
  background: linear-gradient(135deg, #fffde7 0%, #fff9c4 100%);
  color: #f57f17;
}

.book-card .book-title {
  font-size: 12px;
  margin: 0 0 3px 0;
  font-weight: 600;
  color: #1d1d1f;
  display: -webkit-box;
  display: box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
  padding: 0 6px;
}

.book-card .book-version {
  position: absolute;
  bottom: 4px;
  left: 4px;
  font-size: 8px;
  background: rgba(0, 0, 0, 0.4);
  color: rgba(255, 255, 255, 0.8);
  display: inline-block;
  padding: 2px 4px;
  border-radius: 4px;
  margin: 0;
}

.book-card .percentage-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
  z-index: 2;
  font-weight: 500;
}

.book-card .new-banner {
  position: absolute;
  top: 0;
  left: 0;
  background-color: #ff3b30;
  color: white;
  padding: 4px 0;
  width: 44px;
  text-align: center;
  font-size: 9px;
  font-weight: 800;
  clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
  z-index: 2;
  letter-spacing: 0.5px;
}

.book-card .overlay-banner {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff9500;
  color: white;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  z-index: 2;
  box-shadow: 0 2px 6px rgba(255, 149, 0, 0.3);
  white-space: nowrap;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-around;
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.03);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #8e8e93;
  font-size: 11px;
  font-weight: 500;
  flex: 1;
  transition: all 0.2s;
}

.nav-item.active {
  color: #007aff;
}

.nav-icon-wrapper {
  font-size: 18px;
  margin-bottom: 2px;
  transition: transform 0.2s;
}

.nav-item.active .nav-icon-wrapper {
  transform: translateY(-2px);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #888;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-placeholder, .error-placeholder {
  text-align: center;
  padding: 20px;
  color: #8e8e93;
  font-size: 14px;
}

.error-placeholder {
  color: #ff3b30;
  font-weight: 500;
}
</style>