<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">〈</text>
        </view>
        <view class="nav-title">文章管理</view>
        <view class="nav-right">
          <text class="draft-link" @click="toggleDrafts">{{ showDrafts ? '查看全部' : '草稿箱' }}</text>
          <view class="add-btn" @click="goToAdd">
            <text class="add-icon">+</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 搜索和筛选工具栏 (参考 exam.vue 风格) -->
    <view class="toolbar-section" :style="{ marginTop: (statusBarHeight + 44) + 'px' }">
      <view class="search-bar-container">
        <view class="search-box">
          <icon type="search" size="14" color="#999" />
          <input 
            class="search-input" 
            type="text" 
            placeholder="搜索文章标题..." 
            v-model="searchKeyword"
            @input="onSearch"
          />
          <text v-if="searchKeyword" class="clear-icon" @click="clearSearch">×</text>
        </view>
      </view>
    </view>

    <!-- 分类标签 (参考 exam.vue 风格) -->
    <view class="category-wrapper">
      <scroll-view class="category-scroll" scroll-x :show-scrollbar="false" :enhanced="true">
        <view class="category-list">
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

    <!-- 文章列表 -->
    <scroll-view class="article-list" scroll-y @scrolltolower="loadMore">
      <view v-if="loading && articles.length === 0" class="loading-state">
        <text>加载中...</text>
      </view>
      
      <view v-else-if="articles.length === 0" class="empty-state">
        <image src="/static/images/empty.png" mode="aspectFit" class="empty-img" />
        <text>暂无文章</text>
        <button class="empty-btn" @click="goToAdd">去发布第一篇</button>
      </view>

      <view v-else class="list-content">
        <view 
          v-for="item in articles" 
          :key="item._id" 
          class="article-card"
          @click="goToEdit(item)"
        >
          <view class="card-body">
            <view class="article-info">
              <view class="title-wrapper">
                <text v-if="item.linkUrl" class="wechat-badge">微信</text>
                <text class="article-title">{{ item.title }}</text>
              </view>
              <view class="article-meta">
                <text class="category-tag">{{ item.category }}</text>
                <text class="time-text">{{ formatDate(item.createdAt) }}</text>
                <text class="author-text">{{ item.author || '管理员' }}</text>
              </view>
            </view>
            <view v-if="item.imageUrl" class="article-cover">
              <image :src="item.imageUrl" mode="aspectFill" class="cover-img" />
            </view>
          </view>
          
          <view class="card-footer">
            <view class="status-tags">
              <text v-if="item.isActive === 1" class="status-tag published">已发布</text>
              <text v-else class="status-tag draft">草稿</text>
              <text class="view-count">👁 {{ item.viewCount || 0 }}</text>
            </view>
            <view class="actions">
              <view class="action-item delete" @click.stop="deleteArticle(item)">
                <text class="action-icon">🗑</text>
                <text>删除</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <view v-if="loading && articles.length > 0" class="load-more">
        <text>加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue';

const { proxy } = getCurrentInstance();
const adminApi = proxy.$api.adminApi;

const statusBarHeight = ref(0);
const isDarkMode = ref(false);
const searchKeyword = ref('');
const showDrafts = ref(false);
const categories = ['全部', '资料', '备考经验', '政策动态', '考试技巧', '系统通知'];
const selectedCategory = ref('全部');

const articles = ref([]);
const loading = ref(false);
const page = ref(1);
const hasMore = ref(true);

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync();
  statusBarHeight.value = sysInfo.statusBarHeight || 0;
  fetchArticles();
});

const goBack = () => {
  uni.navigateBack();
};

const goToAdd = () => {
  uni.navigateTo({
    url: '/pages/admin/article/article-edit'
  });
};

const goToEdit = (item) => {
  uni.navigateTo({
    url: `/pages/admin/article/article-edit?id=${item._id}`
  });
};

const toggleDrafts = () => {
  showDrafts.value = !showDrafts.value;
  refreshList();
};

const selectCategory = (cat) => {
  console.log('Category selected:', cat);
  selectedCategory.value = cat;
  refreshList();
};

const onSearch = () => {
  refreshList();
};

const clearSearch = () => {
  searchKeyword.value = '';
  refreshList();
};

const refreshList = () => {
  page.value = 1;
  articles.value = [];
  hasMore.value = true;
  fetchArticles();
};

const fetchArticles = async () => {
  if (loading.value || !hasMore.value) return;
  
  loading.value = true;
  try {
      const params = {
        page: page.value,
        size: 10,
        keyword: searchKeyword.value,
        status: showDrafts.value ? 0 : 1,
        noticeType: 'article'
      };
      
      if (selectedCategory.value !== '全部') {
        params.category = selectedCategory.value;
      }
      
      console.log('Fetching articles with params:', params);
      const res = await adminApi.getNotices(params);
      
      if (res.code === 0) {
        // 参考 exam.vue 的处理方式，兼容不同格式的返回数据
        let newArticles = [];
        if (res.data && res.data.list) {
          newArticles = res.data.list;
        } else if (Array.isArray(res.data)) {
          newArticles = res.data;
        }
        
        console.log('Fetched articles:', newArticles.length);
        
        if (newArticles.length < 10) {
          hasMore.value = false;
        }
        articles.value = [...articles.value, ...newArticles];
        page.value++;
      }
    } catch (error) {
    console.error('Fetch articles error:', error);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  fetchArticles();
};

const deleteArticle = (item) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这篇文章吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const deleteRes = await adminApi.deleteNotice(item._id);
          if (deleteRes.code === 0) {
            uni.showToast({ title: '删除成功' });
            refreshList();
          }
        } catch (error) {
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
</script>

<style scoped>
.container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f6fa;
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background-color: #fff;
  z-index: 100;
  box-sizing: content-box;
  border-bottom: 1rpx solid #eee;
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
}

.back-btn {
  padding: 10px 5px;
}

.back-icon {
  font-size: 20px;
  color: #666;
}

.nav-title {
  font-size: 18px;
  font-weight: bold;
  color: #7b4397;
}

.nav-right {
  display: flex;
  align-items: center;
}

.draft-link {
  font-size: 14px;
  color: #7b4397;
  margin-right: 15px;
}

.add-btn {
  padding: 5px;
}

.add-icon {
  font-size: 24px;
  color: #7b4397;
  font-weight: bold;
}

.toolbar-section {
  background-color: #ffffff;
  padding: 12rpx 24rpx 12rpx;
  flex-shrink: 0;
}

.search-bar-container {
  margin-bottom: 12rpx;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f5f6fa;
  height: 72rpx;
  border-radius: 36rpx;
  padding: 0 24rpx;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #333;
  height: 100%;
  margin-left: 10rpx;
}

.clear-icon {
  font-size: 28rpx;
  color: #999;
  padding: 8rpx;
  margin-right: -8rpx;
}

/* 分类 Tab - 参考 exam.vue 风格 */
.category-wrapper {
  background-color: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
  flex-shrink: 0;
}

.category-scroll {
  width: 100%;
  white-space: nowrap;
}

.category-list {
  display: inline-flex;
  padding: 0 24rpx;
  height: 80rpx;
  align-items: center;
}

.category-item {
  display: inline-block;
  margin-right: 40rpx;
  font-size: 28rpx;
  color: #666666;
  height: 80rpx;
  line-height: 80rpx;
  position: relative;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  pointer-events: auto;
}

.category-item:last-child { margin-right: 0; }

.category-item.active {
  color: #7b4397;
  font-weight: 600;
  font-size: 30rpx;
}

.category-item.active::after {
  content: '';
  position: absolute;
  bottom: 12rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background-color: #7b4397;
  border-radius: 2rpx;
}

.article-list {
  flex: 1;
  height: 0;
  background-color: #f5f6fa;
  overflow: hidden;
}

.list-content {
  padding: 10px 15px;
}

.article-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 10px;
  margin-top: 0;
  margin-bottom: 5px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.card-body {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.article-info {
  flex: 1;
  margin-right: 10px;
}

.title-wrapper {
  display: flex;
  align-items: flex-start;
  margin-bottom: 5px;
}

.wechat-badge {
  font-size: 10px;
  color: #fff;
  background-color: #07c160;
  padding: 1px 4px;
  border-radius: 4px;
  margin-right: 6px;
  margin-top: 2px;
  flex-shrink: 0;
}

.article-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.category-tag {
  font-size: 10px;
  color: #7b4397;
  background-color: rgba(123, 67, 151, 0.1);
  padding: 1px 5px;
  border-radius: 4px;
  margin-right: 8px;
}

.time-text, .author-text {
  font-size: 11px;
  color: #999;
  margin-right: 8px;
}

.article-cover {
  width: 70px;
  height: 52px;
  border-radius: 4px;
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1rpx solid #f0f0f0;
}

.status-tags {
  display: flex;
  align-items: center;
}

.status-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  margin-right: 8px;
}

.status-tag.published {
  background-color: #e3f9e5;
  color: #1db954;
}

.status-tag.draft {
  background-color: #fff3e0;
  color: #ff9800;
}

.view-count {
  font-size: 12px;
  color: #999;
}

.actions {
  display: flex;
}

.action-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  padding: 5px 10px;
  border-radius: 4px;
}

.action-item.delete {
  color: #f44336;
}

.action-icon {
  margin-right: 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100px;
}

.empty-img {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
}

.empty-btn {
  margin-top: 20px;
  background-color: #7b4397;
  color: #fff;
  font-size: 14px;
  border-radius: 20px;
  padding: 0 30px;
}

.loading-state, .load-more {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}
</style>
