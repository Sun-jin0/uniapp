<template>
  <view class="admin-container">
    <header class="top-bar">
      <div class="back-btn" @click="goBack">❮</div>
      <div class="top-bar-title">数学刷题后台管理</div>
    </header>

    <main class="main-content">
      <section class="admin-card">
        <div class="card-header">
          <span class="card-icon">⚙️</span>
          <span class="card-title">管理选项</span>
        </div>
        <div class="admin-menu">
          <div class="menu-item" @click="goToManagement">
            <span class="menu-icon">📊</span>
            <div class="menu-info">
              <span class="menu-title">题库与科目管理</span>
              <span class="menu-desc">管理数学科目、章节及题目数据</span>
            </div>
            <span class="menu-arrow">❯</span>
          </div>
          <div class="menu-item" @click="goToImport">
            <span class="menu-icon">📥</span>
            <div class="menu-info">
              <span class="menu-title">题目批量导入</span>
              <span class="menu-desc">通过 JSON 文件批量导入题目数据</span>
            </div>
            <span class="menu-arrow">❯</span>
          </div>
          <!-- 可以添加更多数学特有的管理功能 -->
          <div class="menu-item disabled">
            <span class="menu-icon">📈</span>
            <div class="menu-info">
              <span class="menu-title">数据分析 (开发中)</span>
              <span class="menu-desc">查看数学刷题数据统计</span>
            </div>
            <span class="menu-arrow">❯</span>
          </div>
        </div>
      </section>
    </main>
  </view>
</template>

<script setup>
const goBack = () => {
  uni.navigateBack();
};

const goToManagement = () => {
  uni.navigateTo({
    url: '/pages/admin/math-management/math-management'
  });
};

const goToImport = () => {
  uni.navigateTo({
    url: '/pages/math/math-question-import'
  });
};
</script>

<style scoped>
.admin-container {
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
}

.main-content {
  padding: 30rpx;
}

.admin-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.card-icon {
  font-size: 40rpx;
  margin-right: 15rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.admin-menu {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f9f9f9;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: #fcfcfc;
}

.menu-item.disabled {
  opacity: 0.6;
}

.menu-icon {
  font-size: 44rpx;
  margin-right: 25rpx;
}

.menu-info {
  flex: 1;
}

.menu-title {
  display: block;
  font-size: 30rpx;
  color: #333;
  margin-bottom: 4rpx;
}

.menu-desc {
  font-size: 24rpx;
  color: #999;
}

.menu-arrow {
  font-size: 28rpx;
  color: #ccc;
}
</style>
