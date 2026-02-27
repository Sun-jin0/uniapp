<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    
    <!-- 悬浮添加按钮 -->
    <FloatButton 
      icon="+" 
      tooltip-text="添加轮播图" 
      :right="'24px'" 
      :bottom="'100px'"
      @click="openAddBannerModal"
    />
    
    <!-- 搜索栏 -->
    <SearchBox 
      v-model="searchKeyword" 
      placeholder="搜索轮播图" 
      @search="searchBanner"
    />
    
    <!-- 轮播图列表 -->
    <scroll-view 
      scroll-y 
      class="banner-list" 
      :show-scrollbar="false"
      :enhanced="true"
    >
      <view v-for="banner in filteredBanners" :key="banner.id" class="banner-card">
        <!-- 轮播图图片 -->
        <image class="banner-image" :src="banner.imageUrl" mode="aspectFill" @error="(e) => handleBannerImageError(banner, e)"></image>
        
        <!-- 轮播图信息 -->
        <view class="banner-info">
          <view class="banner-header">
            <view class="banner-title">{{ banner.title }}</view>
            <view class="banner-id">ID: {{ banner.id }}</view>
          </view>
          
          <view class="banner-meta">
            <view class="meta-item">
              <text class="meta-label">排序:</text>
              <text class="meta-value">{{ banner.sort }}</text>
            </view>
            <view class="meta-item">
              <text class="meta-label">创建时间:</text>
              <text class="meta-value">{{ formatDate(banner.createTime) }}</text>
            </view>
          </view>
          
          <view class="banner-footer">
            <!-- 状态开关 -->
            <view class="status-section">
              <view class="status-text" :class="banner.status">
                {{ banner.status === 1 ? '启用' : '禁用' }}
              </view>
              <switch class="status-switch" 
                :checked="banner.status === 1 || banner.status === '1'" 
                @change="(event) => {
                  banner.status = event ? 1 : 0;
                  onStatusChange(banner);
                }"
              />
            </view>
            
            <!-- 操作按钮 -->
            <view class="actions-section">
              <button class="edit-btn" @click="editBanner(banner)">编辑</button>
              <button class="delete-btn" @click="deleteBanner(banner.id)">删除</button>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-if="filteredBanners.length === 0">
        <view class="empty-icon">📷</view>
        <view class="empty-text">暂无轮播图数据</view>
        <button class="empty-action-btn" @click="openAddBannerModal">添加轮播图</button>
      </view>
    </scroll-view>
    
    <!-- 添加/编辑轮播图模态框 -->
    <view v-if="showModal" class="modal-overlay" @click="closeBannerModal"></view>
    <view v-if="showModal" class="modal-container">
      <view class="modal-header">
        <view class="modal-title">{{ editingBanner.id ? '编辑轮播图' : '添加轮播图' }}</view>
        <view class="modal-close" @click="closeBannerModal">×</view>
      </view>
      
      <view class="modal-content">
        <view class="form-item">
          <view class="form-label">轮播图标题</view>
          <input class="form-input" type="text" placeholder="请输入轮播图标题" v-model="editingBanner.title" />
        </view>
        <view class="form-item">
          <view class="form-label">轮播图片</view>
          <view class="banner-upload">
            <image 
              class="banner-preview" 
              :src="editingBanner.imageUrl" 
              mode="aspectFill"
              @error="onImageError"
            ></image>
            <button class="upload-btn" @click="uploadBannerImage">上传图片</button>
          </view>
        </view>
        <view class="form-item">
          <view class="form-label">图片URL</view>
          <input class="form-input" type="text" placeholder="请输入图片URL或点击上传" v-model="editingBanner.imageUrl" />
        </view>
        <view class="form-item">
          <view class="form-label">跳转链接 (可选)</view>
          <input class="form-input" type="text" placeholder="请输入点击跳转的页面路径或URL" v-model="editingBanner.link" />
        </view>
        <view class="form-item">
          <view class="form-label">排序</view>
          <input class="form-input" type="number" placeholder="请输入排序值" v-model="editingBanner.sort" />
        </view>
        <view class="form-item">
          <view class="form-label">状态</view>
          <view class="form-switch">
            <switch 
              :checked="editingBanner.status === 1" 
              @change="(event) => {
                editingBanner.status = event ? 1 : 0;
              }"
            />
            <text>{{ editingBanner.status === 1 ? '启用' : '禁用' }}</text>
          </view>
        </view>
      </view>
      
      <view class="modal-footer">
        <button class="cancel-btn" @click="closeBannerModal">取消</button>
        <button class="confirm-btn" @click="saveBanner">确定</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/api/index.js';
import FloatButton from '@/components/FloatButton/FloatButton.vue';
import SearchBox from '@/components/SearchBox/SearchBox.vue';

// 主题状态
const isDarkMode = ref(false);

// 弹窗显示状态
const showModal = ref(false);

// 轮播图数据
const banners = ref([]);

// 搜索关键词
const searchKeyword = ref('');

// 初始化
onMounted(async () => {
  const currentTheme = uni.getStorageSync('themeMode') || 'light';
  isDarkMode.value = currentTheme === 'dark';
  
  uni.$on('themeChange', (darkMode) => {
    isDarkMode.value = darkMode;
  });
  
  // 加载轮播图列表
  await loadBanners();
});

// 加载轮播图列表
const loadBanners = async () => {
  try {
    const res = await api.adminApi.getBanners();
    
    if (res.code === 0) {
      banners.value = res.data.list || [];
    }
  } catch (error) {
    console.error('加载轮播图列表失败:', error);
    banners.value = [];
  }
};

// 搜索轮播图
const searchBanner = () => {
  // 搜索逻辑已在computed中实现
};

// 筛选后的轮播图列表
const filteredBanners = computed(() => {
  if (!searchKeyword.value) {
    return banners.value;
  }
  return banners.value.filter(banner => {
    return banner.title.includes(searchKeyword.value) || banner.id.toString().includes(searchKeyword.value);
  });
});

const getBannerImageUrl = (banner) => {
  return banner.imageUrl || banner.link || '';
};

// 编辑轮播图数据
const editingBanner = ref({
  id: null,
  title: '',
  imageUrl: '',
  link: '',
  sort: 0,
  status: 1,
  createTime: '',
  updateTime: ''
});

// 打开添加轮播图模态框
const openAddBannerModal = () => {
  resetEditingBanner();
  showModal.value = true;
};

// 关闭模态框
const closeBannerModal = () => {
  showModal.value = false;
};

// 重置编辑轮播图数据
const resetEditingBanner = () => {
  editingBanner.value = {
    id: null,
    title: '',
    imageUrl: '',
    link: '',
    sort: 0,
    status: 1,
    createTime: '',
    updateTime: ''
  };
};

// 编辑轮播图
const editBanner = (banner) => {
  editingBanner.value = { ...banner };
  showModal.value = true;
};

// 删除轮播图
const deleteBanner = (id) => {
  uni.showModal({
    title: '删除轮播图',
    content: '确定要删除该轮播图吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({
            title: '删除中...'
          });
          
          const deleteRes = await api.adminApi.deleteBanner(id);
          
          uni.hideLoading();
          
          if (deleteRes.code === 0) {
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            });
            await loadBanners();
          }
        } catch (error) {
          uni.hideLoading();
          console.error('删除轮播图失败:', error);
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 上传轮播图图片
const uploadBannerImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempUrl = res.tempFilePaths[0];
      
      uni.showLoading({
        title: '上传中...',
        mask: true
      });
      
      try {
        const uploadRes = await api.adminApi.uploadImage(tempUrl);
        
        if (uploadRes.code === 0 && uploadRes.data && uploadRes.data.url) {
          editingBanner.value.imageUrl = uploadRes.data.url;
          uni.showToast({
            title: '图片上传成功',
            icon: 'success'
          });
        } else {
          throw new Error(uploadRes.message || '上传失败');
        }
      } catch (error) {
        console.error('图片上传失败:', error);
        uni.showToast({
          title: '图片上传失败，请重试',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    fail: () => {
      uni.showToast({
        title: '图片选择失败',
        icon: 'none'
      });
    }
  });
};

// 图片加载错误处理
const onImageError = (e) => {
  // 当图片加载失败时，清空图片URL并提示用户
  editingBanner.value.imageUrl = '';
  uni.showToast({
    title: '图片加载失败，请重新上传',
    icon: 'none'
  });
};

// 轮播图状态变化
const onStatusChange = async (banner) => {
  try {
    uni.showLoading({
      title: '处理中...'
    });
    
    const updateRes = await api.adminApi.updateBannerStatus(banner.id, banner.status);
    
    uni.hideLoading();
    
    if (updateRes.code === 0) {
      uni.showToast({
        title: '状态更新成功',
        icon: 'success'
      });
      await loadBanners();
    }
  } catch (error) {
    uni.hideLoading();
    console.error('更新轮播图状态失败:', error);
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    });
  }
};

// 保存轮播图
const saveBanner = async () => {
  // 表单验证
  if (!editingBanner.value.title) {
    uni.showToast({
      title: '请输入轮播图标题',
      icon: 'none'
    });
    return;
  }
  
  if (!editingBanner.value.imageUrl && !editingBanner.value.link) {
    uni.showToast({
      title: '请上传轮播图图片或填写链接地址',
      icon: 'none'
    });
    return;
  }
  
  try {
    uni.showLoading({
      title: '保存中...'
    });
    
    let res;
    if (editingBanner.value.id) {
      res = await api.adminApi.updateBanner(editingBanner.value.id, {
        title: editingBanner.value.title,
        imageUrl: editingBanner.value.imageUrl,
        link: editingBanner.value.link,
        sort: editingBanner.value.sort,
        status: editingBanner.value.status
      });
    } else {
      res = await api.adminApi.createBanner({
        title: editingBanner.value.title,
        imageUrl: editingBanner.value.imageUrl,
        link: editingBanner.value.link,
        sort: editingBanner.value.sort,
        status: editingBanner.value.status
      });
    }
    
    uni.hideLoading();
    
    if (res.code === 0) {
      uni.showToast({
        title: editingBanner.value.id ? '编辑成功' : '添加成功',
        icon: 'success'
      });
      showModal.value = false;
      await loadBanners();
    }
  } catch (error) {
    uni.hideLoading();
    console.error('保存轮播图失败:', error);
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    });
  }
};

// 轮播图列表图片错误处理
const handleBannerImageError = (banner, e) => {
  // 当列表中的图片加载失败时，尝试修复该图片
  const imgElement = e.target;
  // 清空图片源，避免显示破碎图片图标
  imgElement.src = '';
  // 提示用户该轮播图图片加载失败
  uni.showToast({
    title: `轮播图 ${banner.title} 图片加载失败`,
    icon: 'none',
    duration: 1500
  });
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
</script>

<style scoped>
/* 基础样式 */
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
  margin-bottom: 20rpx;
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: none;
}

.back-icon {
  font-size: 36rpx;
  color: #333333;
}

.nav-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
}

.add-btn {
  padding: 16rpx 32rpx;
  background-color: #6666ff;
  color: #ffffff;
  border: none;
  border-radius: 20rpx;
  font-size: 26rpx;
  font-weight: bold;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.search-input {
  flex: 1;
  height: 70rpx;
  padding: 0 20rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 35rpx;
  font-size: 26rpx;
}

.search-btn {
  padding: 0 32rpx;
  height: 70rpx;
  background-color: #6666ff;
  color: #ffffff;
  border: none;
  border-radius: 35rpx;
  font-size: 26rpx;
  font-weight: bold;
}

/* 轮播图列表 */
.banner-list {
  flex: 1;
  padding: 20rpx;
  overflow: hidden;
}

/* 轮播图项 */
.banner-card {
  background-color: #ffffff;
  border: 1rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

/* 轮播图图片 */
.banner-image {
  width: 100%;
  height: 200rpx;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
}

/* 轮播图信息 */
.banner-info {
  display: flex;
  flex-direction: column;
}

/* 轮播图头部 */
.banner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.banner-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.banner-id {
  font-size: 24rpx;
  color: #999999;
}

/* 轮播图元信息 */
.banner-meta {
  display: flex;
  gap: 20rpx;
  margin-bottom: 16rpx;
  font-size: 24rpx;
  color: #666666;
}

/* 轮播图底部 */
.banner-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 状态开关 */
.status-section {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.status-text {
  font-size: 24rpx;
  font-weight: bold;
  color: #333333;
}

.status-switch {
  transform: scale(1.1);
}

/* 操作按钮 */
.actions-section {
  display: flex;
  gap: 12rpx;
}

.edit-btn, .delete-btn {
  padding: 12rpx 24rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: bold;
}

.edit-btn {
  background-color: #6666ff;
  color: #ffffff;
}

.delete-btn {
  background-color: #ff6666;
  color: #ffffff;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 20rpx;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.empty-action-btn {
  margin-top: 20rpx;
  padding: 16rpx 32rpx;
  background-color: #6666ff;
  color: #ffffff;
  border: none;
  border-radius: 20rpx;
  font-size: 26rpx;
  font-weight: bold;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.modal-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  border-radius: 20rpx 20rpx 0 0;
  padding: 30rpx;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 999;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.modal-close {
  font-size: 40rpx;
  color: #999999;
}

/* 表单样式 */
.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  font-size: 26rpx;
  box-sizing: border-box;
}

/* 图片上传样式 */
.banner-upload {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.banner-preview {
  width: 100%;
  height: 300rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  object-fit: cover;
  display: block;
  background-color: #f5f5f5;
}

.upload-btn {
  align-self: flex-start;
  padding: 16rpx 32rpx;
  background-color: #6666ff;
  color: #ffffff;
  border: none;
  border-radius: 12rpx;
  font-size: 24rpx;
  font-weight: bold;
}

/* 开关样式 */
.form-switch {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.form-switch text {
  font-size: 26rpx;
  color: #666666;
}

/* 模态框底部 */
.modal-footer {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  height: 80rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666666;
}

.confirm-btn {
  background-color: #6666ff;
  color: #ffffff;
}
</style>
