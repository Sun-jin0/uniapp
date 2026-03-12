<template>
  <view class="account-manage-container">
    <view class="top-bar">
      <view class="back-btn" @click="goBack">❮</view>
      <view class="top-bar-title">账号管理</view>
      <view class="add-btn" @click="showCreateModal">+</view>
    </view>

    <view class="main-content">
      <!-- 统计卡片 -->
      <view class="stats-card">
        <view class="stat-item">
          <text class="stat-num">{{ userList.length }}</text>
          <text class="stat-label">总用户数</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-num">{{ adminCount }}</text>
          <text class="stat-label">管理员</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-num">{{ activeCount }}</text>
          <text class="stat-label">活跃用户</text>
        </view>
      </view>

      <!-- 搜索栏 -->
      <view class="search-bar">
        <input
          class="search-input"
          type="text"
          v-model="searchKeyword"
          placeholder="搜索用户名或ID"
          @confirm="handleSearch"
        />
        <view class="search-btn" @click="handleSearch">🔍</view>
      </view>

      <!-- 用户列表 -->
      <view class="user-list">
        <view
          class="user-item"
          v-for="user in filteredUserList"
          :key="user.id"
          @click="showUserDetail(user)"
        >
          <view class="user-avatar">
            <image
              v-if="user.avatar"
              :src="user.avatar"
              mode="aspectFill"
            />
            <view v-else class="default-avatar">{{ getFirstChar(user.nickname || user.username) }}</view>
          </view>
          <view class="user-info">
            <view class="user-name-row">
              <text class="user-name">{{ user.nickname || user.username }}</text>
              <view class="role-tag" :class="{ 'admin': user.role === 1 || user.role === '1' }">{{ getRoleText(user.role) }}</view>
            </view>
            <view class="user-meta">
              <text class="user-id">ID: {{ user.studentId || user.userId || user.id }}</text>
              <text class="user-status" :class="user.status">{{ getStatusText(user.status) }}</text>
            </view>
          </view>
          <view class="user-arrow">❯</view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="load-more" v-if="hasMore" @click="loadMore">
        <text>加载更多</text>
      </view>
    </view>

    <!-- 创建账号弹窗 -->
    <view class="modal-overlay" v-if="showModal" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">创建新账号</text>
          <view class="modal-close" @click="closeModal">✕</view>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">学号 <text class="required">*</text></text>
            <view class="input-with-btn">
              <input
                class="form-input"
                type="text"
                v-model="formData.studentId"
                placeholder="留空则自动生成"
              />
              <button class="input-btn" @click="generateStudentId">自动生成</button>
            </view>
            <text class="input-tip">默认格式：SA年月日时分（如SA202503111430）</text>
          </view>
          <view class="form-item">
            <text class="form-label">昵称</text>
            <input
              class="form-input"
              type="text"
              v-model="formData.nickname"
              placeholder="请输入昵称（可选）"
            />
          </view>
          <view class="form-item">
            <text class="form-label">密码</text>
            <view class="input-with-btn">
              <input
                class="form-input"
                type="text"
                v-model="formData.password"
                placeholder="点击生成随机密码"
                readonly
              />
              <button class="input-btn" @click="generatePassword">生成密码</button>
            </view>
            <text class="input-tip">默认生成6位随机数字密码</text>
          </view>
          <view class="form-item">
            <text class="form-label">角色</text>
            <view class="role-selector">
              <view
                class="role-option"
                :class="{ active: formData.role === 0 }"
                @click="formData.role = 0"
              >
                普通用户
              </view>
              <view
                class="role-option"
                :class="{ active: formData.role === 1 }"
                @click="formData.role = 1"
              >
                管理员
              </view>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="closeModal">取消</button>
          <button class="btn-confirm" @click="createAccount">创建</button>
        </view>
      </view>
    </view>

    <!-- 创建成功弹窗 -->
    <view class="modal-overlay" v-if="showSuccessModal" @click="closeSuccessModal">
      <view class="modal-content success-modal" @click.stop>
        <view class="success-header">
          <view class="success-icon">✓</view>
          <text class="success-title">账号创建成功</text>
        </view>
        <view class="success-body">
          <view class="account-info">
            <view class="info-row">
              <text class="info-label">学号：</text>
              <text class="info-value">{{ createdAccount.studentId }}</text>
              <view class="copy-btn-small" @click="copyText(createdAccount.studentId)">复制</view>
            </view>
            <view class="info-row">
              <text class="info-label">密码：</text>
              <text class="info-value">{{ createdAccount.password }}</text>
              <button class="copy-btn-small" @click="copyText(createdAccount.password)">复制</button>
            </view>
          </view>
          <button class="copy-all-btn" @click="copyAccountInfo">
            <text class="copy-all-text">📋 复制账号密码</text>
          </button>
        </view>
        <view class="success-footer">
          <button class="btn-confirm" @click="closeSuccessModal">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue';

const instance = getCurrentInstance();

// 数据
const userList = ref([]);
const searchKeyword = ref('');
const showModal = ref(false);
const showSuccessModal = ref(false);
const hasMore = ref(false);
const page = ref(1);
const pageSize = 20;

// 表单数据 (role: 0=普通用户, 1=管理员)
const formData = ref({
  studentId: '',
  nickname: '',
  password: '',
  role: 0
});

// 创建结果（用于显示和复制）
const createdAccount = ref({
  studentId: '',
  password: ''
});

// 计算属性
const filteredUserList = computed(() => {
  if (!searchKeyword.value) return userList.value;
  const keyword = searchKeyword.value.toLowerCase();
  return userList.value.filter(user =>
    (user.username && user.username.toLowerCase().includes(keyword)) ||
    (user.nickname && user.nickname.toLowerCase().includes(keyword)) ||
    (user.studentId && user.studentId.toString().includes(keyword))
  );
});

const adminCount = computed(() => {
  return userList.value.filter(user => user.role === 1 || user.role === '1').length;
});

const activeCount = computed(() => {
  return userList.value.filter(user => user.status === 'active' || !user.status).length;
});

// 检查管理员权限 (role为1时是管理员)
const checkAdminPermission = () => {
  const role = uni.getStorageSync('role');
  if (role !== 1 && role !== '1') {
    uni.showToast({
      title: '无权限访问',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
    return false;
  }
  return true;
};

// 加载用户列表
const loadUserList = async () => {
  try {
    uni.showLoading({ title: '加载中...' });
    const res = await instance.appContext.config.globalProperties.$api.adminApi.getUserList({
      page: page.value,
      pageSize: pageSize
    });
    uni.hideLoading();

    if (res.code === 0) {
      if (page.value === 1) {
        userList.value = res.data.list || [];
      } else {
        userList.value = [...userList.value, ...(res.data.list || [])];
      }
      hasMore.value = userList.value.length < (res.data.total || 0);
    } else {
      uni.showToast({
        title: res.message || '加载失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('加载用户列表失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  }
};

// 加载更多
const loadMore = () => {
  page.value++;
  loadUserList();
};

// 搜索
const handleSearch = () => {
  page.value = 1;
  loadUserList();
};

// 获取首字符
const getFirstChar = (str) => {
  if (!str) return '?';
  return str.charAt(0).toUpperCase();
};

// 获取角色文本 (role为1时是管理员)
const getRoleText = (role) => {
  if (role === 1 || role === '1') return '管理员';
  return '用户';
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'active': '正常',
    'inactive': '禁用',
    'banned': '封禁'
  };
  return statusMap[status] || '正常';
};

// 显示创建弹窗
const showCreateModal = () => {
  formData.value = {
    studentId: '',
    nickname: '',
    password: '',
    role: 0
  };
  createdAccount.value = { studentId: '', password: '' };
  showModal.value = true;
};

// 生成学号（SA+年月日时分）
const generateStudentId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  formData.value.studentId = `SA${year}${month}${day}${hour}${minute}`;
};

// 生成随机6位数字密码
const generatePassword = () => {
  const password = Math.floor(100000 + Math.random() * 900000).toString();
  formData.value.password = password;
};

// 关闭弹窗
const closeModal = () => {
  showModal.value = false;
};

// 关闭成功弹窗
const closeSuccessModal = () => {
  showSuccessModal.value = false;
  closeModal();
};

// 复制文本
const copyText = (text) => {
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({
        title: '已复制',
        icon: 'success'
      });
    }
  });
};

// 复制完整账号信息
const copyAccountInfo = () => {
  const text = `学号：${createdAccount.value.studentId}\n密码：${createdAccount.value.password}`;
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({
        title: '账号密码已复制',
        icon: 'success'
      });
    }
  });
};

// 创建账号
const createAccount = async () => {
  // 如果没有填写学号，自动生成
  if (!formData.value.studentId.trim()) {
    generateStudentId();
  }

  // 如果没有生成密码，自动生成
  if (!formData.value.password) {
    generatePassword();
  }

  try {
    uni.showLoading({ title: '创建中...' });
    const res = await instance.appContext.config.globalProperties.$api.adminApi.createUser({
      username: formData.value.studentId, // 后端要求 username
      studentId: formData.value.studentId,
      nickname: formData.value.nickname || formData.value.studentId,
      password: formData.value.password,
      role: formData.value.role
    });
    uni.hideLoading();

    if (res.code === 0) {
      // 保存创建的账号信息
      createdAccount.value = {
        studentId: formData.value.studentId,
        password: formData.value.password
      };
      // 显示成功弹窗
      showSuccessModal.value = true;
      // 刷新列表
      page.value = 1;
      loadUserList();
    } else {
      uni.showToast({
        title: res.message || '创建失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('创建账号失败:', error);
    uni.showToast({
      title: '创建失败',
      icon: 'none'
    });
  }
};

// 显示用户详情
const showUserDetail = (user) => {
  uni.navigateTo({
    url: `/pages/admin/user-detail?id=${user.id}`
  });
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

onMounted(() => {
  if (checkAdminPermission()) {
    loadUserList();
  }
});
</script>

<style scoped>
.account-manage-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.top-bar {
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx 30rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.back-btn {
  font-size: 40rpx;
  color: #fff;
  padding: 10rpx 20rpx;
}

.top-bar-title {
  flex: 1;
  text-align: center;
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
}

.add-btn {
  font-size: 48rpx;
  color: #fff;
  padding: 10rpx 20rpx;
  font-weight: 300;
}

.main-content {
  padding: 30rpx;
}

.stats-card {
  display: flex;
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-divider {
  width: 2rpx;
  background: #e5e7eb;
}

.stat-num {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 10rpx;
}

.stat-label {
  font-size: 26rpx;
  color: #6b7280;
}

.search-bar {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.search-input {
  flex: 1;
  height: 60rpx;
  font-size: 28rpx;
  padding: 0 20rpx;
}

.search-btn {
  font-size: 36rpx;
  padding: 0 20rpx;
}

.user-list {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.user-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 2rpx solid #f3f4f6;
}

.user-item:last-child {
  border-bottom: none;
}

.user-item:active {
  background: #f9fafb;
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 24rpx;
  background: #e5e7eb;
}

.user-avatar image {
  width: 100%;
  height: 100%;
}

.default-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #6b7280;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.user-info {
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.user-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  margin-right: 16rpx;
}

.role-tag {
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  background: #e5e7eb;
  color: #6b7280;
}

.role-tag.admin {
  background: #fef3c7;
  color: #f59e0b;
}

.role-tag.superadmin {
  background: #fee2e2;
  color: #ef4444;
}

.user-meta {
  display: flex;
  align-items: center;
}

.user-id {
  font-size: 24rpx;
  color: #9ca3af;
  margin-right: 20rpx;
}

.user-status {
  font-size: 24rpx;
  color: #10b981;
}

.user-status.inactive {
  color: #f59e0b;
}

.user-status.banned {
  color: #ef4444;
}

.user-arrow {
  font-size: 28rpx;
  color: #d1d5db;
}

.load-more {
  text-align: center;
  padding: 40rpx;
  color: #6b7280;
  font-size: 28rpx;
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
  width: 80%;
  max-width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 2rpx solid #f3f4f6;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  font-size: 40rpx;
  color: #9ca3af;
  padding: 10rpx;
}

.modal-body {
  padding: 30rpx;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #374151;
  margin-bottom: 12rpx;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  height: 72rpx;
  padding: 0 20rpx;
  border: 2rpx solid #e5e7eb;
  border-radius: 10rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #667eea;
}

.role-selector {
  display: flex;
  gap: 20rpx;
}

.role-option {
  flex: 1;
  padding: 20rpx;
  text-align: center;
  border: 2rpx solid #e5e7eb;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #6b7280;
}

.role-option.active {
  border-color: #667eea;
  background: #eef2ff;
  color: #667eea;
}

.modal-footer {
  display: flex;
  padding: 20rpx 30rpx 30rpx;
  border-top: 2rpx solid #f3f4f6;
  gap: 20rpx;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 20rpx 24rpx;
  text-align: center;
  border-radius: 12rpx;
  font-size: 30rpx;
  border: none;
  margin: 0;
  line-height: 1.5;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

/* 输入框带按钮容器 */
.input-with-btn {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.input-with-btn .form-input {
  flex: 1;
  min-width: 0;
}

/* 输入框按钮 */
.input-btn {
  flex: 0 0 auto;
  padding: 0 20rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: #f3f4f6;
  border-radius: 10rpx;
  font-size: 26rpx;
  color: #667eea;
  white-space: nowrap;
  border: none;
  margin: 0;
}

.input-btn:active {
  background: #e5e7eb;
}

.input-tip {
  display: block;
  font-size: 22rpx;
  color: #9ca3af;
  margin-top: 8rpx;
}

/* 成功弹窗样式 */
.success-modal {
  text-align: center;
}

.success-header {
  padding: 50rpx 30rpx 30rpx;
}

.success-icon {
  width: 100rpx;
  height: 100rpx;
  line-height: 100rpx;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  font-size: 60rpx;
  border-radius: 50%;
  margin: 0 auto 20rpx;
}

.success-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1f2937;
}

.success-body {
  padding: 0 30rpx 30rpx;
}

.account-info {
  background: #f9fafb;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 28rpx;
  color: #6b7280;
  width: 100rpx;
}

.info-value {
  flex: 1;
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
  font-family: monospace;
}

.copy-btn-small {
  flex: 0 0 auto;
  padding: 8rpx 20rpx;
  background: #eef2ff;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #667eea;
  border: none;
  margin: 0;
}

.copy-btn-small:active {
  background: #e0e7ff;
}

.copy-all-btn {
  width: 100%;
  padding: 24rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12rpx;
  border: none;
  margin: 0;
}

.copy-all-text {
  font-size: 30rpx;
  color: #fff;
}

.copy-all-btn:active {
  opacity: 0.9;
}

.success-footer {
  padding: 0 30rpx 30rpx;
}

.success-footer .btn-confirm {
  width: 100%;
  border: none;
  margin: 0;
}
</style>
