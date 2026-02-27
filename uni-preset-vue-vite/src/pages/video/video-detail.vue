<template>
  <view class="container">
    <!-- Player Section -->
    <view class="player-box" :class="{ 'fullscreen': isFullscreen }">
      <block v-if="currentUrl && hasAccess">
        <!-- B站视频处理：如果是B站链接且在H5端，使用 iframe 绕过 ORB 限制 -->
        <!-- #ifdef H5 -->
        <view v-if="isBilibili" class="video-container">
          <iframe 
            :src="currentUrl" 
            class="video-player" 
            frameborder="0" 
            allowfullscreen="true"
            sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
            referrerpolicy="no-referrer"
          ></iframe>
        </view>
        <!-- #endif -->

        <!-- #ifdef MP-WEIXIN -->
        <!-- 小程序端：如果是 B站页面链接（解析失败后的回退），只能用 web-view -->
        <web-view v-if="isBilibili" :src="currentUrl"></web-view>
        <!-- #endif -->

        <view v-if="!isBilibili" class="video-container">
          <!-- 视频 -->
          <video
            id="myVideo" 
            :src="currentUrl" 
            class="video-player"
            autoplay 
            :controls="true"
            :show-center-play-btn="true"
            :show-play-btn="true"
            :show-fullscreen-btn="true"
            :enable-play-gesture="true"
            :enable-progress-gesture="true"
            :initial-time="initialTime"
            :playback-rate="currentSpeed"
            @error="handleVideoError"
            @play="onVideoPlay"
            @pause="onVideoPause"
            @ended="onVideoEnd"
            @timeupdate="onTimeUpdate"
            @fullscreenchange="onFullscreenChange"
          ></video>

          <!-- 倍速切换按钮 (悬浮在原生控件上方或侧边) -->
          <view class="speed-control" v-if="!isBilibili" @tap.stop="toggleSpeedPanel">
            <text class="speed-text">{{ currentSpeed }}x</text>
          </view>
          
          <!-- 倍速选择面板 -->
          <view class="speed-panel" v-if="showSpeedPanel" @tap.stop>
            <view 
              v-for="speed in speedOptions" 
              :key="speed" 
              class="speed-item"
              :class="{ active: currentSpeed === speed }"
              @tap="setSpeed(speed)"
            >
              {{ speed }}x
            </view>
          </view>
        </view>
      </block>
      
      <!-- 无权限或未选择视频时的占位 -->
      <view v-else class="player-placeholder">
        <image v-if="resource.cover_url" :src="resource.cover_url" mode="aspectFill" class="placeholder-bg"></image>
        <view class="placeholder-content">
          <template v-if="!hasAccess && resource.requires_redemption">
            <svg viewBox="0 0 24 24" fill="#fff" class="lock-icon">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            <text class="placeholder-text">该课程需要兑换后观看</text>
            <button class="redeem-btn" @tap="handleRedeem">立即兑换</button>
          </template>
          <template v-else-if="items.length > 0">
            <view class="loading-spinner"></view>
            <text class="placeholder-text">加载中...</text>
          </template>
          <template v-else>
            <text class="placeholder-text">暂无视频内容</text>
          </template>
        </view>
      </view>

      <!-- 选集侧边弹窗 -->
      <view class="episodes-mask" v-if="showEpisode" @tap="showEpisode = false">
        <view class="episodes-panel" @tap.stop>
          <view class="panel-header">
            <text>选集 ({{ items.length }})</text>
            <text class="close-btn" @tap="showEpisode = false">×</text>
          </view>
          <scroll-view scroll-y class="episodes-list">
            <view 
              v-for="(item, index) in items" 
              :key="index"
              class="episode-item"
              :class="{ active: currentItemIndex === index }"
              @tap="playVideo(index); showEpisode = false"
            >
              <view class="episode-info">
                <text class="episode-index">{{ index + 1 }}</text>
                <text class="episode-title">{{ item.title }}</text>
              </view>
              <view class="playing-icon" v-if="currentItemIndex === index">
                <view class="bar"></view>
                <view class="bar"></view>
                <view class="bar"></view>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>

    <!-- Info Section -->
    <scroll-view scroll-y class="info-scroll" v-if="!isFullscreen">
      <!-- 标题和操作按钮 -->
      <view class="header-section">
        <view class="title-row">
          <text class="title">{{ resource.title }}</text>
          <view class="actions">
            <view class="action-btn" @tap="toggleFavorite">
              <svg viewBox="0 0 24 24" :fill="isFavorite ? '#ff4d4f' : 'none'" :stroke="isFavorite ? 'none' : '#666'" stroke-width="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <text :style="{color: isFavorite ? '#ff4d4f' : '#666'}">{{ isFavorite ? '已收藏' : '收藏' }}</text>
            </view>
            <view class="action-btn" @tap="showFeedbackPopup('feedback')">
              <svg viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/>
              </svg>
              <text>反馈</text>
            </view>
            <view class="action-btn" @tap="showFeedbackPopup('recommend')">
              <svg viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
              <text>推荐</text>
            </view>
          </view>
        </view>
        
        <!-- 标签信息 -->
        <view class="tags-row">
          <text class="tag">{{ resource.subject_name }}</text>
          <text class="tag">{{ resource.category_name }}</text>
          <text class="tag" v-if="items.length">{{ items.length }}个视频</text>
        </view>
        
        <!-- 合集信息 -->
        <view v-if="resource.collectionInfo" class="collection-tag">
          <text>来自合集：{{ resource.collectionInfo.collection_name }}</text>
        </view>
      </view>

      <!-- 简介 -->
      <view class="desc-section" v-if="resource.description">
        <view class="desc-header" @tap="descExpanded = !descExpanded">
          <text class="desc-title">简介</text>
          <text class="desc-toggle">{{ descExpanded ? '收起' : '展开' }}</text>
        </view>
        <text class="desc-content" :class="{ 'desc-expanded': descExpanded }">{{ resource.description }}</text>
      </view>

      <!-- 播放列表 -->
      <view class="playlist-section">
        <view class="section-header">
          <text class="section-title">课程大纲</text>
          <text class="section-count">共 {{ items.length }} 课时</text>
        </view>
        <view class="playlist">
          <view 
            class="playlist-item" 
            v-for="(item, index) in items" 
            :key="index"
            :class="{ active: currentItemIndex === index, locked: !hasAccess && resource.requires_redemption, completed: item.progress?.isCompleted }"
            @tap="playVideo(index)"
          >
            <view class="item-main">
              <text class="item-number" :class="{ 'completed-num': item.progress?.isCompleted }">{{ index + 1 }}</text>
              <view class="item-info">
                <text class="item-title" :class="{ 'completed-text': item.progress?.isCompleted }">{{ item.title }}</text>
                <!-- 进度条 -->
                <view v-if="item.progress && !item.progress.isCompleted && hasAccess" class="item-progress">
                  <view class="progress-mini-track">
                    <view class="progress-mini-fill" :style="{ width: item.progress.progressPercent + '%' }"></view>
                  </view>
                  <text class="progress-mini-text">{{ formatProgress(item.progress) }}</text>
                </view>
                <view v-else-if="!item.progress && hasAccess" class="item-progress">
                  <text class="not-started">未开始</text>
                </view>
                <view v-else-if="item.progress?.isCompleted" class="item-progress">
                  <text class="completed-label">已完成</text>
                </view>
                <view v-else class="item-play-btn">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <text>立即播放</text>
                </view>
              </view>
            </view>
            <view class="item-status">
              <svg v-if="!hasAccess && resource.requires_redemption" viewBox="0 0 24 24" fill="#bfbfbf">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              <svg v-else-if="currentItemIndex === index" viewBox="0 0 24 24" fill="#1890ff">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
              <!-- 已完成标记 -->
              <view v-else-if="item.progress?.isCompleted" class="completed-icon">
                <svg viewBox="0 0 24 24" fill="#52c41a">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 反馈/推荐 弹窗 -->
    <view class="feedback-mask" v-if="feedbackVisible" @tap="feedbackVisible = false">
      <view class="feedback-panel" @tap.stop>
        <view class="panel-header">
          <text>{{ feedbackType === 'feedback' ? '视频反馈' : '好片推荐' }}</text>
          <text class="close-btn" @tap="feedbackVisible = false">×</text>
        </view>
        <view class="panel-body">
          <textarea 
            class="feedback-input" 
            v-model="feedbackContent" 
            :placeholder="feedbackType === 'feedback' ? '请输入您的问题或建议...' : '为什么推荐这个视频？它的亮点在哪里？'"
          ></textarea>
        </view>
        <view class="panel-footer">
          <button class="btn-submit" @tap="submitFeedback">确认提交</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import videoApi from '@/api/video';
import { BASE_URL } from '@/api/request';
import { decryptVideoUrl } from './utils/videoEncryption';

const resourceVid = ref(null);
const resourceId = ref(null);
const resource = ref({});
const items = ref([]);
const currentItemIndex = ref(-1);
const hasAccess = ref(false);
const isFavorite = ref(false);
const descExpanded = ref(false);
const isPlaying = ref(true);
const isFullscreen = ref(false);
const showEpisode = ref(false);
const currentSpeed = ref(1.0);
const showSpeedPanel = ref(false);
const speedOptions = [0.5, 0.8, 1.0, 1.25, 1.5, 2.0, 3.0];
const initialTime = ref(0);
const currentVideoTime = ref(0);

const feedbackVisible = ref(false);
const feedbackType = ref('feedback');
const feedbackContent = ref('');

const currentUrl = computed(() => {
    if (currentItemIndex.value >= 0 && items.value[currentItemIndex.value]) {
        let url = items.value[currentItemIndex.value].url;
        if (url && url.startsWith('/api/')) {
            // 移除 BASE_URL 末尾的 /api，并确保拼接时只有一个 /
            const baseUrl = BASE_URL.replace(/\/api$/, '');
            return baseUrl + url;
        }
        return url;
    }
    return '';
});

const isBilibili = computed(() => {
    const url = currentUrl.value;
    if (!url) return false;
    // 如果是代理链接，虽然包含 bilibili 域名，但它是视频流，应该用 video 组件播放
    if (url.includes('/api/video/proxy')) return false;
    return url.includes('bilibili.com') || url.includes('b23.tv') || url.includes('player.bilibili.com');
});

onLoad((options) => {
    if (options.vid) {
        resourceVid.value = options.vid;
        loadData();
    } else if (options.v) {
        // Fallback for old links
        resourceVid.value = options.v;
        loadData();
    }
});

const toggleSpeedPanel = () => {
    showSpeedPanel.value = !showSpeedPanel.value;
};

const setSpeed = (speed) => {
    currentSpeed.value = speed;
    showSpeedPanel.value = false;
    
    // 某些平台可能需要手动调用 videoContext.playbackRate
    const videoContext = uni.createVideoContext('myVideo');
    videoContext.playbackRate(speed);
    
    uni.showToast({
        title: `倍速: ${speed}x`,
        icon: 'none',
        duration: 1000
    });
};

const loadData = async () => {
    try {
        const res = await videoApi.getVideoDetail(resourceVid.value);
        if (res.code === 0) {
            const data = res.data;
            // Update resourceId to the real integer ID for subsequent actions (favorite, redeem, etc.)
            resourceId.value = data.id;
            
            // Decrypt URLs
            if (data.items) {
                data.items.forEach(item => {
                    if (item.url) item.url = decryptVideoUrl(item.url);
                    if (item.bili_link) item.bili_link = decryptVideoUrl(item.bili_link);
                });
            }
            if (data.bili_link) data.bili_link = decryptVideoUrl(data.bili_link);

            resource.value = data;
            items.value = data.items || [];
            hasAccess.value = data.hasAccess;
            isFavorite.value = data.isFavorite;
            
            if (hasAccess.value && items.value.length > 0) {
                playVideo(0);
            }
        }
    } catch (e) {
        console.error(e);
    }
};

const handleVideoError = (e) => {
    console.error('Video Playback Error:', e);
    let content = '该视频链接可能已过期或受到防盗链限制。';
    
    // #ifdef MP-WEIXIN
    if (isBilibili.value) {
        content = '微信小程序暂不支持直接播放B站播放器链接，请尝试切换到H5端观看或使用兼容的视频源。';
    }
    // #endif
    
    uni.showModal({
        title: '播放失败',
        content: content,
        showCancel: false,
        confirmText: '我知道了'
    });
};

const onFullscreenChange = (e) => {
    isFullscreen.value = e.detail.fullScreen;
};

// 播放视频
const playVideo = async (index) => {
    if (!hasAccess.value && resource.value.requires_redemption) {
        handleRedeem();
        return;
    }
    
    try {
        uni.showLoading({ title: '加载中...' });
        
        // 先保存当前视频的进度
        if (currentItemIndex.value >= 0) {
            await updateProgress();
        }
        
        const res = await videoApi.getPlayUrl(resourceVid.value, index);
        if (res.code === 0) {
            let playUrl = res.data.url;
            // If the URL is not a proxy URL and not a direct web URL, it might be encrypted (though getPlayUrl should return ready-to-use URLs)
            // But let's check if it's a proxy URL, if not, try to decrypt just in case
            if (playUrl && !playUrl.includes('/api/video/proxy') && playUrl.includes(':')) {
                playUrl = decryptVideoUrl(playUrl);
            }
            
            items.value[index].url = playUrl;
            currentItemIndex.value = index;
            isPlaying.value = true;
            showEpisode.value = false;
            
            // 恢复上次播放进度
            initialTime.value = res.data.progressSeconds || 0;
            currentVideoTime.value = initialTime.value;
            
            // 开始记录播放进度
            startProgressTracking();
        } else {
            uni.showToast({ title: res.message || '获取播放地址失败', icon: 'none' });
        }
    } catch (e) {
        uni.showToast({ title: '加载失败', icon: 'none' });
    } finally {
        uni.hideLoading();
    }
};

// 视频播放事件
const onVideoPlay = () => {
    isPlaying.value = true;
    startProgressTracking();
};

// 视频暂停事件
const onVideoPause = () => {
    isPlaying.value = false;
    updateProgress();
};

const handleRedeem = () => {
    uni.showModal({
        title: '课程兑换',
        editable: true,
        placeholderText: '请输入兑换码',
        success: async (res) => {
            if (res.confirm && res.content) {
                try {
                     const result = await videoApi.redeem(res.content);
                     if (result.code === 0) {
                        uni.showToast({ title: '兑换成功', icon: 'success' });
                        loadData();
                    } else {
                        uni.showToast({ title: result.message || '兑换失败', icon: 'none' });
                    }
                } catch (e) {
                    uni.showToast({ title: '兑换失败', icon: 'none' });
                }
            }
        }
    });
};

const showFeedbackPopup = (type) => {
  feedbackType.value = type;
  feedbackContent.value = '';
  feedbackVisible.value = true;
};

const submitFeedback = async () => {
  if (!feedbackContent.value.trim()) {
    uni.showToast({ title: '请输入内容', icon: 'none' });
    return;
  }
  try {
    const res = await videoApi.submitFeedback({
      resourceId: resourceId.value,
      type: feedbackType.value,
      content: feedbackContent.value
    });
    if (res.code === 0) {
      uni.showToast({ title: '提交成功', icon: 'none' });
      feedbackVisible.value = false;
    } else {
      uni.showToast({ title: res.message || '提交失败', icon: 'none' });
    }
  } catch (e) {
    uni.showToast({ title: '提交失败', icon: 'none' });
  }
};

const toggleFavorite = async () => {
    if (!resourceId.value) return;
    try {
        const res = await videoApi.toggleFavorite(resourceId.value);
        if (res.code === 0) {
            isFavorite.value = res.data.isFavorite;
            uni.showToast({ title: isFavorite.value ? '已收藏' : '已取消收藏', icon: 'none' });
        } else if (res.code === 401) {
            uni.showToast({ title: '请先登录', icon: 'none' });
        } else {
            uni.showToast({ title: res.message || '操作失败', icon: 'none' });
        }
    } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' });
    }
};

// 播放进度记录
let progressTimer = null;
let videoDuration = 0;
let lastProgressUpdate = 0;

// 开始记录播放进度
const startProgressTracking = () => {
    stopProgressTracking();
    progressTimer = setInterval(() => {
        updateProgress();
    }, 5000); // 每5秒记录一次
};

// 停止记录播放进度
const stopProgressTracking = () => {
    if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
    }
};

// 更新播放进度
const updateProgress = async (isCompleted = false) => {
    if (!resourceId.value || currentItemIndex.value < 0) return;
    
    const videoContext = uni.createVideoContext('myVideo');
    if (!videoContext) return;
    
    try {
        // 获取当前播放进度
        const currentTime = await new Promise((resolve) => {
            videoContext.currentTime;
            // uni-app video组件没有直接获取currentTime的方法，需要通过其他方式
            resolve(0);
        });
        
        // 使用全局变量存储进度（通过timeupdate事件更新）
        const progressSeconds = currentVideoTime.value || 0;
        const duration = videoDuration || 0;
        
        if (duration > 0) {
            const progressPercent = Math.min(100, Math.round((progressSeconds / duration) * 100 * 100) / 100);
            
            // 避免频繁更新（至少间隔5秒）
            const now = Date.now();
            if (now - lastProgressUpdate < 5000 && !isCompleted) return;
            lastProgressUpdate = now;
            
            await videoApi.updateProgress({
                resourceId: resourceId.value,
                itemIndex: currentItemIndex.value,
                progressSeconds: Math.floor(progressSeconds),
                durationSeconds: Math.floor(duration),
                progressPercent: progressPercent,
                isCompleted: isCompleted || progressPercent >= 95
            });
        }
    } catch (e) {
        console.error('Update progress error:', e);
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

// 视频时间更新事件
const onTimeUpdate = (e) => {
    if (e.detail) {
        currentVideoTime.value = e.detail.currentTime || 0;
        if (e.detail.duration) {
            videoDuration = e.detail.duration;
        }
    }
};

// 视频播放结束
const onVideoEnd = () => {
    isPlaying.value = false;
    updateProgress(true); // 标记为已完成
};

// 页面卸载时保存进度
onUnmounted(() => {
    stopProgressTracking();
    updateProgress();
});
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.player-box {
  width: 100%;
  height: 422rpx;
  background-color: #000;
  position: relative;
  z-index: 10;
}

.video-player {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.video-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
}

/* 倍速控制按钮 */
.speed-control {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  background: rgba(0, 0, 0, 0.5);
  padding: 6rpx 16rpx;
  border-radius: 30rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  z-index: 100;
}

.speed-text {
  color: #fff;
  font-size: 24rpx;
}

/* 倍速面板 */
.speed-panel {
  position: absolute;
  top: 80rpx;
  right: 20rpx;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12rpx;
  padding: 10rpx 0;
  z-index: 101;
  min-width: 120rpx;
}

.speed-item {
  color: #fff;
  font-size: 24rpx;
  padding: 16rpx 30rpx;
  text-align: center;
}

.speed-item.active {
  color: #ff4d4f;
  font-weight: bold;
}

.player-placeholder {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.placeholder-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.3;
  filter: blur(10px);
}

.placeholder-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 40rpx;
  text-align: center;
}

.lock-icon {
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 20rpx;
}

.placeholder-text {
  color: #fff;
  font-size: 28rpx;
  margin-bottom: 30rpx;
}

.redeem-btn {
  background-color: #4db6ac;
  color: #fff;
  font-size: 26rpx;
  padding: 0 60rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 36rpx;
  border: none;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 选集弹窗 */
.episodes-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 200;
}

.episodes-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 60%;
  background: rgba(26,26,26,0.95);
  display: flex;
  flex-direction: column;
  box-shadow: -10rpx 0 30rpx rgba(0,0,0,0.3);
}

.episodes-panel .panel-header {
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid rgba(255,255,255,0.1);
}

.episodes-panel .panel-header text {
  color: #fff;
  font-size: 30rpx;
  font-weight: bold;
}

.episodes-panel .close-btn {
  font-size: 40rpx;
  color: #999;
  padding: 10rpx;
}

.episodes-list {
  flex: 1;
  padding: 10rpx 0;
}

.episode-item {
  padding: 10rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 5px;
  width: 100%;
  box-sizing: border-box;
}

.episode-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
  min-width: 0;
}

.episode-item.active {
  background: rgba(255,77,79,0.1);
}

.episode-index {
  color: #999;
  font-size: 24rpx;
  width: 40rpx;
  flex-shrink: 0;
}

.episode-title {
  color: rgba(255,255,255,0.8);
  font-size: 26rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.episode-item.active .episode-title {
  color: #ff4d4f;
}

.playing-icon {
  display: flex;
  align-items: flex-end;
  gap: 4rpx;
  height: 24rpx;
  width: 30rpx;
  flex-shrink: 0;
}

.playing-icon .bar {
  width: 4rpx;
  background: #ff4d4f;
  animation: playing-bar 0.6s infinite alternate;
}

.playing-icon .bar:nth-child(1) { height: 100%; animation-delay: 0s; }
.playing-icon .bar:nth-child(2) { height: 60%; animation-delay: 0.2s; }
.playing-icon .bar:nth-child(3) { height: 80%; animation-delay: 0.4s; }

@keyframes playing-bar {
  from { height: 20%; }
  to { height: 100%; }
}

/* 信息区域 */
.info-scroll {
  flex: 1;
  height: calc(100vh - 422rpx);
}

/* 头部区域 */
.header-section {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
  margin-right: 20rpx;
  line-height: 1.4;
}

.actions {
  display: flex;
  gap: 24rpx;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 22rpx;
  color: #666;
}

.action-btn svg {
  width: 40rpx;
  height: 40rpx;
  margin-bottom: 4rpx;
}

/* 标签行 */
.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.tag {
  font-size: 24rpx;
  color: #666;
  background: #f5f5f5;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
}

/* 合集标签 */
.collection-tag {
  display: inline-block;
  font-size: 24rpx;
  color: #6666ff;
  background: #ebf8ff;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
}

/* 简介区域 */
.desc-section {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.desc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.desc-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.desc-toggle {
  font-size: 24rpx;
  color: #999;
}

.desc-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.desc-content.desc-expanded {
  -webkit-line-clamp: unset;
}

/* 播放列表区域 */
.playlist-section {
  background: #fff;
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.section-count {
  font-size: 24rpx;
  color: #999;
}

.playlist {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.playlist-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
}

.playlist-item.active {
  background: #e6f7ff;
  border-color: #1890ff;
}

.playlist-item.locked {
  opacity: 0.6;
}

.item-main {
  display: flex;
  align-items: flex-start;
  flex: 1;
}

.item-number {
  font-size: 32rpx;
  color: #bfbfbf;
  font-weight: 500;
  margin-right: 20rpx;
  min-width: 48rpx;
}

.playlist-item.active .item-number {
  color: #1890ff;
}

.item-info {
  flex: 1;
}

.item-title {
  font-size: 30rpx;
  color: #262626;
  font-weight: 500;
  margin-bottom: 12rpx;
  line-height: 1.4;
}

.item-play-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #1890ff;
}

.item-play-btn svg {
  width: 28rpx;
  height: 28rpx;
}

.item-status svg {
  width: 40rpx;
  height: 40rpx;
}

/* 已完成状态 */
.playlist-item.completed {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.item-number.completed-num {
  color: #52c41a;
}

.item-title.completed-text {
  color: #52c41a;
}

.item-progress {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 8rpx;
}

.progress-mini-track {
  flex: 1;
  height: 6rpx;
  background: #e8e8e8;
  border-radius: 3rpx;
  overflow: hidden;
  max-width: 200rpx;
}

.progress-mini-fill {
  height: 100%;
  background: #1890ff;
  border-radius: 3rpx;
  transition: width 0.3s;
}

.progress-mini-text {
  font-size: 22rpx;
  color: #999;
  min-width: 120rpx;
}

.not-started {
  font-size: 22rpx;
  color: #999;
}

.completed-label {
  font-size: 22rpx;
  color: #52c41a;
}

.completed-icon {
  width: 40rpx;
  height: 40rpx;
}

.completed-icon svg {
  width: 100%;
  height: 100%;
}

/* 反馈弹窗 */
.feedback-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.feedback-panel {
  width: 80%;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}

.feedback-panel .panel-header {
  padding: 30rpx;
  text-align: center;
  font-weight: bold;
  border-bottom: 1rpx solid #eee;
  position: relative;
  font-size: 32rpx;
}

.feedback-panel .close-btn {
  position: absolute;
  right: 30rpx;
  top: 20rpx;
  font-size: 48rpx;
  color: #999;
  line-height: 1;
  padding: 10rpx;
}

.feedback-panel .panel-body {
  padding: 30rpx;
}

.feedback-input {
  width: 100%;
  height: 200rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 20rpx;
  box-sizing: border-box;
  font-size: 28rpx;
  border: none;
}

.feedback-panel .panel-footer {
  padding: 0 30rpx 30rpx;
}

.btn-submit {
  background: linear-gradient(to right, #1890ff, #36cfc9);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  height: 80rpx;
  line-height: 80rpx;
  border: none;
  width: 100%;
}
</style>
