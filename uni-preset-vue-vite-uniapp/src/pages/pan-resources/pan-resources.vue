<template>
  <view class="container">
    <!-- 加载中状态 -->
    <view v-if="isCheckingLogin" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 未登录提示 - 仅在没有资源时显示 -->
    <view v-else-if="!isLoggedIn && resources.length === 0" class="unlogin-container">
      <view class="unlogin-card">
        <view class="unlogin-icon">
          <text class="icon-text">🔒</text>
        </view>
        <text class="unlogin-title">网盘资源</text>
        <text class="unlogin-desc">登录后可查看全网盘资源合集\n考研、教资、绝版课程持续更新</text>
        <button class="login-btn" @click="goToLogin">立即登录</button>
      </view>
    </view>

    <!-- 资源内容区域 - 无论是否登录都显示 -->
    <template v-else>
      <!-- 登录提示条 - 未登录时显示 -->
      <view v-if="!isLoggedIn" class="login-tip-bar" @click="goToLogin">
        <text class="login-tip-text">🔒 登录后可查看更多网盘资源</text>
        <text class="login-tip-btn">去登录 ></text>
      </view>
      
      <!-- 搜索栏 -->
      <view class="toolbar-section">
        <view class="search-bar-container">
          <view class="search-box">
            <icon type="search" size="14" color="#999" />
            <input 
              class="search-input" 
              type="text" 
              placeholder="搜索资料名称..." 
              v-model="searchKeyword"
              @input="onSearch"
            />
            <text v-if="searchKeyword" class="clear-icon" @click="clearSearch">×</text>
          </view>
        </view>
      </view>

      <!-- 分类标签 -->
      <view v-if="categories.length > 0" class="category-wrapper">
        <scroll-view class="category-scroll" scroll-x :show-scrollbar="false">
          <view class="category-list">
            <view 
              class="category-item" 
              :class="{ active: selectedCategory === '' }"
              @click="selectCategory('')"
            >
              全部资料 ({{ totalCount }})
            </view>
            <view 
              v-for="cat in categories" 
              :key="cat"
              class="category-item"
              :class="{ active: selectedCategory === cat }"
              @click="selectCategory(cat)"
            >
              {{ cat }}
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 资源列表 -->
      <scroll-view class="resource-list" scroll-y @scrolltolower="loadMore">
        <view v-if="loading && resources.length === 0" class="loading-state">
          <text>加载中...</text>
        </view>
        
        <view v-else-if="resources.length === 0" class="empty-state">
        <text class="empty-text">暂无相关资源</text>
        <text class="empty-hint">试试切换其他分类或搜索关键词</text>
      </view>

      <view v-else class="list-content">
        <view
          v-for="item in resources"
          :key="item.ResourceID"
          class="resource-card"
          :class="{
            'only-baidu': item.BaiduUrl && !item.QuarkUrl,
            'only-quark': !item.BaiduUrl && item.QuarkUrl,
            'both-available': item.BaiduUrl && item.QuarkUrl,
            'is-top': item.IsTop
          }"
        >
          <view class="card-header">
            <view class="file-icon">
              <image class="file-image" src="/static/logo.png" mode="aspectFit" />
            </view>
            <view class="resource-info">
              <view class="title-row">
                <text v-if="item.IsTop" class="top-tag">置顶</text>
                <text v-if="item.Source === 'article'" class="article-tag">文章</text>
                <text class="resource-title">{{ item.Title }}</text>
                <text v-if="item.IsNew" class="new-tag">NEW</text>
              </view>
            </view>
          </view>
          
          <view class="card-actions">
            <!-- 所有资源都显示网盘按钮 -->
            <view 
              class="action-btn baidu" 
              :class="{ disabled: !item.BaiduUrl }"
              @click="item.BaiduUrl && openUrl(item.BaiduUrl, '百度网盘')"
            >
              <text>百度网盘</text>
            </view>
            <view 
              class="action-btn quark" 
              :class="{ disabled: !item.QuarkUrl }"
              @click="item.QuarkUrl && openUrl(item.QuarkUrl, '夸克网盘')"
            >
              <text>夸克网盘</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
    </template>
  </view>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue';

const instance = getCurrentInstance();
const api = instance.appContext.config.globalProperties.$api;

const searchKeyword = ref('');
const selectedCategory = ref('');
const categories = ref([]);
const resources = ref([]);
const totalCount = ref(0);
const loading = ref(false);

// 登录状态
const isLoggedIn = ref(false);
const isCheckingLogin = ref(true);

// 检查登录状态
const checkLoginStatus = () => {
  const token = uni.getStorageSync('token');
  isLoggedIn.value = !!token;
  isCheckingLogin.value = false;
  return isLoggedIn.value;
};

// 检查登录并提示
const checkLoginAndAlert = () => {
  if (!isLoggedIn.value) {
    uni.showModal({
      title: '提示',
      content: '请先登录后再查看网盘资源',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/login/login'
          });
        }
      }
    });
    return false;
  }
  return true;
};

onMounted(() => {
  // 检查登录状态
  checkLoginStatus();

  // 无论是否登录都加载分类和资源
  fetchCategories();
  fetchResources();
});

const fetchCategories = async () => {
  try {
    // 同时从网盘资源表和文章资源获取分类
    const [panCategoriesRes, noticesRes] = await Promise.all([
      api.publicApi.getPanCategories().catch(() => ({ code: -1, data: [] })),
      api.publicApi.getNotices({
        sort: 'newest',
        page: 1,
        size: 100
      }).catch(() => ({ code: -1, data: [] }))
    ]);
    
    const categorySet = new Set();
    
    // 从网盘资源表获取分类
    if (panCategoriesRes.code === 0 && panCategoriesRes.data) {
      panCategoriesRes.data.forEach(cat => categorySet.add(cat));
    }
    
    // 从文章资源获取分类
    if (noticesRes.code === 0 && noticesRes.data) {
      noticesRes.data
        .filter(item => item.noticeType === 'pan_resource' && item.category)
        .forEach(item => categorySet.add(item.category));
    }
    
    categories.value = Array.from(categorySet);
  } catch (err) {
    console.error('获取分类失败:', err);
  }
};

const fetchResources = async () => {
  loading.value = true;
  try {
    // 根据登录状态决定是否获取网盘资源表数据
    const promises = [];
    
    // 1. 登录后才获取网盘资源表数据
    if (isLoggedIn.value) {
      promises.push(
        api.publicApi.getPanResources({
          category: selectedCategory.value,
          search: searchKeyword.value
        }).catch(err => {
          console.error('获取网盘资源表失败:', err);
          return { code: -1, data: [] };
        })
      );
    }
    
    // 2. 无论是否登录都获取文章形式的网盘资源
    promises.push(
      api.publicApi.getNotices({
        sort: 'newest',
        keyword: searchKeyword.value,
        page: 1,
        size: 100
      }).catch(err => {
        console.error('获取文章资源失败:', err);
        return { code: -1, data: [] };
      })
    );
    
    const results = await Promise.all(promises);
    const panRes = isLoggedIn.value ? results[0] : { code: -1, data: [] };
    const noticesRes = isLoggedIn.value ? results[1] : results[0];

    let allResources = [];

    // 处理网盘资源表数据（仅登录用户）
    if (panRes.code === 0 && panRes.data) {
      allResources = [...panRes.data];
    }

    // 处理文章形式的网盘资源
    if (noticesRes.code === 0 && noticesRes.data) {
      const panArticles = noticesRes.data
        .filter(item => item.noticeType === 'pan_resource')
        .map(item => {
          const url = item.linkUrl || '';
          // 判断链接类型
          const isQuark = url.includes('quark.cn') || url.includes('quark');
          const isBaidu = url.includes('baidu.com') || url.includes('pan.baidu');
          
          return {
            ResourceID: `article_${item._id}`,
            Title: item.title,
            BaiduUrl: isBaidu ? url : '',
            QuarkUrl: isQuark ? url : '',
            IsTop: item.isTop || 0,
            IsNew: false,
            CategoryName: item.category || '网盘资源',
            Source: 'article' // 标记来源
          };
        });
      allResources = [...allResources, ...panArticles];
    }

    // 根据分类筛选 - 只对网盘资源表数据筛选，文章形式资源始终显示
    if (selectedCategory.value) {
      allResources = allResources.filter(item => 
        item.Source === 'article' || item.CategoryName === selectedCategory.value
      );
    }

    // 排序：置顶优先，然后按时间倒序
    allResources.sort((a, b) => {
      if (a.IsTop !== b.IsTop) {
        return (b.IsTop || 0) - (a.IsTop || 0);
      }
      return 0;
    });

    resources.value = allResources;
    if (selectedCategory.value === '' && searchKeyword.value === '') {
      totalCount.value = allResources.length;
    }
  } catch (err) {
    console.error('获取资源失败:', err);
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  fetchResources();
};

const clearSearch = () => {
  searchKeyword.value = '';
  fetchResources();
};

const selectCategory = (cat) => {
  selectedCategory.value = cat;
  fetchResources();
};

const openUrl = (url, type) => {
  uni.setClipboardData({
    data: url,
    success: () => {
      uni.showToast({
        title: '链接已复制',
        icon: 'success'
      });
      
      uni.showModal({
        title: '复制成功',
        content: `链接已复制到剪贴板，请前往${type}保存。`,
        showCancel: false,
        confirmText: '我知道了'
      });
    }
  });
};

// 跳转到登录页
const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/login/login'
  });
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
}

/* 加载中状态 */
.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #e5e7eb;
  border-top-color: #009688;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #6b7280;
}

/* 未登录状态样式 */
.unlogin-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.unlogin-card {
  background: white;
  border-radius: 30rpx;
  padding: 80rpx 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 600rpx;
}

.unlogin-icon {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #e0f2f1 0%, #f1f8e9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
}

.icon-text {
  font-size: 70rpx;
}

.unlogin-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 20rpx;
}

.unlogin-desc {
  font-size: 26rpx;
  color: #6b7280;
  text-align: center;
  margin-bottom: 50rpx;
  line-height: 1.8;
}

.login-btn {
  width: 80%;
  height: 88rpx;
  background: linear-gradient(135deg, #009688 0%, #00796b 100%);
  color: white;
  font-size: 30rpx;
  font-weight: 600;
  border-radius: 44rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn:active {
  opacity: 0.9;
}

/* 登录提示条 */
.login-tip-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  padding: 12px 15px;
  border-bottom: 1px solid #ffe082;
}

.login-tip-text {
  font-size: 14px;
  color: #f57c00;
}

.login-tip-btn {
  font-size: 13px;
  color: #e65100;
  font-weight: 500;
}

.toolbar-section {
  padding: 5px 15px;
  background: #fff;
}

.search-bar-container {
  background: #f2f2f2;
  border-radius: 16px;
  padding: 6px 12px;
  height: 36px;
  box-sizing: border-box;
}

.search-box {
  display: flex;
  align-items: center;
  height: 100%;
}

.search-input {
  flex: 1;
  margin-left: 8px;
  font-size: 13px;
  background: #f2f2f2;
  border: none;
  outline: none;
  height: 24px;
  line-height: 24px;
}

.search-input input {
  height: 24px;
  line-height: 24px;
}

.category-wrapper {
  background: #fff;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.category-list {
  display: flex;
  padding: 0 15px;
  white-space: nowrap;
}

.category-item {
  padding: 4px 12px;
  margin-right: 8px;
  border-radius: 12px;
  background: #f5f5f5;
  font-size: 12px;
  color: #666;
  border: 1px solid transparent;
}

.category-item.active {
  background: #e0f2f1;
  color: #009688;
  border-color: #009688;
  font-weight: 500;
}

.resource-list {
  flex: 1;
  padding: 5px;
  box-sizing: border-box;
}

.list-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-bottom: 20px;
}

.resource-card {
  background: #fff;
  border-radius: 8px;
  padding: 8px 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  border: 1px solid #e0e0e0;
}

.resource-card.only-baidu {
  border-color: #e3f2fd;
}

.resource-card.only-quark {
  border-color: #fff3e0;
}

.resource-card.both-available {
  border-color: #e8f5e9;
}

.card-header {
  display: flex;
  margin-bottom: 8px;
}

.file-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.file-image {
  width: 24px;
  height: 24px;
}

.resource-info {
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  margin-bottom: 3px;
}

.resource-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.3;
}

.new-tag {
  background: #ff5252;
  color: #fff;
  font-size: 9px;
  padding: 1px 3px;
  border-radius: 3px;
  margin-left: 4px;
  font-weight: bold;
}

.top-tag {
  background: #ff6b6b;
  color: #fff;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  margin-right: 4px;
  font-weight: bold;
}

.article-tag {
  background: #4a90d9;
  color: #fff;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  margin-right: 4px;
  font-weight: bold;
}

.resource-card.is-top {
  border: 2rpx solid #ff6b6b;
  background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
}

.card-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  flex: 1;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  font-size: 12px;
  transition: all 0.2s;
}

.action-btn.baidu {
  background: #e3f2fd;
  color: #1976d2;
}

.action-btn.quark {
  background: #fff3e0;
  color: #f57c00;
}

.action-btn.baidu.disabled {
  background: #f5f5f5;
  color: #ccc;
}

.action-btn.quark.disabled {
  background: #f5f5f5;
  color: #ccc;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.loading-state text,
.empty-state text {
  font-size: 14px;
}

.empty-text {
  font-size: 15px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.empty-hint {
  font-size: 13px;
  color: #999;
}


</style>
