<template>
  <view class="container" :class="{ 'dark-mode': isDarkMode }">
    <view class="scroll-content">
      <!-- 签到主体 -->
      <view class="checkin-section">
        <!-- 签到卡片 -->
        <view class="checkin-card">
          <view class="checkin-header">
            <view class="user-info">
              <view class="user-name">{{ userName }}</view>
              <view class="user-level-tag">Lv.{{ userLevel }}</view>
            </view>
            <view class="checkin-stats">
              <view class="stat-item">
                <view class="stat-value">{{ continuousDays }} <view class="stat-unit">天</view></view>
                <view class="stat-label">连续签到</view>
              </view>
              <view class="stat-item">
                <view class="stat-value">{{ totalDays }} <view class="stat-unit">天</view></view>
                <view class="stat-label">总签到</view>
              </view>
            </view>
          </view>
          
          <!-- 签到按钮 -->
          <view class="checkin-main">
            <view class="checkin-circle" :class="{ 'checked-in': hasCheckedInToday }" @click="handleCheckin">
              <view class="circle-inner">
                <view class="checkin-icon" :class="{ 'checked': hasCheckedInToday }"></view>
                <view class="checkin-text">{{ hasCheckedInToday ? '已签到' : '签到' }}</view>
              </view>
            </view>
          </view>
          
          <!-- 签到日历 -->
          <view class="checkin-calendar">
            <view class="calendar-header">
              <text class="calendar-title">{{ currentMonth }}</text>
            </view>
            <view class="calendar-body">
              <view class="weekdays">
                <view class="weekday" v-for="day in weekdays" :key="day">{{ day }}</view>
              </view>
              <view class="days">
                <view class="day" 
                      v-for="day in calendarDays" 
                      :key="day.date"
                      :class="{
                        'checked-in': day.checked,
                        'today': day.today,
                        'other-month': day.otherMonth
                      }">
                  <text class="day-number">{{ day.day }}</text>
                  <view class="checkin-mark" v-if="day.checked"></view>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 签到规则 -->
        <view class="rules-section">
          <view class="section-title">签到规则</view>
          <view class="rule-item">
            <view class="rule-icon checkin-icon"></view>
            <text class="rule-text">每日可进行一次签到</text>
          </view>
          <view class="rule-item">
            <view class="rule-icon streak-icon"></view>
            <text class="rule-text">连续签到可记录你的学习状态</text>
          </view>
          <view class="rule-item">
            <view class="rule-icon practice-icon"></view>
            <text class="rule-text">养成良好的学习习惯</text>
          </view>
          <view class="rule-item">
            <view class="rule-icon event-icon"></view>
            <text class="rule-text">记录你坚持的每一天</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 签到成功弹窗 -->
    <view class="success-popup-overlay" v-if="showSuccessPopup" @click="showSuccessPopup = false">
      <view class="success-popup" @click.stop>
        <view class="success-icon"></view>
        <view class="success-title">签到成功</view>
        <view class="success-desc">你已经坚持学习了 {{ totalDays }} 天</view>
        <view class="success-stats">
          <view class="stat-row">
            <text class="stat-label">连续签到：</text>
            <text class="stat-value">{{ continuousDays }}天</text>
          </view>
        </view>
        <view class="success-btn" @click="showSuccessPopup = false">确 定</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue';

const instance = getCurrentInstance();

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 用户信息
const userName = ref('考生');
const userLevel = ref(5);
const continuousDays = ref(0);
const totalDays = ref(0);
const totalScore = ref(0);
const checkinReward = ref(10);
const hasCheckedInToday = ref(false);
const statusBarHeight = ref(0);

// 弹窗状态
const showSuccessPopup = ref(false);

// 主题状态
const isDarkMode = ref(false);

// 星期和月份
const weekdays = ref(['日', '一', '二', '三', '四', '五', '六']);
const currentMonth = ref('2024年1月');

// 日历数据
const calendarDays = ref([]);

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const res = await instance.appContext.config.globalProperties.$api.userApi.getUserInfo();
    if (res.code === 0) {
      userName.value = res.data.nickname || res.data.username || '考生';
      // 计算用户等级：10级以前每20个题加一个等级，超过10级每50个题加一个等级
      const calcLevel = (questions) => {
        if (questions < 200) {
          return Math.floor(questions / 20) + 1;
        } else {
          return 10 + Math.floor((questions - 200) / 50);
        }
      };
      userLevel.value = res.data.level || calcLevel(res.data.totalQuestions || 0);
    }
  } catch (error) {
    console.error('加载用户信息失败:', error);
  }
};

// 加载签到记录
const loadCheckinRecords = async () => {
  try {
    const res = await instance.appContext.config.globalProperties.$api.checkinApi.getCheckinRecords();
    
    if (res.code === 0) {
      continuousDays.value = res.data.consecutiveDays || 0;
      totalDays.value = res.data.totalDays || 0;
      totalScore.value = res.data.totalScore || 0;
      hasCheckedInToday.value = res.data.hasCheckedInToday || false;
      
      // 更新日历数据
      updateCalendarWithRecords(res.data.records || []);
    }
  } catch (error) {
    console.error('加载签到记录失败:', error);
  }
};

// 用签到记录更新日历
const updateCalendarWithRecords = (records) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // 获取当月已签到的日期
  const checkedDates = records
    .filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getFullYear() === year && recordDate.getMonth() === month;
    })
    .map(record => new Date(record.date).getDate());
  
  // 更新日历中的签到状态
  calendarDays.value.forEach(day => {
    if (!day.otherMonth && checkedDates.includes(day.day)) {
      day.checked = true;
    }
  });
};

// 生成日历数据
const generateCalendar = () => {
  const days = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // 本月第一天
  const firstDay = new Date(year, month, 1);
  // 本月最后一天
  const lastDay = new Date(year, month + 1, 0);
  // 上月最后一天
  const prevLastDay = new Date(year, month, 0);
  
  // 本月第一天是星期几
  const startDayOfWeek = firstDay.getDay();
  // 本月天数
  const daysInMonth = lastDay.getDate();
  // 上月天数
  const prevDaysInMonth = prevLastDay.getDate();
  
  // 填充上月的日期
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevDaysInMonth - i),
      day: prevDaysInMonth - i,
      checked: false,
      today: false,
      otherMonth: true
    });
  }
  
  // 填充本月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = i === now.getDate();
    days.push({
      date: new Date(year, month, i),
      day: i,
      checked: i <= 10 || isToday,
      today: isToday,
      otherMonth: false
    });
  }
  
  // 填充下月的日期，使日历完整
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      day: i,
      checked: false,
      today: false,
      otherMonth: true
    });
  }
  
  calendarDays.value = days;
  currentMonth.value = `${year}年${month + 1}月`;
};

// 处理签到
const handleCheckin = async () => {
  if (hasCheckedInToday.value) {
    uni.showToast({
      title: '今天已经签到过了',
      icon: 'none'
    });
    return;
  }
  
  try {
    uni.showLoading({
      title: '签到中...'
    });
    
    const res = await instance.appContext.config.globalProperties.$api.checkinApi.dailyCheckin();
    
    uni.hideLoading();
    
    if (res.code === 0) {
      // 更新签到状态
      hasCheckedInToday.value = true;
      continuousDays.value = res.data.consecutiveDays || continuousDays.value + 1;
      totalDays.value = res.data.totalDays || totalDays.value + 1;
      totalScore.value = res.data.totalScore || totalScore.value + checkinReward.value;
      
      // 更新日历
      const today = new Date();
      const todayIndex = calendarDays.value.findIndex(day => 
        day.date.getDate() === today.getDate() && 
        !day.otherMonth
      );
      if (todayIndex !== -1) {
        calendarDays.value[todayIndex].checked = true;
      }
      
      // 显示签到成功弹窗
      showSuccessPopup.value = true;
    }
  } catch (error) {
    uni.hideLoading();
    console.error('签到失败:', error);
    uni.showToast({
      title: '签到失败',
      icon: 'none'
    });
  }
};

// 页面加载时生成日历
onMounted(async () => {
  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync();
  statusBarHeight.value = systemInfo.statusBarHeight || 0;
  
  // 生成日历
  generateCalendar();
  
  // 加载用户信息
  await loadUserInfo();
  
  // 加载签到记录
  await loadCheckinRecords();
  
  // 初始化主题状态
  const currentTheme = uni.getStorageSync('themeMode') || 'light';
  isDarkMode.value = currentTheme === 'dark';
  
  // 监听主题变化事件
  uni.$on('themeChange', (darkMode) => {
    isDarkMode.value = darkMode;
  });
});

onUnmounted(() => {
  uni.$off('themeChange');
});
</script>

<style>
.container {
  background-color: var(--background);
  min-height: 100vh;
  transition: all 0.3s ease;
}

/* 顶部导航栏 */
.nav-bar {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.nav-content {
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 30rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 600;
  color: white;
}

.scroll-content {
  padding-top: 88rpx;
  padding-bottom: 40rpx;
}

/* 签到主体 */
.checkin-section {
  padding: 30rpx;
}

.checkin-card {
  background: var(--card-background);
  border-radius: 30rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 10rpx 20rpx var(--light-shadow-color);
  margin-bottom: 30rpx;
  transition: all 0.3s ease;
}

/* 签到头部 */
.checkin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40rpx;
  transition: all 0.3s ease;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.user-level-tag {
  display: inline-block;
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  color: white;
  font-size: 18rpx;
  font-weight: 600;
  padding: 6rpx 16rpx;
  border-radius: 24rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2rpx 8rpx rgba(245, 158, 11, 0.3);
  min-width: 80rpx;
  text-align: center;
  transition: all 0.3s ease;
  margin-top: 8rpx;
}

.checkin-stats {
  display: flex;
  gap: 30rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4rpx;
}

.stat-value {
  font-size: 32rpx;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 4rpx;
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  transition: all 0.3s ease;
}

.stat-unit {
  font-size: 20rpx;
  font-weight: 600;
  color: var(--text-secondary);
}

.stat-label {
  font-size: 20rpx;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

/* 签到按钮 */
.checkin-main {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 30rpx;
  padding: 40rpx 0;
}

.checkin-circle {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(102, 102, 255, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
}

.checkin-circle:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 12rpx rgba(102, 102, 255, 0.2);
}

.checkin-circle.checked-in {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  box-shadow: 0 8rpx 24rpx rgba(67, 233, 123, 0.3);
}

.circle-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  color: #ffffff;
}

.checkin-icon {
  font-size: 64rpx;
}

.checkin-text {
  font-size: 32rpx;
  font-weight: bold;
}

.checkin-reward {
  font-size: 24rpx;
  background-color: rgba(255, 255, 255, 0.3);
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}

/* 签到日历 */
.checkin-calendar {
  margin-top: 20rpx;
}

.calendar-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20rpx;
}

.calendar-title {
  font-size: 28rpx;
  font-weight: bold;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.calendar-body {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10rpx;
  margin-bottom: 10rpx;
}

.weekday {
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: var(--text-secondary);
  font-weight: bold;
  transition: all 0.3s ease;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10rpx;
}

.day {
  height: 80rpx;
  background-color: var(--active-color);
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

.day.other-month {
  background-color: var(--border-color);
  opacity: 0.5;
}

.day.today {
  background-color: var(--active-color);
  border: 2rpx solid var(--primary-color);
}

.day.checked-in {
  background-color: rgba(67, 233, 123, 0.1);
  border: 2rpx solid var(--success-color);
}

.day-number {
  font-size: 28rpx;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.day.checked-in .day-number {
  color: var(--success-color);
  font-weight: bold;
}

.checkin-mark {
  position: absolute;
  top: 5rpx;
  right: 5rpx;
  font-size: 20rpx;
}

/* 积分规则 */
.rules-section {
  background-color: var(--card-background);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-top: 20rpx;
  box-shadow: 0 2rpx 10rpx var(--light-shadow-color);
  transition: all 0.3s ease;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 20rpx;
  transition: all 0.3s ease;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
  padding: 20rpx;
  background-color: var(--active-color);
  border-radius: 12rpx;
  transition: all 0.3s ease;
}

.rule-icon {
  font-size: 36rpx;
}

.rule-text {
  font-size: 26rpx;
  color: var(--text-secondary);
  flex: 1;
  transition: all 0.3s ease;
}

/* 签到成功弹窗 */
.success-popup {
  width: 90%;
  max-width: 500rpx;
  background-color: var(--card-background);
  border-radius: 24rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  transition: all 0.3s ease;
}

.success-icon {
  font-size: 80rpx;
}

.success-title {
  font-size: 36rpx;
  font-weight: bold;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.success-desc {
  font-size: 28rpx;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.success-stats {
  width: 100%;
  background-color: var(--active-color);
  border-radius: 16rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  transition: all 0.3s ease;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-row .stat-label {
  font-size: 26rpx;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.stat-row .stat-value {
  font-size: 28rpx;
  font-weight: bold;
  color: var(--primary-color);
  transition: all 0.3s ease;
}

.confirm-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: #ffffff;
  font-size: 28rpx;
  font-weight: bold;
  border: none;
  border-radius: 45rpx;
  margin-top: 20rpx;
  transition: all 0.3s ease;
}

.confirm-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 6rpx rgba(102, 102, 255, 0.2);
}

/* 夜间模式样式 */
.dark-mode .container {
  background-color: #1a1a1a;
}

.dark-mode .nav-bar {
  background-color: #2d2d2d;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.3);
}

.dark-mode .back-btn {
  background-color: #404040;
}

.dark-mode .back-icon {
  color: #ffffff;
}

.dark-mode .nav-title {
  color: #ffffff;
}

.dark-mode .checkin-card {
  background-color: #2d2d2d;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.3);
}

.dark-mode .checkin-header {
  border-bottom-color: #404040;
}

.dark-mode .user-name {
  color: #ffffff;
}

.dark-mode .stat-value {
  color: #ffffff;
}

.dark-mode .stat-label {
  color: #999999;
}

.dark-mode .calendar-title {
  color: #ffffff;
}

.dark-mode .weekday {
  color: #cccccc;
}

.dark-mode .day {
  background-color: #404040;
}

.dark-mode .day.other-month {
  background-color: #333333;
}

.dark-mode .day.today {
  background-color: #404040;
  border-color: #6666ff;
}

.dark-mode .day-number {
  color: #ffffff;
}

.dark-mode .rules-section {
  background-color: #2d2d2d;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.3);
}

.dark-mode .section-title {
  color: #ffffff;
}

.dark-mode .rule-item {
  background-color: #404040;
}

.dark-mode .rule-text {
  color: #cccccc;
}

.dark-mode .success-popup {
  background-color: #2d2d2d;
}

.dark-mode .success-title {
  color: #ffffff;
}

.dark-mode .success-desc {
  color: #cccccc;
}

.dark-mode .success-stats {
  background-color: #404040;
}

.dark-mode .stat-row .stat-label {
  color: #cccccc;
}
</style>