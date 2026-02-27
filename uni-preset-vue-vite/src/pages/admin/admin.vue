<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-title">管理员后台</view>
      <view class="nav-actions">
        <view class="role-badge">{{ roleText }}</view>
        <view class="action-btn" @click="logout">退出登录</view>
      </view>
    </view>
    
    <!-- 管理员功能菜单 -->
    <scroll-view scroll-y class="admin-section" :show-scrollbar="false" :enhanced="true">
      <!-- 首页内容管理 - 内容管理员及以上可见 -->
      <view class="menu-group">
        <view class="group-title">首页装修管理</view>
        <view class="menu-item" @click="goToBannerManage">
          <view class="menu-icon" :style="{ backgroundColor: '#6666ff' }">{{ bannerIcon }}</view>
          <view class="menu-content">
            <view class="menu-title">轮播图管理</view>
            <view class="menu-desc">管理首页顶部轮播图片及其跳转链接</view>
          </view>
          <view class="menu-arrow"></view>
        </view>
        <view class="menu-item" @click="goToContentManage">
          <view class="menu-icon" :style="{ backgroundColor: '#7b4397' }">📝</view>
          <view class="menu-content">
            <view class="menu-title">内容管理 (新)</view>
            <view class="menu-desc">统一管理公告、广告及文章内容</view>
          </view>
          <view class="menu-arrow"></view>
        </view>
      </view>

      <!-- 业务内容管理 - 内容管理员及以上可见 -->
      <view class="menu-group">
        <view class="group-title">题库与业务管理</view>
        <view class="menu-item" @click="goToVideoAdmin">
          <view class="menu-icon" :style="{ backgroundColor: '#ff5252' }">🎬</view>
          <view class="menu-content">
            <view class="menu-title">视频课程管理</view>
            <view class="menu-desc">管理视频分类、资源、合集、兑换码与权限</view>
          </view>
          <view class="menu-arrow"></view>
        </view>
        <view class="menu-item" @click="goToHomepageCardManage">
          <view class="menu-icon" :style="{ backgroundColor: '#4facfe' }">📇</view>
          <view class="menu-content">
            <view class="menu-title">首页科目卡片</view>
            <view class="menu-desc">管理首页精选刷题卡片的内容、颜色和高度</view>
          </view>
          <view class="menu-arrow"></view>
        </view>
        <view class="menu-item" @click="goToMathManagement">
          <view class="menu-icon" :style="{ backgroundColor: '#009688' }">{{ mathIcon }}</view>
          <view class="menu-content">
            <view class="menu-title">数学题库管理</view>
            <view class="menu-desc">数学公式可视化编辑与纠错</view>
          </view>
          <view class="menu-arrow"></view>
        </view>
        <view class="menu-item" @click="goToPanManagement">
          <view class="menu-icon" :style="{ backgroundColor: '#4facfe' }">📂</view>
          <view class="menu-content">
            <view class="menu-title">网盘资源管理</view>
            <view class="menu-desc">管理百度/夸克网盘资源与批量获取</view>
          </view>
          <view class="menu-arrow"></view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ROLES, PERMISSIONS, hasPermission, getUserRole } from './utils/permission';

// 主题状态
const isDarkMode = ref(false);



// 图标
const mathIcon = ref('🧮');
const computerIcon = ref('💻');
const medIcon = ref('🏥');
const bannerIcon = ref('🖼️');

// 用户角色
const userRole = ref(getUserRole());

// 页面加载时检查角色
onMounted(() => {
  // 从本地存储获取当前主题模式，默认白天模式
  const currentTheme = uni.getStorageSync('themeMode') || 'light';
  isDarkMode.value = currentTheme === 'dark';
  
  // 监听主题变化事件
  uni.$on('themeChange', (darkMode) => {
    isDarkMode.value = darkMode;
  });
  
  // 重新获取用户角色
  const role = getUserRole();
  if (role) {
    userRole.value = role;
    console.log('User role:', role);
  } else {
    console.log('No user role found in storage');
    // 尝试从其他存储位置获取
    try {
      const userInfo = uni.getStorageSync('userInfo');
      console.log('UserInfo from storage:', userInfo);
    } catch (e) {
      console.log('Error reading userInfo:', e);
    }
  }
});

// 角色文本
const roleText = computed(() => {
  const roleMap = {
    [ROLES.SUPER_ADMIN]: '超级管理员',
    [ROLES.ADMIN]: '管理员',
    [ROLES.CONTENT_ADMIN]: '内容管理员'
  };
  return roleMap[userRole.value] || '管理员';
});

// 检查权限 - 如果没有角色信息，默认显示所有菜单
const checkPermission = (permission) => {
  // 如果没有获取到角色，默认返回true显示所有菜单
  if (!userRole.value) {
    console.log('No user role found, showing all menus by default');
    return true;
  }
  return hasPermission(permission, userRole.value);
};

// 跳转到视频课程管理
const goToVideoAdmin = () => {
  uni.navigateTo({
    url: '/pages/admin/video-admin/video-admin'
  });
};

const goToBannerManage = () => {
  uni.navigateTo({
    url: '/pages/admin/banner/banner'
  });
};

// 跳转到内容管理（统一管理页面）
const goToContentManage = () => {
  uni.navigateTo({
    url: '/pages/admin/content-manage/content-manage'
  });
};

// 跳转到文章管理
const goToArticleManage = () => {
  uni.navigateTo({
    url: '/pages/admin/content-manage/content-manage?tab=article'
  });
};

// 跳转到数学题目管理
const goToMathManagement = () => {
  uni.navigateTo({ url: '/pages/admin/math-management/math-management' });
};

// 跳转到网盘资源管理
const goToPanManagement = () => {
  uni.navigateTo({
    url: '/pages/admin/pan-management/pan-management'
  });
};

// 跳转到首页卡片管理
const goToHomepageCardManage = () => {
  uni.navigateTo({
    url: '/pages/admin/homepage-card/homepage-card'
  });
};

// 跳转到反馈管理
const goToFeedbackManage = () => {
  uni.navigateTo({
    url: '/pages/admin/feedback/feedback'
  });
};

// 退出登录
const logout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出管理员登录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '已退出登录',
          icon: 'success',
          duration: 1500
        });
        setTimeout(() => {
          uni.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);
      }
    }
  });
};
</script>

<style>
/* 初始样式 - 浅色模式 */
.container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  overflow: hidden;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  box-sizing: border-box;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0 !important;
  height: 0 !important;
  -webkit-appearance: none;
  background: transparent;
}

/* 顶部导航栏 */
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 40rpx;
  background-color: #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
}

.nav-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  transition: all 0.3s ease;
}

.nav-actions {
  display: flex;
  gap: 20rpx;
}

.role-badge {
  padding: 12rpx 20rpx;
  background-color: #6666ff;
  color: #ffffff;
  font-size: 22rpx;
  border-radius: 16rpx;
  font-weight: bold;
  margin-right: 20rpx;
  transition: all 0.3s ease;
}

.action-btn {
  padding: 12rpx 24rpx;
  background-color: #ff6b35;
  color: #ffffff;
  font-size: 24rpx;
  border-radius: 8rpx;
  transition: all 0.3s ease;
}

.action-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

/* 管理员功能菜单 */
.admin-section {
  flex: 1;
  padding: 20rpx;
  height: 100%;
}

.menu-group {
  background-color: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.group-title {
  font-size: 24rpx;
  font-weight: bold;
  color: #999999;
  padding: 20rpx 30rpx;
  background-color: #f0f0f0;
  transition: all 0.3s ease;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  transition: all 0.3s ease;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: #f0f4ff;
}

.menu-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  margin-right: 20rpx;
}

.menu-content {
  flex: 1;
}

.menu-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 8rpx;
  transition: all 0.3s ease;
}

.menu-desc {
  font-size: 22rpx;
  color: #999999;
  transition: all 0.3s ease;
}

.menu-arrow {
  width: 20rpx;
  height: 20rpx;
  border-top: 3rpx solid #999999;
  border-right: 3rpx solid #999999;
  transform: rotate(45deg);
  transition: all 0.3s ease;
}

/* 深色模式样式 */
.dark-mode {
  background-color: #1a1a1a;
}

.dark-mode .container {
  background-color: #1a1a1a;
}

.dark-mode .nav-bar {
  background-color: #2d2d2d;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.3);
}

.dark-mode .nav-title {
  color: #ffffff;
}

.dark-mode .menu-group {
  background-color: #2d2d2d;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
}

.dark-mode .group-title {
  color: #cccccc;
  background-color: #3a3a3a;
}

.dark-mode .menu-item {
  border-bottom: 1rpx solid #404040;
}

.dark-mode .menu-item:active {
  background-color: #3a3a7a;
}

.dark-mode .menu-title {
  color: #ffffff;
}

.dark-mode .menu-desc {
  color: #cccccc;
}

.dark-mode .menu-arrow {
  border-top: 3rpx solid #cccccc;
  border-right: 3rpx solid #cccccc;
}
</style>