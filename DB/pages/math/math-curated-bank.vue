<template>
  <div class="curated-container">
    <div class="header">
      <div class="title-section">
        <span class="title">精选题库</span>
        <span class="subtitle">私藏好题，分类整理</span>
      </div>
      <div class="add-btn" @click="showCreateModal = true">
        <SvgIcon name="plus" size="24" fill="white" style="margin-right: 8rpx;" />
        <span>新建题库</span>
      </div>
    </div>

    <!-- 题库列表 -->
    <div v-if="banks.length > 0" class="bank-list">
      <div v-for="bank in banks" :key="bank.BankID" class="bank-card" @click="goToDetail(bank)">
        <div class="bank-info">
          <div class="bank-title">{{ bank.Title }}</div>
          <div class="bank-desc">{{ bank.Description || '暂无描述' }}</div>
          <div class="bank-meta">
            <span class="meta-item">
              <SvgIcon name="calendar" size="20" fill="#bdc3c7" style="margin-right: 8rpx;" />
              {{ formatDate(bank.CreatedAt) }}
            </span>
          </div>
        </div>
        <div class="bank-actions" @click.stop>
          <div class="action-btn edit" @click="editBank(bank)">编辑</div>
          <div class="action-btn delete" @click="confirmDelete(bank)">删除</div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <SvgIcon name="books" size="80" fill="#bdc3c7" />
      </div>
      <div class="empty-text">还没有创建精选题库</div>
      <div class="empty-sub">您可以创建私有的题库文件夹，整理分类题目</div>
      <div class="create-btn" @click="showCreateModal = true">立即创建</div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <div v-if="showCreateModal || showEditModal" class="modal-mask" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <span class="modal-title">{{ showEditModal ? '编辑题库' : '新建题库' }}</span>
          <span class="modal-close" @click="closeModal">
            <SvgIcon name="close" size="36" fill="#bdc3c7" />
          </span>
        </div>
        <div class="modal-body">
          <div class="input-group">
            <div class="label">题库名称</div>
            <input v-model="form.title" type="text" placeholder="请输入题库名称" class="input" />
          </div>
          <div class="input-group">
            <div class="label">题库描述</div>
            <textarea v-model="form.description" placeholder="请输入题库描述（可选）" class="textarea"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <div class="btn cancel" @click="closeModal">取消</div>
          <div class="btn confirm" @click="submitForm">确定</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import SvgIcon from '@/components/SvgIcon/SvgIcon.vue';

const subjectId = ref(null);
const banks = ref([]);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingBank = ref(null);

const form = ref({
  title: '',
  description: ''
});

onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  subjectId.value = currentPage.options.subjectId;
  fetchBanks();
});

const fetchBanks = async () => {
  try {
    const res = await uni.request({
      url: `http://localhost:3000/api/math/curated-banks?subjectId=${subjectId.value}`,
      method: 'GET'
    });
    if (res.data.success) {
      banks.value = res.data.data;
    }
  } catch (error) {
    console.error('获取题库失败:', error);
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingBank.value = null;
  form.value = { title: '', description: '' };
};

const submitForm = async () => {
  if (!form.value.title) {
    uni.showToast({ title: '请输入题库名称', icon: 'none' });
    return;
  }

  try {
    const url = showEditModal.value 
      ? `http://localhost:3000/api/math/curated-banks/${editingBank.value.BankID}`
      : 'http://localhost:3000/api/math/curated-banks';
    const method = showEditModal.value ? 'PUT' : 'POST';

    const res = await uni.request({
      url,
      method,
      data: {
        ...form.value,
        subjectId: subjectId.value
      }
    });

    if (res.data.success) {
      uni.showToast({ title: showEditModal.value ? '更新成功' : '创建成功', icon: 'success' });
      closeModal();
      fetchBanks();
    }
  } catch (error) {
    console.error('提交失败:', error);
  }
};

const editBank = (bank) => {
  editingBank.value = bank;
  form.value = {
    title: bank.Title,
    description: bank.Description
  };
  showEditModal.value = true;
};

const confirmDelete = (bank) => {
  uni.showModal({
    title: '提示',
    content: `确定要删除题库“${bank.Title}”吗？删除后其中的章节和关联题目也将被移除。`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const deleteRes = await uni.request({
            url: `http://localhost:3000/api/math/curated-banks/${bank.BankID}`,
            method: 'DELETE'
          });
          if (deleteRes.data.success) {
            uni.showToast({ title: '已删除', icon: 'success' });
            fetchBanks();
          }
        } catch (error) {
          console.error('删除失败:', error);
        }
      }
    }
  });
};

const goToDetail = (bank) => {
  // 保存为最近练习科目，以便在首页显示
  const practiceItem = {
    id: bank.BankID,
    title: `数学 - ${bank.Title}`,
    url: '/pages/math/math-curated-bank',
    icon: 'math'
  };
  uni.setStorageSync('lastPracticeSubject', practiceItem);

  uni.navigateTo({
    url: `/pages/math/math-curated-bank-detail?bankId=${bank.BankID}&title=${encodeURIComponent(bank.Title)}`
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
</script>

<style scoped>
.curated-container {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 30rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}

.title-section .title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #2c3e50;
}

.title-section .subtitle {
  font-size: 24rpx;
  color: #7f8c8d;
  margin-top: 8rpx;
}

.add-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  padding: 16rpx 30rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  font-size: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(52, 152, 219, 0.3);
}

.add-btn .icon {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.bank-list {
  display: grid;
  gap: 30rpx;
}

.bank-card {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: transform 0.2s;
}

.bank-card:active {
  transform: scale(0.98);
}

.bank-info {
  flex: 1;
}

.bank-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 12rpx;
}

.bank-desc {
  font-size: 26rpx;
  color: #7f8c8d;
  margin-bottom: 20rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.bank-meta {
  font-size: 24rpx;
  color: #bdc3c7;
}

.bank-actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-left: 20rpx;
}

.action-btn {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  text-align: center;
}

.action-btn.edit {
  color: #3498db;
  background: rgba(52, 152, 219, 0.1);
}

.action-btn.delete {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 40rpx;
}

.empty-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 16rpx;
}

.empty-sub {
  font-size: 26rpx;
  color: #7f8c8d;
  text-align: center;
  margin-bottom: 60rpx;
  padding: 0 60rpx;
}

.create-btn {
  background: #3498db;
  color: white;
  padding: 24rpx 80rpx;
  border-radius: 50rpx;
  font-size: 30rpx;
}

/* Modal Styles */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  width: 600rpx;
  border-radius: 24rpx;
  overflow: hidden;
  animation: modalIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

@keyframes modalIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-header {
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
}

.modal-close {
  font-size: 48rpx;
  color: #bdc3c7;
  padding: 10rpx;
}

.modal-body {
  padding: 40rpx 30rpx;
}

.input-group {
  margin-bottom: 30rpx;
}

.input-group:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 28rpx;
  color: #34495e;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.input {
  width: 100%;
  height: 80rpx;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.textarea {
  width: 100%;
  height: 200rpx;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.modal-footer {
  padding: 30rpx;
  display: flex;
  gap: 20rpx;
  border-top: 1px solid #eee;
}

.btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.btn.cancel {
  background: #f8f9fa;
  color: #7f8c8d;
  border: 1px solid #e9ecef;
}

.btn.confirm {
  background: #3498db;
  color: white;
}
</style>
