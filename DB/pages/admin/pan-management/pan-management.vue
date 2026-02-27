<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    <view class="header">
      <view class="back-btn" @click="goBack">
        <text class="icon">❮</text>
      </view>
      <text class="title">网盘资源管理</text>
      <view class="header-actions">
        <!-- 合并的操作按钮 -->
        <view class="action-menu">
          <button class="menu-btn" @click="toggleActionMenu">
            <text class="menu-icon">⋮⋮</text>
            <text class="menu-text">{{ isActionMenuOpen ? '收起' : '操作' }}</text>
          </button>
          <view v-if="isActionMenuOpen" class="menu-dropdown">
            <button class="dropdown-btn manage-btn" @click="toggleBatchMode">{{ isBatchMode ? '退出管理' : '批量管理' }}</button>
            <button class="dropdown-btn category-btn" @click="openCategoryModal">分类管理</button>
            <button class="dropdown-btn sync-btn" @click="openSyncModal">批量获取</button>
            <button class="dropdown-btn add-btn" @click="openAddModal">添加资源</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 分类管理弹窗 -->
    <view v-if="showCategoryModal" class="modal-mask" @click="closeCategoryModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text>分类管理</text>
          <text class="close-btn" @click="closeCategoryModal">×</text>
        </view>
        <view class="modal-body category-modal-body">
          <view class="add-category-form">
            <input class="category-input" v-model="newCategoryName" placeholder="新分类名称" />
            <button class="add-cat-btn" @click="handleAddCategory">添加</button>
          </view>
          <scroll-view scroll-y class="category-list">
            <view v-for="cat in fullCategories" :key="cat.CategoryID" class="category-item">
              <input 
                class="cat-name-input" 
                v-model="cat.CategoryName" 
                @blur="handleUpdateCategory(cat)"
              />
              <view class="cat-actions">
                <text class="cat-delete" @click="handleDeleteCategory(cat)">删除</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>

    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input 
          type="text" 
          v-model="searchKeyword" 
          placeholder="搜索资源标题或描述..." 
          @confirm="handleSearch"
        />
      </view>
      <picker @change="handleCategoryChange" :value="categoryIndex" :range="categories">
        <view class="category-picker">
          <text>{{ categories[categoryIndex] }}</text>
          <text class="arrow">▼</text>
        </view>
      </picker>
    </view>

    <scroll-view scroll-y class="resource-list" @scrolltolower="loadMore">
      <view v-if="loading && page === 1" class="loading-state">加载中...</view>
      <view v-else-if="resources.length === 0" class="empty-state">暂无资源</view>
      
      <view 
        v-for="item in resources" 
        :key="item.ResourceID" 
        class="resource-card"
        :class="{ 'batch-active': isBatchMode, 'selected': selectedIds.includes(item.ResourceID) }"
        @click="isBatchMode ? toggleSelect(item.ResourceID) : null"
      >
        <view class="checkbox-container" v-if="isBatchMode">
          <view class="checkbox" :class="{ checked: selectedIds.includes(item.ResourceID) }">
            <text class="check-icon" v-if="selectedIds.includes(item.ResourceID)">✓</text>
          </view>
        </view>
        <view class="card-content">
          <view class="card-header">
            <view class="title-wrap">
              <text class="new-badge" v-if="item.IsNew">NEW</text>
              <text class="resource-title">{{ item.Title }}</text>
            </view>
            <text class="category-tag">{{ item.Category }}</text>
          </view>
          
          <view class="card-body">
            <view class="link-info" v-if="item.QuarkUrl">
              <text class="link-label quark">夸克:</text>
              <text class="link-text">{{ item.QuarkUrl }}</text>
            </view>
            <view class="link-info" v-if="item.BaiduUrl">
              <text class="link-label baidu">百度:</text>
              <text class="link-text">{{ item.BaiduUrl }}</text>
            </view>
            <text class="description" v-if="item.Description">{{ item.Description }}</text>
          </view>
          
          <view class="card-footer" v-if="!isBatchMode">
            <text class="update-time">{{ formatDate(item.CreatedAt) }}</text>
            <view class="actions">
              <button class="btn edit" @click.stop="openEditModal(item)">编辑</button>
              <button class="btn delete" @click.stop="handleDelete(item)">删除</button>
            </view>
          </view>
        </view>
      </view>
      
      <view v-if="loading && page > 1" class="loading-more">正在加载更多...</view>
      <view v-if="noMore && resources.length > 0" class="no-more">没有更多了</view>
    </scroll-view>

    <!-- 添加/编辑弹窗 -->
    <view v-if="showEditModal" class="modal-mask" @click="closeEditModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text>{{ isEditing ? '编辑资源' : '添加资源' }}</text>
          <text class="close-btn" @click="closeEditModal">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="label">标题</text>
            <input class="input" v-model="editForm.Title" placeholder="请输入资源标题" />
          </view>
          <view class="form-item">
            <text class="label">分类</text>
            <input class="input" v-model="editForm.Category" placeholder="请输入分类名称" />
          </view>
          <view class="form-item">
            <text class="label">夸克链接</text>
            <input class="input" v-model="editForm.QuarkUrl" placeholder="https://pan.quark.cn/s/..." />
          </view>
          <view class="form-item">
            <text class="label">百度链接</text>
            <input class="input" v-model="editForm.BaiduUrl" placeholder="https://pan.baidu.com/s/..." />
          </view>
          <view class="form-item">
            <text class="label">描述</text>
            <textarea class="textarea" v-model="editForm.Description" placeholder="请输入资源描述" maxlength="-1"></textarea>
          </view>
          <view class="form-item row">
            <text class="label">标记为新</text>
            <switch :checked="editForm.IsNew" @change="e => editForm.IsNew = e.detail.value" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="cancel-btn" @click="closeEditModal">取消</button>
          <button class="confirm-btn" @click="handleSave">保存</button>
        </view>
      </view>
    </view>

    <!-- 批量获取/同步弹窗 -->
    <view v-if="showSyncModal" class="modal-mask" @click="closeSyncModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text>批量获取网盘内容</text>
          <text class="close-btn" @click="closeSyncModal">×</text>
        </view>
        <view class="modal-body">
          <view class="tips">
            <text>请粘贴包含网盘链接的文本，系统将自动识别标题和链接。支持百度网盘和夸克网盘。</text>
          </view>
          <textarea 
            class="sync-textarea" 
            v-model="rawSyncText" 
            placeholder="例如：\n【资源标题】链接：https://pan.quark.cn/s/xxx\n或\n标题 https://pan.baidu.com/s/xxx"
            maxlength="-1"
          ></textarea>
        </view>
        <view class="modal-footer">
          <button class="cancel-btn" @click="closeSyncModal">取消</button>
          <button class="confirm-btn" :loading="parsing" @click="handleParse">开始解析</button>
        </view>
      </view>
    </view>

    <!-- 批量解析预览弹窗 -->
    <view v-if="showPreviewModal" class="modal-mask" @click="closePreviewModal">
      <view class="modal-content preview-modal" @click.stop>
        <view class="modal-header">
          <text>解析结果预览 ({{ parsedResults.length }}条)</text>
          <text class="close-btn" @click="closePreviewModal">×</text>
        </view>
        <view class="modal-body preview-body">
          <view class="preview-tips">
            <text>请检查解析结果，您可以直接修改标题和链接。标红项表示存在差异或更新。</text>
          </view>
          <scroll-view scroll-y class="preview-list">
            <view v-for="(item, index) in parsedResults" :key="index" class="preview-card" :class="item.action">
              <view class="preview-card-header">
                <view class="action-badge" :class="item.action">
                  {{ item.action === 'create' ? '新增' : item.action === 'supplement' ? '补充' : item.action === 'update' ? '更新' : '忽略' }}
                </view>
                <input class="preview-title-input" v-model="item.Title" placeholder="标题" />
                <text class="preview-diff" v-if="item.diffs && item.diffs.length">({{ item.diffs.join(', ') }})</text>
              </view>
              <view class="preview-card-body">
                <view class="preview-form-row">
                  <text class="preview-label">分类:</text>
                  <input class="preview-input" v-model="item.Category" placeholder="分类" />
                </view>
                <view class="preview-form-row">
                  <text class="preview-label">夸克:</text>
                  <input class="preview-input" v-model="item.QuarkUrl" placeholder="夸克链接" />
                </view>
                <view class="preview-form-row">
                  <text class="preview-label">百度:</text>
                  <input class="preview-input" v-model="item.BaiduUrl" placeholder="百度链接" />
                </view>
              </view>
              <view class="preview-card-footer">
                <button class="remove-preview-btn" @click="removePreviewItem(index)">排除</button>
              </view>
            </view>
          </scroll-view>
        </view>
        <view class="modal-footer">
          <button class="cancel-btn" @click="closePreviewModal">取消</button>
          <button class="confirm-btn" :loading="importing" @click="handleImport">确认导入</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue';

const { appContext } = getCurrentInstance();
const api = appContext.config.globalProperties.$api;

const isDarkMode = ref(uni.getStorageSync('themeMode') === 'dark');
const loading = ref(false);
const resources = ref([]);
const categories = ref(['全部分类']);
const categoryIndex = ref(0);
const searchKeyword = ref('');
const page = ref(1);
const noMore = ref(false);

const showEditModal = ref(false);
const isEditing = ref(false);
const editForm = reactive({
  ResourceID: null,
  Title: '',
  Category: '',
  QuarkUrl: '',
  BaiduUrl: '',
  Description: '',
  IsNew: false,
  UpdateStatus: '已完结'
});

const showSyncModal = ref(false);
const rawSyncText = ref('');
const parsing = ref(false);

const showPreviewModal = ref(false);
const parsedResults = ref([]);
const importing = ref(false);

const isBatchMode = ref(false);
const selectedIds = ref([]);
const showBatchCategoryModal = ref(false);
const batchTargetCategory = ref('');

const isActionMenuOpen = ref(false);
const toggleActionMenu = () => {
  isActionMenuOpen.value = !isActionMenuOpen.value;
};

const showCategoryModal = ref(false);
const fullCategories = ref([]);
const newCategoryName = ref('');

const fetchResources = async (reset = false) => {
  if (reset) {
    page.value = 1;
    resources.value = [];
    noMore.value = false;
  }
  
  if (loading.value || noMore.value) return;
  
  loading.value = true;
  try {
    const params = {
      search: searchKeyword.value,
      category: categoryIndex.value === 0 ? '' : categories.value[categoryIndex.value]
    };
    
    const res = await api.adminApi.getPanResources(params);
    if (res.code === 0) {
      if (reset) {
        resources.value = res.data;
      } else {
        resources.value = [...resources.value, ...res.data];
      }
      if (res.data.length < 20) {
        noMore.value = true;
      }
    }
  } catch (err) {
    console.error('获取资源失败:', err);
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await api.adminApi.getPanCategories();
    if (res.code === 0) {
      categories.value = ['全部分类', ...res.data];
    }
  } catch (err) {
    console.error('获取分类失败:', err);
  }
};

const onSearch = () => {
  fetchResources(true);
};

const clearSearch = () => {
  searchKeyword.value = '';
  fetchResources(true);
};

const selectCategory = (index) => {
  categoryIndex.value = index;
  fetchResources(true);
};

const loadMore = () => {
  // if (!noMore.value) {
  //   page.value++;
  //   fetchResources();
  // }
};

const openEditModal = (item = null) => {
  if (item) {
    isEditing.value = true;
    Object.assign(editForm, item);
  } else {
    isEditing.value = false;
    editForm.ResourceID = null;
    editForm.Title = '';
    editForm.Category = categories.value[1] || '';
    editForm.QuarkUrl = '';
    editForm.BaiduUrl = '';
    editForm.Description = '';
    editForm.IsNew = false;
    editForm.UpdateStatus = '已完结';
  }
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
};

const handleSave = async () => {
  if (!editForm.Title || !editForm.Category) {
    return uni.showToast({ title: '标题和分类必填', icon: 'none' });
  }
  
  try {
    let res;
    if (isEditing.value) {
      res = await api.adminApi.updatePanResource(editForm.ResourceID, editForm);
    } else {
      res = await api.adminApi.createPanResource(editForm);
    }
    
    if (res.code === 0) {
      uni.showToast({ title: '保存成功' });
      closeEditModal();
      fetchResources(true);
      fetchCategories();
    }
  } catch (err) {
    console.error('保存失败:', err);
  }
};

const handleDelete = (item) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除该资源吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await api.adminApi.deletePanResource(item.ResourceID);
          if (result.code === 0) {
            uni.showToast({ title: '删除成功' });
            fetchResources(true);
          }
        } catch (err) {
          console.error('删除失败:', err);
        }
      }
    }
  });
};

const openSyncModal = () => {
  showSyncModal.value = true;
};

const closeSyncModal = () => {
  showSyncModal.value = false;
  rawSyncText.value = '';
};

const handleParse = async () => {
  if (!rawSyncText.value.trim()) {
    return uni.showToast({ title: '请粘贴文本', icon: 'none' });
  }
  
  parsing.value = true;
  try {
    const res = await api.adminApi.parsePanResources({ rawText: rawSyncText.value });
    if (res.code === 0) {
      if (res.data.length === 0) {
        uni.showToast({ title: '未识别到资源', icon: 'none' });
      } else {
        parsedResults.value = res.data;
        showPreviewModal.value = true;
        closeSyncModal();
      }
    }
  } catch (err) {
    console.error('解析失败:', err);
  } finally {
    parsing.value = false;
  }
};

const toggleBatchMode = () => {
  isBatchMode.value = !isBatchMode.value;
  if (!isBatchMode.value) {
    selectedIds.value = [];
  }
};

const toggleSelect = (id) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
};

const toggleSelectAll = () => {
  if (selectedIds.value.length === resources.value.length && resources.value.length > 0) {
    selectedIds.value = [];
  } else {
    selectedIds.value = resources.value.map(item => item.ResourceID);
  }
};

const handleBatchDelete = () => {
  if (selectedIds.value.length === 0) {
    return uni.showToast({ title: '请先选择资源', icon: 'none' });
  }
  
  uni.showModal({
    title: '批量删除确认',
    content: `确定要删除选中的 ${selectedIds.value.length} 条资源吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await api.adminApi.batchDeletePanResources({ ids: selectedIds.value });
          if (result.code === 0) {
            uni.showToast({ title: '批量删除成功' });
            selectedIds.value = [];
            isBatchMode.value = false;
            fetchResources(true);
          }
        } catch (err) {
          console.error('批量删除失败:', err);
        }
      }
    }
  });
};

const openBatchCategoryModal = () => {
  if (selectedIds.value.length === 0) {
    return uni.showToast({ title: '请先选择资源', icon: 'none' });
  }
  batchTargetCategory.value = categories.value[1] || '';
  showBatchCategoryModal.value = true;
};

const closeBatchCategoryModal = () => {
  showBatchCategoryModal.value = false;
};

const handleBatchUpdateCategory = async () => {
  if (!batchTargetCategory.value) {
    return uni.showToast({ title: '请选择目标分类', icon: 'none' });
  }
  
  try {
    const res = await api.adminApi.batchUpdatePanResourcesCategory({
      ids: selectedIds.value,
      category: batchTargetCategory.value
    });
    
    if (res.code === 0) {
      uni.showToast({ title: '批量修改成功' });
      closeBatchCategoryModal();
      selectedIds.value = [];
      isBatchMode.value = false;
      fetchResources(true);
      fetchCategories();
    }
  } catch (err) {
    console.error('批量修改分类失败:', err);
  }
};

const closePreviewModal = () => {
  showPreviewModal.value = false;
  parsedResults.value = [];
};

const removePreviewItem = (index) => {
  parsedResults.value.splice(index, 1);
};

const handleImport = async () => {
  if (parsedResults.value.length === 0) return;
  
  importing.value = true;
  try {
    const res = await api.adminApi.importPanResources({ resources: parsedResults.value });
    if (res.code === 0) {
      uni.showToast({ 
        title: `导入成功: 新增${res.data.createdCount}, 更新${res.data.updatedCount}`,
        duration: 2000
      });
      closePreviewModal();
      fetchResources(true);
      fetchCategories();
    }
  } catch (err) {
    console.error('导入失败:', err);
  } finally {
    importing.value = false;
  }
};

const openCategoryModal = async () => {
  showCategoryModal.value = true;
  fetchFullCategories();
};

const closeCategoryModal = () => {
  showCategoryModal.value = false;
};

const fetchFullCategories = async () => {
  try {
    const res = await api.adminApi.getPanCategories(true);
    if (res.code === 0) {
      fullCategories.value = res.data;
    }
  } catch (err) {
    console.error('获取完整分类失败:', err);
  }
};

const handleAddCategory = async () => {
  if (!newCategoryName.value.trim()) return;
  try {
    const res = await api.adminApi.createPanCategory({ name: newCategoryName.value.trim() });
    if (res.code === 0) {
      newCategoryName.value = '';
      fetchFullCategories();
      fetchCategories();
    }
  } catch (err) {
    console.error('添加分类失败:', err);
  }
};

const handleUpdateCategory = async (cat) => {
  try {
    await api.adminApi.updatePanCategory(cat.CategoryID, { 
      name: cat.CategoryName,
      sortOrder: cat.SortOrder 
    });
    fetchCategories();
  } catch (err) {
    console.error('更新分类失败:', err);
  }
};

const handleDeleteCategory = async (cat) => {
  uni.showModal({
    title: '提示',
    content: `确定要删除分类“${cat.CategoryName}”吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await api.adminApi.deletePanCategory(cat.CategoryID);
          if (result.code === 0) {
            fetchFullCategories();
            fetchCategories();
          }
        } catch (err) {
          console.error('删除分类失败:', err);
        }
      }
    }
  });
};

const goBack = () => {
  uni.navigateBack();
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

onMounted(() => {
  fetchResources();
  fetchCategories();
});
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-bottom: 40rpx;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.back-btn {
  padding: 8rpx 16rpx 8rpx 0;
}

.back-btn .icon {
  font-size: 32rpx;
  color: #333;
}

.title {
  flex: 1;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12rpx;
  position: relative;
}

/* 操作菜单样式 */
.action-menu {
  position: relative;
  z-index: 101;
}

.menu-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  padding: 0 16rpx;
  height: 48rpx;
  line-height: 48rpx;
  border-radius: 24rpx;
  margin: 0;
  background-color: #6666ff;
  color: #fff;
  white-space: nowrap;
}

.menu-icon {
  font-size: 24rpx;
  line-height: 1;
}

.menu-text {
  font-size: 22rpx;
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8rpx;
  background-color: #fff;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.1);
  padding: 8rpx 0;
  min-width: 200rpx;
  z-index: 101;
}

.dropdown-btn {
  display: block;
  width: 100%;
  font-size: 22rpx;
  padding: 12rpx 16rpx;
  margin: 0;
  border: none;
  border-radius: 0;
  text-align: left;
  background: none;
  color: #333;
  transition: background-color 0.2s ease;
}

.dropdown-btn:hover {
  background-color: #f5f5f5;
}

.dropdown-btn.manage-btn:hover {
  background-color: #f0f0f0;
}

.dropdown-btn.category-btn:hover {
  background-color: #f0f0f0;
}

.dropdown-btn.sync-btn {
  color: #4facfe;
}

.dropdown-btn.sync-btn:hover {
  background-color: #f0f7ff;
}

.dropdown-btn.add-btn {
  color: #6666ff;
}

.dropdown-btn.add-btn:hover {
  background-color: #f0f0ff;
}

/* 暗色模式下拉菜单 */
.dark-mode .menu-dropdown {
  background-color: #2a2a2a;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.3);
}

.dark-mode .dropdown-btn {
  color: #eee;
}

.dark-mode .dropdown-btn:hover {
  background-color: #3a3a3a;
}

.dark-mode .dropdown-btn.sync-btn:hover {
  background-color: rgba(79, 172, 254, 0.1);
}

.dark-mode .dropdown-btn.add-btn:hover {
  background-color: rgba(102, 102, 255, 0.1);
}

.search-bar {
  display: flex;
  padding: 16rpx 24rpx;
  background-color: #fff;
  gap: 16rpx;
  margin-bottom: 10rpx;
  flex-wrap: wrap;
}

.search-input-wrap {
  flex: 1;
  min-width: 200rpx;
  background-color: #f1f3f5;
  height: 64rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
}

.search-icon {
  margin-right: 12rpx;
  font-size: 24rpx;
  color: #999;
}

.search-input-wrap input {
  flex: 1;
  font-size: 24rpx;
  color: #333;
}

.category-picker {
  height: 64rpx;
  line-height: 64rpx;
  padding: 0 16rpx;
  background-color: #f1f3f5;
  border-radius: 10rpx;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.arrow {
  font-size: 16rpx;
  margin-left: 8rpx;
  color: #999;
}

.resource-list {
  height: calc(100vh - 200rpx);
  padding: 16rpx;
  box-sizing: border-box;
}

.resource-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03);
  transition: all 0.3s ease;
}

.resource-card:hover {
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
  transform: translateY(-2rpx);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12rpx;
}

.title-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8rpx;
}

.new-badge {
  background-color: #ff4d4f;
  color: #fff;
  font-size: 16rpx;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
  flex-shrink: 0;
}

.resource-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
  min-width: 0;
}

.category-tag {
  font-size: 20rpx;
  color: #6666ff;
  background-color: #f0f0ff;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  flex-shrink: 0;
}

.card-body {
  margin-bottom: 16rpx;
}

.link-info {
  display: flex;
  font-size: 22rpx;
  margin-bottom: 8rpx;
  align-items: center;
}

.link-label {
  font-weight: bold;
  margin-right: 8rpx;
  width: 70rpx;
  flex-shrink: 0;
}

.link-label.quark { color: #4facfe; }
.link-label.baidu { color: #ff4d4f; }

.link-text {
  flex: 1;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 20rpx;
}

.description {
  display: block;
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
  line-height: 1.4;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1rpx solid #f0f0f0;
  padding-top: 12rpx;
}

.update-time {
  font-size: 20rpx;
  color: #bbb;
}

.actions {
  display: flex;
  gap: 12rpx;
}

.btn {
  font-size: 20rpx;
  padding: 0 16rpx;
  height: 40rpx;
  line-height: 40rpx;
  margin: 0;
  border-radius: 6rpx;
}

.btn.edit {
  background-color: #f0f0f0;
  color: #666;
}

.btn.delete {
  background-color: #fff1f0;
  color: #ff4d4f;
}

/* Modal Styles */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 85%;
  background-color: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 24rpx 30rpx;
  text-align: center;
  font-weight: bold;
  font-size: 28rpx;
  border-bottom: 2rpx solid #f0f0f0;
  position: relative;
  color: #333;
}

.close-btn {
  position: absolute;
  right: 24rpx;
  top: 24rpx;
  font-size: 36rpx;
  color: #999;
  line-height: 1;
}

.modal-body {
  padding: 24rpx;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 20rpx;
}

.form-item.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.input {
  width: 100%;
  height: 64rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 0 16rpx;
  font-size: 24rpx;
  box-sizing: border-box;
  color: #333;
}

.textarea {
  width: 100%;
  height: 140rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 24rpx;
  box-sizing: border-box;
  color: #333;
}

.tips {
  background-color: #f0f7ff;
  padding: 16rpx;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}

.tips text {
  font-size: 22rpx;
  color: #4facfe;
  line-height: 1.5;
}

.sync-textarea {
  width: 100%;
  height: 360rpx;
  background-color: #f8f9fa;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 22rpx;
  box-sizing: border-box;
  color: #333;
}

.modal-footer {
  padding: 16rpx 24rpx 24rpx;
  display: flex;
  gap: 16rpx;
}

.modal-footer button {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 26rpx;
  border-radius: 8rpx;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background-color: #6666ff;
  color: #fff;
}

.loading-state, .empty-state, .loading-more, .no-more {
  text-align: center;
  padding: 32rpx;
  color: #999;
  font-size: 22rpx;
}

/* 新增预览弹窗样式 */
.preview-modal {
  width: 90vw;
  max-height: 85vh;
}

.preview-body {
  padding: 16rpx;
  display: flex;
  flex-direction: column;
}

.preview-tips {
  font-size: 22rpx;
  color: #666;
  background-color: #fffbe6;
  padding: 12rpx;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}

.preview-list {
  flex: 1;
  max-height: 60vh;
}

.preview-card {
  border: 1rpx solid #eee;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-bottom: 16rpx;
  background-color: #fff;
  transition: all 0.2s ease;
}

.preview-card:hover {
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
}

.preview-card.create { border-left: 6rpx solid #52c41a; }
.preview-card.supplement { border-left: 6rpx solid #1890ff; background-color: #e6f7ff; }
.preview-card.update { border-left: 6rpx solid #faad14; background-color: #fff7e6; }
.preview-card.ignore { border-left: 6rpx solid #d9d9d9; opacity: 0.8; }

.preview-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
  gap: 12rpx;
  flex-wrap: wrap;
}

.action-badge {
  font-size: 18rpx;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
  color: #fff;
  flex-shrink: 0;
}

.action-badge.create { background-color: #52c41a; }
.action-badge.supplement { background-color: #1890ff; }
.action-badge.update { background-color: #faad14; }
.action-badge.ignore { background-color: #d9d9d9; }

.preview-title-input {
  flex: 1;
  font-size: 26rpx;
  font-weight: bold;
  border-bottom: 1rpx solid #eee;
  color: #333;
  min-width: 120rpx;
}

.preview-diff {
  font-size: 20rpx;
  color: #ff4d4f;
  flex-shrink: 0;
  white-space: nowrap;
}

.preview-form-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
  font-size: 22rpx;
  flex-wrap: wrap;
  gap: 8rpx;
}

.preview-label {
  width: 70rpx;
  color: #999;
  flex-shrink: 0;
}

.preview-input {
  flex: 1;
  border-bottom: 1rpx solid #f0f0f0;
  padding: 4rpx 0;
  color: #333;
  min-width: 160rpx;
}

.preview-card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8rpx;
}

.remove-preview-btn {
  font-size: 18rpx;
  padding: 0 16rpx;
  height: 36rpx;
  line-height: 36rpx;
  margin: 0;
  background-color: #fff;
  border: 1rpx solid #ddd;
  border-radius: 18rpx;
  color: #999;
}

.dark-mode {
  background-color: #1a1a1a;
}

.dark-mode .header, .dark-mode .search-bar, .dark-mode .resource-card, .dark-mode .modal-content {
  background-color: #2a2a2a;
  color: #fff;
}

.dark-mode .resource-title {
  color: #fff;
}

.dark-mode .input, .dark-mode .textarea, .dark-mode .search-input-wrap, .dark-mode .category-picker {
  background-color: #333;
  border-color: #444;
  color: #eee;
}

.dark-mode .link-text, .dark-mode .description, .dark-mode .update-time {
  color: #aaa;
}

.dark-mode .btn.edit {
  background-color: #3a3a3a;
  color: #ccc;
}

.dark-mode .btn.delete {
  background-color: #3a2a2a;
  color: #ff4d4f;
}

.dark-mode .manage-btn, .dark-mode .category-btn {
  background-color: #3a3a3a;
  color: #ccc;
}

/* 分类管理样式 */
.category-modal-body {
  padding: 24rpx;
}

.add-category-form {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
  flex-wrap: wrap;
}

.category-input {
  flex: 1;
  min-width: 160rpx;
  height: 64rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 0 16rpx;
  font-size: 24rpx;
  color: #333;
}

.add-cat-btn {
  width: 100rpx;
  height: 64rpx;
  line-height: 64rpx;
  background-color: #6666ff;
  color: #fff;
  font-size: 22rpx;
  border-radius: 8rpx;
  margin: 0;
  flex-shrink: 0;
}

.category-list {
  max-height: 400rpx;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.cat-name-input {
  flex: 1;
  font-size: 26rpx;
  color: #333;
}

.cat-actions {
  margin-left: 16rpx;
}

.cat-delete {
  font-size: 22rpx;
  color: #ff4d4f;
  padding: 8rpx;
}

/* 批量操作样式 */
.checkbox-container {
  margin-right: 16rpx;
}

.checkbox {
  width: 32rpx;
  height: 32rpx;
  border: 2rpx solid #ddd;
  border-radius: 4rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
}

.checkbox.checked {
  background-color: #6666ff;
  border-color: #6666ff;
}

.check-icon {
  color: #fff;
  font-size: 20rpx;
}

.batch-active {
  position: relative;
}

.batch-active .card-content {
  padding-left: 48rpx;
}

/* 响应式设计 */
@media screen and (max-width: 750rpx) {
  .header {
    padding: 12rpx 20rpx;
  }
  
  .title {
    font-size: 28rpx;
  }
  
  .menu-btn {
    font-size: 20rpx;
    padding: 0 14rpx;
    height: 44rpx;
    line-height: 44rpx;
  }
  
  .menu-text {
    font-size: 20rpx;
  }
  
  .menu-dropdown {
    min-width: 180rpx;
  }
  
  .dropdown-btn {
    font-size: 20rpx;
    padding: 10rpx 14rpx;
  }
  
  .search-bar {
    padding: 12rpx 20rpx;
  }
  
  .resource-list {
    padding: 12rpx;
  }
  
  .resource-card {
    padding: 16rpx;
    margin-bottom: 12rpx;
  }
  
  .modal-content {
    width: 90%;
  }
  
  .preview-modal {
    width: 95vw;
  }
}

@media screen and (max-width: 480rpx) {
  .menu-btn {
    font-size: 18rpx;
    padding: 0 12rpx;
    height: 40rpx;
    line-height: 40rpx;
  }
  
  .menu-icon {
    font-size: 22rpx;
  }
  
  .menu-text {
    font-size: 18rpx;
  }
  
  .menu-dropdown {
    min-width: 160rpx;
    margin-top: 6rpx;
  }
  
  .dropdown-btn {
    font-size: 18rpx;
    padding: 8rpx 12rpx;
  }
  
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .category-picker {
    width: 100%;
  }
  
  .resource-title {
    font-size: 26rpx;
  }
  
  .link-info {
    font-size: 20rpx;
  }
}
</style>