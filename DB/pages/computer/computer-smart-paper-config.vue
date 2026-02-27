<template>
  <view class="config-container">
    <view class="top-bar">
      <navigator url="/pages/computer/computer-main" class="back-btn">❮ 返回</navigator>
      <view class="page-title">{{ compositionMode === 'smart' ? '智能组卷配置' : '手动组卷模式' }}</view>
    </view>

    <view class="main-content">
      <!-- 模式切换 -->
      <view class="mode-toggle-section">
        <view class="mode-tabs">
          <view 
            class="mode-tab" 
            :class="{ active: compositionMode === 'smart' }"
            @click="compositionMode = 'smart'"
          >
            智能组卷
          </view>
          <view 
            class="mode-tab" 
            :class="{ active: compositionMode === 'manual' }"
            @click="compositionMode = 'manual'"
          >
            手动组卷
          </view>
        </view>
      </view>

      <!-- 智能组卷模式内容 -->
      <template v-if="compositionMode === 'smart'">
        <!-- 科目选择 (如果URL没带subjectId则显示) -->
        <view class="config-section" v-if="!fixedSubject">
          <view class="section-title">1. 选择科目</view>
          <view class="subject-selector">
            <view 
              v-for="subject in subjects" 
              :key="subject.id"
              class="subject-chip"
              :class="{ active: selectedSubjectId === subject.id }"
              @click="selectSubject(subject.id)"
            >
              {{ subject.name }}
            </view>
          </view>
        </view>

        <!-- 范围选择 -->
        <view class="config-section" v-if="selectedSubjectId">
          <view class="section-header-row">
            <view class="section-title">1. 选择范围</view>
            <view class="select-scope-btn" @click="showScopeModal = true">
              {{ selectedScope.length > 0 ? `已选 ${selectedScope.length} 个科目` : '选择科目/章节' }}
            </view>
          </view>
          
          <!-- 已选范围简览 -->
          <view class="selected-scope-preview" v-if="selectedScope.length > 0">
            <view v-for="item in selectedScope" :key="item.majorId" class="scope-preview-item">
              <view class="item-main">
                <text class="book-name">{{ getSubjectName(item.majorId) }}</text>
                <text class="chapter-count" v-if="item.chapters.length > 0">({{ item.chapters.length }}个章节)</text>
                <text class="chapter-count" v-else>(整门科目)</text>
              </view>
              <!-- 显示该科目/章节的自定义题量汇总 -->
              <view class="item-configs" v-if="hasCustomConfig(item)">
                <text class="config-tag" v-if="getScopeTotal(item, 'choice') > 0">单:{{ getScopeTotal(item, 'choice') }}</text>
                <text class="config-tag" v-if="getScopeTotal(item, 'multiple') > 0">多:{{ getScopeTotal(item, 'multiple') }}</text>
                <text class="config-tag" v-if="getScopeTotal(item, 'fill') > 0">填:{{ getScopeTotal(item, 'fill') }}</text>
                <text class="config-tag" v-if="getScopeTotal(item, 'analysis') > 0">解:{{ getScopeTotal(item, 'analysis') }}</text>
                <text class="config-tag" v-if="getScopeTotal(item, 'judge') > 0">判:{{ getScopeTotal(item, 'judge') }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 题型数量设置 -->
        <view class="config-section">
          <view class="section-title">2. 题型数量设置 (总计 {{ totalQuestions }} 题)</view>
          <view class="count-setters">
            <view class="count-item" v-for="type in qTypes" :key="type.key">
              <view class="type-info">
                <text class="type-label">{{ type.label }}</text>
                <text class="custom-hint" v-if="totalCustomCounts[type.key] > 0">(含自定义 {{ totalCustomCounts[type.key] }} 题)</text>
              </view>
              <view class="counter">
                <view class="adjust-btn" @click="adjustCount(type.key, -1)" :class="{ disabled: counts[type.key] <= (totalCustomCounts[type.key] || 0) }">-</view>
                <input 
                  type="number" 
                  v-model.number="counts[type.key]" 
                  :min="totalCustomCounts[type.key] || 0" 
                  @input="userModifiedCounts[type.key] = true"
                />
                <view class="adjust-btn" @click="adjustCount(type.key, 1)">+</view>
              </view>
            </view>
          </view>
        </view>
      </template>

      <!-- 手动组卷模式内容 -->
      <template v-else>
        <view class="config-section">
          <view class="section-header-row">
            <view class="section-title">
              1. 手动添加题目 
              <text class="q-count-badge" v-if="manualQuestions.length > 0">已选 {{ manualQuestions.length }} 题</text>
            </view>
            <view class="manual-actions">
              <view class="action-chip" @click="showIdInputPopup = true">ID 添加</view>
              <view class="action-chip primary" @click="openSourceSelector">资源选择</view>
            </view>
          </view>

          <!-- 已选题目列表 -->
          <view class="manual-questions-list" v-if="manualQuestions.length > 0">
            <view v-for="(q, index) in manualQuestions" :key="q.id + index" class="manual-q-item">
              <view class="q-main-info">
                <text class="q-idx">{{ index + 1 }}.</text>
                <text class="q-type-tag">{{ q.type }}</text>
                <text class="q-id-val">ID: {{ q.id }}</text>
              </view>
              <view class="q-sub-info">
                <text class="q-src">{{ q.source || '手动输入' }}</text>
                <text class="remove-q" @click="removeManualQuestion(index)">删除</text>
              </view>
            </view>
          </view>
          <view class="manual-empty-tip" v-else>
            <text class="empty-icon">📂</text>
            <view class="tip">还没有添加题目，点击上方按钮开始挑选</view>
          </view>
        </view>
      </template>

      <view class="action-footer">
        <view 
          class="generate-btn" 
          :disabled="!canGenerate" 
          :class="{ loading: generating, disabled: !canGenerate }"
          @click="showNamingPopup"
        >
          {{ generating ? '正在生成中...' : (compositionMode === 'smart' ? '开始智能组卷' : '完成手动组卷') }}
        </view>
      </view>
    </view>

    <!-- 范围选择弹窗 -->
    <view class="modal" v-if="showScopeModal" @click="showScopeModal = false">
      <view class="modal-content scope-modal" @click.stop>
        <view class="modal-header">
          <view class="modal-title-text">选择组卷范围</view>
          <text class="close-btn" @click="showScopeModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="book-list">
            <view v-for="subject in subjects" :key="subject.id" class="book-item">
              <view class="book-header" @click="toggleSubjectSelection(subject.id)">
                <view class="checkbox" :class="{ checked: isSubjectSelected(subject.id) }"></view>
                <text class="book-name">{{ subject.name }}</text>
                <view class="expand-icon" @click.stop="toggleSubjectExpand(subject.id)">
                  {{ expandedSubjects.includes(subject.id) ? '收起设置 ▲' : '配置题量/选择章节 ▼' }}
                </view>
              </view>

              <!-- 科目层级的题量设置 -->
              <view v-if="expandedSubjects.includes(subject.id) && isSubjectSelected(subject.id) && (subjectChapters[subject.id]?.length === 0 || (selectedScope.find(s => s.majorId === subject.id)?.chapters.length === 0))" class="scope-config-area">
                <view class="config-label">整门科目题量设置:</view>
                <view class="mini-counters">
                  <view class="mini-counter" v-for="type in qTypes" :key="type.key">
                    <text>{{ type.label[0] }}:</text>
                    <view class="ctl">
                      <view class="adjust-btn-mini" @click.stop="updateScopeConfig(subject.id, null, type.key, -1)">-</view>
                      <input type="number" :value="getScopeConfig(subject.id)[type.key]" @input="e => handleScopeInput(subject.id, null, type.key, e)" @click.stop />
                      <view class="adjust-btn-mini" @click.stop="updateScopeConfig(subject.id, null, type.key, 1)">+</view>
                    </view>
                  </view>
                </view>
              </view>

              <view v-if="expandedSubjects.includes(subject.id)" class="chapter-list">
                <view v-if="loadingChapters[subject.id]" class="loading-inline">加载章节中...</view>
                <view v-else-if="!subjectChapters[subject.id] || subjectChapters[subject.id].length === 0" class="no-data">暂无章节信息</view>
                <view v-else>
                  <view class="chapter-actions">
                    <text @click="selectAllChapters(subject.id)">全选章节</text>
                    <text @click="deselectAllChapters(subject.id)">清空章节</text>
                  </view>
                  <view class="chapter-grid">
                    <view 
                      v-for="chapter in subjectChapters[subject.id]" 
                      :key="chapter.id"
                      class="chapter-item"
                      :class="{ active: isChapterSelected(subject.id, chapter.id) }"
                      @click="toggleChapterSelection(subject.id, chapter.id, chapter.name)"
                    >
                      <view class="chapter-info">
                        <text class="chapter-name-text">{{ chapter.name }}</text>
                        <view v-if="isChapterSelected(subject.id, chapter.id)" class="chapter-mini-config" @click.stop>
                          <view class="m-cfg-item" v-for="type in qTypes" :key="type.key">
                            <text>{{ type.label[0] }}:</text>
                            <input type="number" :value="getScopeConfig(subject.id, chapter.id)[type.key]" @input="e => handleScopeInput(subject.id, chapter.id, type.key, e)" />
                          </view>
                        </view>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <view class="confirm-btn" @click="showScopeModal = false">确定</view>
        </view>
      </view>
    </view>

    <!-- 命名弹窗 -->
    <view class="modal" v-if="showModal" @click="showModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <view class="modal-title-text">试卷配置</view>
          <text class="close-btn" @click="showModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="input-item">
            <text class="input-label">试卷名称</text>
            <input 
              type="text" 
              v-model="paperTitle" 
              placeholder="请输入试卷名称" 
              class="paper-name-input"
            />
          </view>
        </view>
        <view class="modal-footer">
          <view class="cancel-btn" @click="showModal = false">取消</view>
          <view class="confirm-btn" @click="confirmGenerate" :class="{ disabled: !paperTitle }">确定组卷</view>
        </view>
      </view>
    </view>

    <!-- 资源选择弹窗 (手动模式) -->
    <view class="modal" v-if="showSourceSelector" @click="showSourceSelector = false">
      <view class="modal-content full-modal" @click.stop>
        <view class="modal-header">
          <view class="modal-title-text">{{ browsingSource ? (browsingChapter ? browsingChapter.name : browsingSource.name) : '选择题目资源' }}</view>
          <text class="close-btn" @click="showSourceSelector = false">×</text>
        </view>
        <view class="modal-body source-selector-body">
          <!-- 导航面包屑/返回 -->
          <view class="source-nav" v-if="browsingSource">
            <text class="nav-back" @click="goBackSource">❮ 返回{{ browsingChapter ? '章节列表' : '科目列表' }}</text>
          </view>

          <!-- 1. 科目列表 -->
          <view v-if="!browsingSource" class="source-list">
            <view v-for="subject in subjects" :key="subject.id" class="source-item" @click="browseSource(subject)">
              <view class="source-item-icon">📚</view>
              <view class="source-item-info">
                <view class="source-item-title">{{ subject.name }}</view>
                <view class="source-item-desc">点击查看章节</view>
              </view>
              <view class="source-item-arrow">❯</view>
            </view>
          </view>

          <!-- 2. 章节列表 -->
          <view v-else-if="!browsingChapter" class="source-list">
            <view v-if="loadingChapters[browsingSource.id]" class="loading-state">加载中...</view>
            <view v-else v-for="chapter in subjectChapters[browsingSource.id]" :key="chapter.id" class="source-item" @click="browseChapter(chapter)">
              <view class="source-item-icon">🔖</view>
              <view class="source-item-info">
                <view class="source-item-title">{{ chapter.name }}</view>
              </view>
              <view class="source-item-arrow">❯</view>
            </view>
          </view>

          <!-- 3. 题目列表 -->
          <view v-else class="source-questions">
            <view v-if="loadingSourceQuestions" class="loading-state">题目加载中...</view>
            <view v-else-if="sourceQuestions.length === 0" class="empty-state">该章节暂无题目</view>
            <view v-else class="q-list">
              <view 
                v-for="q in sourceQuestions" 
                :key="q.question_id" 
                class="q-item-selectable"
                :class="{ selected: isQuestionSelected(q.question_id) }"
                @click="toggleQuestionSelection(q)"
              >
                <view class="q-check">
                  <view class="checkbox" :class="{ checked: isQuestionSelected(q.question_id) }"></view>
                </view>
                <view class="q-content">
                  <view class="q-type-badge">{{ q.exercise_type_name }}</view>
                  <view class="q-stem-preview">{{ q.stem }}</view>
                  <view class="q-meta">ID: {{ q.question_id }} | 难度: {{ q.level || 3 }}</view>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <view class="selected-summary">
            已选择 <text class="highlight">{{ manualQuestions.length }}</text> 题
          </view>
          <view class="confirm-btn" @click="showSourceSelector = false">完成选择</view>
        </view>
      </view>
    </view>

    <!-- ID 添加弹窗 -->
    <view class="modal" v-if="showIdInputPopup" @click="showIdInputPopup = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <view class="modal-title-text">手动添加题目</view>
          <text class="close-btn" @click="showIdInputPopup = false">×</text>
        </view>
        <view class="modal-body">
          <view class="input-item">
            <text class="input-label">题目 ID</text>
            <input 
              type="text" 
              v-model="manualIdInput" 
              placeholder="请输入题目 ID (如: q_123)" 
              class="paper-name-input"
              @confirm="addManualQuestionById"
            />
          </view>
          <view class="id-hint">提示：可以在题目详情页复制题目 ID</view>
        </view>
        <view class="modal-footer">
          <view class="cancel-btn" @click="showIdInputPopup = false">取消</view>
          <view class="confirm-btn" @click="addManualQuestionById" :class="{ disabled: !manualIdInput }">添加</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { request } from '../../api/request';
import { onLoad } from '@dcloudio/uni-app';

const subjects = ref([]);
const selectedSubjectId = ref(null);
const fixedSubject = ref(false);
const subjectChapters = ref({});
const expandedSubjects = ref([]);
const loadingChapters = ref({});
const selectedScope = ref([]); // [{ majorId, chapters: [{id, name}] }]
const scopeConfigs = ref({}); // { 'major-1': { choice, multiple, fill, analysis, judge }, 'chapter-1-1': { ... } }
const showScopeModal = ref(false);
const compositionMode = ref('smart');
const generating = ref(false);
const showModal = ref(false);
const paperTitle = ref('');

const manualIdInput = ref('');
const showIdInputPopup = ref(false);
const manualQuestions = ref([]);

// 资源选择相关
const showSourceSelector = ref(false);
const browsingSource = ref(null);
const browsingChapter = ref(null);
const sourceQuestions = ref([]);
const loadingSourceQuestions = ref(false);

const qTypes = [
  { key: 'choice', label: '单选题' },
  { key: 'multiple', label: '多选题' },
  { key: 'fill', label: '填空题' },
  { key: 'analysis', label: '解答题' },
  { key: 'judge', label: '判断题' }
];

const counts = ref({
  choice: 10,
  multiple: 0,
  fill: 0,
  analysis: 0,
  judge: 0
});

// 记录用户是否手动修改过全局题量
const userModifiedCounts = ref({
  choice: false,
  multiple: false,
  fill: false,
  analysis: false,
  judge: false
});

const getScopeConfig = (majorId, chapterId = null) => {
  const key = chapterId ? `chapter-${majorId}-${chapterId}` : `major-${majorId}`;
  if (!scopeConfigs.value[key]) {
    scopeConfigs.value[key] = { choice: 0, multiple: 0, fill: 0, analysis: 0, judge: 0 };
  }
  return scopeConfigs.value[key];
};

const updateScopeConfig = (majorId, chapterId, type, delta) => {
  const config = getScopeConfig(majorId, chapterId);
  const newVal = (config[type] || 0) + delta;
  if (newVal >= 0) {
    config[type] = newVal;
  }
};

const hasCustomConfig = (item) => {
  const majorConfig = scopeConfigs.value[`major-${item.majorId}`];
  if (majorConfig && qTypes.some(t => (majorConfig[t.key] || 0) > 0)) return true;
  
  return item.chapters.some(chap => {
    const chapConfig = scopeConfigs.value[`chapter-${item.majorId}-${chap.id}`];
    return chapConfig && qTypes.some(t => (chapConfig[t.key] || 0) > 0);
  });
};

const getScopeTotal = (item, type) => {
  let total = 0;
  if (item.chapters.length === 0) {
    const config = scopeConfigs.value[`major-${item.majorId}`];
    total = (config && config[type]) || 0;
  } else {
    item.chapters.forEach(chap => {
      const chapConfig = scopeConfigs.value[`chapter-${item.majorId}-${chap.id}`];
      total += (chapConfig && chapConfig[type]) || 0;
    });
  }
  return total;
};

const totalCustomCounts = computed(() => {
  const result = { choice: 0, multiple: 0, fill: 0, analysis: 0, judge: 0 };
  selectedScope.value.forEach(item => {
    qTypes.forEach(type => {
      result[type.key] += getScopeTotal(item, type.key);
    });
  });
  return result;
});

// 监听自定义题量的变化，自动调整全局题量
watch(totalCustomCounts, (newVal) => {
  qTypes.forEach(type => {
    const custom = newVal[type.key];
    if (custom > 0) {
      if (!userModifiedCounts.value[type.key] || counts.value[type.key] < custom) {
        counts.value[type.key] = custom;
      }
    } else {
      if (!userModifiedCounts.value[type.key]) {
        const defaults = { choice: 10, multiple: 0, fill: 0, analysis: 0, judge: 0 };
        counts.value[type.key] = defaults[type.key];
      }
    }
  });
}, { deep: true });

onLoad((options) => {
  if (options.subjectId) {
    selectedSubjectId.value = options.subjectId;
    fixedSubject.value = true;
  }
});

onMounted(async () => {
  await fetchSubjects();
  if (selectedSubjectId.value) {
    await fetchChapters(selectedSubjectId.value);
    // 默认选中当前科目
    toggleSubjectSelection(selectedSubjectId.value);
  }
});

const fetchSubjects = async () => {
  try {
    const res = await request({ url: '/computer1/subjects' });
    subjects.value = res.data || [];
  } catch (error) {
    console.error('获取科目失败:', error);
  }
};

const fetchChapters = async (majorId) => {
  if (loadingChapters.value[majorId]) return;
  loadingChapters.value[majorId] = true;
  try {
    const res = await request({ 
      url: '/computer1/chapters',
      data: { majorId }
    });
    subjectChapters.value[majorId] = res.data || [];
  } catch (error) {
    console.error('获取章节失败:', error);
  } finally {
    loadingChapters.value[majorId] = false;
  }
};

const getSubjectName = (majorId) => {
  const s = subjects.value.find(s => s.id === majorId);
  return s ? s.name : '未知科目';
};

const selectSubject = (id) => {
  selectedSubjectId.value = id;
  fetchChapters(id);
};

const toggleSubjectSelection = (majorId) => {
  const index = selectedScope.value.findIndex(s => s.majorId === majorId);
  if (index > -1) {
    selectedScope.value.splice(index, 1);
    // 清理该科目及其章节的自定义配置
    delete scopeConfigs.value[`major-${majorId}`];
    Object.keys(scopeConfigs.value).forEach(key => {
      if (key.startsWith(`chapter-${majorId}-`)) {
        delete scopeConfigs.value[key];
      }
    });
  } else {
    selectedScope.value.push({ majorId, chapters: [] });
    if (!subjectChapters.value[majorId]) {
      fetchChapters(majorId);
    }
    if (!expandedSubjects.value.includes(majorId)) {
      toggleSubjectExpand(majorId);
    }
  }
};

const isSubjectSelected = (majorId) => {
  return selectedScope.value.some(s => s.majorId === majorId);
};

const toggleSubjectExpand = (majorId) => {
  const idx = expandedSubjects.value.indexOf(majorId);
  if (idx > -1) {
    expandedSubjects.value.splice(idx, 1);
  } else {
    expandedSubjects.value.push(majorId);
    if (!subjectChapters.value[majorId]) {
      fetchChapters(majorId);
    }
  }
};

const toggleChapterSelection = (majorId, chapterId, chapterName) => {
  let scopeItem = selectedScope.value.find(s => s.majorId === majorId);
  if (!scopeItem) {
    scopeItem = { majorId, chapters: [{ id: chapterId, name: chapterName }] };
    selectedScope.value.push(scopeItem);
  } else {
    const cIndex = scopeItem.chapters.findIndex(c => c.id === chapterId);
    if (cIndex > -1) {
      scopeItem.chapters.splice(cIndex, 1);
      // 清理该章节的自定义配置
      delete scopeConfigs.value[`chapter-${majorId}-${chapterId}`];
    } else {
      scopeItem.chapters.push({ id: chapterId, name: chapterName });
    }
  }
};

const isChapterSelected = (majorId, chapterId) => {
  const scopeItem = selectedScope.value.find(s => s.majorId === majorId);
  return scopeItem ? scopeItem.chapters.some(c => c.id === chapterId) : false;
};

const selectAllChapters = (majorId) => {
  let scopeItem = selectedScope.value.find(s => s.majorId === majorId);
  if (!scopeItem) {
    scopeItem = { majorId, chapters: [] };
    selectedScope.value.push(scopeItem);
  }
  const chapters = subjectChapters.value[majorId] || [];
  scopeItem.chapters = chapters.map(c => ({ id: c.id, name: c.name }));
};

const deselectAllChapters = (majorId) => {
  let scopeItem = selectedScope.value.find(s => s.majorId === majorId);
  if (scopeItem) {
    // 清理这些章节的自定义配置
    scopeItem.chapters.forEach(chap => {
      delete scopeConfigs.value[`chapter-${majorId}-${chap.id}`];
    });
    scopeItem.chapters = [];
  }
};

const adjustCount = (type, delta) => {
  const newVal = (counts.value[type] || 0) + delta;
  if (newVal >= (totalCustomCounts.value[type] || 0)) {
    counts.value[type] = newVal;
    userModifiedCounts.value[type] = true;
  }
};

const totalQuestions = computed(() => {
  return Object.values(counts.value).reduce((a, b) => a + (b || 0), 0);
});

const canGenerate = computed(() => {
  if (compositionMode.value === 'smart') {
    return selectedScope.value.length > 0 && totalQuestions.value > 0;
  } else {
    return manualQuestions.value.length > 0;
  }
});

const showNamingPopup = () => {
  if (!canGenerate.value) return;
  const now = new Date();
  paperTitle.value = `智能组卷_${now.getMonth() + 1}${now.getDate()}_${now.getHours()}${now.getMinutes()}`;
  showModal.value = true;
};

const confirmGenerate = async () => {
  if (!paperTitle.value) return;
  generating.value = true;
  showModal.value = false;
  
  let postData = {
    subjectId: selectedSubjectId.value,
    title: paperTitle.value,
    mode: compositionMode.value,
    manualQuestions: manualQuestions.value
  };

  if (compositionMode.value === 'smart') {
    // 格式化 scope，包含每个 item 的自定义配置
    const formattedScope = selectedScope.value.map(item => {
      const majorConfig = scopeConfigs.value[`major-${item.majorId}`];
      const chaptersWithConfigs = item.chapters.map(chap => ({
        id: chap.id,
        name: chap.name,
        counts: scopeConfigs.value[`chapter-${item.majorId}-${chap.id}`] || null
      }));

      return {
        majorId: item.majorId,
        chapters: chaptersWithConfigs,
        counts: (item.chapters.length === 0) ? majorConfig : null
      };
    });
    
    postData.scope = formattedScope;
    postData.counts = counts.value;
  }

  try {
    const res = await request({
      url: '/computer1/smart-papers',
      method: 'POST',
      data: postData
    });
    
    uni.showToast({ title: '组卷成功', icon: 'success' });
    setTimeout(() => {
      uni.navigateTo({
        url: `/pages/computer/computer-generated-paper?paperId=${res.data.paperId}`
      });
    }, 1500);
  } catch (error) {
    console.error('组卷失败:', error);
    uni.showToast({ title: error.message || '组卷失败', icon: 'none' });
  } finally {
    generating.value = false;
  }
};

const addManualQuestionById = async () => {
  const qid = manualIdInput.value.trim();
  if (!qid) return;

  if (manualQuestions.value.some(q => q.id === qid)) {
    uni.showToast({ title: '该题目已在列表中', icon: 'none' });
    return;
  }

  uni.showLoading({ title: '正在获取题目...' });
  try {
    const res = await request({
      url: `/computer1/questions/${qid}`
    });
    
    if (res.data) {
      manualQuestions.value.push({
        id: res.data.question_id,
        type: res.data.exercise_type_name,
        source: res.data.major_id || '手动添加'
      });
      manualIdInput.value = '';
      showIdInputPopup.value = false;
      uni.showToast({ title: '添加成功', icon: 'success' });
    } else {
      uni.showToast({ title: '题目不存在', icon: 'none' });
    }
  } catch (error) {
    console.error('获取题目失败:', error);
    uni.showToast({ title: '获取题目失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const removeManualQuestion = (index) => {
  manualQuestions.value.splice(index, 1);
};

const openSourceSelector = () => {
  showSourceSelector.value = true;
  browsingSource.value = null;
  browsingChapter.value = null;
};

const browseSource = async (subject) => {
  browsingSource.value = subject;
  if (!subjectChapters.value[subject.id]) {
    await fetchChapters(subject.id);
  }
};

const browseChapter = async (chapter) => {
  browsingChapter.value = chapter;
  fetchSourceQuestions(chapter.id);
};

const goBackSource = () => {
  if (browsingChapter.value) {
    browsingChapter.value = null;
  } else {
    browsingSource.value = null;
  }
};

const fetchSourceQuestions = async (chapterId) => {
  loadingSourceQuestions.value = true;
  try {
    const res = await request({
      url: '/computer1/questions',
      data: { chapterId }
    });
    sourceQuestions.value = res.data || [];
  } catch (err) {
    console.error('获取题目失败:', err);
    uni.showToast({ title: '获取题目失败', icon: 'none' });
  } finally {
    loadingSourceQuestions.value = false;
  }
};

const isQuestionSelected = (questionId) => {
  return manualQuestions.value.some(q => q.id === questionId);
};

const toggleQuestionSelection = (q) => {
  const index = manualQuestions.value.findIndex(item => item.id === q.question_id);
  if (index > -1) {
    manualQuestions.value.splice(index, 1);
  } else {
    manualQuestions.value.push({
      id: q.question_id,
      type: q.exercise_type_name,
      source: browsingSource.value ? browsingSource.value.name : '资源选择',
      stem: q.stem
    });
  }
};
</script>

<style scoped>
.config-container {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 120rpx;
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
  font-size: 32rpx;
  color: #333;
  margin-right: 30rpx;
}

.page-title {
  font-size: 34rpx;
  font-weight: bold;
}

.main-content {
  padding: 30rpx;
}

.mode-toggle-section {
  margin-bottom: 30rpx;
}

.mode-tabs {
  display: flex;
  background: #eee;
  padding: 6rpx;
  border-radius: 12rpx;
}

.mode-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  font-size: 28rpx;
  border-radius: 8rpx;
  color: #666;
}

.mode-tab.active {
  background: #fff;
  color: #007aff;
  font-weight: bold;
}

.config-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  color: #333;
}

.subject-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.subject-chip {
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #666;
}

.subject-chip.active {
  background: #e1f0ff;
  color: #007aff;
  border: 1rpx solid #007aff;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.select-scope-btn {
  background: #007aff;
  color: #fff;
  font-size: 24rpx;
  padding: 10rpx 24rpx;
  border-radius: 30rpx;
  line-height: 1.5;
}

.selected-scope-preview {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.scope-preview-item {
  background: #f8f9fa;
  padding: 20rpx;
  border-radius: 12rpx;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.book-name {
  font-size: 28rpx;
  font-weight: 500;
}

.chapter-count {
  font-size: 24rpx;
  color: #999;
}

.count-setters {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.count-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-label {
  font-size: 28rpx;
  color: #444;
}

.counter {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.counter .adjust-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 30rpx;
  border: 1rpx solid #ddd;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 36rpx;
  cursor: pointer;
}

.counter .adjust-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.counter input {
  width: 80rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: bold;
}

.action-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 40rpx;
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.05);
}

.generate-btn {
  background: #007aff;
  color: #fff;
  border-radius: 44rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: bold;
}

.generate-btn[disabled] {
  background: #ccc;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.modal-content {
  background: #fff;
  width: 100%;
  border-radius: 30rpx 30rpx 0 0;
  padding: 40rpx;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.modal-body {
  overflow-y: auto;
  flex: 1;
}

.book-item {
  margin-bottom: 20rpx;
  border: 1rpx solid #eee;
  border-radius: 12rpx;
  overflow: hidden;
}

.book-header {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #f9f9f9;
}

.modal-content.full-modal {
  width: 95%;
  height: 90vh;
  display: flex;
  flex-direction: column;
}

.source-selector-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.source-nav {
  padding: 20rpx 30rpx;
  background: #f8f9fa;
  border-bottom: 1rpx solid #eee;
}

.nav-back {
  font-size: 26rpx;
  color: #007aff;
}

.source-list {
  display: flex;
  flex-direction: column;
}

.source-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.source-item-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.source-item-info {
  flex: 1;
}

.source-item-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.source-item-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.source-item-arrow {
  color: #ccc;
  font-size: 24rpx;
}

.loading-state, .empty-state {
  padding: 100rpx 0;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}

.q-list {
  display: flex;
  flex-direction: column;
}

.q-item-selectable {
  display: flex;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background 0.2s;
}

.q-item-selectable.selected {
  background: #f0f7ff;
}

.q-check {
  margin-right: 20rpx;
  display: flex;
  align-items: center;
}

.q-content {
  flex: 1;
  overflow: hidden;
}

.q-type-badge {
  display: inline-block;
  padding: 4rpx 12rpx;
  background: #e1f0ff;
  color: #007aff;
  font-size: 20rpx;
  border-radius: 4rpx;
  margin-bottom: 10rpx;
}

.q-stem-preview {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  margin-bottom: 10rpx;
}

.q-meta {
  font-size: 22rpx;
  color: #999;
}

.selected-summary {
  font-size: 26rpx;
  color: #666;
}

.selected-summary .highlight {
  color: #007aff;
  font-weight: bold;
  margin: 0 6rpx;
}

/* 复用 checkbox 样式 */
.checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #ccc;
  border-radius: 50%;
  position: relative;
  margin-right: 20rpx;
}

.checkbox.checked {
  background: #007aff;
  border-color: #007aff;
}

.checkbox.checked::after {
  content: '';
  position: absolute;
  width: 18rpx;
  height: 10rpx;
  border-left: 4rpx solid #fff;
  border-bottom: 4rpx solid #fff;
  left: 50%;
  top: 45%;
  transform: translate(-50%, -50%) rotate(-45deg);
}

.expand-icon {
  padding: 10rpx;
  color: #999;
  font-size: 24rpx;
}

.scope-config-area {
  background: #fcfdfe;
  padding: 24rpx;
  border-top: 2rpx solid #f0f3f5;
  border-bottom: 2rpx solid #f0f3f5;
}

.config-label {
  font-size: 24rpx;
  color: #7f8c8d;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.mini-counters {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.mini-counter {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: #2c3e50;
  background: #fff;
  padding: 8rpx 12rpx;
  border-radius: 12rpx;
  border: 1rpx solid #e9ecef;
}

.mini-counter .ctl {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 8rpx;
  border: 1rpx solid #dee2e6;
  overflow: hidden;
}

.mini-counter .ctl .adjust-btn-mini {
  width: 44rpx;
  height: 44rpx;
  padding: 0;
  margin: 0;
  border: none;
  background: #fff;
  font-size: 28rpx;
  color: #3498db;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  cursor: pointer;
}

.mini-counter .ctl .adjust-btn-mini:active {
  background: #f0f0f0;
}

.mini-counter .ctl input {
  width: 50rpx;
  height: 44rpx;
  text-align: center;
  font-size: 22rpx;
  font-weight: 600;
  border-left: 1rpx solid #dee2e6;
  border-right: 1rpx solid #dee2e6;
  background: transparent;
}

.chapter-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  width: 100%;
}

.chapter-mini-config {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8rpx;
  margin-top: 8rpx;
  padding-top: 8rpx;
  border-top: 1rpx dashed #3498db40;
  width: 100%;
}

.m-cfg-item {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 18rpx;
  color: #3498db;
}

.m-cfg-item input {
  width: 44rpx;
  height: 32rpx;
  background: #fff;
  border: 1rpx solid #3498db40;
  border-radius: 4rpx;
  text-align: center;
  font-size: 18rpx;
  font-weight: bold;
}

.chapter-list {
  padding: 20rpx;
  background: #fff;
  border-top: 2rpx solid #eee;
}

.chapter-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 20rpx;
}

.chapter-item {
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #666;
}

.chapter-item.active {
  background: #e1f0ff;
  color: #007aff;
  border: 1rpx solid #007aff;
}

.chapter-actions {
  display: flex;
  gap: 30rpx;
  font-size: 24rpx;
  color: #007aff;
}

.modal-footer {
  margin-top: 40rpx;
  display: flex;
  gap: 20rpx;
}

.modal-footer .cancel-btn, .modal-footer .confirm-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  cursor: pointer;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background: #007aff;
  color: #fff;
}

.paper-name-input {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #eee;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.manual-actions {
  display: flex;
  gap: 16rpx;
}

.action-chip {
  padding: 8rpx 20rpx;
  font-size: 24rpx;
  border-radius: 24rpx;
  background: #f0f0f0;
  color: #666;
  border: none;
}

.action-chip.primary {
  background: #e1f0ff;
  color: #007aff;
}

.manual-empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
  color: #999;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}
.selected-scope-preview {
  margin-top: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 10rpx;
}

.scope-preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.scope-preview-item:last-child {
  border-bottom: none;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.book-name {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.chapter-count {
  font-size: 22rpx;
  color: #999;
}

.item-configs {
  display: flex;
  gap: 8rpx;
}

.config-tag {
  font-size: 20rpx;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  background: #eef7fe;
  color: #3498db;
  border: 1rpx solid #3498db30;
}
</style>
