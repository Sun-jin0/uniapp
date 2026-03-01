<template>
  <view class="app-container">
    <view class="category-filter">
      <scroll-view scroll-x class="category-scroll">
        <view 
          class="category-tab" 
          :class="{ active: currentCategoryId === null }"
          @click="selectCategory(null)"
        >全部</view>
        <view 
          class="category-tab" 
          v-for="cat in categories" 
          :key="cat.CategoryID"
          :class="{ active: currentCategoryId === cat.CategoryID }"
          @click="selectCategory(cat.CategoryID)"
          @longpress="handleLongPressCategory(cat)"
        >{{ cat.Title }}</view>
        <view class="add-category-tab" @click="showAddCategoryModal = true">
          <SvgIcon name="plus" size="24" fill="#007aff" />
        </view>
      </scroll-view>
    </view>

    <!-- 添加分类弹窗 -->
    <view class="modal-overlay" v-if="showAddCategoryModal" @click="showAddCategoryModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">新建收藏分类</text>
        </view>
        <view class="modal-body">
          <input 
            type="text" 
            v-model="newCategoryTitle" 
            placeholder="请输入分类名称" 
            class="category-input"
            auto-focus
          />
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="showAddCategoryModal = false">取消</button>
          <button class="modal-btn confirm" @click="handleAddCategory">确认</button>
        </view>
      </view>
    </view>

    <main class="main-content">
      <section class="favorites-section">
        <div class="favorites-list" v-if="favorites.length > 0">
          <div v-for="(group, bookTitle) in groupedFavorites" :key="bookTitle" class="favorite-group">
            <div class="group-header" @click="toggleGroup(bookTitle)">
              <div class="group-icon">
                <SvgIcon name="books" size="24" fill="#666" />
              </div>
              <span class="group-title">{{ bookTitle || '未分类题目' }}</span>
              <div class="group-right">
                <span class="group-count">{{ group.length }} 题</span>
                <div class="toggle-icon" :class="{ 'collapsed': collapsedGroups[bookTitle] }">
                  <SvgIcon name="right" size="16" fill="#ccc" />
                </div>
              </div>
            </div>
            <div v-show="!collapsedGroups[bookTitle]">
              <div v-for="item in group" :key="item.FavoriteID" class="favorite-item" @click="goToQuestion(item.QuestionID)">
                <div class="remove-fav-btn" @click.stop="removeFromFavorites(item.QuestionID)">
                  <SvgIcon name="close" size="24" fill="#ccc" />
                </div>
                <div class="fav-header">
                  <span class="fav-kptitle" v-if="item.KPTitle">{{ item.KPTitle }}</span>
                  <span class="fav-id">ID: {{ item.QuestionID }}</span>
                </div>
                <!-- #ifdef H5 -->
                <div class="fav-preview latex-content" v-html="item.QuestionText"></div>
                <!-- #endif -->
                <!-- #ifdef MP-WEIXIN -->
                <towxml class="fav-preview" :nodes="favoritesNodesCache[item.FavoriteID] || {}"></towxml>
                <!-- #endif -->
                <div class="fav-footer">
                  <span class="fav-source" v-if="item.Source">{{ item.Source }}</span>
                  <span class="fav-time">{{ formatDate(item.CreatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">
            <SvgIcon name="star" size="56" fill="#ddd" />
          </div>
          <p>暂无收藏题目</p>
          <navigator url="/pages/math/math-bookshelf" open-type="reLaunch" class="go-study-btn">去刷题</navigator>
        </div>
      </section>
    </main>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../api/request';
import { katexRenderWithRetry, parseTextWithLatexForMp, containsLatex } from '../../utils/latex';
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue';

const favorites = ref([]);
const categories = ref([]);
const currentCategoryId = ref(null);
const collapsedGroups = ref({});
const showAddCategoryModal = ref(false);
const newCategoryTitle = ref('');

// Towxml 解析结果缓存
const favoritesNodesCache = reactive({});

// #ifdef MP-WEIXIN
// 更新收藏题目节点缓存
const updateFavoritesNodes = () => {
  favorites.value.forEach((item) => {
    if (item.QuestionText && !favoritesNodesCache[item.FavoriteID]) {
      try {
        favoritesNodesCache[item.FavoriteID] = parseTextWithLatexForMp(item.QuestionText);
        console.log(`Updated favoritesNodes[${item.FavoriteID}]:`, favoritesNodesCache[item.FavoriteID]);
      } catch (e) {
        console.error(`Update favorites nodes error for ${item.FavoriteID}:`, e);
      }
    }
  });
};

// 监听 favorites 变化
watch(favorites, () => {
  updateFavoritesNodes();
}, { deep: true, immediate: true });
// #endif

const toggleGroup = (bookTitle) => {
  collapsedGroups.value[bookTitle] = !collapsedGroups.value[bookTitle];
};

const fetchCategories = async () => {
  try {
    const res = await request({
      url: '/math/favorite-categories'
    });
    categories.value = res.data || [];
  } catch (error) {
    console.error('获取收藏分类失败:', error);
  }
};

const handleAddCategory = async () => {
  if (!newCategoryTitle.value.trim()) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' });
    return;
  }
  try {
    await request({
      url: '/math/favorite-categories',
      method: 'POST',
      data: { title: newCategoryTitle.value.trim() }
    });
    newCategoryTitle.value = '';
    showAddCategoryModal.value = false;
    uni.showToast({ title: '创建成功' });
    fetchCategories();
  } catch (error) {
    console.error('创建分类失败:', error);
    uni.showToast({ title: '创建失败', icon: 'none' });
  }
};

const handleLongPressCategory = (cat) => {
  uni.showActionSheet({
    itemList: ['删除分类'],
    itemColor: '#ff4d4f',
    success: (res) => {
      if (res.tapIndex === 0) {
        confirmDeleteCategory(cat);
      }
    }
  });
};

const confirmDeleteCategory = (cat) => {
  uni.showModal({
    title: '删除分类',
    content: `确定要删除分类 "${cat.Title}" 吗？该分类下的题目将变为未分类。`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({
            url: `/math/favorite-categories/${cat.CategoryID}`,
            method: 'DELETE'
          });
          uni.showToast({ title: '删除成功' });
          if (currentCategoryId.value === cat.CategoryID) {
            currentCategoryId.value = null;
          }
          fetchCategories();
          fetchFavorites();
        } catch (error) {
          console.error('删除分类失败:', error);
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};

const fetchFavorites = async () => {
  const subjectId = uni.getStorageSync('math_selected_subject_id');
  try {
    const res = await request({
      url: '/math/favorites',
      data: { 
        subjectId,
        categoryId: currentCategoryId.value 
      }
    });
    favorites.value = res.data || [];
    
    // 默认折叠所有组
    const groups = {};
    favorites.value.forEach(item => {
      const title = item.BookTitle || '未分类题目';
      groups[title] = true;
    });
    collapsedGroups.value = groups;
  } catch (error) {
    console.error('获取收藏列表失败:', error);
  }
};

const selectCategory = (categoryId) => {
  currentCategoryId.value = categoryId;
  fetchFavorites();
};

const startPractice = () => {
  if (favorites.value.length === 0) return;

  // 保存为最近练习科目，以便在首页显示
  const practiceItem = {
    id: 'math-favorites',
    title: '数学 - 我的收藏',
    url: '/pages/math/math-my-favorites',
    icon: 'math'
  };
  uni.setStorageSync('lastPracticeSubject', practiceItem);

  // 收藏夹刷题逻辑：跳转到详情页并传入题目ID列表
  const ids = favorites.value.map(f => f.QuestionID).join(',');
  uni.navigateTo({
    url: `/pages/math/math-question-detail?ids=${ids}&mode=practice`
  });
};

const printFavorites = () => {
  if (favorites.value.length === 0) return;
  const ids = favorites.value.map(f => f.QuestionID).join(',');
  uni.navigateTo({
    url: `/pages/math/math-generated-paper?ids=${ids}&title=我的收藏`
  });
};

const groupedFavorites = computed(() => {
  const groups = {};
  favorites.value.forEach(item => {
    const title = item.BookTitle || '未分类题目';
    if (!groups[title]) {
      groups[title] = [];
    }
    groups[title].push(item);
  });
  return groups;
});

const renderLaTeX = () => {
  // #ifdef H5
  nextTick(() => {
    if (typeof document !== 'undefined') {
      const elements = document.querySelectorAll('.latex-content');
      elements.forEach(el => {
        katexRenderWithRetry(el);
      });
    }
  });
  // #endif
  // #ifdef MP-WEIXIN
  // 微信小程序不支持 DOM 操作，LaTeX 公式将以纯文本形式显示
  // #endif
};

watch(favorites, () => {
  renderLaTeX();
}, { deep: true });

const removeFromFavorites = async (questionId) => {
  uni.showModal({
    title: '确认移除',
    content: '确定要从收藏夹中移除这道题吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({ 
            url: '/math/favorites/toggle',
            method: 'POST',
            data: { questionId }
          });
          favorites.value = favorites.value.filter(f => f.QuestionID !== questionId);
          uni.showToast({ title: '已移除', icon: 'none' });
        } catch (error) {
          console.error('Failed to remove favorite:', error);
          uni.showToast({ title: '移除失败', icon: 'none' });
        }
      }
    }
  });
};

const goToQuestion = (questionId) => {
  // 获取当前显示的所有题目 ID
  const ids = favorites.value.map(f => f.QuestionID).join(',');
  uni.navigateTo({
    url: `/pages/math/math-question-detail?questionId=${questionId}&ids=${ids}`
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const goBack = () => {
  uni.navigateBack();
};

onShow(() => {
  fetchCategories();
  fetchFavorites();
});

onMounted(() => {
  // fetchFavorites(); // onShow will handle it
});
</script>

<style scoped>
.app-container {
  background-color: #f5f7fa;
  min-height: 100vh;
}

.category-filter {
  background: #fff;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #eee;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 100;
}

.category-scroll {
  width: 100%;
  padding: 0 8rpx;
}

.category-tab {
  display: inline-block;
  padding: 14rpx 28rpx;
  margin: 0 8rpx;
  font-size: 26rpx;
  color: #666;
  background: #f0f2f5;
  border-radius: 32rpx;
  transition: all 0.25s ease;
}

.category-tab.active {
  color: #fff;
  background: linear-gradient(135deg, #4db6ac 0%, #26a69a 100%);
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(77, 182, 172, 0.3);
}

.add-category-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  margin: 0 8rpx;
  background: rgba(77, 182, 172, 0.1);
  border-radius: 50%;
  vertical-align: middle;
  transition: all 0.25s ease;
}

.add-category-tab:active {
  background: rgba(77, 182, 172, 0.2);
  transform: scale(0.95);
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  width: 85%;
  max-width: 600rpx;
  border-radius: 20rpx;
  overflow: hidden;
}

.modal-header {
  padding: 32rpx;
  text-align: center;
  background: linear-gradient(135deg, #4db6ac 0%, #26a69a 100%);
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
}

.modal-body {
  padding: 32rpx;
}

.category-input {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  transition: border-color 0.2s;
}

.category-input:focus {
  border-color: #4db6ac;
}

.modal-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 30rpx;
  border: none;
  border-radius: 0;
  background: transparent;
}

.modal-btn.cancel {
  color: #666;
  border-right: 1rpx solid #f0f0f0;
}

.modal-btn.confirm {
  color: #4db6ac;
  font-weight: 600;
}

.main-content {
  padding: 20rpx 24rpx;
}

.favorite-group {
  margin-bottom: 24rpx;
}

.group-header {
  display: flex;
  align-items: center;
  padding: 16rpx 8rpx;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 12rpx;
}

.group-header:active {
  background: rgba(0, 0, 0, 0.03);
}

.group-icon {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(77, 182, 172, 0.1);
  border-radius: 10rpx;
  margin-right: 16rpx;
}

.group-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.group-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.group-count {
  font-size: 24rpx;
  color: #999;
  background: #f0f2f5;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.toggle-icon {
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.toggle-icon.collapsed {
  transform: rotate(-90deg);
}

.favorite-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  position: relative;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  border: 1rpx solid #f0f0f0;
  transition: all 0.2s ease;
}

.favorite-item:active {
  transform: scale(0.99);
  box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.06);
}

.remove-fav-btn {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 77, 79, 0.08);
  border-radius: 50%;
  z-index: 10;
  transition: all 0.2s;
}

.remove-fav-btn:active {
  background: rgba(255, 77, 79, 0.15);
}

.fav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  padding-right: 56rpx;
}

.fav-kptitle {
  font-size: 22rpx;
  color: #4db6ac;
  background: rgba(77, 182, 172, 0.1);
  padding: 6rpx 14rpx;
  border-radius: 8rpx;
  font-weight: 500;
}

.fav-id {
  font-size: 22rpx;
  color: #bbb;
  font-family: monospace;
}

.fav-preview {
  font-size: 28rpx;
  color: #333;
  line-height: 1.7;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.fav-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1rpx solid #f5f5f5;
  padding-top: 16rpx;
  margin-top: 8rpx;
}

.fav-source {
  font-size: 22rpx;
  color: #999;
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.fav-time {
  font-size: 22rpx;
  color: #bbb;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 160rpx;
  color: #999;
}

.empty-icon {
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  border-radius: 50%;
  margin-bottom: 32rpx;
}

.empty-state p {
  font-size: 28rpx;
  color: #999;
}

.go-study-btn {
  margin-top: 40rpx;
  padding: 20rpx 56rpx;
  background: linear-gradient(135deg, #4db6ac 0%, #26a69a 100%);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
  box-shadow: 0 6rpx 20rpx rgba(77, 182, 172, 0.3);
}
</style>
