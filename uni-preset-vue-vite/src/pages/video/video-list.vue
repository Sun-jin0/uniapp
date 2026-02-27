<template>
  <view class="container">
    <!-- Header/Search -->
    <view class="header">
      <view class="search-wrapper">
        <view class="search-icon">Q</view>
        <input v-model="keyword" class="search-input" placeholder="搜索视频资源" @confirm="onSearch" />
        <view v-if="keyword" class="search-clear" @click="keyword = ''; onSearch()">x</view>
      </view>
      <button class="recommend-btn" @click="showRecommend = true">
        <text>+ 推荐</text>
      </button>
    </view>

    <!-- Recommend Modal -->
    <view v-if="showRecommend" class="modal-mask" @click="showRecommend = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">推荐视频资源</text>
          <text class="close" @click="showRecommend = false">x</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="label">视频标题 (可选)</text>
            <input v-model="recommendForm.title" class="input" placeholder="如：Vue3 实战教程" />
          </view>
          <view class="form-item">
            <text class="label">视频链接 (必填)</text>
            <textarea v-model="recommendForm.url" class="textarea" placeholder="请粘贴 B站、百度网盘或其他直链" />
          </view>
          <button class="submit-btn" :loading="submitting" @click="submitRecommend">提交推荐</button>
        </view>
      </view>
    </view>

    <!-- Subjects Tabs -->
    <view class="filter-header">
      <scroll-view scroll-x class="subject-tabs" :scroll-into-view="'sub-'+currentSubjectId">
        <view class="tab-item" :class="{ active: currentTab === 'all' }" @click="selectTab('all')">
          <text>全部</text>
        </view>
        <view class="tab-item" :class="{ active: currentTab === 'redeemed' }" @click="selectTab('redeemed')">
          <text>兑换</text>
        </view>
        <view v-for="sub in subjects" :key="sub.id" :id="'sub-'+sub.id" 
              class="tab-item" :class="{ active: currentTab === 'subject' && currentSubjectId === sub.id }" 
              @click="selectSubject(sub)">
          <text>{{ sub.name }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- Categories (Level 2) - only show when a subject is selected -->
    <view v-if="currentTab === 'subject' && currentCategories.length" class="category-bar">
       <scroll-view scroll-x class="cat-scroll">
         <view class="cat-item" :class="{ active: !currentCategoryId }" @click="selectCategory(null)">全部</view>
         <view v-for="cat in currentCategories" :key="cat.id" 
               class="cat-item" :class="{ active: currentCategoryId === cat.id }"
               @click="selectCategory(cat)">
           {{ cat.name }}
         </view>
       </scroll-view>
    </view>

    <!-- Video List -->
    <scroll-view scroll-y class="video-list" @scrolltolower="loadMore">
       <view v-if="loading && videos.length === 0" class="loading">
         <text>加载中...</text>
       </view>
       <view v-if="!loading && videos.length === 0" class="empty">
         <text>暂无视频资源</text>
       </view>
       
       <!-- Redeemed Collections View -->
       <view v-if="currentTab === 'redeemed'" class="collections-list">
         <view v-for="collection in redeemedCollections" :key="collection.id" class="collection-section">
           <!-- Collection Header -->
           <view class="collection-header" @click="toggleCollection(collection.id)">
             <view class="collection-info">
               <text class="collection-name">{{ collection.name }}</text>
               <text class="collection-meta">{{ collection.video_count }}个视频</text>
             </view>
             <text class="arrow" :class="{ expanded: expandedCollections.includes(collection.id) }">›</text>
           </view>
           
           <!-- Collection Videos -->
           <view v-if="expandedCollections.includes(collection.id)" class="collection-videos">
             <view v-for="(video, index) in collection.videos" :key="video.id" class="collection-video-item" @click="goDetail(video)">
               <view class="video-index">{{ index + 1 }}</view>
               <view class="video-title">{{ video.title }}</view>
               <view v-if="video.progress?.isCompleted" class="completed-icon">
                 <svg viewBox="0 0 24 24" fill="#52c41a">
                   <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                 </svg>
               </view>
               <view v-else-if="video.progress" class="progress-mini">
                 <view class="progress-bar-mini">
                   <view class="progress-fill-mini" :style="{ width: video.progress.progressPercent + '%' }"></view>
                 </view>
               </view>
             </view>
           </view>
         </view>
         
         <!-- Individual Redeemed Videos -->
         <view v-if="redeemedIndividualVideos.length > 0" class="individual-section">
           <view class="section-title">单个视频</view>
           <view v-for="video in redeemedIndividualVideos" :key="video.id" class="video-card" @click="goDetail(video)">
             <view class="card-main">
               <view class="card-title">{{ video.title }}</view>
               <view class="card-tags">
                 <text class="tag redeemed">已兑换</text>
                 <text class="tag type">视频</text>
                 <text class="tag subject">{{ video.subject_name }}</text>
               </view>
             </view>
             <view class="card-arrow"></view>
           </view>
         </view>
       </view>
       
       <!-- Normal Video Grid -->
       <view v-else class="video-grid">
         <view v-for="v in videos" :key="v.id" class="video-card" @click="goDetail(v)">
           <view class="card-main">
             <view class="card-title">{{ v.title }}</view>
             <view class="card-tags">
               <text v-if="v.requires_redemption && !v.has_redeemed_access" class="tag lock">需兑换</text>
               <text class="tag type">{{ v.type === 'collection' ? '合集' : '视频' }}</text>
               <text class="tag subject">{{ v.subject_name }}</text>
               <text class="tag category" v-if="v.category_name">{{ v.category_name }}</text>
             </view>
           </view>
           <view class="card-arrow"></view>
         </view>
       </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import videoApi from '@/api/video';

const subjects = ref([]);
const currentSubjectId = ref(null);
const currentCategoryId = ref(null);
const currentTab = ref('all'); // 'all', 'redeemed', 'subject'
const keyword = ref('');
const videos = ref([]);
const loading = ref(false);
const showRecommend = ref(false);
const submitting = ref(false);
const recommendForm = ref({ title: '', url: '' });

// Redeemed collections data
const redeemedCollections = ref([]);
const redeemedIndividualVideos = ref([]);
const expandedCollections = ref([]);

const submitRecommend = async () => {
  if (!recommendForm.value.url) {
    uni.showToast({ title: '请输入视频链接', icon: 'none' });
    return;
  }
  submitting.value = true;
  try {
    const res = await videoApi.recommendVideo(recommendForm.value);
    if (res.code === 0) {
      uni.showToast({ title: '推荐成功，感谢分享' });
      showRecommend.value = false;
      recommendForm.value = { title: '', url: '' };
    } else {
      uni.showToast({ title: res.message || '提交失败', icon: 'none' });
    }
  } catch (e) {
    uni.showToast({ title: '提交出错', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  fetchSubjects();
  fetchVideos();
});

const currentCategories = computed(() => {
  if (!currentSubjectId.value) return [];
  const sub = subjects.value.find(s => s.id === currentSubjectId.value);
  return sub ? (sub.categories || []) : [];
});

const fetchSubjects = async () => {
  try {
    const res = await videoApi.getSubjects();
    if (res.code === 0) {
      subjects.value = res.data;
    }
  } catch (e) {
    console.error(e);
  }
};

const selectTab = (tab) => {
  currentTab.value = tab;
  currentSubjectId.value = null;
  currentCategoryId.value = null;
  if (tab === 'redeemed') {
    fetchRedeemedVideos();
  } else if (tab === 'all') {
    fetchVideos();
  }
};

const fetchRedeemedVideos = async () => {
  loading.value = true;
  try {
    const res = await videoApi.getMyVideos('redeemed');
    if (res.code === 0) {
      redeemedCollections.value = res.data.collections || [];
      redeemedIndividualVideos.value = res.data.individualVideos || [];
      
      // Fetch videos for each collection
      for (const collection of redeemedCollections.value) {
        await fetchCollectionVideos(collection);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const fetchCollectionVideos = async (collection) => {
  try {
    const res = await videoApi.getCollectionVideos(collection.id);
    if (res.code === 0) {
      collection.videos = res.data || [];
    }
  } catch (e) {
    console.error('Error fetching collection videos:', e);
    collection.videos = [];
  }
};

const toggleCollection = (collectionId) => {
  const index = expandedCollections.value.indexOf(collectionId);
  if (index > -1) {
    expandedCollections.value.splice(index, 1);
  } else {
    expandedCollections.value.push(collectionId);
  }
};

const fetchVideos = async () => {
  loading.value = true;
  try {
    const params = { keyword: keyword.value };
    if (currentSubjectId.value) params.subject_id = currentSubjectId.value;
    if (currentCategoryId.value) params.category_id = currentCategoryId.value;

    console.log('Fetching videos with params:', params);
    const res = await videoApi.getVideos(params);
    if (res.code === 0) {
      // 在"全部"和"科目"标签页，过滤掉已兑换的视频（只在"兑换"标签页显示）
      videos.value = res.data.filter(v => !v.has_redeemed_access);
      console.log('Fetched videos:', videos.value.length);
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const selectSubject = (sub) => {
  if (!sub) {
    // If no subject selected, switch to 'all' tab
    selectTab('all');
    return;
  }
  currentTab.value = 'subject';
  currentSubjectId.value = sub.id;
  currentCategoryId.value = null;
  fetchVideos();
};

const selectCategory = (cat) => {
  if (cat) {
    currentCategoryId.value = cat.id;
  } else {
    // "全部" selected - show all videos under current subject
    currentCategoryId.value = null;
  }
  fetchVideos();
};

const onSearch = () => {
  fetchVideos();
};

const goDetail = (v) => {
  uni.navigateTo({ url: `/pages/video/video-detail?vid=${v.vid}` });
};
</script>

<style scoped>
.container { 
  height: 100vh; 
  display: flex; 
  flex-direction: column; 
  background: #f5f5f5; 
}

/* Header */
.header { 
  padding: 8px 12px; 
  background: #fff; 
  display: flex; 
  align-items: center; 
  gap: 8px;
  border-bottom: 1px solid #e0e0e0;
}

/* 美化搜索框 */
.search-wrapper { 
  background: #f0f0f0; 
  border-radius: 20px; 
  padding: 0 12px; 
  height: 36px; 
  display: flex; 
  align-items: center; 
  flex: 1;
  border: 1px solid #e0e0e0;
}

.search-icon {
  width: 18px;
  height: 18px;
  background: #2c3e50;
  color: #fff;
  border-radius: 50%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-weight: bold;
}

.search-input { 
  flex: 1; 
  font-size: 13px; 
  color: #333;
  background: transparent;
}

.search-clear {
  width: 18px;
  height: 18px;
  background: #999;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
}

.recommend-btn {
  background: #4db6ac;
  color: #fff;
  font-size: 13px;
  padding: 0 14px;
  height: 36px;
  line-height: 36px;
  border-radius: 18px;
  border: none;
  white-space: nowrap;
}

/* Modal */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 85%;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close {
  font-size: 20px;
  color: #999;
  padding: 4px;
}

.modal-body {
  padding: 16px;
}

.form-item {
  margin-bottom: 16px;
}

.label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  display: block;
}

.input, .textarea {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  box-sizing: border-box;
}

.textarea {
  height: 80px;
  resize: none;
}

.submit-btn {
  width: 100%;
  background: #4db6ac;
  color: #fff;
  font-size: 15px;
  height: 44px;
  line-height: 44px;
  border-radius: 8px;
  border: none;
  margin-top: 8px;
}

/* Filter Header */
.filter-header {
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 12px;
}

.subject-tabs {
  white-space: nowrap;
  height: 44px;
  line-height: 44px;
}

.tab-item {
  display: inline-block;
  padding: 0 16px;
  font-size: 14px;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #4db6ac;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: #4db6ac;
  border-radius: 2px;
}

/* Category Bar */
.category-bar {
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 8px 12px;
}

.cat-scroll {
  white-space: nowrap;
}

.cat-item {
  display: inline-block;
  padding: 6px 14px;
  margin-right: 8px;
  font-size: 13px;
  color: #666;
  background: #f5f5f5;
  border-radius: 14px;
}

.cat-item.active {
  background: #4db6ac;
  color: #fff;
}

/* Video List */
.video-list {
  flex: 1;
  padding: 12px;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

.video-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.video-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.card-main {
  flex: 1;
}

.card-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
}

.tag.lock {
  background: #fff5f5;
  color: #c53030;
  border: 1px solid #feb2b2;
}

.tag.redeemed {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.tag.collection {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.tag.type {
  background: #ebf8ff;
  color: #2b6cb0;
  border: 1px solid #90cdf4;
}

.tag.subject {
  background: #f0fff4;
  color: #276749;
  border: 1px solid #9ae6b4;
}

.tag.category {
  background: #fffff0;
  color: #975a16;
  border: 1px solid #fbd38d;
}

.card-arrow {
  width: 8px;
  height: 8px;
  border-top: 2px solid #ccc;
  border-right: 2px solid #ccc;
  transform: rotate(45deg);
  margin-left: 10px;
}

/* Collections List */
.collections-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.collection-section {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.collection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #f8f9fa;
}

.collection-info {
  flex: 1;
}

.collection-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  display: block;
}

.collection-meta {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  display: block;
}

.arrow {
  font-size: 20px;
  color: #999;
  transition: transform 0.2s;
}

.arrow.expanded {
  transform: rotate(90deg);
}

.collection-videos {
  padding: 8px 0;
}

.collection-video-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.collection-video-item:last-child {
  border-bottom: none;
}

.video-index {
  font-size: 13px;
  color: #999;
  min-width: 24px;
}

.video-title {
  flex: 1;
  font-size: 14px;
  color: #666;
  margin: 0 10px;
}

.completed-icon {
  width: 18px;
  height: 18px;
}

.completed-icon svg {
  width: 100%;
  height: 100%;
}

.progress-mini {
  width: 60px;
}

.progress-bar-mini {
  height: 4px;
  background: #e8e8e8;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill-mini {
  height: 100%;
  background: #1890ff;
  border-radius: 2px;
  transition: width 0.3s;
}

/* Individual Section */
.individual-section {
  margin-top: 20px;
}

.section-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 10px;
  padding-left: 4px;
}
</style>
