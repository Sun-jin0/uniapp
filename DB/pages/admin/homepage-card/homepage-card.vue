<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    
    <!-- 悬浮添加按钮 -->
    <FloatButton 
      icon="+" 
      tooltip-text="添加卡片" 
      :right="'24px'" 
      :bottom="'100px'"
      @click="openAddCardModal"
    />
    
    <!-- 标题栏 -->
    <view class="page-header">
      <view class="header-title">首页卡片管理</view>
    </view>
    
    <!-- 卡片列表 -->
    <scroll-view 
      scroll-y 
      class="card-list-scroll" 
      :show-scrollbar="false" 
      :enhanced="true"
    >
      <view class="card-list">
        <view v-for="card in cards" :key="card.id" class="data-card" :style="{ borderLeft: `8rpx solid ${card.color}` }">
          <view class="card-header">
            <view class="card-title-row">
              <view class="card-icon-wrapper">
                <view class="card-icon-preview" v-if="card.icon">{{ card.icon }}</view>
                <view class="card-text-icon-preview" v-else-if="card.text_icon">{{ card.text_icon }}</view>
                <view class="card-image-preview" v-else-if="card.image_url">
                  <image :src="card.image_url" mode="aspectFill"></image>
                </view>
              </view>
              <view class="card-title">{{ card.title }}</view>
              <view class="card-tag" v-if="card.is_tab">Tab页</view>
            </view>
            <view class="card-status" :class="card.is_active ? 'active' : 'inactive'">
              {{ card.is_active ? '启用' : '禁用' }}
            </view>
          </view>
          
          <view class="card-body">
            <view class="info-row">
              <text class="label">分类:</text>
              <text class="value">
                {{ card.category === 'professional' ? '专业课' : (card.category === 'selected' ? '精选' : '公共课') }}
              </text>
            </view>
            <view class="info-row">
              <text class="label">描述:</text>
              <text class="value">{{ card.description }}</text>
            </view>
            <view class="info-row">
              <text class="label">链接:</text>
              <text class="value">{{ card.url }}</text>
            </view>
            <view class="info-row">
              <text class="label">颜色:</text>
              <view class="color-preview" :style="{ backgroundColor: card.color }"></view>
              <text class="value">{{ card.color }}</text>
            </view>
            <view class="info-row">
              <text class="label">排序:</text>
              <text class="value">{{ card.sort_order }}</text>
            </view>
          </view>
          
          <view class="card-footer">
            <view class="footer-left">
              <switch 
                :checked="card.is_active === 1" 
                @change="(e) => handleStatusChange(card, e)"
                transform="scale(0.8)"
              />
            </view>
            <view class="footer-right">
              <button class="action-btn edit" @click="editCard(card)">编辑</button>
              <button class="action-btn delete" @click="deleteCard(card.id)">删除</button>
            </view>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view class="empty-state" v-if="cards.length === 0">
          <view class="empty-icon">📇</view>
          <view class="empty-text">暂无卡片数据</view>
          <button class="empty-action-btn" @click="openAddCardModal">添加卡片</button>
        </view>
      </view>
    </scroll-view>
    
    <!-- 添加/编辑模态框 -->
    <view v-if="showModal" class="modal-overlay" @click="closeModal"></view>
    <view v-if="showModal" class="modal-container">
      <view class="modal-header">
        <view class="modal-title">{{ editingCard.id ? '编辑卡片' : '添加卡片' }}</view>
        <view class="modal-close" @click="closeModal">×</view>
      </view>
      
      <scroll-view scroll-y class="modal-content">
        <view class="form-item">
          <view class="form-label-row">
            <view class="form-label">标题 (uni-navigator 这里的标题)</view>
            <view class="select-book-btn" @click="openBookSelector">选择已有书籍</view>
          </view>
          <input class="form-input" type="text" placeholder="请输入卡片标题" v-model="editingCard.title" />
        </view>

        <view class="form-item">
          <view class="form-label">所属分类</view>
          <radio-group class="radio-group" @change="(e) => editingCard.category = e.detail.value">
            <label class="radio-label">
              <radio value="public" :checked="editingCard.category === 'public' || !editingCard.category" /> 公共课
            </label>
            <label class="radio-label">
              <radio value="professional" :checked="editingCard.category === 'professional'" /> 专业课
            </label>
            <label class="radio-label">
              <radio value="selected" :checked="editingCard.category === 'selected'" /> 精选
            </label>
          </radio-group>
        </view>
        
        <view class="form-item">
          <view class="form-label">描述 (对应的文字内容)</view>
          <input class="form-input" type="text" placeholder="请输入卡片描述" v-model="editingCard.description" />
        </view>
        
        <view class="form-item">
          <view class="form-label">图标 (推荐输入 Unicode 符号，如 💻)</view>
          <input class="form-input" type="text" placeholder="例如: 💻" v-model="editingCard.icon" @input="validateIcon" />
        </view>

        <view class="form-item">
          <view class="form-label">文字图标 (如果图标为空，显示此文字)</view>
          <input class="form-input" type="text" placeholder="例如: 计" v-model="editingCard.text_icon" />
        </view>
        
        <view class="form-item">
          <view class="form-label">背景颜色</view>
          <view class="color-picker-row">
            <input class="form-input color-input" type="text" placeholder="#RRGGBB" v-model="editingCard.color" />
            <view class="color-preview-large" :style="{ backgroundColor: editingCard.color }"></view>
          </view>
          <view class="color-presets">
            <view class="color-preset" v-for="c in presetColors" :key="c" :style="{ backgroundColor: c }" @click="editingCard.color = c"></view>
          </view>
        </view>
        
        <view class="form-item">
          <view class="form-label">跳转链接 (默认题库页面)</view>
          <input class="form-input" type="text" placeholder="/pages/practice/practice-detail?id=xxx" v-model="editingCard.url" />
          <view class="input-hint">格式: /pages/practice/practice-detail?id=科目ID</view>
        </view>
        
        <view class="form-item">
          <view class="form-label">图片 URL (可选，替代图标)</view>
          <input class="form-input" type="text" placeholder="http://..." v-model="editingCard.image_url" />
        </view>
        
        <view class="form-item">
          <view class="form-label">卡片高度 (rpx, 默认100)</view>
          <input class="form-input" type="number" placeholder="100" v-model="editingCard.height" />
        </view>
        
        <view class="form-item">
          <view class="form-label">排序值 (越小越靠前)</view>
          <input class="form-input" type="number" placeholder="0" v-model="editingCard.sort_order" />
        </view>
        
        <view class="form-item switch-item">
          <view class="form-label">Tab页跳转</view>
          <switch :checked="editingCard.is_tab === 1" @change="(e) => editingCard.is_tab = e.detail.value ? 1 : 0" />
          <view class="switch-desc">如果是底部导航栏页面，必须开启此项</view>
        </view>
        
        <view class="form-item switch-item">
          <view class="form-label">启用状态</view>
          <switch :checked="editingCard.is_active === 1" @change="(e) => editingCard.is_active = e.detail.value ? 1 : 0" />
        </view>
      </scroll-view>
      
      <view class="modal-footer">
        <button class="cancel-btn" @click="closeModal">取消</button>
        <button class="confirm-btn" @click="saveCard">确定</button>
      </view>
    </view>

    <!-- 书籍选择器 -->
    <view v-if="showBookSelector" class="sub-modal-overlay" @click="showBookSelector = false"></view>
    <view v-if="showBookSelector" class="sub-modal-container">
      <view class="sub-modal-header">
        <view class="sub-modal-title">选择书籍</view>
        <view class="sub-modal-close" @click="showBookSelector = false">×</view>
      </view>
      <view class="search-bar">
        <input class="search-input" type="text" placeholder="搜索书籍名称..." v-model="bookSearchKeyword" />
      </view>
      <scroll-view scroll-y class="book-list">
        <view v-for="book in filteredBooks" :key="book.id" class="book-item" @click="selectBook(book)">
          <view class="book-name">{{ book.title }}</view>
          <view class="book-desc" v-if="book.description">{{ book.description }}</view>
        </view>
        <view class="empty-state" v-if="filteredBooks.length === 0">
          <text>未找到相关书籍</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/api/index.js';
import FloatButton from '@/components/FloatButton/FloatButton.vue';

const isDarkMode = ref(false);
const cards = ref([]);
const showModal = ref(false);
const showBookSelector = ref(false);
const allBooks = ref([]);
const bookSearchKeyword = ref('');

const filteredBooks = computed(() => {
  if (!bookSearchKeyword.value) return allBooks.value;
  const keyword = bookSearchKeyword.value.toLowerCase();
  return allBooks.value.filter(book => 
    (book.title && book.title.toLowerCase().includes(keyword)) || 
    (book.description && book.description.toLowerCase().includes(keyword))
  );
});

const presetColors = [
  '#e3f2fd', '#e8f5e9', '#fce4ec', '#fff3e0', '#f3e5f5', '#e0f7fa', 
  '#f1f8e9', '#fffde7', '#efebe9', '#fafafa', '#ffe0b2', '#d1c4e9',
  '#ffcdd2', '#f8bbd0', '#e1bee7', '#d1c4e9', '#c5cae9', '#bbdefb',
  '#b3e5fc', '#b2ebf2', '#b2dfdb', '#c8e6c9', '#dcedc8', '#f0f4c3'
];

const editingCard = ref({
  id: null,
  title: '',
  category: 'public',
  description: '',
  icon: '',
  text_icon: '',
  color: '#e3f2fd',
  url: '/pages/practice/practice-detail?id=',
  image_url: '',
  height: 140,
  sort_order: 0,
  is_active: 1,
  is_tab: 0
});

onMounted(() => {
  const currentTheme = uni.getStorageSync('themeMode') || 'light';
  isDarkMode.value = currentTheme === 'dark';
  uni.$on('themeChange', (darkMode) => isDarkMode.value = darkMode);
  loadCards();
});

const loadCards = async () => {
  try {
    const res = await api.adminApi.getHomepageCards();
    if (res.code === 0) {
      cards.value = res.data.map(card => ({
        ...card,
        height: card.height || 140,
        category: card.category || 'public'
      }));
    }
  } catch (error) {
    console.error('Failed to load cards:', error);
    uni.showToast({ title: '加载失败', icon: 'none' });
  }
};

const openAddCardModal = () => {
  editingCard.value = {
    id: null,
    title: '',
    category: 'public',
    description: '',
    icon: '',
    text_icon: '',
    color: '#e3f2fd',
    url: '/pages/public-book-detail/public-book-detail?bookId=',
    image_url: '',
    height: 140,
    sort_order: cards.value.length,
    is_active: 1,
    is_tab: 0
  };
  showModal.value = true;
};

const openBookSelector = async () => {
  if (allBooks.value.length === 0) {
    uni.showLoading({ title: '加载书籍...' });
    try {
      console.log('Fetching public books...');
      // 传入参数以获取所有书籍（包括未启用的）
      const res = await api.publicApi.getPublicBooks({ 
        subject: 'all',
        includeInactive: 'true'
      });
      console.log('GetPublicBooks response:', res);
      if (res.code === 0) {
        allBooks.value = Array.isArray(res.data) ? res.data : [];
        if (allBooks.value.length === 0) {
          uni.showToast({ title: '暂无可用书籍', icon: 'none' });
        }
      } else {
        uni.showToast({ title: res.msg || '获取书籍失败', icon: 'none' });
      }
    } catch (error) {
      console.error('Failed to load books:', error);
      uni.showToast({ title: '加载书籍失败', icon: 'none' });
    } finally {
      uni.hideLoading();
    }
  }
  showBookSelector.value = true;
};

const selectBook = (book) => {
  editingCard.value.title = book.title;
  editingCard.value.description = book.description || book.title;
  editingCard.value.url = `/pages/public-book-detail/public-book-detail?bookId=${book.id}&title=${encodeURIComponent(book.title)}`;
  editingCard.value.category = 'selected';
  
  if (book.title && !editingCard.value.text_icon) {
    editingCard.value.text_icon = book.title.charAt(0);
  }
  
  showBookSelector.value = false;
  uni.showToast({ title: '已选择书籍', icon: 'none' });
};

const closeModal = () => {
  showModal.value = false;
};

const editCard = (card) => {
  editingCard.value = { ...card };
  showModal.value = true;
};

const deleteCard = (id) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个卡片吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await api.adminApi.deleteHomepageCard(id);
          if (result.code === 0) {
            uni.showToast({ title: '删除成功', icon: 'success' });
            loadCards();
          }
        } catch (error) {
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};

const handleStatusChange = async (card, e) => {
  const newStatus = e.detail.value ? 1 : 0;
  try {
    card.is_active = newStatus; // Optimistic update
    await api.adminApi.updateHomepageCard(card.id, { ...card, is_active: newStatus });
  } catch (error) {
    card.is_active = newStatus === 1 ? 0 : 1; // Revert
    uni.showToast({ title: '状态更新失败', icon: 'none' });
  }
};

const saveCard = async () => {
  if (!editingCard.value.title) return uni.showToast({ title: '请输入标题', icon: 'none' });
  if (!editingCard.value.url) return uni.showToast({ title: '请输入链接', icon: 'none' });

  try {
    uni.showLoading({ title: '保存中' });
    let res;
    if (editingCard.value.id) {
      res = await api.adminApi.updateHomepageCard(editingCard.value.id, editingCard.value);
    } else {
      res = await api.adminApi.createHomepageCard(editingCard.value);
    }
    
    uni.hideLoading();
    if (res.code === 0) {
      uni.showToast({ title: '保存成功', icon: 'success' });
      showModal.value = false;
      loadCards();
    }
  } catch (error) {
    uni.hideLoading();
    uni.showToast({ title: '保存失败', icon: 'none' });
  }
};
</script>

<style scoped>
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

.dark-mode {
  background-color: #121212;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0 !important;
  height: 0 !important;
  -webkit-appearance: none;
  background: transparent;
}

.page-header {
  padding: 30rpx 40rpx;
  background-color: #ffffff;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
}

.dark-mode .page-header {
  background-color: #1e1e1e;
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.dark-mode .header-title {
  color: #ffffff;
}

.card-list-scroll {
  flex: 1;
  height: 0; /* 关键：让 flex-grow 起作用 */
}

.card-list {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.data-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.card-icon-wrapper {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 12rpx;
  overflow: hidden;
}

.card-icon-preview {
  font-size: 32rpx;
}

.card-text-icon-preview {
  font-size: 24rpx;
  color: #666;
  font-weight: bold;
}

.card-image-preview {
  width: 100%;
  height: 100%;
}

.card-image-preview image {
  width: 100%;
  height: 100%;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.card-tag {
  font-size: 20rpx;
  background: #e3f2fd;
  color: #1976d2;
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
}

.card-status {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.card-status.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.card-status.inactive {
  background: #ffebee;
  color: #c62828;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
  font-size: 28rpx;
}

.label {
  color: #666;
  width: 100rpx;
}

.value {
  color: #333;
  flex: 1;
}

.color-preview {
  width: 30rpx;
  height: 30rpx;
  border-radius: 4rpx;
  border: 1rpx solid #ddd;
  margin-right: 10rpx;
}

.card-footer {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-right {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  font-size: 24rpx;
  padding: 10rpx 30rpx;
  border-radius: 30rpx;
  border: none;
}

.edit {
  background: #e3f2fd;
  color: #1976d2;
}

.delete {
  background: #ffebee;
  color: #c62828;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 998;
}

.modal-container {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  z-index: 999;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #eee;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
}

.modal-content {
  padding: 30rpx;
  flex: 1;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.select-book-btn {
  font-size: 24rpx;
  color: #6666ff;
  background: #f0f0ff;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

/* Sub Modal (Book Selector) */
.sub-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 1000;
}

.sub-modal-container {
  position: fixed;
  top: 10%; left: 5%; right: 5%; bottom: 10%;
  background: #fff;
  border-radius: 24rpx;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sub-modal-header {
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #eee;
}

.sub-modal-title {
  font-size: 32rpx;
  font-weight: bold;
}

.sub-modal-close {
  font-size: 40rpx;
  color: #999;
  padding: 0 10rpx;
}

.search-bar {
  padding: 20rpx 30rpx;
  background: #f8f9fa;
}

.search-input {
  background: #fff;
  border: 1rpx solid #ddd;
  padding: 16rpx 24rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.book-list {
  flex: 1;
  padding: 0 30rpx;
}

.book-item {
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.book-item:active {
  background: #f9f9f9;
}

.book-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.book-desc {
  font-size: 24rpx;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-footer {
  display: flex;
  gap: 40rpx;
  padding: 10rpx 0;
}

.radio-label {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #333;
  gap: 10rpx;
}

.form-input {
  border: 1rpx solid #ddd;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.input-hint {
  font-size: 22rpx;
  color: #f57c00;
  margin-top: 8rpx;
}

.color-picker-row {
  display: flex;
  gap: 20rpx;
}

.color-preview-large {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  border: 1rpx solid #ddd;
}

.color-presets {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
  flex-wrap: wrap;
}

.color-preset {
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  border: 1rpx solid #eee;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch-desc {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}

.modal-footer {
  padding: 30rpx;
  display: flex;
  gap: 30rpx;
  border-top: 1rpx solid #eee;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  border: none;
  border-radius: 40rpx;
  font-size: 30rpx;
  padding: 20rpx 0;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background: #6666ff;
  color: #fff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  color: #999;
  font-size: 28rpx;
}

.empty-action-btn {
  margin-top: 30rpx;
  background: #6666ff;
  color: #fff;
  font-size: 28rpx;
  padding: 10rpx 40rpx;
  border-radius: 30rpx;
}
</style>
