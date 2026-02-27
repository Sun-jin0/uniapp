<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { request } from '../../api/request';
import { processStem, countBlanks } from '../../utils/questionUtils';

const statusBarHeight = ref(0);
const loading = ref(true);
const testStarted = ref(false);
const testFinished = ref(false);
const showReview = ref(false);
const showAnswerSheet = ref(false);
const questions = ref([]);
const currentIndex = ref(0);
const userAnswers = ref({}); // { questionId: answer }
const multiChoiceAnswers = ref({}); // { questionId: [keys] }
const blankAnswers = ref({}); // { questionId: [answers] }
const subjectiveAnswers = ref({}); // { questionId: { sub_id: answer } }
const timeRemaining = ref(3600); // 60 minutes
const timer = ref(null);
const score = ref(0);
const stats = ref({
  total: 0,
  correct: 0,
  wrong: 0,
  unanswered: 0
});

// 反馈相关
const showFeedback = ref(false);
const feedbackType = ref('题目纠错');
const feedbackContent = ref('');

const submitFeedback = async () => {
  const q = currentQuestion.value;
  if (!q || !feedbackContent.value.trim()) {
    uni.showToast({ title: '请输入反馈内容', icon: 'none' });
    return;
  }
  try {
    await request({
      url: '/computer1/feedback',
      method: 'POST',
      data: {
        questionId: q.question_id,
        type: feedbackType.value,
        content: feedbackContent.value
      }
    });
    uni.showToast({ title: '反馈提交成功', icon: 'success' });
    showFeedback.value = false;
    feedbackContent.value = '';
  } catch (error) {
    console.error('提交反馈失败:', error);
    uni.showToast({ title: '提交失败', icon: 'none' });
  }
};

const currentQuestion = computed(() => questions.value[currentIndex.value] || null);
const currentSubjectId = ref(null);

onMounted(async () => {
  const systemInfo = uni.getSystemInfoSync();
  statusBarHeight.value = systemInfo.statusBarHeight || 0;
  
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options || {};
  currentSubjectId.value = options.subjectId;
  
  await fetchTestQuestions(currentSubjectId.value);
});

onUnmounted(() => {
  stopTimer();
});

const fetchTestQuestions = async (subjectId) => {
  const id = subjectId || currentSubjectId.value;
  loading.value = true;
  try {
    const res = await request({ 
      url: '/computer1/test/generate',
      data: { subjectId: id, count: 20 }
    });
    
    // 处理题目数据
    const processedQuestions = (res.data || []).map(q => {
      // 初始化答案结构
      if (q.exercise_type === 2) {
        multiChoiceAnswers.value[q.question_id] = [];
      } else if (q.exercise_type === 3) {
        const totalBlanks = countBlanks(q.stem);
        blankAnswers.value[q.question_id] = new Array(totalBlanks).fill('');
      }
      
      // 只要有小题，就初始化小题答案结构
      if (q.subs && q.subs.length > 0) {
        subjectiveAnswers.value[q.question_id] = {};
        q.subs.forEach((sub, idx) => {
          subjectiveAnswers.value[q.question_id][sub.sub_id || idx] = '';
        });
      } else if (q.exercise_type === 4) {
        // 没有小题的解答题，初始化主输入区
        subjectiveAnswers.value[q.question_id] = { 'main': '' };
      }

      return {
        ...q,
        stem: processStem(q.stem),
        options: (q.options || []).map(opt => ({
          ...opt,
          option_value: processStem(opt.option_value)
        })),
        answer: q.exercise_type === 3 ? q.answer : processStem(q.answer || ''),
        analysis: processStem(q.analysis || ''),
        commentary: processStem(q.commentary || ''),
        method: processStem(q.method || ''),
        subs: (q.subs || []).map(sub => ({
          ...sub,
          stem: processStem(sub.stem),
          answer: processStem(sub.answer),
          analysis: processStem(sub.analysis)
        }))
      };
    });
    
    // 按题型排序 (单选 1, 多选 2, 填空 3, 解答 4, 判断 5)
    // 排序逻辑：单选 -> 多选 -> 判断 -> 填空 -> 解答
    const typeOrder = { 1: 1, 2: 2, 5: 3, 3: 4, 4: 5 };
    processedQuestions.sort((a, b) => (typeOrder[a.exercise_type] || 99) - (typeOrder[b.exercise_type] || 99));

    // 为题目增加题型分组标记
    let lastType = null;
    processedQuestions.forEach(q => {
      if (q.exercise_type !== lastType) {
        q.isTypeFirst = true;
        lastType = q.exercise_type;
      }
    });

    questions.value = processedQuestions;
    stats.value.total = questions.value.length;
  } catch (error) {
    console.error('获取测试题目失败:', error);
    uni.showToast({ title: '获取题目失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const startTest = () => {
  testStarted.value = true;
  startTimer();
};

const startTimer = () => {
  timer.value = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--;
    } else {
      submitTest();
    }
  }, 1000);
};

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const selectOption = (optionKey) => {
  if (testFinished.value) return;
  const q = currentQuestion.value;
  if (!q) return;
  
  if (q.exercise_type === 2) {
    // 多选
    const current = multiChoiceAnswers.value[q.question_id] || [];
    const index = current.indexOf(optionKey);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(optionKey);
      current.sort();
    }
    multiChoiceAnswers.value[q.question_id] = current;
    userAnswers.value[q.question_id] = current.join('');
  } else {
    // 单选和判断
    userAnswers.value[q.question_id] = optionKey;
  }
};

const handleBlankInput = (index, value) => {
  if (testFinished.value) return;
  const q = currentQuestion.value;
  if (!q) return;
  
  if (!blankAnswers.value[q.question_id]) {
    const totalBlanks = countBlanks(q.stem);
    blankAnswers.value[q.question_id] = new Array(totalBlanks).fill('');
  }
  blankAnswers.value[q.question_id][index] = value;
  
  // 检查是否所有填空都为空
  const hasValue = blankAnswers.value[q.question_id].some(v => v && v.trim() !== '');
  if (hasValue) {
    userAnswers.value[q.question_id] = JSON.stringify(blankAnswers.value[q.question_id]);
  } else {
    delete userAnswers.value[q.question_id];
  }
};

const handleSubjectiveInput = (subId, value) => {
  if (testFinished.value) return;
  const q = currentQuestion.value;
  if (!q) return;
  
  if (!subjectiveAnswers.value[q.question_id]) {
    subjectiveAnswers.value[q.question_id] = {};
  }
  subjectiveAnswers.value[q.question_id][subId] = value;
  
  // 检查是否所有小题都为空
  const answers = Object.values(subjectiveAnswers.value[q.question_id]);
  const hasValue = answers.some(v => v && v.trim() !== '');
  if (hasValue) {
    userAnswers.value[q.question_id] = JSON.stringify(subjectiveAnswers.value[q.question_id]);
  } else {
    delete userAnswers.value[q.question_id];
  }
};

const nextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++;
  }
};

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

const submitTest = () => {
  uni.showModal({
    title: '确认交卷',
    content: '确定要结束测试并交卷吗？',
    success: (res) => {
      if (res.confirm) {
        processResults();
      }
    }
  });
};

const processResults = () => {
  stopTimer();
  testFinished.value = true;
  
  let correctCount = 0;
    let unansweredCount = 0;
    
    questions.value.forEach(q => {
      const userAns = userAnswers.value[q.question_id];
      
      if (!userAns) {
        unansweredCount++;
      } else {
        if (q.exercise_type === 1 || q.exercise_type === 5) {
          // 单选、判断
          if (userAns === q.answer) correctCount++;
        } else if (q.exercise_type === 2) {
          // 多选
          if (userAns === q.answer) correctCount++;
        } else if (q.exercise_type === 3) {
          // 填空题自动判分（简单匹配）
          try {
            const correctAnswers = JSON.parse(q.answer);
            const userBlankAns = blankAnswers.value[q.question_id] || [];
            
            if (Array.isArray(correctAnswers)) {
              const isAllCorrect = userBlankAns.length === correctAnswers.length && 
                userBlankAns.every((ans, i) => (ans || '').trim() === (correctAnswers[i] || '').trim());
              if (isAllCorrect) correctCount++;
            } else {
              if ((userBlankAns[0] || '').trim() === (q.answer || '').trim()) correctCount++;
            }
          } catch (e) {
            // 非 JSON 格式，直接比对字符串
            const userBlankAns = blankAnswers.value[q.question_id] || [];
            if ((userBlankAns[0] || '').trim() === (q.answer || '').trim()) correctCount++;
          }
        } else {
          // 解答题默认算对（或者后续增加人工阅卷逻辑）
          correctCount++; 
        }
      }
    });
    
    stats.value.correct = correctCount;
  stats.value.unanswered = unansweredCount;
  stats.value.wrong = stats.value.total - correctCount - unansweredCount;
  score.value = Math.round((correctCount / stats.value.total) * 100);
  
  // 上报成绩到后端
  reportScore();
};

const reportScore = async () => {
  try {
    await request({
      url: '/computer1/test/report',
      method: 'POST',
      data: {
        score: score.value,
        stats: stats.value,
        answers: userAnswers.value
      }
    });
  } catch (e) {
    console.error('上报成绩失败:', e);
  }
};

const goBack = () => {
  if (testStarted.value && !testFinished.value) {
    uni.showModal({
      title: '正在测试中',
      content: '退出将不保存当前进度，确定退出吗？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateBack();
        }
      }
    });
  } else {
    uni.navigateBack();
  }
};

const reviewTest = () => {
  currentIndex.value = 0;
  testStarted.value = true;
  // testFinished is already true
};

const restartTest = () => {
  testStarted.value = false;
  testFinished.value = false;
  currentIndex.value = 0;
  userAnswers.value = {};
  timeRemaining.value = 3600;
  fetchTestQuestions(currentSubjectId.value);
};
</script>

<template>
  <view class="app-container" :class="{ 'finished': testFinished }">
    <!-- 状态栏占位 -->
    <view :style="{ height: statusBarHeight + 'px', background: '#fff' }"></view>
    
    <!-- 自定义导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @click="goBack">
        <text class="back-icon">❮</text>
      </view>
      <view class="nav-title">模拟测试</view>
      <view class="nav-right">
        <view v-if="testStarted" class="nav-tools">
          <view class="nav-tool-btn" @click="showFeedback = true">
            <text class="tool-icon">💬</text>
          </view>
          <view v-if="!testFinished" class="nav-tool-btn" @click="showAnswerSheet = true">
            <text class="tool-icon">📋</text>
          </view>
          <view v-if="!testFinished" class="timer">{{ formatTime(timeRemaining) }}</view>
        </view>
      </view>
    </view>

    <!-- 未开始状态 -->
    <view v-if="!testStarted && !loading" class="start-screen">
      <view class="test-icon">📝</view>
      <view class="test-info">
        <text class="test-name">计算机基础模拟测试</text>
        <text class="test-desc">共 {{ questions.length }} 道题，限时 60 分钟</text>
      </view>
      <button class="start-btn" @click="startTest">开始测试</button>
    </view>

    <!-- 测试中状态 -->
    <view v-if="testStarted" class="test-container">
      <view class="progress-info" v-if="!testFinished">
        <text class="current-pos">题目 {{ currentIndex + 1 }}/{{ questions.length }}</text>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: ((currentIndex + 1) / questions.length * 100) + '%' }"></view>
        </view>
      </view>

      <scroll-view scroll-y class="question-scroll">
        <view class="question-detail" v-if="currentQuestion">
          <!-- 题型分类标题 -->
          <view v-if="currentQuestion.isTypeFirst" class="type-group-header">
            <text class="type-name">{{ currentQuestion.exercise_type_name }}</text>
            <view class="type-line"></view>
          </view>

          <!-- 题目信息 -->
          <view class="question-info">
            <view class="info-left">
              <text class="info-item type">{{ currentQuestion.exercise_type_name }}</text>
            </view>
          </view>

          <!-- 题干 -->
          <view class="stem-section">
            <view class="stem-text" v-html="currentQuestion.stem"></view>
          </view>
          
          <!-- 填空题输入区 -->
          <view class="blanks-input-section" v-if="currentQuestion.exercise_type === 3 && blankAnswers[currentQuestion.question_id]">
            <view v-for="(ans, index) in blankAnswers[currentQuestion.question_id]" :key="index" class="blank-input-item">
              <text class="blank-label">填空 ({{ index + 1 }})</text>
              <input 
                class="blank-input" 
                :value="blankAnswers[currentQuestion.question_id][index]"
                @input="(e) => handleBlankInput(index, e.detail.value)"
                placeholder="请输入答案"
                :disabled="testFinished"
              />
            </view>
          </view>

          <!-- 解答题主输入区 -->
          <view class="saq-input-section" v-if="currentQuestion.exercise_type === 4 && (!currentQuestion.subs || currentQuestion.subs.length === 0)">
            <textarea 
              class="saq-input" 
              :value="subjectiveAnswers[currentQuestion.question_id]?.['main'] || ''"
              @input="(e) => handleSubjectiveInput('main', e.detail.value)"
              placeholder="请输入您的答案..."
              :disabled="testFinished"
            />
          </view>

          <!-- 选项 (单选/多选/判断) -->
          <view class="options-section" v-if="(currentQuestion.exercise_type === 1 || currentQuestion.exercise_type === 2 || currentQuestion.exercise_type === 5) && currentQuestion.options && currentQuestion.options.length > 0">
            <view 
              v-for="opt in currentQuestion.options" 
              :key="opt.option_key"
              class="option-item"
              :class="{ 
                'selected': currentQuestion.exercise_type === 2 
                  ? (multiChoiceAnswers[currentQuestion.question_id] || []).includes(opt.option_key)
                  : userAnswers[currentQuestion.question_id] === opt.option_key,
                'correct': testFinished && (currentQuestion.answer || '').includes(opt.option_key),
                'wrong': testFinished && (currentQuestion.exercise_type === 2 
                  ? (multiChoiceAnswers[currentQuestion.question_id] || []).includes(opt.option_key)
                  : userAnswers[currentQuestion.question_id] === opt.option_key) && !(currentQuestion.answer || '').includes(opt.option_key)
              }"
              @click="selectOption(opt.option_key)"
            >
              <view class="option-key">
                <text v-if="currentQuestion.exercise_type === 2" class="multi-indicator">
                  {{ (multiChoiceAnswers[currentQuestion.question_id] || []).includes(opt.option_key) ? '✓' : '' }}
                </text>
                <text>{{ opt.option_key }}</text>
              </view>
              <view class="option-value" v-html="opt.option_value"></view>
            </view>
          </view>

          <!-- 小题 -->
          <view class="subs-section" v-if="currentQuestion.subs && currentQuestion.subs.length > 0">
            <view v-for="(sub, index) in currentQuestion.subs" :key="sub.sub_id || index" class="sub-item">
              <view class="sub-header">
                <text class="sub-index">({{ index + 1 }})</text>
                <text class="sub-score" v-if="sub.score">[{{ sub.score }}分]</text>
              </view>
              <view class="sub-stem" v-html="sub.stem"></view>
              
              <view class="sub-input-section" v-if="currentQuestion.exercise_type === 4">
                <textarea 
                  class="sub-input" 
                  :value="subjectiveAnswers[currentQuestion.question_id]?.[sub.sub_id || index] || ''"
                  @input="(e) => handleSubjectiveInput(sub.sub_id || index, e.detail.value)"
                  placeholder="请输入该小题的答案..."
                  :disabled="testFinished"
                />
              </view>

              <view v-if="testFinished" class="sub-answer-section">
                <view class="sub-answer">
                  <text class="label">【答案】</text>
                  <view v-html="sub.answer"></view>
                </view>
                <view v-if="sub.analysis" class="sub-analysis">
                  <text class="label">【解析】</text>
                  <view v-html="sub.analysis"></view>
                </view>
              </view>
            </view>
          </view>

          <!-- 答案和解析 (仅在测试结束后显示) -->
          <view class="answer-section" v-if="testFinished">
            <view class="answer-box">
              <view class="answer-title">正确答案</view>
              <view class="answer-content">
                <!-- 填空题答案特殊处理 -->
                <view v-if="currentQuestion.exercise_type === 3">
                   <view v-for="(ans, idx) in ((() => {
                    try {
                      // 1. 尝试解析 JSON 格式的答案
                      const parsed = typeof currentQuestion.answer === 'string' ? JSON.parse(currentQuestion.answer) : currentQuestion.answer;
                      if (Array.isArray(parsed)) return parsed;
                      
                      // 2. 如果不是数组，检查是否有关联的选项数据 (options 表中存储了填空题答案)
                      if (currentQuestion.options && currentQuestion.options.length > 0) {
                        return currentQuestion.options.map(o => o.option_value);
                      }
                      
                      // 3. 兜底返回原始答案
                      return [currentQuestion.answer];
                    } catch (e) {
                      // 4. 解析失败时，检查 options
                      if (currentQuestion.options && currentQuestion.options.length > 0) {
                        return currentQuestion.options.map(o => o.option_value);
                      }
                      return [currentQuestion.answer];
                    }
                  })())" :key="idx" class="blank-answer-item">
                    <text class="blank-index">({{ idx + 1 }})</text>
                    <view class="blank-text" v-html="processStem(ans)"></view>
                  </view>
                </view>
                <!-- 其他题型答案 -->
                <view v-else v-html="currentQuestion.answer"></view>
              </view>
            </view>
            
            <view class="analysis-box" v-if="currentQuestion.analysis || currentQuestion.commentary || currentQuestion.method">
              <view class="analysis-title">题目解析</view>
              <view class="analysis-content">
                <view v-if="currentQuestion.analysis" v-html="currentQuestion.analysis"></view>
                <view v-if="currentQuestion.commentary" class="extra-analysis">
                  <text class="label">【点评】</text>
                  <view v-html="currentQuestion.commentary"></view>
                </view>
                <view v-if="currentQuestion.method" class="extra-analysis">
                  <text class="label">【方法】</text>
                  <view v-html="currentQuestion.method"></view>
                </view>
              </view>
            </view>
          </view>

          <view class="bottom-placeholder"></view>
        </view>
      </scroll-view>

      <view class="action-bar">
        <button class="prev-btn" :disabled="currentIndex === 0" @click="prevQuestion">上一题</button>
        <button v-if="currentIndex < questions.length - 1" class="next-btn" @click="nextQuestion">下一题</button>
        <button v-else-if="!testFinished" class="submit-btn" @click="submitTest">提交试卷</button>
        <button v-else class="finish-btn" @click="testStarted = false">结束查看</button>
      </view>
    </view>

    <!-- 测试结果状态 -->
    <view v-if="!testStarted && testFinished" class="result-screen">
      <view class="result-card">
        <view class="score-circle">
          <text class="score-num">{{ score }}</text>
          <text class="score-label">分</text>
        </view>
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-val">{{ stats.correct }}</text>
            <text class="stat-label">正确</text>
          </view>
          <view class="stat-item">
            <text class="stat-val">{{ stats.wrong }}</text>
            <text class="stat-label">错误</text>
          </view>
          <view class="stat-item">
            <text class="stat-val">{{ stats.unanswered }}</text>
            <text class="stat-label">未做</text>
          </view>
        </view>
      </view>
      
      <view class="result-actions">
        <button class="review-btn" @click="reviewTest">查看解析</button>
        <button class="retry-btn" @click="restartTest">重新测试</button>
        <button class="back-home-btn" @click="goBack">返回首页</button>
      </view>
    </view>

    <!-- 答题卡弹窗 -->
    <view class="modal-mask" v-if="showAnswerSheet" @click="showAnswerSheet = false">
      <view class="answer-sheet-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">答题卡</text>
          <text class="close-btn" @click="showAnswerSheet = false">✕</text>
        </view>
        <scroll-view scroll-y class="sheet-content">
          <view class="sheet-status-legend">
            <view class="legend-item"><view class="status-dot current"></view><text>当前</text></view>
            <view class="legend-item"><view class="status-dot done"></view><text>已做</text></view>
            <view class="legend-item"><view class="status-dot undone"></view><text>未做</text></view>
          </view>
          <view class="sheet-grid">
            <view 
              v-for="(q, index) in questions" 
              :key="q.question_id" 
              class="sheet-item"
              :class="{ 
                'current': index === currentIndex,
                'done': userAnswers[q.question_id]
              }"
              @click="currentIndex = index; showAnswerSheet = false"
            >
              {{ index + 1 }}
            </view>
          </view>
        </scroll-view>
        <view class="modal-footer">
          <button class="modal-submit-btn" @click="showAnswerSheet = false; submitTest()">提前交卷</button>
        </view>
      </view>
    </view>

    <!-- 反馈弹窗 -->
    <view class="modal-mask" v-if="showFeedback" @click="showFeedback = false">
      <view class="feedback-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">题目纠错</text>
          <text class="close-btn" @click="showFeedback = false">✕</text>
        </view>
        <view class="feedback-form">
          <picker :range="['题目纠错', '内容不全', '答案错误', '其他问题']" @change="(e) => feedbackType = ['题目纠错', '内容不全', '答案错误', '其他问题'][e.detail.value]">
            <view class="picker-item">反馈类型：{{ feedbackType }}</view>
          </picker>
          <textarea class="feedback-input" v-model="feedbackContent" placeholder="请详细描述题目问题..."></textarea>
          <button class="feedback-submit" @click="submitFeedback">提交反馈</button>
        </view>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-overlay">
      <view class="spinner"></view>
      <text>题目加载中...</text>
    </view>
  </view>
</template>

<style scoped>
.app-container {
  --primary-color: #1976d2;
  --primary-gradient: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
  --bg-color: #f8f9fa;
  --card-bg: #ffffff;
  --text-main: #333333;
  --text-secondary: #666666;
  --text-light: #999999;
  --border-color: #eee;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
  
  min-height: 100vh;
}

/* 题型分类标题样式 */
.type-group-header {
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.type-name {
  font-size: 34rpx;
  font-weight: bold;
  color: var(--primary-color);
  white-space: nowrap;
}

.type-line {
  flex: 1;
  height: 2rpx;
  background: linear-gradient(90deg, var(--primary-color) 0%, transparent 100%);
  opacity: 0.3;
}

/* 代码块支持左右滑动 */
:deep(pre), :deep(code) {
  max-width: 100%;
  overflow-x: auto !important;
  display: block !important;
  white-space: pre !important;
  word-break: normal !important;
  word-wrap: normal !important;
  -webkit-overflow-scrolling: touch;
}

:deep(pre) {
  background-color: #f6f8fa;
  padding: 20rpx;
  border-radius: 8rpx;
  margin: 10rpx 0;
  font-family: monospace;
  box-sizing: border-box;
}

:deep(.math-tex) {
  max-width: 100%;
  overflow-x: auto;
  display: inline-block;
  vertical-align: middle;
}

/* 页面容器样式 */
.app-container {
  background-color: var(--bg-color);
  display: flex;
  flex-direction: column;
  color: var(--text-main);
}

/* 答案解析布局优化 */
.answer-box {
  background: rgba(76, 175, 80, 0.08);
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  display: flex;
  flex-direction: column;
  border-left: 8rpx solid #4CAF50;
  width: 100%;
  box-sizing: border-box;
}

.answer-title {
  font-size: 0.95em;
  font-weight: bold;
  color: #2e7d32;
  margin-bottom: 12rpx;
  white-space: nowrap;
}

.answer-content {
  width: 100%;
  overflow-x: auto;
  font-size: 1.1em;
  font-weight: bold;
  color: #1b5e20;
}

.analysis-box {
  background: var(--bg-color);
  border-radius: 16rpx;
  padding: 24rpx;
  border: 2rpx solid var(--border-color);
  margin-top: 30rpx;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

.analysis-content {
  width: 100%;
  overflow-x: auto;
  font-size: 1em;
  line-height: 1.8;
  color: var(--text-main);
}

.nav-bar {
  height: 44px;
  background: var(--card-bg);
  display: flex;
  align-items: center;
  padding: 0 15px;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
  border-bottom: 1rpx solid var(--border-color);
}

.nav-left { width: 60rpx; }
.nav-title { flex: 1; text-align: center; font-weight: bold; font-size: 32rpx; color: var(--text-main); }
.nav-right { min-width: 160rpx; display: flex; justify-content: flex-end; }

.timer {
  color: #ff4d4f;
  font-family: monospace;
  font-weight: bold;
  font-size: 28rpx;
  background: rgba(255, 77, 79, 0.05);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.start-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.test-icon { font-size: 120rpx; margin-bottom: 40rpx; }
.test-info { text-align: center; margin-bottom: 80rpx; }
.test-name { font-size: 40rpx; font-weight: bold; display: block; margin-bottom: 20rpx; color: var(--text-main); }
.test-desc { font-size: 28rpx; color: var(--text-secondary); }

.start-btn {
  width: 80%;
  height: 90rpx;
  background: var(--primary-gradient);
  color: #fff;
  border-radius: 45rpx;
  line-height: 90rpx;
  font-weight: bold;
}

.test-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20rpx;
}

.progress-info { margin-bottom: 20rpx; }
.current-pos { font-size: 24rpx; color: var(--text-light); margin-bottom: 10rpx; display: block; }
.progress-bar { height: 6rpx; background: var(--border-color); border-radius: 3rpx; }
.progress-fill { height: 100%; background: var(--primary-gradient); border-radius: 3rpx; transition: width 0.3s; }

.question-scroll { flex: 1; margin-bottom: 20rpx; }

/* 题目详情样式 - 匹配 computer-question-detail */
.question-detail {
  padding: 20rpx;
  background: var(--card-bg);
  border-radius: 16rpx;
  box-shadow: var(--shadow-sm);
  border: 1rpx solid var(--border-color);
}

.question-info {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.info-item.type {
  font-size: 22rpx;
  color: #fff;
  background: var(--primary-gradient);
  padding: 4rpx 16rpx;
  border-radius: 6rpx;
  font-weight: 500;
}

.stem-section {
  margin-bottom: 30rpx;
}

.stem-text {
  line-height: 1.7;
  color: var(--text-main);
  font-size: 32rpx;
  word-break: break-word;
}

:deep(img) {
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  display: block;
  margin: 20rpx auto;
  border-radius: 12rpx;
}

.options-section {
  margin-top: 30rpx;
}

.option-item {
  display: flex;
  padding: 20rpx 24rpx;
  border: 2rpx solid var(--border-color);
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  background: var(--card-bg);
  transition: all 0.2s;
  align-items: center;
}

.option-item.selected {
  border-color: var(--primary-color);
  background: rgba(25, 118, 210, 0.04);
}

.option-item.correct {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.04);
}

.option-item.wrong {
  border-color: #f44336;
  background: rgba(244, 67, 54, 0.04);
}

.option-key {
  width: 56rpx;
  height: 56rpx;
  min-width: 56rpx;
  font-weight: bold;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  border-radius: 50%;
  margin-right: 24rpx;
  font-size: 28rpx;
  border: 2rpx solid var(--border-color);
}

.option-item.selected .option-key {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}

.option-item.correct .option-key {
  background: #4caf50;
  color: #fff;
  border-color: #4caf50;
}

.option-item.wrong .option-key {
  background: #f44336;
  color: #fff;
  border-color: #f44336;
}

.option-value {
  flex: 1;
  font-size: 30rpx;
  line-height: 1.5;
  color: var(--text-main);
}

/* 答案解析样式 */
.answer-section {
  margin-top: 40rpx;
  padding-top: 40rpx;
  border-top: 2rpx dashed var(--border-color);
}

.answer-box {
  background: rgba(76, 175, 80, 0.05);
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
}

/* 答案解析区域 */
.answer-section {
  margin-top: 40rpx;
  animation: fadeIn 0.3s ease;
}

.answer-box {
  background: rgba(76, 175, 80, 0.08);
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  display: flex;
  flex-direction: column;
  border-left: 8rpx solid #4CAF50;
}

.answer-title {
  font-size: 0.95em;
  font-weight: bold;
  color: #2e7d32;
  margin-bottom: 10rpx;
  white-space: nowrap;
}

.answer-content {
  font-size: 1.1em;
  font-weight: bold;
  color: #1b5e20;
  width: 100%;
  overflow-x: hidden;
}

.blank-answer-item {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
  padding: 6rpx 16rpx;
  background: rgba(25, 118, 210, 0.05);
  border-radius: 8rpx;
}

.blank-answer-item:last-child {
  margin-bottom: 0;
}

.blank-answer-item .blank-index {
  font-weight: bold;
  color: var(--primary-color);
  margin-right: 12rpx;
  font-size: 0.85em;
}

.blank-text {
  flex: 1;
  color: var(--text-main);
  word-break: break-all;
  font-size: 0.95em;
}

.analysis-title {
  font-size: 0.9em;
  font-weight: bold;
  color: #f57c00;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.analysis-title::before {
  content: '💡';
  font-size: 1.1em;
}

.extra-analysis {
  margin-top: 24rpx;
  padding: 20rpx;
  background: var(--card-bg);
  border-radius: 12rpx;
  border-left: 6rpx solid #f57c00;
}

.extra-analysis .label {
  font-weight: bold;
  color: #f57c00;
  font-size: 0.85em;
  margin-bottom: 12rpx;
  display: block;
}

.bottom-placeholder {
  height: 40rpx;
}

.action-bar {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 0;
}

.action-bar button { flex: 1; height: 80rpx; line-height: 80rpx; font-size: 28rpx; border-radius: 40rpx; }
.prev-btn { background: var(--card-bg); color: var(--text-secondary); border: 1rpx solid var(--border-color); }
.next-btn, .submit-btn, .finish-btn { background: var(--primary-gradient); color: #fff; }

.result-screen {
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result-card {
  width: 100%;
  background: var(--card-bg);
  border-radius: 30rpx;
  padding: 60rpx 40rpx;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.score-circle {
  width: 200rpx;
  height: 200rpx;
  border: 10rpx solid var(--primary-color);
  border-radius: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 60rpx;
}

.score-num { font-size: 80rpx; font-weight: bold; color: var(--primary-color); }
.score-label { font-size: 24rpx; color: var(--primary-color); margin-top: 20rpx; }

.stats-grid {
  display: flex;
  width: 100%;
  justify-content: space-around;
}

.stat-item { text-align: center; }
.stat-val { font-size: 36rpx; font-weight: bold; display: block; margin-bottom: 10rpx; color: var(--text-main); }
.stat-label { font-size: 24rpx; color: var(--text-light); }

.result-actions { width: 100%; display: flex; flex-direction: column; gap: 30rpx; }
.review-btn { background: var(--primary-gradient); color: #fff; height: 90rpx; border-radius: 45rpx; line-height: 90rpx; font-weight: bold; }
.retry-btn { background: var(--card-bg); color: var(--primary-color); height: 90rpx; border-radius: 45rpx; line-height: 90rpx; border: 1rpx solid var(--primary-color); }
.back-home-btn { background: var(--card-bg); color: var(--text-secondary); height: 90rpx; border-radius: 45rpx; line-height: 90rpx; border: 1rpx solid var(--border-color); }

.loading-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 填空题样式 */
.blanks-input-section {
  margin: 20rpx 0;
  padding: 20rpx;
  background: var(--bg-color);
  border-radius: 20rpx;
  border: 1rpx solid var(--border-color);
}

.blank-input-item {
  margin-bottom: 16rpx;
}

.blank-input-item:last-child {
  margin-bottom: 0;
}

.blank-label {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-bottom: 8rpx;
  display: block;
  font-weight: 500;
}

.blank-input {
  width: 100%;
  height: 80rpx;
  background: var(--card-bg);
  border: 2rpx solid var(--border-color);
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  transition: all 0.3s;
}

.blank-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4rpx rgba(25, 118, 210, 0.1);
}

/* 解答题样式 */
.saq-input-section {
  margin: 20rpx 0;
}

.saq-input, .sub-input {
  width: 100%;
  height: 240rpx;
  background: var(--bg-color);
  border: 2rpx solid var(--border-color);
  border-radius: 20rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  color: var(--text-main);
  transition: all 0.3s;
  line-height: 1.6;
}

.saq-input:focus, .sub-input:focus {
  border-color: var(--primary-color);
  background: var(--card-bg);
  box-shadow: 0 0 0 4rpx rgba(25, 118, 210, 0.1);
}

/* 填空占位符样式 */
:deep(.blank-placeholder) {
  display: inline-flex;
  align-items: baseline;
  margin: 0 8rpx;
  color: var(--primary-color);
  vertical-align: middle;
}

:deep(.blank-index) {
  font-size: 24rpx;
  font-weight: normal;
  margin-right: 4rpx;
  color: var(--text-secondary);
}

:deep(.blank-underline) {
  border-bottom: 2rpx solid var(--primary-color);
  min-width: 80rpx;
  display: inline-block;
  height: 2rpx;
  margin-bottom: 2rpx;
}

/* 小题样式 */
.subs-section {
  margin-top: 30rpx;
}

.sub-item {
  padding: 24rpx;
  background: var(--bg-color);
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid var(--border-color);
}

.sub-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.sub-index {
  font-weight: bold;
  color: var(--primary-color);
  margin-right: 12rpx;
}

.sub-score {
  font-size: 22rpx;
  color: var(--text-light);
}

.sub-stem {
  font-size: 28rpx;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.sub-input-section {
  margin-top: 20rpx;
}

.sub-input {
  height: 180rpx;
}

.sub-answer-section {
  margin-top: 24rpx;
  padding: 24rpx;
  background: rgba(25, 118, 210, 0.05);
  border-radius: 12rpx;
  border-left: 6rpx solid var(--primary-color);
}

.sub-answer, .sub-analysis {
  margin-bottom: 16rpx;
}

.sub-answer:last-child, .sub-analysis:last-child {
  margin-bottom: 0;
}

.sub-answer .label, .sub-analysis .label {
  font-weight: bold;
  color: var(--primary-color);
  font-size: 0.85em;
  margin-bottom: 8rpx;
  display: block;
}

/* 导航栏工具 */
.nav-tools {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.nav-tool-btn {
  padding: 10rpx;
}

.tool-icon {
  font-size: 40rpx;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.answer-sheet-modal {
  width: 100%;
  background: var(--card-bg);
  border-radius: 30rpx 30rpx 0 0;
  padding: 30rpx;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid var(--border-color);
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
}

.close-btn {
  font-size: 40rpx;
  color: var(--text-light);
  padding: 10rpx;
}

.sheet-content {
  flex: 1;
  overflow: hidden;
}

.sheet-status-legend {
  display: flex;
  gap: 30rpx;
  margin-bottom: 30rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: var(--text-secondary);
}

.status-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  margin-right: 10rpx;
}

.status-dot.current { background: var(--primary-color); }
.status-dot.done { background: rgba(25, 118, 210, 0.2); border: 1rpx solid var(--primary-color); }
.status-dot.undone { background: var(--bg-color); border: 1rpx solid var(--border-color); }

.sheet-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20rpx;
  padding-bottom: 30rpx;
}

.sheet-item {
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: 1rpx solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-secondary);
}

.sheet-item.current {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}

.sheet-item.done {
  background: rgba(25, 118, 210, 0.1);
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.modal-footer {
  padding: 30rpx 0;
  border-top: 1rpx solid var(--border-color);
}

.modal-submit-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  background: var(--primary-gradient);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.loading-overlay text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #fff;
}

/* 反馈弹窗样式 */
.feedback-modal {
  width: 85%;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  animation: modalIn 0.3s ease;
  /* 居中显示 */
  margin: auto;
}

.feedback-form {
  padding: 30rpx;
}

.picker-item {
  background: #f8f9fa;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  color: #333;
}

.feedback-input {
  width: 100%;
  height: 240rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  margin-bottom: 30rpx;
}

.feedback-submit {
  background: var(--primary-color);
  color: #fff;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
}

@keyframes modalIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>