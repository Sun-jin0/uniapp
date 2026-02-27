<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    <view class="scroll-content">
      <!-- 用户信息卡片 (玻璃拟态效果) -->
      <view class="user-profile-header">
        <view class="user-card-glass">
          <view class="avatar-section">
            <image class="main-avatar" :src="userAvatar || 'https://picsum.photos/id/1005/100/100'" mode="aspectFill"></image>
            <view class="level-tag">Lv.{{ userLevel }}</view>
          </view>
          <view class="info-section">
            <view class="name-row">
              <text class="user-name" style="max-width: 280rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ userName }}</text>
              <view class="vip-badge" v-if="isAdmin">PRO</view>
            </view>
            <view class="id-row">
              <text class="user-id">ID: {{ userId || '---' }}</text>
              <button class="copy-btn" @click="copyUserId">复制</button>
            </view>
            <view class="rank-row" v-if="questionRank > 0">
              <text class="rank-label">刷题排名: </text>
              <text class="rank-value">{{ questionRank }}名</text>
            </view>
          </view>
          <view class="edit-btn" @click="editProfile">
            <view class="edit-icon"></view>
          </view>
        </view>
      </view>
      
      <!-- 学习数据简报 -->
      <view class="stats-container">
        <view class="stats-card">
          <view class="stat-box" @click="viewStats">
            <text class="stat-num">{{ totalQuestions }}</text>
            <text class="stat-label">刷题数</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-box" @click="viewStats">
            <text class="stat-num">{{ questionRank > 0 ? questionRank : '---' }}</text>
            <text class="stat-label">刷题排名</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-box" @click="viewStats">
            <text class="stat-num">{{ practiceDays }}</text>
            <text class="stat-label">坚持天数</text>
          </view>
        </view>
      </view>
      
      <!-- 功能菜单区域 -->
      <view class="menu-container">
        <!-- 核心功能组 -->
        <view class="menu-group-card">
          <view class="menu-item-row" @click="goToMyVideos">
            <view class="icon-box video-bg">
              <view class="inner-icon video"></view>
            </view>
            <text class="item-label">我的视频</text>
            <view class="item-arrow"></view>
          </view>
          <view class="menu-item-row" @click="goToRedeem">
            <view class="icon-box redeem-bg">
              <view class="inner-icon redeem"></view>
            </view>
            <text class="item-label">兑换中心</text>
            <view class="item-arrow"></view>
          </view>
          <view class="menu-item-row" @click="goToRanking">
            <view class="icon-box ranking-bg">
              <view class="inner-icon ranking"></view>
            </view>
            <text class="item-label">排行榜</text>
            <view class="item-arrow"></view>
          </view>
          <view class="menu-item-row" @click="goToCheckin">
            <view class="icon-box checkin-bg">
              <view class="inner-icon checkin"></view>
            </view>
            <text class="item-label">每日签到</text>
            <view class="item-arrow"></view>
          </view>
        </view>
        
        <!-- 系统设置组 -->
        <view class="menu-group-card">
          <view class="menu-item-row">
            <view class="icon-box night-bg">
              <view class="inner-icon night"></view>
            </view>
            <text class="item-label">夜间模式</text>
            <switch :checked="isDarkMode" @change="toggleTheme" color="#6366f1" scale="0.8" />
          </view>
          <view class="menu-item-row" @click="goToFeedback">
            <view class="icon-box feedback-bg">
              <view class="inner-icon feedback"></view>
            </view>
            <text class="item-label">意见反馈</text>
            <view class="item-arrow"></view>
          </view>
          <view class="menu-item-row" v-if="isAdmin" @click="goToAdmin">
            <view class="icon-box admin-bg">
              <view class="inner-icon admin"></view>
            </view>
            <text class="item-label">管理后台</text>
            <view class="item-arrow"></view>
          </view>
        </view>
        
        <!-- 退出操作 -->
        <view class="logout-area" @click="logout">
          <text class="logout-text">退出登录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue';

const instance = getCurrentInstance();

// 用户信息
const userName = ref('考生');
const userId = ref('');
const userLevel = ref('学霸');
const totalQuestions = ref(0);
const correctRate = ref(0);
const practiceDays = ref(0);
const totalScore = ref(0);
const couponCount = ref(3);
const isDarkMode = ref(false);
const statusBarHeight = ref(0);
const userAvatar = ref('');
// 排名信息
const questionRank = ref(0);
// 管理员权限状态
const isAdmin = ref(false);

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const res = await instance.appContext.config.globalProperties.$api.userApi.getUserInfo();
    if (res.code === 0) {
      userName.value = res.data.nickname || res.data.username || '考生';
      userId.value = res.data.studentId || res.data.userId || '';
      totalQuestions.value = res.data.totalQuestions || 0;
      correctRate.value = Math.min(100, Math.round((res.data.correctRate || 0) * 100));
      totalScore.value = res.data.totalScore || 0;
      // 计算用户等级：10级以前每20个题加一个等级，超过10级每50个题加一个等级
      const calcLevel = (questions) => {
        if (questions < 200) {
          return Math.floor(questions / 20) + 1;
        } else {
          return 10 + Math.floor((questions - 200) / 50);
        }
      };
      userLevel.value = res.data.level || calcLevel(res.data.totalQuestions || 0);
      isAdmin.value = res.data.role === 2 || res.data.role === 1; // 允许管理员和超级管理员访问
      userAvatar.value = res.data.avatar || '';
      // 加载排行榜数据获取排名
      const rankRes = await instance.appContext.config.globalProperties.$api.wrongBookApi.getLeaderboard('questions', 'all');
      if (rankRes.code === 0 && rankRes.data && rankRes.data.myRank) {
        questionRank.value = rankRes.data.myRank.rank || 0;
      } else {
        questionRank.value = res.data.questionRank || 0;
      }
      console.log('用户信息:', res.data);
      console.log('用户角色:', res.data.role);
      console.log('是否为管理员:', isAdmin.value);
    }
  } catch (error) {
    console.error('加载用户信息失败:', error);
  }
};

// 加载签到数据获取坚持天数
const loadCheckinData = async () => {
  try {
    const res = await instance.appContext.config.globalProperties.$api.checkinApi.getCheckinRecords();
    if (res.code === 0) {
      practiceDays.value = res.data.totalDays || 0;
    }
  } catch (error) {
    console.error('加载签到数据失败:', error);
  }
};

// 编辑资料
const editProfile = () => {
  uni.navigateTo({
    url: '/pages/user-info/user-info'
  });
};

// 查看统计
const viewStats = () => {
  // 显示学习统计信息
  uni.showModal({
    title: '学习统计',
    content: `总题量: ${totalQuestions.value}\n正确率: ${correctRate.value}%\n练习天数: ${practiceDays.value}\n总积分: ${totalScore.value}`,
    showCancel: false,
    confirmText: '确定'
  });
};

// 复制用户ID
const copyUserId = () => {
  if (userId.value) {
    uni.setClipboardData({
      data: userId.value,
      success: () => {
        uni.showToast({
          title: '复制成功',
          icon: 'success'
        });
      }
    });
  }
};

// 我的视频
const goToMyVideos = () => {
  uni.navigateTo({
    url: '/pages/video/my-videos'
  });
};


// 切换主题模式
const toggleTheme = (e) => {
  // 获取开关的实际状态
  const newStatus = e.detail.value;
  isDarkMode.value = newStatus;
  // 保存到本地存储
  uni.setStorageSync('themeMode', newStatus ? 'dark' : 'light');
  // 发送主题变化事件给app.vue
  uni.$emit('themeChange', newStatus);
  
  // 显示状态变化反馈
  uni.showToast({
    title: newStatus ? '已开启夜间模式' : '已关闭夜间模式',
    icon: 'success'
  });
};

// 初始化主题状态
onMounted(() => {
  const systemInfo = uni.getSystemInfoSync();
  statusBarHeight.value = systemInfo.statusBarHeight || 0;
  
  // 加载用户信息
  loadUserInfo();
  // 加载签到数据获取坚持天数
  loadCheckinData();
  
  // 从本地存储获取当前主题模式，默认白天模式
  const currentTheme = uni.getStorageSync('themeMode') || 'light';
  isDarkMode.value = currentTheme === 'dark';
  
  // 监听主题变化事件
  uni.$on('themeChange', (darkMode) => {
    isDarkMode.value = darkMode;
  });
  
  // 监听头像更新事件
  uni.$on('avatarUpdated', () => {
    loadUserInfo();
  });
});

onUnmounted(() => {
  uni.$off('themeChange');
  uni.$off('avatarUpdated');
});

// 跳转到设置
const goToSettings = () => {
  uni.navigateTo({
    url: '/pages/settings/settings'
  });
};

// 跳转到意见反馈
const goToFeedback = () => {
  uni.navigateTo({
    url: '/pages/feedback/feedback'
  });
};

// 跳转到兑换中心
const goToRedeem = () => {
  uni.navigateTo({
    url: '/pages/redeem/redeem'
  });
};

// 跳转到管理员后台
const goToAdmin = () => {
  uni.navigateTo({
    url: '/pages/admin/admin'
  });
};

// 跳转到每日签到
const goToCheckin = () => {
  uni.navigateTo({
    url: '/pages/checkin/checkin'
  });
};

// 跳转到排行榜
const goToRanking = () => {
  uni.navigateTo({
    url: '/pages/ranking/ranking'
  });
};

// 退出登录
const logout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        // 清除本地存储的登录信息
        uni.removeStorageSync('token');
        uni.removeStorageSync('userInfo');
        
        // 跳转到登录页面
        uni.reLaunch({
          url: '/pages/login/login'
        });
      }
    }
  });
};
</script>

<style>
/* 用户资料头部 */
.user-profile-header {
  padding: 40rpx 30rpx;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border-radius: 0 0 60rpx 60rpx;
}

.user-card-glass {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 40rpx;
  padding: 40rpx;
  display: flex;
  align-items: center;
  position: relative;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.avatar-section {
  position: relative;
  margin-right: 30rpx;
}

.main-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  border: 6rpx solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.level-tag {
  position: absolute;
  bottom: 10rpx;
  right: 10rpx;
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  color: white;
  font-size: 18rpx;
  font-weight: 600;
  padding: 6rpx 16rpx;
  border-radius: 24rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2rpx 8rpx rgba(245, 158, 11, 0.3);
  min-width: 80rpx;
  text-align: center;
}

.info-section {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.user-name {
  font-size: 40rpx;
  font-weight: bold;
  color: white;
}

.vip-badge {
  background: rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 18rpx;
  font-weight: bold;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.user-id {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 6rpx;
  margin-top: 4rpx;
}

.rank-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
}

.rank-value {
  font-size: 24rpx;
  font-weight: 600;
  color: #fbbf24;
}

.edit-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.edit-icon {
  width: 30rpx;
  height: 30rpx;
  background-color: white;
  mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>') no-repeat center;
  -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>') no-repeat center;
  mask-size: contain;
  -webkit-mask-size: contain;
}

/* 统计卡片 */
.stats-container {
  margin-top: -40rpx;
  padding: 0 30rpx;
}

.stats-card {
  background: white;
  border-radius: 30rpx;
  padding: 20rpx;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 20rpx;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100rpx;
}

.stat-num {
  font-size: 32rpx;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 2rpx;
}

.stat-label {
  font-size: 20rpx;
  color: #6b7280;
}

.stat-divider {
  width: 2rpx;
  height: 30rpx;
  background-color: #f3f4f6;
}

/* 菜单列表 */
.menu-container {
  padding: 30rpx;
}

.menu-group-card {
  background: white;
  border-radius: 30rpx;
  padding: 10rpx 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.02);
}

.menu-item-row {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f9fafb;
}

.menu-item-row:last-child {
  border-bottom: none;
}

.icon-box {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.inner-icon {
  width: 36rpx;
  height: 36rpx;
  background-color: white;
  mask-size: contain;
  -webkit-mask-size: contain;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-position: center;
}

.video-bg { background: #fee2e2; }
.video { background-color: #ef4444; mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 .61-.03 1.3-.1 2.1-.06.8-.15 1.43-.28 1.9-.13.47-.31.81-.54 1.05s-.54.38-1 .44c-.45.06-1.07.1-1.85.11-.78.01-1.4.01-1.86.01L12 18c-3.69 0-5.74-.03-6.14-.1-.45-.06-.79-.21-1.03-.44s-.41-.58-.54-1.05c-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L4 12c0-.61.03-1.3.1-2.1.06-.8.15-1.43.28-1.9.13-.47.31-.81.54-1.05s.54-.38 1-.44c.45-.06 1.07-.1 1.85-.11.78-.01 1.4-.01 1.86-.01L12 6c3.69 0 5.74.03 6.14.1.45.06.79.21 1.03.44s.41.58.54 1.05z"/></svg>'); }

.redeem-bg { background: #fef3c7; }
.redeem { background-color: #f59e0b; mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.65-.5-.65C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>'); }

.ranking-bg { background: #dcfce7; }
.ranking { background-color: #10b981; mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7.5 21H2V9h5.5v12zm7.25 0h-5.5V3h5.5v18zm7.25 0h-5.5v-9H22v9z"/></svg>'); }

.checkin-bg { background: #e0e7ff; }
.checkin { background-color: #6366f1; mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z"/></svg>'); }

.night-bg { background: #f3f4f6; }
.night { background-color: #4b5563; mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>'); }

.feedback-bg { background: #f3f4f6; }
.feedback { background-color: #4b5563; mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/></svg>'); }

.admin-bg { background: #ede9fe; }
.admin { background-color: #8b5cf6; mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'); }

.item-label {
  flex: 1;
  font-size: 28rpx;
  color: #374151;
  font-weight: 500;
}

.item-arrow {
  width: 16rpx;
  height: 16rpx;
  border-top: 3rpx solid #d1d5db;
  border-right: 3rpx solid #d1d5db;
  transform: rotate(45deg);
}

.logout-area {
  margin-top: 20rpx;
  padding: 30rpx;
  text-align: center;
  background: white;
  border-radius: 30rpx;
}

.logout-text {
  color: #ef4444;
  font-size: 28rpx;
  font-weight: 600;
}

/* 夜间模式适配 */
.dark-mode .user-profile-header {
  background: linear-gradient(135deg, #312e81 0%, #4c1d95 100%);
}

.dark-mode .stats-card,
.dark-mode .menu-group-card,
.dark-mode .logout-area {
  background: #1f2937;
}

.dark-mode .stat-num,
.dark-mode .item-label,
.dark-mode .user-name {
  color: #f9fafb;
}

.dark-mode .stat-label,
.dark-mode .user-id {
  color: #9ca3af;
}

.dark-mode .menu-item-row {
  border-bottom-color: #374151;
}

.dark-mode .stat-divider {
  background-color: #374151;
}

.dark-mode .night-bg,
.dark-mode .feedback-bg {
  background: #374151;
}

.dark-mode .night,
.dark-mode .feedback {
  background-color: #9ca3af;
}

.dark-mode .container {
  background-color: #111827;
}

/* 复制按钮样式 */
.id-row {
  display: flex;
  align-items: center;
  gap: 2rpx; /* 间距调小 */
  margin-bottom: 8rpx;
}

.user-id {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

.copy-btn {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  border: 1rpx solid rgba(255, 255, 255, 0.4);
  padding: 2rpx 12rpx;
  border-radius: 6rpx; /* 圆角矩形 */
  font-size: 20rpx;
  font-weight: 500;
  cursor: pointer;
  height: 32rpx;
  line-height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4rpx;
}

.copy-btn:active {
  background: rgba(255, 255, 255, 0.4);
}

.dark-mode .copy-btn {
  background: rgba(255, 255, 255, 0.15);
  color: #f9fafb;
}

.dark-mode .copy-btn:active {
  background: rgba(255, 255, 255, 0.25);
}
</style>