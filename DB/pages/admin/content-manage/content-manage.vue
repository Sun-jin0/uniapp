<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <view class="back-btn" @click="goBack">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="back-icon">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </view>
        <view class="nav-title">内容管理</view>
        <view class="nav-right">
          <!-- 根据当前标签显示不同的操作按钮 -->
          <block v-if="currentTab === 'article'">
            <text class="draft-link" @click="toggleDrafts">{{ showDrafts ? '查看全部' : '草稿箱' }}</text>
            <view class="add-btn" @click="goToAddArticle">
              <text class="add-icon">+</text>
            </view>
          </block>
          <block v-else>
            <view class="add-btn" @click="openAddNoticeModal">
              <text class="add-icon">+</text>
            </view>
          </block>
        </view>
      </view>
    </view>

    <!-- 标签切换 -->
    <view class="tabs-wrapper" :style="{ marginTop: (statusBarHeight + 44) + 'px' }">
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'notice' }" 
        @click="switchTab('notice')"
      >
        公告与广告
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'article' }" 
        @click="switchTab('article')"
      >
        文章管理
      </view>
    </view>

    <!-- 文章搜索和筛选工具栏 (仅在文章管理标签下显示) -->
    <view v-if="currentTab === 'article'" class="toolbar-section">
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
      
      <!-- 分类标签 -->
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
    </view>

    <!-- 内容区域 -->
    <scroll-view 
      scroll-y 
      class="content-scroll" 
      @scrolltolower="onScrollToLower"
      :show-scrollbar="false" 
      :enhanced="true"
    >
      <!-- 公告列表部分 -->
      <view v-if="currentTab === 'notice'" class="notice-list">
        <view class="notice-item" v-for="notice in notices" :key="notice.id" :class="{ 'ad-item': notice.type === 'ad' }">
          <view class="notice-info">
            <view class="notice-header" v-if="notice.type !== 'ad'">
              <view class="notice-title">{{ notice.title }}</view>
              <view class="notice-id">ID: {{ notice.id }}</view>
            </view>
            
            <view class="notice-meta">
              <view class="notice-type-tag" :class="notice.type === 'ad' ? 'ad-tag' : 'notice-tag'">
                {{ notice.type === 'ad' ? '广告' : (notice.noticeType === 'link' ? '链接通知' : '文章通知') }}
              </view>
              <view class="notice-date">{{ formatDate(notice.createTime || notice.createdAt) }}</view>
              <view class="notice-status">
                <text class="status-text" :class="notice.isActive ? 'published' : 'draft'">
                  {{ notice.isActive ? '已启用' : '已禁用' }}
                </text>
              </view>
            </view>
          </view>
          
          <!-- 操作按钮 -->
          <view class="notice-actions">
            <button class="action-btn-small edit" @click="editNotice(notice)">编辑</button>
            <button class="action-btn-small delete" @click="deleteNotice(notice.id)">删除</button>
            <button 
              class="action-btn-small toggle" 
              :class="{ 'active': notice.isActive }"
              @click="toggleNoticeStatus(notice.id)"
            >
              {{ notice.isActive ? '关闭' : '启用' }}
            </button>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view class="empty-state" v-if="notices.length === 0 && !loading">
          <view class="empty-text">暂无公告数据</view>
          <button class="empty-action-btn" @click="openAddNoticeModal">添加第一条公告</button>
        </view>
      </view>

      <!-- 文章列表部分 -->
      <view v-else class="article-list-container">
        <view v-if="loading && articles.length === 0" class="loading-state">
          <text>加载中...</text>
        </view>
        
        <view v-else-if="articles.length === 0" class="empty-state">
          <text>暂无文章</text>
          <button class="empty-action-btn" @click="goToAddArticle">去发布第一篇</button>
        </view>

        <view v-else class="list-content">
          <view 
            v-for="item in articles" 
            :key="item._id" 
            class="article-card"
            @click="handleArticleClick(item)"
          >
            <view class="card-body">
              <view class="article-info">
                <view class="title-wrapper">
                  <text v-if="item.noticeType === 'link'" class="link-badge">链接</text>
                  <text v-if="item.noticeType === 'wechat'" class="wechat-badge">微信</text>
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
                <view class="action-item-delete" @click.stop="deleteArticle(item)">
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
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance, computed } from 'vue';

const { proxy } = getCurrentInstance();
const adminApi = proxy.$api.adminApi;

// 状态
const statusBarHeight = ref(0);
const isDarkMode = ref(false);
const currentTab = ref('notice'); // 'notice' | 'article'
const loading = ref(false);

// 公告数据
const notices = ref([]);

// 文章数据
const articles = ref([]);
const searchKeyword = ref('');
const showDrafts = ref(false);
const categories = ['全部', '资料', '备考经验', '政策动态', '考试技巧', '系统通知'];
const selectedCategory = ref('全部');
const page = ref(1);
const hasMore = ref(true);

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync();
  statusBarHeight.value = sysInfo.statusBarHeight || 0;

  const currentTheme = uni.getStorageSync('themeMode') || 'light';
  isDarkMode.value = currentTheme === 'dark';

  uni.$on('themeChange', (darkMode) => {
    isDarkMode.value = darkMode;
  });

  // 获取路由参数，确定初始标签
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options || {};
  if (options.tab) {
    currentTab.value = options.tab;
  }

  loadData();
});

const loadData = () => {
  if (currentTab.value === 'notice') {
    fetchNotices();
  } else {
    refreshArticleList();
  }
};

const switchTab = (tab) => {
  if (currentTab.value === tab) return;
  currentTab.value = tab;
  loadData();
};

const goBack = () => {
  uni.navigateBack();
};

// --- 公告管理逻辑 ---

const fetchNotices = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await adminApi.getNotices({ type: 'notice_ad' });
    if (res.code === 0) {
      notices.value = res.data.list || res.data || [];
    }
  } catch (error) {
    console.error('Fetch notices error:', error);
  } finally {
    loading.value = false;
  }
};

const openAddNoticeModal = () => {
  uni.navigateTo({ url: '/pages/admin/article/article-edit?type=notice' });
};

const editNotice = (notice) => {
  uni.navigateTo({ url: `/pages/admin/article/article-edit?id=${notice.id}&type=${notice.type || 'notice'}` });
};

const deleteNotice = (id) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这条公告吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const deleteRes = await adminApi.deleteNotice(id);
          if (deleteRes.code === 0) {
            uni.showToast({ title: '删除成功' });
            fetchNotices();
          }
        } catch (error) {
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};

const toggleNoticeStatus = async (id) => {
  const notice = notices.value.find(n => n.id === id);
  if (!notice) return;
  
  try {
    const updateRes = await adminApi.updateNoticeStatus(id, !notice.isActive);
    if (updateRes.code === 0) {
      uni.showToast({ title: '状态更新成功' });
      fetchNotices();
    }
  } catch (error) {
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};

// --- 文章管理逻辑 ---

const refreshArticleList = () => {
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
    const res = await adminApi.getNotices(params);
    if (res.code === 0) {
      const newArticles = res.data.list || res.data || [];
      if (newArticles.length < 10) hasMore.value = false;
      articles.value = [...articles.value, ...newArticles];
      page.value++;
    }
  } catch (error) {
    console.error('Fetch articles error:', error);
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  refreshArticleList();
};

const clearSearch = () => {
  searchKeyword.value = '';
  refreshArticleList();
};

const selectCategory = (cat) => {
  selectedCategory.value = cat;
  refreshArticleList();
};

const toggleDrafts = () => {
  showDrafts.value = !showDrafts.value;
  refreshArticleList();
};

const goToAddArticle = () => {
  uni.navigateTo({ url: '/pages/admin/article/article-edit?type=article' });
};

const handleArticleClick = (item) => {
  if ((item.noticeType === 'link' || item.noticeType === 'wechat') && item.linkUrl) {
    uni.navigateTo({
      url: `/pages/webview/webview?url=${encodeURIComponent(item.linkUrl)}`
    });
  } else {
    goToEditArticle(item);
  }
};

const goToEditArticle = (item) => {
  uni.navigateTo({ url: `/pages/admin/article/article-edit?id=${item._id}&type=${item.type || 'article'}` });
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
            refreshArticleList();
          }
        } catch (error) {
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};

const onScrollToLower = () => {
  if (currentTab.value === 'article') {
    fetchArticles();
  }
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

/* 导航栏 */
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

.back-btn { padding: 10px 5px; }
.back-icon { font-size: 20px; color: #666; }
.nav-title { font-size: 18px; font-weight: bold; color: #7b4397; }
.nav-right { display: flex; align-items: center; }
.draft-link { font-size: 14px; color: #7b4397; margin-right: 15px; }
.add-btn { padding: 5px; }
.add-icon { font-size: 24px; color: #7b4397; font-weight: bold; }

/* 标签切换 */
.tabs-wrapper {
  display: flex;
  background-color: #fff;
  height: 90rpx;
  border-bottom: 1rpx solid #eee;
  flex-shrink: 0;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #7b4397;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #7b4397;
  border-radius: 2rpx;
}

/* 搜索和筛选 */
.toolbar-section {
  background-color: #fff;
  padding: 10rpx 24rpx;
  border-bottom: 1rpx solid #eee;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f2f2f2;
  height: 72rpx;
  border-radius: 36rpx;
  padding: 0 24rpx;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
  margin-left: 10rpx;
  background: #f2f2f2;
  border: none;
  outline: none;
}

.clear-icon { padding: 8rpx; color: #999; }

.category-wrapper { margin-top: 10rpx; }
.category-scroll { width: 100%; white-space: nowrap; }
.category-list { display: inline-flex; height: 60rpx; align-items: center; }
.category-item {
  margin-right: 30rpx;
  font-size: 26rpx;
  color: #666;
  padding: 4rpx 20rpx;
  border-radius: 30rpx;
  background-color: #f2f2f2;
}
.category-item.active {
  background-color: #7b4397;
  color: #fff;
}

/* 列表容器 */
.content-scroll {
  flex: 1;
  height: 0;
}

/* 公告列表样式 */
.notice-list { padding: 10rpx; }
.notice-item {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 10rpx;
  margin-bottom: 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.notice-header { display: flex; justify-content: space-between; margin-bottom: 10rpx; }
.notice-title { font-size: 30rpx; font-weight: bold; color: #333; }
.notice-id { font-size: 22rpx; color: #999; }

.notice-meta { display: flex; align-items: center; margin-bottom: 10rpx; flex-wrap: wrap; }
.notice-type-tag { font-size: 20rpx; padding: 2rpx 12rpx; border-radius: 4rpx; margin-right: 10rpx; }
.notice-tag { background-color: #e8f0fe; color: #4facfe; }
.ad-tag { background-color: #fff3e0; color: #ff9800; }
.notice-date { font-size: 22rpx; color: #999; flex: 1; }
.status-text { font-size: 22rpx; }
.status-text.published { color: #52c41a; }
.status-text.draft { color: #f5222d; }

.notice-content { font-size: 26rpx; color: #666; line-height: 1.6; margin-bottom: 10rpx; }
.ad-preview-image { width: 100%; height: 300rpx; border-radius: 8rpx; margin-bottom: 10rpx; }

.notice-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1rpx solid #eee;
  padding-top: 10rpx;
  gap: 10rpx;
}

.action-btn-small {
  font-size: 24rpx;
  padding: 10rpx 30rpx;
  border-radius: 30rpx;
  background-color: #f5f6fa;
  margin: 0;
  line-height: 1;
}
.action-btn-small.edit { color: #7b4397; border: 1rpx solid #7b4397; background: transparent; }
.action-btn-small.delete { color: #f5222d; border: 1rpx solid #f5222d; background: transparent; }
.action-btn-small.toggle { background-color: #7b4397; color: #fff; }
.action-btn-small.toggle.active { background-color: #ccc; }

/* 文章列表样式 */
.list-content { padding: 10rpx; }
.article-card {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 10rpx;
  margin-bottom: 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.card-body { display: flex; margin-bottom: 10rpx; }
.article-info { flex: 1; margin-right: 10rpx; }
.title-wrapper { display: flex; align-items: flex-start; margin-bottom: 10rpx; }
.link-badge { font-size: 20rpx; background: #1890ff; color: #fff; padding: 2rpx 8rpx; border-radius: 4rpx; margin-right: 10rpx; }
.wechat-badge { font-size: 20rpx; background: #07c160; color: #fff; padding: 2rpx 8rpx; border-radius: 4rpx; margin-right: 10rpx; }
.article-title { font-size: 30rpx; font-weight: bold; color: #333; line-height: 1.4; }
.category-tag { font-size: 22rpx; color: #7b4397; background: rgba(123, 67, 151, 0.1); padding: 2rpx 12rpx; border-radius: 4rpx; margin-right: 10rpx; }
.time-text, .author-text { font-size: 22rpx; color: #999; margin-right: 10rpx; }
.article-cover { width: 160rpx; height: 120rpx; border-radius: 8rpx; overflow: hidden; }
.cover-img { width: 100%; height: 100%; }

.card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1rpx solid #eee; padding-top: 10rpx; }
.status-tag { font-size: 20rpx; padding: 2rpx 12rpx; border-radius: 20rpx; margin-right: 10rpx; }
.status-tag.published { background: #e6f7ff; color: #1890ff; }
.status-tag.draft { background: #fff7e6; color: #fa8c16; }
.view-count { font-size: 22rpx; color: #999; }
.action-item-delete { color: #f5222d; font-size: 24rpx; display: flex; align-items: center; }

/* 深色模式 */
.dark-mode { background-color: #121212; }
.dark-mode .nav-bar, .dark-mode .tabs-wrapper, .dark-mode .toolbar-section { background-color: #1e1e1e; border-color: #333; }
.dark-mode .nav-title { color: #e0e0e0; }
.dark-mode .tab-item { color: #999; }
.dark-mode .notice-item, .dark-mode .article-card { background-color: #1e1e1e; border-color: #333; }
.dark-mode .notice-title, .dark-mode .article-title { color: #e0e0e0; }
.dark-mode .search-box, .dark-mode .category-item { background-color: #2c2c2c; }
.dark-mode .search-input { color: #e0e0e0; background: #2c2c2c; }

.empty-state { padding: 100rpx 40rpx; text-align: center; }
.empty-text { font-size: 28rpx; color: #999; margin-bottom: 30rpx; }
.empty-action-btn { background: #7b4397; color: #fff; font-size: 26rpx; width: 300rpx; }

.loading-state, .load-more { text-align: center; padding: 30rpx; font-size: 24rpx; color: #999; }
</style>
