<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 顶部导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <view class="nav-title">文章详情</view>
        <view class="nav-right"></view>
      </view>
    </view>
    
    <!-- 文章内容 -->
    <scroll-view class="article-content" scroll-y :style="{ height: 'calc(100vh - ' + (statusBarHeight + 44) + 'px)', marginTop: (statusBarHeight + 44) + 'px' }">
      <view v-if="article" class="article-detail">
        <!-- 文章标题 -->
        <view class="article-title">{{ article.title }}</view>
        
        <!-- 文章元信息 -->
        <view class="article-meta">
          <text class="article-author">{{ article.author || '研兔刷题' }}</text>
          <text class="article-date">{{ formatDate(article.createdAt || article.createTime) }}</text>
          <text class="article-view-count">{{ article.viewCount || 0 }}次阅读</text>
          <text class="article-category">{{ article.category }}</text>
        </view>
        
        
        <!-- 文章摘要 -->
        <view v-if="article.description" class="article-description">
          <view class="description-tag">摘要</view>
          <text>{{ article.description }}</text>
        </view>
        
        <!-- 文章正文 -->
        <view class="article-body">
          <rich-text :nodes="article.content"></rich-text>
        </view>
        
        <!-- 文章链接 -->
        <view v-if="article.linkUrl" class="article-link-section">
          <navigator :url="article.linkUrl" class="article-link-btn">
            <text class="link-text">查看原文链接</text>
            <text class="link-arrow">→</text>
          </navigator>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view v-else class="loading-state">
        <view class="loading-text">加载中...</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed, getCurrentInstance } from 'vue';

const { proxy } = getCurrentInstance();

// 状态栏高度
const statusBarHeight = ref(0);

// 主题状态
const isDarkMode = ref(false);

// 文章数据
const article = ref(null);

// 获取当前页面参数
const getCurrentPageParams = () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return currentPage.options || {};
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 初始化文章数据
const initArticle = async () => {
  const params = getCurrentPageParams();
  const articleId = params.id;
  
  if (articleId) {
    try {
      uni.showLoading({ title: '加载中...' });
      const res = await proxy.$api.publicApi.getNoticeById(articleId);
      uni.hideLoading();
      
      if (res.code === 0 && res.data) {
        article.value = res.data;
        
        // 如果是跳转链接或微信链接类型，直接跳转
        if ((article.value.noticeType === 'link' || article.value.noticeType === 'wechat') && article.value.linkUrl) {
          uni.hideLoading();
          uni.navigateTo({
            url: `/pages/webview/webview?url=${encodeURIComponent(article.value.linkUrl)}`
          });
          return;
        }
        
        // 递增阅读数
        proxy.$api.publicApi.incrementNoticeViewCount(articleId).catch(err => {
          console.error('递增阅读数失败:', err);
        });
      } else {
        uni.showToast({
          title: '文章不存在',
          icon: 'none'
        });
        setTimeout(() => goBack(), 1500);
      }
    } catch (error) {
      uni.hideLoading();
      console.error('加载文章失败:', error);
      uni.showToast({
        title: '加载失败',
        icon: 'none'
      });
      setTimeout(() => goBack(), 1500);
    }
  } else {
    uni.showToast({
      title: '文章ID无效',
      icon: 'none'
    });
    setTimeout(() => goBack(), 1500);
  }
};

// 初始化主题状态
onMounted(() => {
  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync();
  statusBarHeight.value = systemInfo.statusBarHeight || 0;
  
  // 从本地存储获取当前主题模式，默认白天模式
  const currentTheme = uni.getStorageSync('themeMode') || 'light';
  isDarkMode.value = currentTheme === 'dark';
  
  // 监听主题变化事件
  uni.$on('themeChange', (darkMode) => {
    isDarkMode.value = darkMode;
  });
  
  // 初始化文章数据
  initArticle();
});
</script>

<style scoped>
.container {
  background-color: #ffffff;
  min-height: 100vh;
  transition: all 0.3s ease;
}

/* 顶部导航栏 */
.nav-bar {
  background-color: #ffffff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transition: all 0.3s ease;
}

.nav-content {
  height: 44px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30rpx;
  border-bottom: 1rpx solid #eee;
}

.dark-mode .nav-content {
  border-bottom-color: #333;
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.back-icon {
  font-size: 40rpx;
  color: #333333;
}

.nav-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.nav-right {
  width: 60rpx;
}

/* 文章内容 */
.article-content {
  box-sizing: border-box;
}

.article-detail {
  padding: 40rpx 30rpx;
}

.article-title {
  font-size: 44rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 24rpx;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 40rpx;
  flex-wrap: wrap;
}

.article-author {
  font-size: 28rpx;
  color: #576b95;
  font-weight: 500;
}

.article-date {
  font-size: 28rpx;
  color: rgba(0, 0, 0, 0.3);
}

.article-view-count {
  font-size: 28rpx;
  color: rgba(0, 0, 0, 0.3);
}

.article-category {
  font-size: 24rpx;
  color: #7b4397;
  background: rgba(123, 67, 151, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.article-cover {
  width: 100%;
  height: 400rpx;
  border-radius: 8rpx;
  margin-bottom: 40rpx;
  background-color: #f5f5f5;
}

.article-description {
  background-color: #f8f8f8;
  padding: 24rpx;
  border-radius: 8rpx;
  margin-bottom: 40rpx;
  position: relative;
  border-left: 8rpx solid #7b4397;
}

.description-tag {
  font-size: 20rpx;
  color: #7b4397;
  font-weight: bold;
  margin-bottom: 8rpx;
  text-transform: uppercase;
  letter-spacing: 2rpx;
}

.article-description text {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
}

.article-body {
  font-size: 32rpx;
  color: #333333;
  line-height: 1.8;
}

/* 调整富文本中的图片 */
:deep(img) {
  max-width: 100% !important;
  height: auto !important;
  display: block;
  margin: 20rpx 0;
  border-radius: 8rpx;
}

:deep(p) {
  margin-bottom: 20rpx;
}

/* 文章链接部分 */
.article-link-section {
  margin-top: 60rpx;
  padding-top: 40rpx;
  border-top: 1rpx solid #eee;
}

.article-link-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  width: 100%;
  height: 88rpx;
  background-color: #7b4397;
  color: #ffffff;
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: bold;
}

.article-link-btn:active {
  opacity: 0.9;
  transform: scale(0.99);
}

/* 加载状态 */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #999999;
}

/* 夜间模式适配 */
.dark-mode {
  background-color: #1a1a1a;
}

.dark-mode .nav-bar {
  background-color: #2d2d2d;
}

.dark-mode .back-icon,
.dark-mode .nav-title,
.dark-mode .article-title,
.dark-mode .article-body {
  color: #ffffff;
}

.dark-mode .article-author {
  color: #7d90b9;
}

.dark-mode .article-date {
  color: rgba(255, 255, 255, 0.3);
}

.dark-mode .article-description {
  background-color: #252525;
  border-left-color: #7b4397;
}

.dark-mode .article-description text {
  color: #aaaaaa;
}

.dark-mode .article-link-section {
  border-top-color: #333;
}

.dark-mode .article-category {
  background: rgba(123, 67, 151, 0.2);
}

.dark-mode .loading-state {
  background-color: #2d2d2d;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
}

.dark-mode .loading-text {
  color: #cccccc;
}
</style>