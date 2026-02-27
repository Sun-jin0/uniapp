<template>
  <view class="app-container">
    <header class="top-bar">
      <div class="back-btn" @click="goBack">
        <SvgIcon name="left" size="28" fill="#333" />
      </div>
      <div class="top-bar-title">我的收藏</div>
      <div class="top-bar-right" v-if="favorites.length > 0">
        <div class="action-btn" @click="startPractice">刷题</div>
        <div class="action-btn" @click="printFavorites">打印</div>
      </div>
    </header>

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
import { request } from '@/api/request';
import { katexRenderWithRetry, parseTextWithLatexForMp, containsLatex } from '@/utils/latex';
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

onMounted(() => {
  fetchCategories();
  fetchFavorites();
});
</script>

<style scoped>
.app-container {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.top-bar {
  background: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  font-size: 40rpx;
  color: #333;
  padding-right: 30rpx;
}

.top-bar-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.top-bar-right {
  display: flex;
  gap: 15rpx;
}

.action-btn {
  padding: 8rpx 24rpx;
  background: #007aff;
  color: #fff;
  border-radius: 30rpx;
  font-size: 24rpx;
  font-weight: bold;
}

.category-filter {
  background: #fff;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
  white-space: nowrap;
}

.category-scroll {
  width: 100%;
}

.category-tab {
  display: inline-block;
  padding: 10rpx 30rpx;
  margin: 0 15rpx;
  font-size: 26rpx;
  color: #666;
  background: #f5f5f5;
  border-radius: 30rpx;
  transition: all 0.3s;
}

.category-tab.active {
  color: #fff;
  background: #007aff;
  font-weight: bold;
}

.add-category-tab {
  display: inline-block;
  padding: 10rpx 20rpx;
  margin: 0 15rpx;
  font-size: 32rpx;
  color: #007aff;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 30rpx;
  vertical-align: middle;
}

.plus-icon {
  font-weight: bold;
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
  width: 80%;
  border-radius: 24rpx;
  padding: 40rpx;
}

.modal-header {
  margin-bottom: 30rpx;
  text-align: center;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
}

.modal-body {
  margin-bottom: 40rpx;
}

.category-input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #eee;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.modal-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.modal-btn.confirm {
  background: #007aff;
  color: #fff;
}

.main-content {
  padding: 30rpx;
}

.favorite-group {
  margin-bottom: 40rpx;
}

.group-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 10rpx;
  cursor: pointer;
}

.group-icon {
  font-size: 32rpx;
  margin-right: 15rpx;
}

.group-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #666;
  flex: 1;
}

.group-right {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.group-count {
  font-size: 24rpx;
  color: #999;
}

.toggle-icon {
  font-size: 20rpx;
  color: #ccc;
  transition: transform 0.3s;
}

.toggle-icon.collapsed {
  transform: rotate(-90deg);
}

.favorite-item {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  position: relative;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.remove-fav-btn {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  width: 40rpx;
  height: 40rpx;
  line-height: 36rpx;
  text-align: center;
  color: #ccc;
  font-size: 40rpx;
  z-index: 10;
}

.fav-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
  padding-right: 40rpx;
}

.fav-kptitle {
  font-size: 24rpx;
  color: #007aff;
  background: rgba(0, 122, 255, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.fav-id {
  font-size: 22rpx;
  color: #bbb;
}

.fav-preview {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 20rpx;
  display: -webkit-box;
  display: box;
  -webkit-box-orient: vertical;
  box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}

.fav-footer {
  display: flex;
  justify-content: space-between;
  border-top: 1rpx solid #f5f5f5;
  padding-top: 15rpx;
}

.fav-source {
  font-size: 22rpx;
  color: #999;
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
  padding-top: 200rpx;
  color: #999;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}

.go-study-btn {
  margin-top: 40rpx;
  padding: 20rpx 60rpx;
  background: #007aff;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
}
</style>
