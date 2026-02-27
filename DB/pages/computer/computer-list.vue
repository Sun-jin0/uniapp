<template>
  <view class="container" :style="{ paddingTop: statusBarHeight + 'px' }">
    <!-- 顶部导航 -->
    <view class="nav-header">
      <view class="back-icon" @tap="goBack">
        <SvgIcon name="left" size="44" fill="#333" />
      </view>
      <view class="nav-title">计算机综合</view>
      <view class="placeholder"></view>
    </view>

    <!-- 模式切换 Tabs -->
    <view class="tabs-container">
      <view 
        class="tab-item" 
        :class="{ active: currentMode === 'chapter' }"
        @tap="switchMode('chapter')"
      >
        <text>章节真题</text>
        <view class="active-line" v-if="currentMode === 'chapter'"></view>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentMode === 'year' }"
        @tap="switchMode('year')"
      >
        <text>历年真题</text>
        <view class="active-line" v-if="currentMode === 'year'"></view>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentMode === 'smart' }"
        @tap="switchMode('smart')"
      >
        <text>能力测试</text>
        <view class="active-line" v-if="currentMode === 'smart'"></view>
      </view>
    </view>

    <!-- 主体内容 -->
    <view class="main-body">
      <!-- 章节模式 -->
      <template v-if="currentMode === 'chapter'">
        <!-- 左侧科目边栏 -->
        <scroll-view class="sidebar" scroll-y>
          <view 
            v-for="subject in subjects" 
            :key="subject.id" 
            class="sidebar-item" 
            :class="{ active: activeSubjectId === subject.id }"
            @tap="selectSubject(subject)"
          >
            <text>{{ formatName(subject.name) }}</text>
            <view v-if="activeSubjectId === subject.id" class="active-bar"></view>
          </view>
        </scroll-view>

        <!-- 右侧章节内容区 -->
        <scroll-view class="content-area" scroll-y>
          <view class="course-header">
            <view class="header-left">
              <text class="course-name">{{ activeSubjectName }}</text>
            </view>
            <view class="header-right" v-if="activeSubjectProgress">
              <text class="progress-text">{{ activeSubjectProgress.brushedCount }}/{{ activeSubjectProgress.totalQuestions }}</text>
              <view class="progress-bar-bg">
                <view class="progress-bar-fill" :style="{ width: (activeSubjectProgress.brushedCount / activeSubjectProgress.totalQuestions * 100) + '%' }"></view>
              </view>
            </view>
          </view>

          <view class="chapter-list">
            <view v-if="loading" class="loading-state">
              <text>加载中...</text>
            </view>
            <view v-else-if="chapters.length > 0">
              <view 
                v-for="chapter in chapters" 
                :key="chapter.id" 
                class="chapter-group"
              >
                <!-- 章节行 -->
                <view class="chapter-item" :class="{ 'has-children': chapter.subChapterCount > 0 }">
                  <view class="chapter-main" @tap="handleChapterClick(chapter)">
                    <view class="chapter-left">
                      <view class="expand-icon" v-if="chapter.subChapterCount > 0">
                        <SvgIcon :name="expandedChapters[chapter.id] ? 'down' : 'right'" size="24" fill="#bbb" />
                      </view>
                      <text class="chapter-name">{{ formatName(chapter.name) }}</text>
                    </view>
                    <view class="chapter-right">
                      <text class="count-text">{{ chapter.brushedCount || 0 }}/{{ chapter.totalQuestions }}</text>
                      <view class="mini-progress">
                         <view class="fill" :style="{ width: (chapter.brushedCount / chapter.totalQuestions * 100) + '%' }"></view>
                      </view>
                    </view>
                  </view>
                </view>

                <!-- 子章节/考点列表 -->
                <view class="sub-chapter-list" v-if="expandedChapters[chapter.id]">
                  <view v-if="loadingTags[chapter.id]" class="sub-loading">加载中...</view>
                  <view 
                    v-for="tag in chapterTags[chapter.id]" 
                    :key="tag.id"
                    class="sub-chapter-item"
                    @tap="goToPractice(tag, 'tag', chapter)"
                  >
                    <view class="sub-left">
                      <view class="sub-dot"></view>
                      <text class="sub-name">{{ formatName(tag.name) }}</text>
                    </view>
                    <view class="sub-right">
                      <text class="sub-count">{{ tag.brushedCount || 0 }}/{{ tag.totalQuestions || 0 }}题</text>
                      <SvgIcon name="right" size="24" fill="#ddd" />
                    </view>
                  </view>
                </view>
              </view>
            </view>
            <view v-else class="empty-state">
              <text>暂无章节数据</text>
            </view>
          </view>
        </scroll-view>
      </template>

      <!-- 历年模式 -->
      <template v-else-if="currentMode === 'year'">
        <scroll-view class="year-list-container" scroll-y>
          <view v-if="loading" class="loading-state">
            <text>加载中...</text>
          </view>
          <view v-else-if="exams.length > 0" class="year-grid">
            <view 
              v-for="exam in exams" 
              :key="exam.id" 
              class="year-item"
              @tap="goToPractice(exam, 'year')"
            >
              <view class="year-card">
                <text class="year-text">{{ exam.year }}</text>
                <view class="year-info">
                  <text class="year-sub">{{ exam.from_school || '全国统考' }}</text>
                  <text class="year-count">共 {{ exam.questionCount }} 题</text>
                </view>
                <view class="year-tag">{{ exam.type }}</view>
              </view>
            </view>
          </view>
          <view v-else class="empty-state">
            <text>暂无真题数据</text>
          </view>
        </scroll-view>
      </template>

      <!-- 能力测试模式 -->
      <template v-else-if="currentMode === 'smart'">
        <scroll-view class="smart-tools-container" scroll-y>
          <view class="tools-grid">
            <view @click="navigateTo('/pages/computer/computer-question-list?majorId=' + activeSubjectId + '&mode=random&title=章节乱序')" class="tool-card random-practice">
              <view class="tool-icon">🔀</view>
              <view class="tool-info">
                <text class="tool-name">章节乱序</text>
                <text class="tool-desc">打破顺序 巩固记忆</text>
              </view>
            </view>
            <view @click="navigateTo('/pages/computer/computer-smart-paper-config?subjectId=' + activeSubjectId)" class="tool-card ability-test">
              <view class="tool-icon">📝</view>
              <view class="tool-info">
                <text class="tool-name">能力测试</text>
                <text class="tool-desc">智能评估 针对性练习</text>
              </view>
            </view>
            <view @click="navigateTo('/pages/computer/computer-test?subjectId=' + activeSubjectId)" class="tool-card">
              <view class="tool-icon">⏱️</view>
              <view class="tool-info">
                <text class="tool-name">全真测试</text>
                <text class="tool-desc">全真模拟 掌握考试节奏</text>
              </view>
            </view>
            <view @click="navigateTo('/pages/computer/computer-my-papers')" class="tool-card">
              <view class="tool-icon">📁</view>
              <view class="tool-info">
                <text class="tool-name">我的组卷</text>
                <text class="tool-desc">历史记录 随时回顾</text>
              </view>
            </view>
            <view @click="navigateTo('/pages/computer/computer-wrong-book')" class="tool-card wrong-book">
              <view class="tool-icon">📕</view>
              <view class="tool-info">
                <text class="tool-name">错题本</text>
                <text class="tool-desc">错题重做 查漏补缺</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </template>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { request } from '@/api/request';
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue';

const statusBarHeight = ref(0);
const currentMode = ref('chapter'); // 'chapter' | 'year' | 'random'
const loading = ref(true);

const subjects = ref([]);
const activeSubjectId = ref(null);
const chapters = ref([]);
const exams = ref([]);

// 章节展开和考点数据
const expandedChapters = ref({});
const chapterTags = ref({});
const loadingTags = ref({});

const formatName = (name) => {
  if (!name) return '';
  return name.replace(/^专业基础\((.*)\)$/, '$1').replace(/^专业基础/, '');
};

const activeSubjectName = computed(() => {
  const subject = subjects.value.find(s => s.id === activeSubjectId.value);
  return subject ? formatName(subject.name) : '';
});

const activeSubjectProgress = computed(() => {
  if (!chapters.value.length) return null;
  const total = chapters.value.reduce((sum, ch) => sum + (ch.totalQuestions || 0), 0);
  const brushed = chapters.value.reduce((sum, ch) => sum + (ch.brushedCount || 0), 0);
  return { totalQuestions: total, brushedCount: brushed };
});

onMounted(async () => {
  const systemInfo = uni.getSystemInfoSync();
  statusBarHeight.value = systemInfo.statusBarHeight;

  await fetchSubjects();
  await fetchExams();
});

const fetchSubjects = async () => {
  loading.value = true;
  try {
    const res = await request({ url: '/computer1/subjects' });
    if (res.code === 0) {
      subjects.value = res.data;
      if (subjects.value.length > 0) {
        activeSubjectId.value = subjects.value[0].id;
        await fetchChapters(activeSubjectId.value);
      }
    }
  } catch (error) {
    console.error('Fetch subjects failed:', error);
  } finally {
    loading.value = false;
  }
};

const fetchChapters = async (majorId) => {
  if (!majorId) return;
  loading.value = true;
  try {
    const res = await request({ 
      url: '/computer1/chapters',
      data: { majorId }
    });
    if (res.code === 0) {
      chapters.value = res.data;
    }
  } catch (error) {
    console.error('Fetch chapters failed:', error);
  } finally {
    loading.value = false;
  }
};

const fetchExams = async () => {
  try {
    const res = await request({ url: '/computer1/exams' });
    if (res.code === 0) {
      exams.value = res.data;
    }
  } catch (error) {
    console.error('Fetch exams failed:', error);
  }
};

const switchMode = (mode) => {
  currentMode.value = mode;
};

const selectSubject = (subject) => {
  if (activeSubjectId.value === subject.id) return;
  activeSubjectId.value = subject.id;
  // 重置展开状态
  expandedChapters.value = {};
  fetchChapters(subject.id);
};

const handleChapterClick = async (chapter) => {
  if (chapter.subChapterCount === 0) {
    // 如果没有子章节，直接进入练习（兼容旧逻辑）
    goToPractice(chapter, 'chapter');
    return;
  }
  
  // 切换展开状态
  const isExpanded = !!expandedChapters.value[chapter.id];
  expandedChapters.value[chapter.id] = !isExpanded;
  
  // 如果是展开且没有数据，加载数据
  if (!isExpanded && !chapterTags.value[chapter.id]) {
    await fetchChapterTags(chapter.id);
  }
};

const fetchChapterTags = async (chapterId) => {
  loadingTags.value[chapterId] = true;
  try {
    const res = await request({ 
      url: `/computer1/tags?chapterId=${chapterId}`
    });
    if (res.code === 0) {
      chapterTags.value[chapterId] = res.data || [];
    }
  } catch (error) {
    console.error('Fetch tags failed:', error);
  } finally {
    loadingTags.value[chapterId] = false;
  }
};

const goToPractice = (item, mode, parentChapter = null) => {
  let url = '/pages/computer/computer-question-list?';
  
  if (mode === 'tag') {
    // 小节/考点模式
    url += `majorId=${activeSubjectId.value}&chapterId=${parentChapter.id}&tagId=${item.id}&title=${encodeURIComponent(item.name)}`;
  } else if (mode === 'chapter') {
    // 纯章节模式
    url += `majorId=${activeSubjectId.value}&chapterId=${item.id}&mode=chapter&title=${encodeURIComponent(item.name)}`;
  } else if (mode === 'year') {
    // 历年真题
    url += `examGroupId=${item.id}&mode=year&title=${encodeURIComponent(item.year + '年真题')}`;
  } else if (mode === 'random') {
    // 随机练习
    url += `majorId=${activeSubjectId.value}&mode=random&title=章节乱序`;
  }
  
  uni.navigateTo({ url });
};

const goBack = () => {
  uni.navigateBack();
};

const navigateTo = (url) => {
  if (url.includes('subjectId=null')) {
    uni.showToast({
      title: '请先选择科目',
      icon: 'none'
    });
    return;
  }
  uni.navigateTo({ url });
};
</script>

<style lang="scss" scoped>
.container {
  height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 20rpx;
  background-color: #fff;
  color: #333;
  .nav-title {
    font-size: 34rpx;
    font-weight: 600;
  }
  .back-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60rpx;
    height: 60rpx;
  }
  .placeholder {
    width: 60rpx;
  }
}

.tabs-container {
  display: flex;
  background-color: #fff;
  height: 90rpx;
  border-bottom: 1rpx solid #f0f0f0;
  
  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
    color: #666;
    position: relative;
    
    &.active {
      color: #2196f3;
      font-weight: 600;
    }
    
    .active-line {
      position: absolute;
      bottom: 0;
      width: 40rpx;
      height: 4rpx;
      background-color: #2196f3;
      border-radius: 2rpx;
    }
  }
}

.main-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 180rpx;
  background-color: #f5f5f5;
  height: 100%;
  
  .sidebar-item {
    padding: 30rpx 20rpx;
    font-size: 28rpx;
    color: #666;
    text-align: center;
    position: relative;
    
    &.active {
      background-color: #fff;
      color: #333;
      font-weight: 600;
    }
    
    .active-bar {
      position: absolute;
      left: 0;
      top: 30rpx;
      bottom: 30rpx;
      width: 6rpx;
      background-color: #2196f3;
      border-radius: 0 4rpx 4rpx 0;
    }
  }
}

.content-area {
  flex: 1;
  background-color: #fff;
  height: 100%;
}

.course-header {
    padding: 30rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1rpx solid #f5f5f5;
    
    .header-left {
      display: flex;
      align-items: center;
      
      .course-name {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
      }
    }
    
    .header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      
      .progress-text {
        font-size: 24rpx;
        color: #999;
        margin-bottom: 8rpx;
      }
      
      .progress-bar-bg {
        width: 120rpx;
        height: 6rpx;
        background-color: #eee;
        border-radius: 3rpx;
        overflow: hidden;
        
        .progress-bar-fill {
          height: 100%;
          background-color: #2196f3;
        }
      }
    }
  }

  .random-action-box {
    padding: 30rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-bottom: 1rpx solid #f5f5f5;
    background-color: #fff;
    
    .random-btn {
      width: 100%;
      height: 80rpx;
      background: linear-gradient(135deg, #42a5f5, #2196f3);
      border-radius: 40rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 30rpx;
      font-weight: 600;
      box-shadow: 0 4rpx 12rpx rgba(33, 150, 243, 0.3);
      
      text {
        margin-left: 12rpx;
      }
    }
    
    .random-tip {
      margin-top: 16rpx;
      font-size: 24rpx;
      color: #999;
    }
  }
  
  .chapter-list {
  padding: 0 20rpx;
}

.chapter-group {
  margin-bottom: 16rpx;
  background-color: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.chapter-item {
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 6rpx;
    height: 32rpx;
    background-color: #2196f3;
    border-radius: 0 4rpx 4rpx 0;
    opacity: 0.8;
  }
  
  &.has-children {
    .chapter-main {
      padding-left: 20rpx;
    }
  }
  
  .chapter-main {
    padding: 32rpx 24rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color 0.2s;
    
    &:active {
      background-color: #f0f7ff;
    }
    
    .chapter-left {
      display: flex;
      align-items: center;
      flex: 1;
      
      .expand-icon {
        width: 32rpx;
        height: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16rpx;
      }
      
      .chapter-name {
        font-size: 30rpx;
        color: #333;
        font-weight: 500;
        line-height: 1.4;
      }
    }
    
    .chapter-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-left: 20rpx;
      
      .count-text {
        font-size: 24rpx;
        color: #888;
        margin-bottom: 8rpx;
        font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      .mini-progress {
        width: 100rpx;
        height: 6rpx;
        background-color: #eee;
        border-radius: 3rpx;
        overflow: hidden;
        
        .fill {
          height: 100%;
          background: linear-gradient(90deg, #2196f3, #64b5f6);
          border-radius: 3rpx;
          transition: width 0.3s ease;
        }
      }
    }
  }
}

.sub-chapter-list {
  background-color: #fafafa;
  border-top: 1rpx solid #f0f0f0;
  
  .sub-loading {
    padding: 30rpx;
    text-align: center;
    font-size: 24rpx;
    color: #999;
  }
  
  .sub-chapter-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 24rpx 28rpx 72rpx;
    border-bottom: 1rpx solid #f0f0f0;
    transition: background-color 0.2s;
    
    &:active {
      background-color: #f5f5f5;
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    .sub-left {
      display: flex;
      align-items: center;
      flex: 1;
      
      .sub-dot {
        width: 8rpx;
        height: 8rpx;
        border-radius: 50%;
        background-color: #ccc;
        margin-right: 16rpx;
        flex-shrink: 0;
      }
      
      .sub-name {
        font-size: 28rpx;
        color: #555;
        line-height: 1.4;
      }
    }
    
    .sub-right {
      display: flex;
      align-items: center;
      margin-left: 20rpx;
      
      .sub-count {
        font-size: 24rpx;
        color: #999;
        margin-right: 8rpx;
      }
    }
  }
}

.year-list-container {
  flex: 1;
  padding: 30rpx;
}

.year-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -15rpx;
}

.year-item {
  width: 100%;
  padding: 10rpx 15rpx;
  box-sizing: border-box;
}

.year-card {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx 30rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03);
  position: relative;
  overflow: hidden;
  height: auto;
  justify-content: space-between;
  
  .year-text {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 0;
    margin-right: 20rpx;
  }
  
  .year-info {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex: 1;
  }
  
  .year-sub {
    font-size: 24rpx;
    color: #666;
    margin-bottom: 0;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 20rpx;
  }

  .year-count {
    font-size: 22rpx;
    color: var(--primary-color);
    background-color: var(--primary-light);
    padding: 2rpx 16rpx;
    border-radius: 20rpx;
    margin-left: auto;
  }
  
  .year-tag {
    position: absolute;
    top: 0;
    right: 0;
    background-color: #2196f3;
    color: #fff;
    font-size: 20rpx;
    padding: 4rpx 12rpx;
    border-bottom-left-radius: 12rpx;
  }
}

.smart-tools-container {
  flex: 1;
  padding: 30rpx;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.tool-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  }
  
  .tool-icon {
    font-size: 48rpx;
    margin-bottom: 16rpx;
  }
  
  .tool-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    
    .tool-name {
      font-size: 30rpx;
      font-weight: 600;
      color: #333;
      margin-bottom: 8rpx;
    }
    
    .tool-desc {
      font-size: 24rpx;
      color: #999;
    }
  }
  
  &.random-practice {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    
    .tool-name, .tool-desc {
      color: #fff;
    }
  }
  
  &.ability-test {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    
    .tool-name, .tool-desc {
      color: #fff;
    }
  }
  
  &.wrong-book {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
    
    .tool-name, .tool-desc {
      color: #fff;
    }
  }
}

.loading-state, .empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}
</style>