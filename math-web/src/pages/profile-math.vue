<template>
  <view class="app-container">
    <header class="top-bar">
      <div class="top-bar-content">
        <div class="top-bar-title">个人中心</div>
      </div>
    </header>

    <main class="main-content">
      <!-- 用户信息卡片 -->
      <section class="user-card">
        <div class="user-avatar" @click="handleAvatarClick">
          <image v-if="userInfo && userInfo.avatar" :src="userInfo.avatar" class="avatar-img" />
          <div v-else class="avatar-placeholder">
  <SvgIcon name="user" size="40" fill="#999" />
</div>
        </div>
        <div class="user-info">
          <h2 class="username">{{ userInfo ? userInfo.username : '未登录' }}</h2>
          <p class="user-subtitle">正在攻克：{{ currentSubjectName }}</p>
        </div>
      </section>

      <!-- 数据统计 -->
      <section class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">{{ favorites.length }}</span>
          <span class="stat-label">我的收藏</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ userInfo ? userInfo.totalQuestions || 0 : 0 }}</span>
          <span class="stat-label">累计刷题</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ userInfo ? userInfo.totalScore || 0 : 0 }}</span>
          <span class="stat-label">累计得分</span>
        </div>
      </section>

      <!-- 系统功能 -->
      <section class="menu-section">
        <div class="menu-item" @click="goToMyPapers">
  <div class="menu-icon">
    <SvgIcon name="edit-pen" size="28" fill="#333" />
  </div>
  <span class="menu-text">我的组卷</span>
  <div class="menu-arrow">
    <SvgIcon name="right" size="16" fill="#ccc" />
  </div>
</div>
<div class="menu-item" @click="goToMyFavorites">
  <div class="menu-icon">
    <SvgIcon name="star" size="28" fill="#333" />
  </div>
  <span class="menu-text">我的收藏</span>
  <div class="menu-arrow">
    <SvgIcon name="right" size="16" fill="#ccc" />
  </div>
</div>
<div class="menu-item" v-if="isAdmin || showAdminBtn" @click="goToAdmin">
  <div class="menu-icon">
    <SvgIcon name="shield" size="28" fill="#333" />
  </div>
  <span class="menu-text">后台管理</span>
  <div class="menu-arrow">
    <SvgIcon name="right" size="16" fill="#ccc" />
  </div>
</div>
<div class="menu-item" @click="goToIndex">
  <div class="menu-icon">
    <SvgIcon name="home" size="28" fill="#333" />
  </div>
  <span class="menu-text">退出到首页</span>
  <div class="menu-arrow">
    <SvgIcon name="right" size="16" fill="#ccc" />
  </div>
</div>
<picker 
  mode="multiSelector" 
  :range="pickerRange" 
  :value="pickerValue"
  @change="onPickerChange"
  @columnchange="onPickerColumnChange"
>
  <div class="menu-item">
    <div class="menu-icon">
      <SvgIcon name="refresh" size="28" fill="#333" />
    </div>
    <div class="menu-content">
      <span class="menu-text">切换科目</span>
      <span class="menu-subtext">当前: {{ currentSubjectName }}</span>
    </div>
    <div class="menu-arrow">
      <SvgIcon name="right" size="16" fill="#ccc" />
    </div>
  </div>
</picker>
      </section>
    </main>

    <!-- 底部导航 -->
    <nav class="bottom-nav">
      <navigator url="/pages/math/math-bookshelf" open-type="reLaunch" class="nav-item">
        <div class="nav-icon-wrapper">
          <SvgIcon name="book-open" size="36" fill="#999" />
        </div>
        <span class="nav-text">学习</span>
      </navigator>
      <navigator url="/pages/math/math-practice" open-type="reLaunch" class="nav-item">
        <div class="nav-icon-wrapper">
          <SvgIcon name="edit-pen" size="36" fill="#999" />
        </div>
        <span class="nav-text">练习</span>
      </navigator>
      <div class="nav-item active">
        <div class="nav-icon-wrapper">
          <SvgIcon name="user" size="36" fill="#007aff" />
        </div>
        <span class="nav-text">我的</span>
      </div>
    </nav>
  </view>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { request } from '@/api/request';
import { katexRenderWithRetry, parseTextWithLatexForMp, containsLatex } from '@/utils/latex';
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue';

const subjects = ref(uni.getStorageSync('math_subjects') || []);
const favorites = ref([]);
const generatedPapers = ref([]);
const selectedSubjectId = ref(uni.getStorageSync('math_selected_subject_id') || null);
const cachedSubjectName = ref(uni.getStorageSync('math_selected_subject_name') || '数学');
const activeTab = ref('papers');

// 用户信息相关
const userInfo = ref(null);
const isAdmin = computed(() => userInfo.value && userInfo.value.role === 1);
const showAdminBtn = ref(false);

// 连续点击头像 5 次开启调试模式（显示后台管理按钮）
const avatarClickCount = ref(0);
const handleAvatarClick = () => {
  avatarClickCount.value++;
  if (avatarClickCount.value >= 5) {
    showAdminBtn.value = true;
    uni.showToast({ title: '已开启调试模式', icon: 'none' });
  }
};

// 科目切换相关
const navSubjects = ref([]);
const pickerRange = ref([[], []]); // [考试类型, 科目]
const pickerValue = ref([0, 0]);

const fetchUserInfo = async () => {
  try {
    const res = await request({
      url: '/user/info'
    });
    userInfo.value = res.data;
    
    // 同步后端保存的科目
    if (res.data && res.data.selectedSubjectId) {
      const backendSubjectId = res.data.selectedSubjectId;
      if (backendSubjectId && backendSubjectId != selectedSubjectId.value) {
        selectedSubjectId.value = backendSubjectId;
        uni.setStorageSync('math_selected_subject_id', backendSubjectId);
        
        // 如果 subjects 已经加载，顺便更新名称
        if (subjects.value.length > 0) {
          const subject = subjects.value.find(s => s.id == backendSubjectId);
          if (subject) {
            cachedSubjectName.value = subject.name;
            uni.setStorageSync('math_selected_subject_name', subject.name);
          }
        }
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

const fetchNavSubjects = async () => {
  try {
    const res = await request({
      url: '/subjects'
    });
    navSubjects.value = res.data;
    updatePickerRange();
  } catch (error) {
    console.error('获取导航科目失败:', error);
  }
};

const updatePickerRange = () => {
  if (!navSubjects.value || navSubjects.value.length === 0) return;
  
  const examTypes = [...new Set(navSubjects.value
    .filter(s => s && s.examType && s.examType.name)
    .map(s => s.examType.name))];
    
  if (examTypes.length === 0) return;
  
  const currentExamType = examTypes[pickerValue.value[0]] || examTypes[0];
  const subjectsInType = navSubjects.value
    .filter(s => s && s.examType && s.examType.name === currentExamType)
    .map(s => s.name);
  
  pickerRange.value = [examTypes, subjectsInType];
};

const onPickerColumnChange = (e) => {
  if (e.detail.column === 0) {
    pickerValue.value[0] = e.detail.value;
    pickerValue.value[1] = 0;
    updatePickerRange();
  } else {
    pickerValue.value[1] = e.detail.value;
  }
};

const onPickerChange = async (e) => {
  const examTypeIndex = e.detail.value[0];
  const subjectIndex = e.detail.value[1];
  
  const examTypes = pickerRange.value[0];
  if (!examTypes || examTypes.length <= examTypeIndex) return;
  const selectedExamType = examTypes[examTypeIndex];
  
  const subjectsInType = navSubjects.value.filter(s => s && s.examType && s.examType.name === selectedExamType);
  const selectedSubject = subjectsInType[subjectIndex];
  
  if (selectedSubject) {
    if (selectedSubject.page_path === '/pages/math/profile-math') {
      uni.showToast({ title: '当前已在数学频道', icon: 'none' });
      return;
    }
    
    uni.setStorageSync('math_selected_subject_id', selectedSubject.id);
    uni.setStorageSync('math_selected_subject_name', selectedSubject.name);
    
    // 同步到后端
    try {
      await request({
        url: '/user/selected-subject',
        method: 'POST',
        data: { subjectId: selectedSubject.id }
      });
    } catch (error) {
      console.error('Failed to sync subject to backend:', error);
    }
    
    uni.reLaunch({
      url: selectedSubject.page_path
    });
  }
};

const goToAdmin = () => {
  uni.navigateTo({
    url: '/pages/math/math-admin'
  });
};

const goToMyPapers = () => {
  uni.navigateTo({
    url: '/pages/math/math-my-papers'
  });
};

const goToMyFavorites = () => {
  uni.navigateTo({
    url: '/pages/math/math-my-favorites'
  });
};

const fetchGeneratedPapers = async () => {
  try {
    const res = await request({
      url: '/math/smart-papers'
    });
    generatedPapers.value = res.data || [];
  } catch (error) {
    console.error('获取组卷列表失败:', error);
  }
};

const goToPaper = (paperId) => {
  uni.navigateTo({
    url: `/pages/math/math-generated-paper?paperId=${paperId}`
  });
};

// 监听收藏列表变化，自动渲染 LaTeX
watch(favorites, () => {
  nextTick(() => {
    renderLaTeX();
  });
}, { deep: true });

const currentSubjectName = computed(() => {
  if (subjects.value.length > 0) {
    const subject = subjects.value.find(s => s.id == selectedSubjectId.value);
    if (subject) {
      // 顺便更新缓存的名称
      if (cachedSubjectName.value !== subject.name) {
        cachedSubjectName.value = subject.name;
        uni.setStorageSync('math_selected_subject_name', subject.name);
      }
      return subject.name;
    }
  }
  return cachedSubjectName.value;
});

const groupedFavorites = computed(() => {
  const groups = {};
  favorites.value.forEach(item => {
    const title = item.BookTitle || '';
    if (!groups[title]) {
      groups[title] = [];
    }
    groups[title].push(item);
  });
  return groups;
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const goToQuestion = (questionId) => {
  uni.navigateTo({
    url: `/pages/math/math-question-detail?questionId=${questionId}`
  });
};

const removeFromFavorites = async (questionId) => {
  uni.showModal({
    title: '确认移除',
    content: '确定要从收藏夹中移除这道题吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({ 
            url: '/math/favorites/toggle',
            method: 'POST',
            data: { questionId }
          });
          favorites.value = favorites.value.filter(f => f.QuestionID !== questionId);
          uni.showToast({ title: '已移除', icon: 'none' });
          
          // 列表变化后重新渲染 LaTeX
          nextTick(() => {
            renderLaTeX();
          });
        } catch (error) {
          console.error('Failed to remove favorite:', error);
          uni.showToast({ title: '移除失败', icon: 'none' });
        }
      }
    }
  });
};

const goToIndex = () => {
  uni.switchTab({
    url: '/pages/index/index'
  });
};

const fetchFavorites = async () => {
  try {
    const response = await request({
      url: '/math/favorites',
      method: 'GET'
    });
    favorites.value = response.data;
    
    // 数据加载后渲染 LaTeX
    nextTick(() => {
      renderLaTeX();
    });
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
  }
};

const renderLaTeX = () => {
  // #ifdef H5
  if (typeof document !== 'undefined') {
    const elements = document.querySelectorAll('.latex-content');
    elements.forEach(el => {
      katexRenderWithRetry(el);
    });
  }
  // #endif
  // #ifdef MP-WEIXIN
  // 微信小程序不支持 DOM 操作，LaTeX 公式将以纯文本形式显示
  // 可以考虑使用后端渲染为图片或使用 web-view 组件
  // #endif
};

const fetchSubjects = async () => {
  try {
    const response = await request({
      url: '/math/subjects',
      method: 'GET'
    });
    subjects.value = response.data;
    uni.setStorageSync('math_subjects', response.data);
    
    // 如果之前没有选择科目，默认选第一个
    if (!selectedSubjectId.value && response.data.length > 0) {
      const defaultSubject = response.data[0];
      selectedSubjectId.value = defaultSubject.id;
      cachedSubjectName.value = defaultSubject.name;
      uni.setStorageSync('math_selected_subject_id', defaultSubject.id);
      uni.setStorageSync('math_selected_subject_name', defaultSubject.name);
    }
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
  }
};

onMounted(() => {
  // 并行获取数据，提高加载速度
  Promise.all([
    fetchUserInfo(),
    fetchNavSubjects(),
    fetchSubjects(),
    fetchFavorites(),
    fetchGeneratedPapers()
  ]);
});


</script>

<style scoped>
.app-container {
  background-color: #f8f9fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 120rpx;
}

.top-bar {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 20rpx 30rpx;
  border-bottom: 2rpx solid rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.top-bar-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  text-align: center;
}

.main-content {
  flex: 1;
  padding: 30rpx;
}

.user-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 40rpx;
  display: flex;
  align-items: center;
  gap: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  background: #eef2f7;
  border-radius: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder {
  font-size: 60rpx;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.username {
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 8rpx;
}

.user-subtitle {
  font-size: 26rpx;
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx;
  margin-bottom: 40rpx;
}

.stat-item {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
}

.stat-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #007aff;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.menu-section {
  background: #fff;
  border-radius: 32rpx;
  padding: 10rpx 0;
  margin-top: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:active {
  background-color: #f9f9f9;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.menu-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.menu-subtext {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.menu-arrow {
  font-size: 24rpx;
  color: #ccc;
}

.tabs-section {
  margin-bottom: 30rpx;
  background: #fff;
  border-radius: 32rpx;
  padding: 10rpx;
}

.tabs-header {
  display: flex;
  justify-content: space-around;
  position: relative;
}

.tab-item {
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  color: #666;
  position: relative;
  transition: all 0.3s;
}

.tab-item.active {
  color: #007aff;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background: #007aff;
  border-radius: 2rpx;
}

.papers-section {
  background: #fff;
  border-radius: 32rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.paper-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #f0f0f0;
}

.paper-item:last-child {
  border-bottom: none;
}

.paper-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 10rpx;
}

.paper-meta {
  font-size: 24rpx;
  color: #999;
}

.meta-divider {
  margin: 0 10rpx;
}

.action-btn {
  font-size: 24rpx;
  color: #007aff;
}

.favorites-section {
  background: #fff;
  border-radius: 32rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  border-bottom: 2rpx solid #f0f0f0;
  padding-bottom: 20rpx;
}

.section-header h2 {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.count-badge {
  font-size: 24rpx;
  color: #999;
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.favorite-group {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 8rpx 16rpx;
  background: #f0f7ff;
  border-radius: 16rpx;
  margin-bottom: 8rpx;
}

.group-icon {
  font-size: 28rpx;
}

.group-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #007aff;
  flex: 1;
}

.group-count {
  font-size: 24rpx;
  color: #666;
}

.favorite-item {
  position: relative;
  background: #fff;
  border: 2rpx solid #eee;
  border-radius: 16rpx;
  padding: 20rpx;
  transition: all 0.3s;
}

.remove-fav-btn {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 40rpx;
  height: 40rpx;
  line-height: 36rpx;
  text-align: center;
  color: #ccc;
  font-size: 36rpx;
  z-index: 10;
}

.fav-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15rpx;
  padding-right: 40rpx;
}

.fav-kptitle {
  font-size: 24rpx;
  color: #3498db;
  font-weight: bold;
}

.fav-id {
  font-size: 20rpx;
  color: #999;
}

.fav-preview {
  font-size: 28rpx;
  color: #444;
  margin-bottom: 20rpx;
  line-height: 1.6;
}

.fav-footer {
  display: flex;
  justify-content: space-between;
  font-size: 22rpx;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  color: #999;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.go-study-btn {
  margin-top: 30rpx;
  padding: 16rpx 60rpx;
  background: #007aff;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #fff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
  z-index: 1000;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
}

.nav-item.active {
  color: #007aff;
}

.nav-icon-wrapper {
  font-size: 40rpx;
  margin-bottom: 4rpx;
}

.nav-text {
  font-size: 20rpx;
}
</style>