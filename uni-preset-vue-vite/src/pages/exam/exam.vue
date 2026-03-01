<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 分类标签 -->
    <view class="category-wrapper">
      <scroll-view class="category-scroll" scroll-x :show-scrollbar="false" :enhanced="true">
        <view class="category-list">
          <view 
            v-for="cat in categories" 
            :key="cat"
            class="category-item"
            :class="{ active: currentCategory === cat }"
            @click="selectCategory(cat)"
          >
            {{ cat }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 搜索和排序工具栏 -->
    <view class="toolbar-section">
      <view class="search-bar-container">
        <view class="search-box">
          <icon type="search" size="14" color="#999" />
          <input 
            class="search-input" 
            type="text" 
            placeholder="搜索感兴趣的资料..." 
            v-model="searchKeyword"
            @confirm="onSearch"
            @input="onSearchInput"
          />
          <text v-if="searchKeyword" class="clear-icon" @click="clearSearch">×</text>
        </view>
      </view>
      <view class="sort-bar">
        <view 
          class="sort-btn" 
          :class="{ active: currentSort === 'newest' }"
          @click="selectSort('newest')"
        >
          最新
          <view class="active-line" v-if="currentSort === 'newest'"></view>
        </view>
        <view 
          class="sort-btn" 
          :class="{ active: currentSort === 'hottest' }"
          @click="selectSort('hottest')"
        >
          热门
          <view class="active-line" v-if="currentSort === 'hottest'"></view>
        </view>
      </view>
    </view>

    <!-- 网盘资源入口部件 -->
    <view class="pan-entry-card" @click="goToPanResources">
      <view class="pan-entry-left">
        <view class="pan-icon-box">
          <SvgIcon name="folder" size="56" fill="#009688" />
        </view>
        <view class="pan-text-content">
          <text class="pan-title">全网盘资源合集</text>
          <text class="pan-subtitle">考研、教资、绝版课程持续更新</text>
        </view>
      </view>
      <view class="pan-entry-right">
        <text class="enter-text">进入</text>
      </view>
    </view>

    <!-- 资料列表区域 -->
    <scroll-view 
      scroll-y 
      class="material-scroll-view" 
      @scrolltolower="loadMore"
      :show-scrollbar="false"
      :enhanced="true"
    >
      <view 
        v-for="item in materials" 
        :key="item._id" 
        class="material-card"
        @click="goToDetail(item)"
      >
        <view class="material-content">
          <view class="material-info">
            <view class="title-container">
              <text v-if="item.linkUrl" class="wechat-tag">微信</text>
              <text class="material-title">{{ item.title }}</text>
            </view>
            <text v-if="item.description" class="material-desc">{{ item.description }}</text>
            <view class="material-meta">
              <text class="material-author">{{ item.author || '研兔刷题' }}</text>
              <text class="material-view-count">{{ item.viewCount || 0 }}阅读</text>
              <text class="material-date">{{ formatDate(item.createdAt) }}</text>
            </view>
          </view>
          <image 
            v-if="item.imageUrl" 
            :src="item.imageUrl" 
            mode="aspectFill" 
            class="material-cover"
          ></image>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="loading-status" v-if="loading">
        <text>加载中...</text>
      </view>
      <view class="no-more" v-if="!hasMore && materials.length > 0">
        <text>没有更多了</text>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-if="!loading && materials.length === 0">
        <image src="/static/empty-data.png" mode="aspectFit" class="empty-img"></image>
        <text class="empty-text">暂无相关资料</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance, onUnmounted, computed } from 'vue';

const { proxy } = getCurrentInstance();
const $api = proxy?.$api;
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue';

const isDarkMode = ref(false);
const currentCategory = ref('全部');
const currentSort = ref('newest');
const searchKeyword = ref('');
const materials = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const page = ref(1);

const categories = ['全部', '资料', '备考经验', '政策动态', '考试技巧'];

// 是否显示返回按钮
const showBackButton = computed(() => {
  const pages = getCurrentPages();
  return pages.length > 1;
});

// 获取状态栏高度
const getSystemInfo = () => {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 0;
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 3600000) {
    return Math.floor(diff / 60000) + '分钟前';
  } else if (diff < 86400000) {
    return Math.floor(diff / 3600000) + '小时前';
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
};

// 加载资料列表
const fetchMaterials = async (reset = false) => {
  if (loading.value || (!hasMore.value && !reset)) return;
  
  if (reset) {
    page.value = 1;
    materials.value = [];
    hasMore.value = true;
  }
  
  loading.value = true;
  try {
    const params = {
      sort: currentSort.value,
      keyword: searchKeyword.value,
      page: page.value,
      size: 10
    };
    // 只有当不是"全部"时才添加 category 参数
    if (currentCategory.value !== '全部') {
      params.category = currentCategory.value;
    }
    const res = await $api.publicApi.getNotices(params);
    
    if (res.code === 0) {
      let list = res.data || [];
      // 过滤掉系统通知类
      list = list.filter(item => item.category !== '系统通知');
      // 过滤掉纯跳转链接类型（只保留文章内容和微信链接）
      list = list.filter(item => item.noticeType === 'article' || item.noticeType === 'wechat');
      
      if (list.length < 10) {
        hasMore.value = false;
      }
      materials.value = [...materials.value, ...list];
      page.value++;
    }
  } catch (error) {
    console.error('Fetch materials error:', error);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  fetchMaterials();
};

const goToPanResources = () => {
  uni.navigateTo({
    url: '/pages/pan-resources/pan-resources'
  });
};

const selectCategory = (cat) => {
  currentCategory.value = cat;
  fetchMaterials(true);
};

const selectSort = (sort) => {
  currentSort.value = sort;
  fetchMaterials(true);
};

const goBack = () => {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({
      url: '/pages/index/index'
    });
  }
};

const onSearch = () => {
  fetchMaterials(true);
};

let searchTimer = null;
const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    fetchMaterials(true);
  }, 500);
};

const clearSearch = () => {
  searchKeyword.value = '';
  fetchMaterials(true);
};

const goToDetail = (item) => {
  // 如果是跳转链接或微信链接类型，直接跳转
  if ((item.noticeType === 'link' || item.noticeType === 'wechat') && item.linkUrl) {
    // #ifdef H5
    window.location.href = item.linkUrl;
    // #endif
    
    // #ifndef H5
    uni.navigateTo({
      url: `/pages/webview/webview?url=${encodeURIComponent(item.linkUrl || '')}&title=${encodeURIComponent(item.title || '')}`
    });
    // #endif
    return;
  }
  uni.navigateTo({
    url: `/pages/article/article-detail?id=${item._id}`
  });
};

onMounted(() => {
  fetchMaterials();
  
  // 主题模式
  const currentTheme = uni.getStorageSync('themeMode') || 'light';
  isDarkMode.value = currentTheme === 'dark';
  uni.$on('themeChange', (darkMode) => {
    isDarkMode.value = darkMode;
  });
});

onUnmounted(() => {
  uni.$off('themeChange');
});
</script>

<style scoped>
.container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  overflow: hidden;
}

::-webkit-scrollbar { display: none; }
.dark-mode { background-color: #000000; }

/* 分类 Tab - 极简下划线风格 */
.category-wrapper {
  background-color: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
  flex-shrink: 0;
}
.dark-mode .category-wrapper { 
  background-color: #111; 
  border-bottom-color: #222;
}

.category-list {
  display: flex;
  padding: 0 24rpx;
  height: 76rpx; /* 压缩高度 */
  align-items: center;
}

.category-item {
  margin-right: 32rpx;
  font-size: 28rpx;
  color: #666666;
  height: 76rpx;
  line-height: 76rpx;
  position: relative;
  font-weight: 500;
}
.dark-mode .category-item { color: #888; }

.category-item:last-child { margin-right: 0; }

.category-item.active {
  color: #000000;
  font-weight: 600;
  font-size: 30rpx;
}
.dark-mode .category-item.active { color: #fff; }

.category-item.active::after {
  content: '';
  position: absolute;
  bottom: 12rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background-color: #07c160; /* 微信绿 */
  border-radius: 2rpx;
}

/* 工具栏区域 - 合并搜索和排序，更紧凑 */
.toolbar-section {
  background-color: #ffffff;
  padding: 5px 24rpx 5px;
  border-bottom: 1rpx solid #f5f5f5;
  flex-shrink: 0;
}
.dark-mode .toolbar-section { 
  background-color: #111; 
  border-bottom-color: #222;
}

/* 网盘资源入口卡片 */
.pan-entry-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #e0f2f1 0%, #f1f8e9 100%);
  padding: 14rpx 20rpx;
  border-radius: 12rpx;
  margin-bottom: 10rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 150, 136, 0.08);
  border: 1px solid rgba(0, 150, 136, 0.1);
}

.dark-mode .pan-entry-card {
  background: linear-gradient(135deg, #004d40 0%, #1b5e20 100%);
  border-color: rgba(255, 255, 255, 0.05);
}

.pan-entry-left {
  display: flex;
  align-items: center;
}

.pan-icon-box {
  width: 64rpx;
  height: 64rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.04);
  background: transparent;
}

.dark-mode .pan-icon-box {
  background: transparent;
}

.pan-icon-svg {
  color: #009688;
}

.pan-text-content {
  display: flex;
  flex-direction: column;
}

.pan-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #00796b;
  margin-bottom: 3rpx;
}

.dark-mode .pan-title {
  color: #e0f2f1;
}

.pan-subtitle {
  font-size: 20rpx;
  color: #558b2f;
}

.dark-mode .pan-subtitle {
  color: #a5d6a7;
}

.pan-entry-right {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.6);
  padding: 6rpx 16rpx;
  border-radius: 24rpx;
}

.dark-mode .pan-entry-right {
  background: rgba(0, 0, 0, 0.25);
}

.enter-text {
  font-size: 22rpx;
  color: #009688;
  font-weight: 500;
}

.dark-mode .enter-text {
  color: #4db6ac;
}

/* 搜索框 - 扁平紧凑 */
.search-box {
  display: flex;
  align-items: center;
  background-color: #f2f2f2;
  height: 32px;
  border-radius: 16rpx;
  padding: 5px 12px;
  margin-bottom: 10rpx;
  box-sizing: border-box;
}
.dark-mode .search-box { background-color: #222; }

.search-icon { margin-right: 8rpx; }

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #333;
  height: 22px;
  line-height: 22px;
  background: #f2f2f2;
  border: none;
  outline: none;
}
.dark-mode .search-input { color: #ddd; }

.search-input input {
  height: 22px;
  line-height: 24px;
}

.clear-icon {
  font-size: 28rpx;
  color: #999;
  padding: 8rpx;
  margin-right: -8rpx;
}

/* 排序 - 简单文字 */
.sort-bar {
  display: flex;
  gap: 20rpx;
  height: 40rpx;
  align-items: center;
}

.sort-btn {
  font-size: 26rpx;
  color: #999999;
  font-weight: 500;
  position: relative;
}

.sort-btn.active {
  color: #07c160;
  font-weight: 600;
}

.sort-btn.active::after {
  content: '';
  position: absolute;
  bottom: -4rpx;
  left: 0;
  right: 0;
  height: 2rpx;
  background-color: #07c160;
}

/* 列表 - 微信文章列表风格 */
.material-scroll-view {
  flex: 1;
  height: 0; /* 必须设置 height: 0 或一个确定的高度，flex: 1 才能在 scroll-view 中生效 */
  background-color: #ffffff;
}
.dark-mode .material-scroll-view { background-color: #000; }

.material-card {
  padding: 24rpx; /* 适中内边距 */
  background-color: #ffffff;
  border-bottom: 1rpx solid #f0f0f0; /* 细线分隔 */
}
.dark-mode .material-card { 
  background-color: #000; 
  border-bottom-color: #1a1a1a;
}

.material-card:last-child { border-bottom: none; }

.material-card:active { background-color: #f9f9f9; }
.dark-mode .material-card:active { background-color: #111; }

.material-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20rpx;
}

.material-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 120rpx; /* 与图片等高 */
}

.title-container {
  display: flex;
  align-items: flex-start;
}

.wechat-tag {
  font-size: 18rpx;
  color: #fff;
  background-color: #07c160;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
  margin-right: 10rpx;
  margin-top: 6rpx;
  flex-shrink: 0;
}

.material-title {
  font-size: 30rpx; /* 正文字号 */
  line-height: 1.5;
  color: #1a1a1a;
  font-weight: 500;
  display: -webkit-box;
  display: box;
  -webkit-box-orient: vertical;
  box-orient: vertical;
  -webkit-line-clamp: 2; /* 最多两行 */
  line-clamp: 2;
  overflow: hidden;
}
.dark-mode .material-title { color: #e6e6e6; }

.material-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
  font-size: 22rpx; /* 小字号 */
  color: #b3b3b3; /* 浅灰 */
  height: 30rpx;
  overflow: hidden;
}
.dark-mode .material-meta { color: #666; }

.material-author {
  color: #576b95; /* 链接蓝 */
  font-weight: 500;
}

.material-cover {
  width: 120rpx; /* 小图 */
  height: 120rpx;
  border-radius: 6rpx;
  background-color: #f0f0f0;
  flex-shrink: 0;
  object-fit: cover;
}
.dark-mode .material-cover { background-color: #222; }

/* 状态提示 */
.loading-status, .no-more {
  text-align: center;
  padding: 32rpx 0;
  font-size: 24rpx;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 180rpx;
}

.empty-img {
  width: 180rpx;
  height: 180rpx;
  opacity: 0.5;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 26rpx;
  color: #999;
}
</style>