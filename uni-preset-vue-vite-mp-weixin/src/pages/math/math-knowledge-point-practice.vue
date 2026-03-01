<template>
  <view class="page">
    <view class="search-box">
      <view class="search-input-wrap">
        <text class="search-icon">搜索</text>
        <input 
          type="text" 
          v-model="searchKeyword"
          placeholder="输入考点名称"
          class="search-input"
          @input="onSearch"
        />
        <text v-if="searchKeyword" class="clear-btn" @tap="clearSearch">清除</text>
      </view>
    </view>

    <scroll-view class="content" scroll-y>
      <view v-if="loading" class="loading">加载中...</view>
      
      <view v-else-if="filteredTree.length === 0" class="empty">
        <text v-if="searchKeyword">未找到相关考点</text>
        <text v-else>暂无考点数据</text>
      </view>

      <view v-else class="tree-list">
        <view v-for="subject in filteredTree" :key="subject.id" class="subject-item">
          <view class="subject-header" @tap="toggleSubject(subject.id)">
            <view class="arrow" :class="{ expanded: expandedSubjects.has(subject.id) }"></view>
            <text class="subject-name">{{ subject.name }}</text>
            <text class="subject-count">{{ getSubjectCount(subject) }}</text>
          </view>
          
          <view v-show="expandedSubjects.has(subject.id)" class="chapter-list">
            <view v-for="chapter in subject.chapters" :key="chapter.id" class="chapter-item">
              <view class="chapter-header" @tap="toggleChapter(chapter.id)">
                <view class="arrow" :class="{ expanded: expandedChapters.has(chapter.id) }"></view>
                <text class="chapter-name">{{ chapter.name }}</text>
                <text class="chapter-count">{{ chapter.points?.length || 0 }}</text>
              </view>
              
              <view v-show="expandedChapters.has(chapter.id)" class="point-list">
                <view
                  v-for="point in chapter.points"
                  :key="point.id"
                  class="point-item"
                  @tap="goToQuestions(point)"
                >
                  <text class="point-name">{{ point.name }}</text>
                  <text class="point-count">{{ point.questionCount }}题</text>
                  <view class="point-arrow"></view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { request } from '@/api/request';

const searchKeyword = ref('');
const treeData = ref(null);
const expandedSubjects = ref(new Set());
const expandedChapters = ref(new Set());
const loading = ref(false);

const fetchTreeData = async () => {
  try {
    loading.value = true;
    const res = await request({
      url: '/math/knowledge-categories',
      method: 'GET'
    });
    treeData.value = res.data;
    if (res.data?.subjects?.length > 0) {
      expandedSubjects.value.add(res.data.subjects[0].id);
    }
  } catch (err) {
    console.error('获取考点失败:', err);
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const filteredTree = computed(() => {
  if (!treeData.value?.subjects) return [];
  if (!searchKeyword.value) return treeData.value.subjects;
  
  const keyword = searchKeyword.value.toLowerCase();
  return treeData.value.subjects.map(subject => {
    const filteredChapters = subject.chapters?.map(chapter => {
      const filteredPoints = chapter.points?.filter(p => 
        p.name.toLowerCase().includes(keyword)
      ) || [];
      return { ...chapter, points: filteredPoints };
    }).filter(c => c.points?.length > 0) || [];
    
    return { ...subject, chapters: filteredChapters };
  }).filter(s => s.chapters?.length > 0);
});

const getSubjectCount = (subject) => {
  let count = 0;
  subject.chapters?.forEach(c => {
    count += c.points?.length || 0;
  });
  return count;
};

const toggleSubject = (id) => {
  if (expandedSubjects.value.has(id)) {
    expandedSubjects.value.delete(id);
  } else {
    expandedSubjects.value.add(id);
  }
};

const toggleChapter = (id) => {
  if (expandedChapters.value.has(id)) {
    expandedChapters.value.delete(id);
  } else {
    expandedChapters.value.add(id);
  }
};

const onSearch = () => {
  if (searchKeyword.value) {
    filteredTree.value.forEach(subject => {
      expandedSubjects.value.add(subject.id);
      subject.chapters?.forEach(chapter => {
        expandedChapters.value.add(chapter.id);
      });
    });
  }
};

const clearSearch = () => {
  searchKeyword.value = '';
};

const goToQuestions = (point) => {
  uni.navigateTo({
    url: `/pages/math/math-knowledge-questions?pointId=${point.originalId}&pointName=${encodeURIComponent(point.name)}`
  });
};

onMounted(() => {
  fetchTreeData();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
}

.search-box {
  padding: 12px 16px;
  background: #fff;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: #f2f3f5;
  border-radius: 8px;
  padding: 0 12px;
  height: 36px;
}

.search-icon {
  font-size: 14px;
  color: #969799;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  font-size: 14px;
  color: #323233;
}

.clear-btn {
  font-size: 12px;
  color: #576b95;
  padding: 4px 8px;
}

.content {
  height: calc(100vh - 60px);
}

.loading, .empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #969799;
  font-size: 14px;
}

.tree-list {
  padding: 12px 16px;
}

.subject-item {
  margin-bottom: 12px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.subject-header {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #f2f3f5;
}

.arrow {
  width: 12px;
  height: 12px;
  margin-right: 8px;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow::after {
  content: '>';
  font-size: 12px;
  color: #969799;
}

.arrow.expanded {
  transform: rotate(90deg);
}

.subject-name {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #323233;
}

.subject-count {
  font-size: 13px;
  color: #969799;
}

.chapter-list {
  padding: 0 16px;
}

.chapter-item {
  border-bottom: 1px solid #ebedf0;
}

.chapter-item:last-child {
  border-bottom: none;
}

.chapter-header {
  display: flex;
  align-items: center;
  padding: 12px 0;
}

.chapter-name {
  flex: 1;
  font-size: 14px;
  color: #323233;
}

.chapter-count {
  font-size: 13px;
  color: #969799;
  margin-right: 8px;
}

.point-list {
  padding-bottom: 8px;
}

.point-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 4px;
  background: #fafafa;
  border-radius: 4px;
}

.point-name {
  flex: 1;
  font-size: 14px;
  color: #323233;
}

.point-count {
  font-size: 12px;
  color: #576b95;
  margin-right: 8px;
}

.point-arrow {
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.point-arrow::after {
  content: '>';
  font-size: 12px;
  color: #c8c9cc;
}
</style>
