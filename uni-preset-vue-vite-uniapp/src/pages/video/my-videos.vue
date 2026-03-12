<template>
  <view class="container">
    <view class="tabs">
      <view class="tab" :class="{ active: activeTab === 'redeemed' }" @click="activeTab = 'redeemed'">已兑换</view>
      <view class="tab" :class="{ active: activeTab === 'favorite' }" @click="activeTab = 'favorite'">我的收藏</view>
    </view>

    <scroll-view scroll-y class="list-container">
      <view v-if="loading" class="loading">加载中...</view>
      <view v-else-if="isEmpty" class="empty">暂无数据</view>
      
      <!-- 已兑换 - 合集分组显示 -->
      <template v-if="activeTab === 'redeemed'">
        <!-- 合集列表 -->
        <view v-for="collection in collections" :key="'col-'+collection.id" class="list-section">
          <!-- 合集头部 - 点击展开/收起 -->
          <view class="list-item" @click="toggleCollection(collection.id)">
            <view class="item-left">
              <text class="item-title">{{ collection.name }}</text>
              <text class="item-meta">{{ collection.video_count }}个视频</text>
            </view>
            <text class="arrow" :class="{ expanded: expandedCollections.includes(collection.id) }">›</text>
          </view>
          
          <!-- 合集视频列表 - 展开时显示 -->
          <view v-if="expandedCollections.includes(collection.id)" class="sub-list">
            <view v-for="(video, index) in collection.videos" :key="video.id" class="sub-item" @click="goVideoDetail(video)">
              <view class="video-info">
                <view class="video-title-row">
                  <text class="video-index">{{ index + 1 }}</text>
                  <text class="sub-title" :class="{ 'text-completed': video.progress?.isCompleted }">{{ video.title }}</text>
                  <!-- 已完成标记 -->
                  <view v-if="video.progress?.isCompleted" class="completed-badge">
                    <svg viewBox="0 0 24 24" fill="#52c41a">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </view>
                </view>
                <!-- 进度条 -->
                <view v-if="video.progress && !video.progress.isCompleted" class="progress-bar">
                  <view class="progress-track">
                    <view class="progress-fill" :style="{ width: video.progress.progressPercent + '%' }"></view>
                  </view>
                  <text class="progress-text">{{ formatProgress(video.progress) }}</text>
                </view>
                <view v-else-if="!video.progress" class="progress-bar">
                  <text class="no-progress">未开始</text>
                </view>
              </view>
              <text class="arrow">›</text>
            </view>
          </view>
        </view>
        
        <!-- 单个视频列表 -->
        <view v-for="item in individualVideos" :key="'vid-'+item.id" class="list-item" @click="goVideoDetail(item)">
          <text class="item-title">{{ item.title }}</text>
          <text class="arrow">›</text>
        </view>
      </template>
      
      <!-- 我的收藏 - 列表显示 -->
      <template v-else>
        <view v-for="item in favoriteList" :key="item.id" class="list-item" @click="goVideoDetail(item)">
          <text class="item-title">{{ item.title }}</text>
          <text class="arrow">›</text>
        </view>
      </template>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import videoApi from '@/api/video';

const activeTab = ref('redeemed');
const loading = ref(false);

// 已兑换数据
const collections = ref([]);
const individualVideos = ref([]);

// 收藏数据
const favoriteList = ref([]);

// 展开的合集ID列表
const expandedCollections = ref([]);

const isEmpty = computed(() => {
  if (activeTab.value === 'redeemed') {
    return collections.value.length === 0 && individualVideos.value.length === 0;
  }
  return favoriteList.value.length === 0;
});

onMounted(() => {
  fetchList();
});

watch(activeTab, () => {
  fetchList();
});

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await videoApi.getMyVideos(activeTab.value);
    if (res.code === 0) {
      if (activeTab.value === 'redeemed') {
        // 分组数据
        collections.value = res.data.collections || [];
        individualVideos.value = res.data.individualVideos || [];
        
        // 加载每个合集的视频
        for (const collection of collections.value) {
          await fetchCollectionVideos(collection);
        }
      } else {
        // 列表数据
        favoriteList.value = res.data.data || [];
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// 获取合集视频列表
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

// 展开/收起合集
const toggleCollection = (collectionId) => {
  const index = expandedCollections.value.indexOf(collectionId);
  if (index > -1) {
    expandedCollections.value.splice(index, 1);
  } else {
    expandedCollections.value.push(collectionId);
  }
};

// 格式化进度显示
const formatProgress = (progress) => {
  if (!progress) return '未开始';
  if (progress.isCompleted) return '已完成';
  const current = formatTime(progress.progressSeconds);
  const total = formatTime(progress.durationSeconds);
  return `${current} / ${total}`;
};

// 格式化时间
const formatTime = (seconds) => {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 进入视频详情页
const goVideoDetail = (video) => {
  if (!video || !video.vid) {
    console.warn('Video item or VID is missing:', video);
    return;
  }
  uni.navigateTo({ url: `/pages/video/video-detail?vid=${video.vid}` });
};
</script>

<style scoped>
.container { height: 100vh; display: flex; flex-direction: column; background: #f5f5f5; }

/* 标签页 */
.tabs { display: flex; background: #fff; border-bottom: 1px solid #eee; }
.tab { flex: 1; text-align: center; padding: 14px; font-size: 15px; color: #666; position: relative; }
.tab.active { color: #333; font-weight: 600; }
.tab.active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 20px; height: 3px; background: #333; border-radius: 2px; }

/* 列表容器 */
.list-container { flex: 1; padding: 10px; }

/* 列表项 */
.list-item { display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 16px; margin-bottom: 10px; border-radius: 8px; }
.item-left { flex: 1; display: flex; flex-direction: column; }
.item-title { font-size: 15px; color: #333; }
.item-meta { font-size: 12px; color: #999; margin-top: 4px; }
.arrow { font-size: 20px; color: #999; margin-left: 10px; transition: transform 0.2s; }
.arrow.expanded { transform: rotate(90deg); }

/* 子列表 */
.list-section { margin-bottom: 10px; }
.sub-list { margin-top: 8px; padding-left: 12px; }
.sub-item { display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 10px 14px; margin-bottom: 6px; border-radius: 6px; }

/* 视频信息 */
.video-info { flex: 1; }
.video-title-row { display: flex; align-items: center; gap: 8px; }
.video-index { font-size: 13px; color: #999; min-width: 20px; }
.sub-title { font-size: 14px; color: #666; flex: 1; }
.sub-title.text-completed { color: #52c41a; }

/* 已完成标记 */
.completed-badge { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; }
.completed-badge svg { width: 100%; height: 100%; }

/* 进度条 */
.progress-bar { margin-top: 8px; display: flex; align-items: center; gap: 8px; }
.progress-track { flex: 1; height: 4px; background: #e8e8e8; border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: #1890ff; border-radius: 2px; transition: width 0.3s; }
.progress-text { font-size: 11px; color: #999; min-width: 70px; text-align: right; }
.no-progress { font-size: 11px; color: #999; }

/* 加载和空状态 */
.loading, .empty { text-align: center; padding: 40px; color: #999; font-size: 14px; }
</style>
