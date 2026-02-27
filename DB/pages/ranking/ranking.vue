<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    <view class="scroll-content">
      <!-- 排名类型切换 (答题榜) -->
      <view class="type-tabs">
        <view class="tab-item active">答题榜</view>
      </view>

      <!-- Top 3 领奖台 -->
      <view class="podium-section fade-in" v-if="rankingData.length > 0">
        <!-- 第二名 -->
        <view class="podium-item rank-2" v-if="rankingData.length >= 2" @click="showUserDetail(rankingData[1])">
          <view class="avatar-wrapper">
            <image :src="rankingData[1].avatar || DEFAULT_AVATAR" alt="avatar" class="avatar" mode="aspectFill"></image>
            <view class="rank-badge-2">2</view>
          </view>
          <view class="podium-base">
            <view class="user-name">
              {{ rankingData[1].name }}
            </view>
            <view class="score">{{ rankingData[1].score }}<text class="unit">题</text></view>
          </view>
        </view>

        <!-- 第一名 -->
        <view class="podium-item rank-1" v-if="rankingData.length >= 1" @click="showUserDetail(rankingData[0])">
          <view class="avatar-wrapper">
            <image :src="rankingData[0].avatar || DEFAULT_AVATAR" alt="avatar" class="avatar" mode="aspectFill"></image>
            <view class="rank-badge-1">1</view>
          </view>
          <view class="podium-base">
            <view class="user-name">
              {{ rankingData[0].name }}
            </view>
            <view class="score">{{ rankingData[0].score }}</view>
          </view>
        </view>

        <!-- 第三名 -->
        <view class="podium-item rank-3" v-if="rankingData.length >= 3" @click="showUserDetail(rankingData[2])">
          <view class="avatar-wrapper">
            <image :src="rankingData[2].avatar || DEFAULT_AVATAR" alt="avatar" class="avatar" mode="aspectFill"></image>
            <view class="rank-badge-3">3</view>
          </view>
          <view class="podium-base">
            <view class="user-name">
              {{ rankingData[2].name }}
            </view>
            <view class="score">{{ rankingData[2].score }}</view>
          </view>
        </view>
      </view>

      <!-- 排名筛选 (周期) - 仅显示本周、本月、全部 -->
      <view class="filter-pills">
        <view v-for="filter in rankingFilters" 
              :key="filter.id" 
              class="pill-item"
              :class="{ active: selectedRankingFilter === filter.id }"
              @click="selectRankingFilter(filter.id)">
          {{ filter.name }}
        </view>
      </view>

      <!-- 4名及以后列表 -->
      <view class="list-section fade-in" v-if="rankingData.length > 3">
        <view class="list-item" 
              v-for="(item, index) in displayData" 
              :key="item.id"
              @click="showUserDetail(item)">
          <view class="rank-number">{{ index + 4 }}</view>
          <image :src="item.avatar || DEFAULT_AVATAR" alt="avatar" class="list-avatar" mode="aspectFill"></image>
          <view class="list-info">
            <view class="list-name">
              {{ item.name }}
            </view>
          </view>
          <view class="list-score">{{ item.score }}</view>
          <view class="list-heart" :class="{ active: item.liked }" @click.stop="toggleLike(item)">
            {{ item.liked ? '♥' : '♡' }}
          </view>
        </view>

        <!-- 展开/收起按钮 -->
        <view class="expand-wrapper" v-if="rankingData.length > 20">
          <view class="expand-btn" @click="toggleExpand">
            {{ isExpanded ? '收起' : '展开显示更多 (前50名)' }}
          </view>
        </view>
      </view>
      
      <view class="empty-state" v-if="rankingData.length === 0">
        <text class="empty-text">暂无数据，快来占领榜单吧~</text>
      </view>
    </view>

    <!-- 底部我的信息卡片 -->
    <view class="my-card fade-in" v-if="myRankData">
      <view class="my-rank-info">
        <image :src="myRankData.avatar || DEFAULT_AVATAR" alt="my avatar" class="my-avatar" mode="aspectFill"></image>
        <view class="my-text">
          <view class="my-name">
            {{ myRankData.name }}
            <text class="my-rank-tag">第 {{ myRankData.rank }} 名</text>
          </view>
          <view class="my-status">当前排名：{{ myRankData.rank }} | 答题数：{{ myRankData.score }}</view>
        </view>
      </view>
      <view class="settings-icon" @click="openPrivacyPopup">⚙</view>
    </view>

    <!-- 隐私设置弹窗 -->
    <view class="privacy-popup-overlay" v-if="showPrivacyPopup" @click="closePrivacyPopup">
      <view class="privacy-popup-container" @click.stop>
        <view class="privacy-popup">
          <view class="popup-header">
            <view class="popup-title">排行榜设置</view>
            <view class="close-btn" @click="closePrivacyPopup">×</view>
          </view>
          <view class="popup-content">
            <view class="privacy-item">
              <view class="item-left">
                <view class="item-title">参与排行榜</view>
                <view class="item-desc">关闭后您的数据将不会出现在榜单中</view>
              </view>
              <switch :checked="showInRanking" @change="updatePrivacySetting" color="#3498db" />
            </view>
            <view class="privacy-item">
              <view class="item-left">
                <view class="item-title">显示详细数据</view>
                <view class="item-desc">关闭后其他用户无法查看您的练习详情</view>
              </view>
              <switch :checked="showDetail" @change="updateDetailSetting" color="#3498db" />
            </view>
          </view>
          <view class="popup-footer">
            <button class="btn-confirm" @click="closePrivacyPopup">确定</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, getCurrentInstance } from 'vue';

// 获取组件实例以访问全局 $api
const instance = getCurrentInstance();

const DEFAULT_AVATAR = 'https://picsum.photos/id/1005/100/100';

// 主题状态
const isDarkMode = ref(false);
const statusBarHeight = ref(0);

// 排名筛选 (周期)
const rankingFilters = ref([
  { id: 'week', name: '本周' },
  { id: 'month', name: '本月' },
  { id: 'all', name: '全部' }
]);

// 选中的排名类型
const selectedRankingTab = ref('questions');

// 选中的周期
const selectedRankingFilter = ref('week');

// 排行榜数据
const rankingData = ref([]);

// 我的排名数据
const myRankData = ref(null);

// 展开状态
const isExpanded = ref(false);

// 显示的数据 (前 20 或 前 50)
const displayData = computed(() => {
  if (rankingData.value.length <= 3) return [];
  const afterTop3 = rankingData.value.slice(3);
  const limit = isExpanded.value ? 47 : 17; // 3 + 17 = 20, 3 + 47 = 50
  return afterTop3.slice(0, limit);
});

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

// 弹窗显示状态
const showPrivacyPopup = ref(false);

// 隐私设置状态
const showInRanking = ref(true);
const showDetail = ref(true);

// 打开弹窗方法
const openPrivacyPopup = () => {
  showPrivacyPopup.value = true;
};

// 关闭弹窗方法
const closePrivacyPopup = () => {
  showPrivacyPopup.value = false;
};

// 加载排行榜数据
const loadRankingData = async () => {
  const currentInstance = instance || getCurrentInstance();
  if (!currentInstance) {
    console.error('无法获取组件实例');
    return;
  }
  
  try {
    uni.showLoading({ title: '加载中...' });
    
    const api = currentInstance.appContext.config.globalProperties.$api;
    if (!api) {
      throw new Error('API not found');
    }
    
    const res = await api.wrongBookApi.getLeaderboard(selectedRankingTab.value, selectedRankingFilter.value);
    
    if (res.code === 0 && res.data) {
      const { list, myRank } = res.data;
      
      rankingData.value = list.map((item, index) => ({
        id: item.id,
        name: item.nickname || item.username || '未命名用户',
        avatar: item.avatar || '',
        score: item.value || 0,
        gender: index % 3 === 0 ? 'female' : 'male', // 模拟性别
        liked: false,
        isCurrentUser: String(item.id) === String(uni.getStorageSync('userId'))
      }));
      
      if (myRank) {
        myRankData.value = {
          rank: myRank.rank || '-',
          name: uni.getStorageSync('username') || '我',
          score: myRank.value || 0,
          avatar: myRank.avatar || ''
        };
      }
    }
    
    uni.hideLoading();
  } catch (error) {
    console.error('加载排行榜数据失败:', error);
    uni.hideLoading();
    uni.showToast({ title: '加载失败', icon: 'none' });
  }
};

// 监听筛选变化
watch([selectedRankingTab, selectedRankingFilter], () => {
  loadRankingData();
});

// 点赞切换
const toggleLike = (item) => {
  item.liked = !item.liked;
  uni.showToast({
    title: item.liked ? '已点赞' : '取消点赞',
    icon: 'none',
    duration: 1000
  });
};

// 选择排名筛选
const selectRankingFilter = (filterId) => {
  selectedRankingFilter.value = filterId;
};

// 显示用户详情
const showUserDetail = (user) => {
  uni.showToast({
    title: `查看${user.name}的详情`,
    icon: 'none'
  });
};

// 更新隐私设置
const updatePrivacySetting = (event) => {
  showInRanking.value = event.detail.value;
  uni.setStorageSync('showInRanking', showInRanking.value);
  uni.showToast({
    title: showInRanking.value ? '已开启排行榜显示' : '已关闭排行榜显示',
    icon: 'none'
  });
  loadRankingData();
};

const updateDetailSetting = (event) => {
  showDetail.value = event.detail.value;
  uni.setStorageSync('showDetail', showDetail.value);
  uni.showToast({
    title: showDetail.value ? '已显示详细数据' : '已隐藏详细数据',
    icon: 'none'
  });
};

// 初始化
onMounted(() => {
  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync();
  statusBarHeight.value = systemInfo.statusBarHeight || 0;
  
  const currentTheme = uni.getStorageSync('themeMode') || 'light';
  isDarkMode.value = currentTheme === 'dark';
  
  uni.$on('themeChange', (darkMode) => {
    isDarkMode.value = darkMode;
  });
  
  loadRankingData();
});

onUnmounted(() => {
  uni.$off('themeChange');
});
</script>

<style scoped>
/* 基础样式 - 参考 ranking.html */
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%);
  padding-bottom: 240rpx;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.scroll-content {
  padding: 40rpx 32rpx;
  max-width: 960rpx;
  margin: 0 auto;
}

/* 筛选器 */
.type-tabs {
  display: flex;
  justify-content: center;
  gap: 40rpx;
  margin-bottom: 30rpx;
}

.tab-item {
  font-size: 32rpx;
  color: #7f8c8d;
  padding: 10rpx 20rpx;
  position: relative;
  transition: all 0.3s;
}

.tab-item.active {
  color: #2c3e50;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  background: #3498db;
  border-radius: 3rpx;
}

.filter-pills {
  display: flex;
  justify-content: center;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.pill-item {
  padding: 10rpx 30rpx;
  font-size: 24rpx;
  color: #5d6d7e;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 30rpx;
  transition: all 0.3s ease;
  border: 1rpx solid rgba(255, 255, 255, 0.5);
}

.pill-item.active {
  color: #fff;
  background: #3498db;
  font-weight: bold;
  box-shadow: 0 4rpx 12rpx rgba(52, 152, 219, 0.3);
}

/* Top 3 领奖台区域 */
.podium-section {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  margin-bottom: 60rpx;
  padding: 0 20rpx;
  height: 480rpx;
  position: relative;
}

.podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  transition: transform 0.3s ease;
}

.podium-item:active {
  transform: translateY(-10rpx);
}

/* 第二名 */
.rank-2 {
  margin-right: -30rpx;
  z-index: 1;
}

.rank-2 .avatar-wrapper {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  padding: 6rpx;
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
  box-shadow: 0 8rpx 30rpx rgba(192, 192, 192, 0.4);
}

.rank-2 .podium-base {
  width: 220rpx;
  height: 200rpx;
  background: linear-gradient(180deg, #c0c0c0 0%, #f5f5f5 100%);
  border-radius: 24rpx 24rpx 0 0;
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  box-shadow: 0 -8rpx 40rpx rgba(0,0,0,0.1);
}

.rank-badge-2 {
  position: absolute;
  top: -10rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 48rpx;
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 28rpx;
  border: 4rpx solid white;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.2);
}

/* 第一名 */
.rank-1 {
  z-index: 2;
  margin-bottom: 40rpx;
}

.rank-1 .avatar-wrapper {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  padding: 8rpx;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  box-shadow: 0 12rpx 50rpx rgba(255, 215, 0, 0.5);
  position: relative;
}

.rank-1 .avatar-wrapper::before {
  content: '🏆'; /* 使用奖杯图标替代皇冠，更符合运动/竞赛感 */
  position: absolute;
  top: -36rpx;
  left: 50%;
  transform: translateX(-50%);
  font-size: 64rpx;
  filter: drop-shadow(0 4rpx 8rpx rgba(0,0,0,0.2));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-10rpx); }
}

.rank-1 .podium-base {
  width: 240rpx;
  height: 240rpx;
  background: linear-gradient(180deg, #ffd700 0%, #fffde7 100%);
  border-radius: 32rpx 32rpx 0 0;
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  box-shadow: 0 -12rpx 50rpx rgba(255, 215, 0, 0.3);
}

.rank-badge-1 {
  position: absolute;
  top: -16rpx;
  right: -10rpx;
  width: 56rpx;
  height: 56rpx;
  background: linear-gradient(135deg, #ffd700, #ff6b35);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 32rpx;
  border: 6rpx solid white;
  box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.3);
}

/* 第三名 */
.rank-3 {
  margin-left: -30rpx;
  z-index: 1;
}

.rank-3 .avatar-wrapper {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  padding: 6rpx;
  background: linear-gradient(135deg, #cd7f32 0%, #d4a373 100%);
  box-shadow: 0 8rpx 30rpx rgba(205, 127, 50, 0.4);
}

.rank-3 .podium-base {
  width: 220rpx;
  height: 180rpx;
  background: linear-gradient(180deg, #cd7f32 0%, #faf3eb 100%);
  border-radius: 24rpx 24rpx 0 0;
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  box-shadow: 0 -8rpx 40rpx rgba(0,0,0,0.1);
}

.rank-badge-3 {
  position: absolute;
  top: -10rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 48rpx;
  background: linear-gradient(135deg, #cd7f32, #a0522d);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 28rpx;
  border: 4rpx solid white;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.2);
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #fff;
  border: 4rpx solid white;
}

.user-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8rpx;
  max-width: 180rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.score {
  font-size: 40rpx;
  font-weight: 800;
  color: #2c3e50;
  text-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.heart-icon {
  margin-top: 12rpx;
  color: #bdc3c7;
  font-size: 40rpx;
  cursor: pointer;
  transition: all 0.2s;
}

.heart-icon.active {
  color: #e74c3c;
  transform: scale(1.1);
}

/* 列表区域 */
.list-section {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-radius: 40rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 40rpx rgba(0,0,0,0.05);
}

.list-item {
  display: flex;
  align-items: center;
  padding: 28rpx 16rpx;
  border-radius: 24rpx;
  transition: all 0.3s ease;
  margin-bottom: 8rpx;
}

.list-item:active {
  background: rgba(255, 255, 255, 0.8);
  transform: translateX(10rpx);
}

.rank-number {
  width: 64rpx;
  text-align: center;
  font-size: 34rpx;
  font-weight: 700;
  color: #34495e;
  margin-right: 24rpx;
}

.list-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  border: 4rpx solid rgba(255,255,255,0.8);
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.1);
}

.list-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.list-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #2c3e50;
  max-width: 240rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-score {
  font-size: 36rpx;
  font-weight: 700;
  color: #2c3e50;
  margin-right: 24rpx;
}

.list-heart {
  color: #bdc3c7;
  font-size: 40rpx;
  cursor: pointer;
  transition: all 0.2s;
  padding: 8rpx;
}

.list-heart.active {
  color: #e74c3c;
  transform: scale(1.1);
}

/* 展开更多按钮 */
.expand-wrapper {
  padding: 30rpx 0 10rpx;
  display: flex;
  justify-content: center;
}

.expand-btn {
  font-size: 26rpx;
  color: #3498db;
  padding: 16rpx 40rpx;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 40rpx;
  border: 1rpx solid rgba(52, 152, 219, 0.2);
}

/* 底部我的信息卡片 */
.my-card {
  position: fixed;
  bottom: 40rpx;
  left: 32rpx;
  right: 32rpx;
  background: rgba(30, 30, 35, 0.95);
  backdrop-filter: blur(40rpx);
  -webkit-backdrop-filter: blur(40rpx);
  border-radius: 32rpx;
  padding: 32rpx 40rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 16rpx 64rpx rgba(0,0,0,0.3);
  z-index: 100;
  border: 1rpx solid rgba(255,255,255,0.1);
}

.my-rank-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.my-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  border: 4rpx solid rgba(255,255,255,0.2);
}

.my-text {
  color: white;
}

.my-name {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 4rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.my-rank-tag {
  font-size: 22rpx;
  background: #ffd700;
  color: #000;
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
  font-weight: bold;
}

.gender-tag {
  font-size: 22rpx;
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
  background: rgba(52, 152, 219, 0.3);
  color: #3498db;
  border: 1rpx solid rgba(52, 152, 219, 0.5);
}

.gender-tag.female {
  background: rgba(231, 76, 60, 0.3);
  color: #e74c3c;
  border: 1rpx solid rgba(231, 76, 60, 0.5);
}

.my-status {
  font-size: 26rpx;
  color: rgba(255,255,255,0.6);
}

.settings-icon {
  margin-left: 32rpx;
  color: rgba(255,255,255,0.6);
  font-size: 40rpx;
  cursor: pointer;
  transition: transform 0.3s;
  padding: 16rpx;
}

.settings-icon:active {
  transform: rotate(90deg);
  color: white;
}

/* 隐私设置弹窗 */
.privacy-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 9998;
  backdrop-filter: blur(8rpx);
  -webkit-backdrop-filter: blur(8rpx);
  display: flex;
  justify-content: center;
  align-items: center;
}

.privacy-popup-container {
  width: 85%;
  max-width: 680rpx;
}

.privacy-popup {
  background: white;
  border-radius: 40rpx;
  padding: 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.3);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}

.popup-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #2c3e50;
}

.close-btn {
  font-size: 48rpx;
  color: #999;
  padding: 10rpx;
}

.privacy-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  background: #f8f9fa;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
}

.item-left {
  flex: 1;
}

.item-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4rpx;
}

.item-desc {
  font-size: 24rpx;
  color: #7f8c8d;
}

.popup-footer {
  margin-top: 40rpx;
}

.btn-confirm {
  width: 100%;
  height: 88rpx;
  background: #3498db;
  color: white;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.btn-confirm:active {
  opacity: 0.9;
  transform: scale(0.98);
}

/* 加载动画 */
.fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(40rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.empty-state {
  padding: 100rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 夜间模式 */
.dark-mode.container {
  background: linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 100%);
}

.dark-mode .user-name,
.dark-mode .score,
.dark-mode .list-name,
.dark-mode .list-score,
.dark-mode .tab-item.active {
  color: #e5e7eb;
}

.dark-mode .list-section {
  background: rgba(255, 255, 255, 0.05);
}

.dark-mode .privacy-popup {
  background-color: #1c1c1e;
  color: white;
}

.dark-mode .popup-title {
  color: white;
}

.dark-mode .privacy-item {
  background-color: rgba(255, 255, 255, 0.05);
}

.dark-mode .item-title {
  color: white;
}
</style>
