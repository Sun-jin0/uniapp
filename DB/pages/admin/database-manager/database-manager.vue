<template>
  <view class="database-manager">
    <view class="header">
      <text class="title">数据库管理</text>
    </view>

    <view class="collection-list">
      <view 
        v-for="collection in collections" 
        :key="collection.name"
        class="collection-item"
        @click="selectCollection(collection)"
      >
        <view class="collection-info">
          <text class="collection-name">{{ collection.name }}</text>
          <text class="collection-count">{{ collection.count }} 条记录</text>
        </view>
        <text class="arrow">></text>
      </view>
    </view>

    <view v-if="selectedCollection" class="modal-overlay" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ selectedCollection.name }}</text>
          <text class="close-btn" @click="closeModal">×</text>
        </view>

        <view class="modal-body">
          <view class="search-bar">
            <input 
              v-model="searchQuery" 
              placeholder="搜索..." 
              class="search-input"
              @input="handleSearch"
            />
          </view>

          <view class="action-buttons">
            <button class="btn btn-primary" @click="showAddModal">添加记录</button>
            <button class="btn btn-danger" @click="clearCollection">清空集合</button>
          </view>

          <scroll-view scroll-y class="data-table-container">
            <view class="data-table">
              <view class="table-header">
                <text 
                  v-for="field in fields" 
                  :key="field"
                  class="table-cell header-cell"
                  @click="sortBy(field)"
                >
                  {{ field }}
                  <text v-if="sortField === field" class="sort-indicator">
                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                  </text>
                </text>
                <text class="table-cell header-cell"></text>
              </view>

              <view 
                v-for="(doc, index) in documents" 
                :key="doc._id"
                class="table-row"
              >
                <text 
                  v-for="field in fields" 
                  :key="field"
                  class="table-cell"
                >
                  {{ formatValue(doc[field]) }}
                </text>
                <view class="table-cell action-cell">
                  <button class="btn-small btn-edit" @click="editDocument(doc)">编辑</button>
                  <button class="btn-small btn-delete" @click="deleteDocument(doc._id)">删除</button>
                </view>
              </view>
            </view>
          </scroll-view>

          <view class="pagination">
            <button 
              class="btn-page" 
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
            >
              上一页
            </button>
            <text class="page-info">{{ currentPage }} / {{ totalPages }}</text>
            <button 
              class="btn-page" 
              :disabled="currentPage >= totalPages"
              @click="changePage(currentPage + 1)"
            >
              下一页
            </button>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <view class="modal-content edit-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ isEditing ? '编辑记录' : '添加记录' }}</text>
          <text class="close-btn" @click="closeEditModal">×</text>
        </view>

        <scroll-view scroll-y class="edit-form">
          <view v-for="field in fields" :key="field" class="form-group">
            <text class="form-label">{{ field }}</text>
            <input 
              v-model="editingDocument[field]"
              class="form-input"
              :placeholder="`请输入 ${field}`"
            />
          </view>
        </scroll-view>

        <view class="modal-footer">
          <button class="btn btn-secondary" @click="closeEditModal">取消</button>
          <button class="btn btn-primary" @click="saveDocument">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const API_BASE = 'http://localhost:3000/api/admin';

const collections = ref([]);
const selectedCollection = ref(null);
const documents = ref([]);
const fields = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const searchQuery = ref('');
const sortField = ref('_id');
const sortOrder = ref('asc');
const showEditModal = ref(false);
const editingDocument = ref({});
const isEditing = ref(false);

onMounted(() => {
  loadCollections();
});

async function loadCollections() {
  try {
    const response = await uni.request({
      url: `${API_BASE}/collections`,
      method: 'GET'
    });
    collections.value = response.data.data;
  } catch (error) {
    console.error('加载集合失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  }
}

async function selectCollection(collection) {
  selectedCollection.value = collection;
  currentPage.value = 1;
  await loadDocuments();
  await loadFields();
}

async function loadDocuments() {
  try {
    const response = await uni.request({
      url: `${API_BASE}/collections/${selectedCollection.value.name}`,
      method: 'GET',
      data: {
        page: currentPage.value,
        limit: 20,
        sort: sortField.value,
        order: sortOrder.value
      }
    });
    documents.value = response.data.data.documents;
    totalPages.value = response.data.data.pagination.totalPages;
  } catch (error) {
    console.error('加载文档失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  }
}

async function loadFields() {
  try {
    const response = await uni.request({
      url: `${API_BASE}/collections/${selectedCollection.value.name}/fields`,
      method: 'GET'
    });
    fields.value = response.data.data;
  } catch (error) {
    console.error('加载字段失败:', error);
  }
}

async function handleSearch() {
  if (searchQuery.value) {
    try {
      const response = await uni.request({
        url: `${API_BASE}/collections/${selectedCollection.value.name}/search`,
        method: 'GET',
        data: {
          query: searchQuery.value,
          page: currentPage.value,
          limit: 20
        }
      });
      documents.value = response.data.data.documents;
      totalPages.value = response.data.data.pagination.totalPages;
    } catch (error) {
      console.error('搜索失败:', error);
    }
  } else {
    await loadDocuments();
  }
}

function sortBy(field) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortOrder.value = 'asc';
  }
  loadDocuments();
}

function changePage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadDocuments();
  }
}

function showAddModal() {
  editingDocument.value = {};
  fields.value.forEach(field => {
    editingDocument.value[field] = '';
  });
  isEditing.value = false;
  showEditModal.value = true;
}

function editDocument(doc) {
  editingDocument.value = { ...doc };
  isEditing.value = true;
  showEditModal.value = true;
}

async function saveDocument() {
  try {
    if (isEditing.value) {
      await uni.request({
        url: `${API_BASE}/collections/${selectedCollection.value.name}/${editingDocument.value._id}`,
        method: 'PUT',
        data: { document: editingDocument.value }
      });
      uni.showToast({
        title: '更新成功',
        icon: 'success'
      });
    } else {
      await uni.request({
        url: `${API_BASE}/collections/${selectedCollection.value.name}`,
        method: 'POST',
        data: { document: editingDocument.value }
      });
      uni.showToast({
        title: '添加成功',
        icon: 'success'
      });
    }
    closeEditModal();
    loadDocuments();
  } catch (error) {
    console.error('保存失败:', error);
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    });
  }
}

async function deleteDocument(id) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await uni.request({
            url: `${API_BASE}/collections/${selectedCollection.value.name}/${id}`,
            method: 'DELETE'
          });
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          });
          loadDocuments();
        } catch (error) {
          console.error('删除失败:', error);
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          });
        }
      }
    }
  });
}

async function clearCollection() {
  uni.showModal({
    title: '确认清空',
    content: `确定要清空 ${selectedCollection.value.name} 集合的所有数据吗？此操作不可恢复！`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await uni.request({
            url: `${API_BASE}/collections/${selectedCollection.value.name}`,
            method: 'DELETE'
          });
          uni.showToast({
            title: '清空成功',
            icon: 'success'
          });
          loadCollections();
          closeModal();
        } catch (error) {
          console.error('清空失败:', error);
          uni.showToast({
            title: '清空失败',
            icon: 'none'
          });
        }
      }
    }
  });
}

function closeModal() {
  selectedCollection.value = null;
  documents.value = [];
  fields.value = [];
  searchQuery.value = '';
}

function closeEditModal() {
  showEditModal.value = false;
  editingDocument.value = {};
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? '是' : '否';
  return String(value);
}
</script>

<style scoped>
.database-manager {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  background-color: #007aff;
  padding: 40rpx 30rpx;
  color: white;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
}

.collection-list {
  padding: 20rpx;
}

.collection-item {
  background-color: white;
  border-radius: 10rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.collection-info {
  display: flex;
  flex-direction: column;
}

.collection-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.collection-count {
  font-size: 26rpx;
  color: #999;
}

.arrow {
  font-size: 40rpx;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 20rpx;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.edit-modal {
  max-height: 80vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
}

.close-btn {
  font-size: 60rpx;
  color: #999;
  cursor: pointer;
}

.modal-body {
  flex: 1;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-bar {
  margin-bottom: 20rpx;
}

.search-input {
  width: 100%;
  padding: 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  font-size: 28rpx;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.btn {
  flex: 1;
  padding: 20rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  border: none;
}

.btn-primary {
  background-color: #007aff;
  color: white;
}

.btn-secondary {
  background-color: #999;
  color: white;
}

.btn-danger {
  background-color: #ff3b30;
  color: white;
}

.data-table-container {
  flex: 1;
  overflow: auto;
}

.data-table {
  min-width: 100%;
}

.table-header {
  display: flex;
  background-color: #f5f5f5;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 10;
}

.table-row {
  display: flex;
  border-bottom: 1rpx solid #eee;
}

.table-cell {
  flex: 1;
  padding: 20rpx;
  font-size: 24rpx;
  word-break: break-all;
  min-width: 150rpx;
  max-width: 300rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-cell {
  cursor: pointer;
  user-select: none;
}

.sort-indicator {
  margin-left: 10rpx;
}

.action-cell {
  display: flex;
  gap: 10rpx;
  min-width: 200rpx;
  max-width: 200rpx;
}

.btn-small {
  padding: 10rpx 20rpx;
  border-radius: 5rpx;
  font-size: 22rpx;
  border: none;
  color: white;
}

.btn-edit {
  background-color: #007aff;
}

.btn-delete {
  background-color: #ff3b30;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30rpx;
  padding: 20rpx;
  border-top: 1rpx solid #eee;
}

.btn-page {
  padding: 15rpx 30rpx;
  border-radius: 10rpx;
  background-color: #007aff;
  color: white;
  font-size: 28rpx;
  border: none;
}

.btn-page:disabled {
  background-color: #ccc;
}

.page-info {
  font-size: 28rpx;
  color: #666;
}

.edit-form {
  flex: 1;
  padding: 20rpx;
}

.form-group {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.form-input {
  width: 100%;
  padding: 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 10rpx;
  font-size: 28rpx;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 20rpx;
  border-top: 1rpx solid #eee;
}
</style>
