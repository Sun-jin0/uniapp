<template>
  <view class="config-container">
    <header class="top-bar">
      <navigator url="/pages/math/math-bookshelf" class="back-btn">❮ 返回</navigator>
      <h1 class="page-title">{{ compositionMode === 'smart' ? '智能组卷配置' : '手动组卷模式' }}</h1>
    </header>

    <main class="main-content">
      <!-- 模式切换 -->
      <section class="mode-toggle-section">
        <div class="mode-tabs">
          <div 
            class="mode-tab" 
            :class="{ active: compositionMode === 'smart' }"
            @click="compositionMode = 'smart'"
          >
            智能组卷
          </div>
          <div 
            class="mode-tab" 
            :class="{ active: compositionMode === 'manual' }"
            @click="compositionMode = 'manual'"
          >
            手动组卷
          </div>
        </div>
      </section>

      <!-- 智能组卷模式内容 -->
      <template v-if="compositionMode === 'smart'">
        <!-- 科目选择 (如果URL没带subjectId则显示) -->
        <section class="config-section" v-if="!fixedSubject">
          <h2 class="section-title">1. 选择科目</h2>
          <div class="subject-selector">
            <div 
              v-for="subject in displaySubjects" 
              :key="subject.id"
              class="subject-chip"
              :class="{ active: selectedSubjectId === subject.id }"
              @click="selectSubject(subject.id)"
            >
              {{ subject.name }}
            </div>
          </div>
        </section>

        <!-- 范围选择 -->
        <section class="config-section" v-if="selectedSubjectId">
          <div class="section-header-row">
            <h2 class="section-title">1. 选择范围</h2>
            <button class="select-scope-btn" @click="showScopeModal = true">
              {{ selectedScope.length > 0 ? `已选 ${selectedScope.length} 本书` : '选择书籍/章节' }}
            </button>
          </div>
          
          <!-- 已选范围简览 -->
          <div class="selected-scope-preview" v-if="selectedScope.length > 0">
            <div v-for="item in selectedScope" :key="item.bookId" class="scope-preview-item">
              <div class="item-main">
                <span class="book-name">{{ getBookTitle(item.bookId) }}</span>
                <span class="chapter-count" v-if="item.chapters.length > 0">({{ item.chapters.length }}个章节)</span>
                <span class="chapter-count" v-else>(整本书)</span>
              </div>
              <!-- 显示该书/章节的自定义题量汇总 -->
              <div class="item-configs" v-if="hasCustomConfig(item)">
                <span class="config-tag" v-if="getScopeTotal(item, 'choice') > 0">选:{{ getScopeTotal(item, 'choice') }}</span>
                <span class="config-tag" v-if="getScopeTotal(item, 'fill') > 0">填:{{ getScopeTotal(item, 'fill') }}</span>
                <span class="config-tag" v-if="getScopeTotal(item, 'analysis') > 0">解:{{ getScopeTotal(item, 'analysis') }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 题型数量设置 -->
        <section class="config-section">
          <h2 class="section-title">2. 题型数量设置 (总计 {{ totalQuestions }} 题)</h2>
          <div class="count-setters">
            <div class="count-item">
              <div class="type-info">
                <span class="type-label">选择题</span>
                <span class="custom-hint" v-if="totalCustomCounts.choice > 0">(含自定义 {{ totalCustomCounts.choice }} 题)</span>
              </div>
              <div class="counter">
                <button @click="adjustCount('choice', -1)" :disabled="counts.choice <= totalCustomCounts.choice">-</button>
                <input 
                  type="number" 
                  v-model.number="counts.choice" 
                  :min="totalCustomCounts.choice" 
                  @input="userModifiedCounts.choice = true"
                />
                <button @click="adjustCount('choice', 1)">+</button>
              </div>
            </div>
            <div class="count-item">
              <div class="type-info">
                <span class="type-label">填空题</span>
                <span class="custom-hint" v-if="totalCustomCounts.fill > 0">(含自定义 {{ totalCustomCounts.fill }} 题)</span>
              </div>
              <div class="counter">
                <button @click="adjustCount('fill', -1)" :disabled="counts.fill <= totalCustomCounts.fill">-</button>
                <input 
                  type="number" 
                  v-model.number="counts.fill" 
                  :min="totalCustomCounts.fill" 
                  @input="userModifiedCounts.fill = true"
                />
                <button @click="adjustCount('fill', 1)">+</button>
              </div>
            </div>
            <div class="count-item">
              <div class="type-info">
                <span class="type-label">解答题</span>
                <span class="custom-hint" v-if="totalCustomCounts.analysis > 0">(含自定义 {{ totalCustomCounts.analysis }} 题)</span>
              </div>
              <div class="counter">
                <button @click="adjustCount('analysis', -1)" :disabled="counts.analysis <= totalCustomCounts.analysis">-</button>
                <input 
                  type="number" 
                  v-model.number="counts.analysis" 
                  :min="totalCustomCounts.analysis" 
                  @input="userModifiedCounts.analysis = true"
                />
                <button @click="adjustCount('analysis', 1)">+</button>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- 手动组卷模式内容 -->
      <template v-else>
        <section class="config-section">
          <div class="section-header-row">
            <h2 class="section-title">
              1. 手动添加题目 
              <span class="q-count-badge" v-if="manualQuestions.length > 0">已选 {{ manualQuestions.length }} 题</span>
            </h2>
            <div class="manual-actions">
              <button class="action-chip" @click="showIdInputPopup = true">ID 添加</button>
              <button class="action-chip primary" @click="openSourceSelector">资源选择</button>
            </div>
          </div>

          <!-- 已选题目列表 -->
          <div class="manual-questions-list" v-if="manualQuestions.length > 0">
            <div v-for="(q, index) in manualQuestions" :key="q.id + index" class="manual-q-item">
              <div class="q-main-info">
                <span class="q-idx">{{ index + 1 }}.</span>
                <span class="q-type-tag">{{ q.type }}</span>
                <span class="q-id-val">ID: {{ q.id }}</span>
              </div>
              <div class="q-sub-info">
                <span class="q-src">{{ q.source || '手动输入' }}</span>
                <span class="remove-q" @click="removeManualQuestion(index)">删除</span>
              </div>
            </div>
          </div>
          <div class="manual-empty-tip" v-else>
            <span class="empty-icon">📂</span>
            <p class="tip">还没有添加题目，点击上方按钮开始挑选</p>
            <p class="tip" style="font-size: 24rpx; margin-top: 10rpx;">您可以从书架、收藏夹选择，或直接输入 ID</p>
          </div>
        </section>
      </template>

      <div class="action-footer">
        <button 
          class="generate-btn" 
          :disabled="!canGenerate" 
          :class="{ loading: generating }"
          @click="showNamingPopup"
        >
          {{ generating ? '正在生成中...' : (compositionMode === 'smart' ? '开始智能组卷' : '完成手动组卷') }}
        </button>
        <p class="tip" v-if="!canGenerate">
          {{ compositionMode === 'smart' ? '请选择科目、书籍及至少一个章节' : '请至少添加一道题目' }}
        </p>
      </div>
    </main>

    <!-- ID 添加弹窗 -->
    <div class="modal" v-if="showIdInputPopup" @click="showIdInputPopup = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">通过 ID 添加题目</h3>
          <span class="close-btn" @click="showIdInputPopup = false">×</span>
        </div>
        <div class="modal-body">
          <p class="input-desc">请输入题目 ID (多个 ID 请用空格或逗号分隔)</p>
          <textarea 
            v-model="idInput" 
            placeholder="例如: 1001, 1002, 1003" 
            class="id-textarea"
            :focus="true"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showIdInputPopup = false">取消</button>
          <button class="confirm-btn" @click="addQuestionsById" :disabled="!idInput.trim()">添加</button>
        </div>
      </div>
    </div>

    <!-- 资源选择弹窗 (手动模式) -->
    <div class="modal" v-if="showSourceSelector" @click="showSourceSelector = false">
      <div class="modal-content full-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">选择题目资源</h3>
          <span class="close-btn" @click="showSourceSelector = false">×</span>
        </div>
        <div class="modal-body source-selector-body">
          <!-- 资源分类切换 -->
          <div class="source-tabs">
            <div 
              v-for="tab in ['bookshelf', 'favorite']" 
              :key="tab"
              class="source-tab"
              :class="{ active: currentSourceTab === tab }"
              @click="currentSourceTab = tab"
            >
              {{ tab === 'bookshelf' ? '我的书架' : '我的收藏' }}
            </div>
          </div>

          <!-- 书架内容 -->
          <div v-if="currentSourceTab === 'bookshelf'" class="source-content">
            <div v-if="!browsingSource" class="source-list">
              <div v-for="book in userBookshelf" :key="book.BookID" class="source-item" @click="browseSource(book)">
                <div class="source-item-icon">📚</div>
                <div class="source-item-info">
                  <div class="source-item-title">{{ book.BookTitle }}</div>
                  <div class="source-item-meta">{{ book.ContentType === 'mock_paper' ? '模拟卷' : book.ContentType === 'past_paper' ? '真题' : '书籍' }}</div>
                </div>
                <div class="source-item-arrow">❯</div>
              </div>
            </div>
            
            <!-- 正在浏览书籍详情 -->
            <div v-else class="source-detail">
              <div class="detail-header" @click="browsingSource = null">
                <span class="back-icon">❮</span>
                <span class="detail-title">{{ browsingSource.BookTitle }}</span>
              </div>
              
              <!-- 章节列表 -->
              <div v-if="!browsingChapter" class="chapter-list-simple">
                <div v-for="chap in sourceChapters" :key="chap.name" class="chapter-row" @click="browseChapter(chap)">
                  <span>{{ chap.name }}</span>
                  <span class="q-count">{{ chap.questionCount || 0 }}题 ❯</span>
                </div>
              </div>

              <!-- 题目列表 -->
              <div v-else class="question-list-simple">
                <div class="detail-header sub" @click="browsingChapter = null">
                  <span class="back-icon">❮</span>
                  <span class="detail-title">{{ browsingChapter.name }}</span>
                </div>
                <div v-if="loadingSourceQuestions" class="loading-inline">加载题目中...</div>
                <div v-else class="q-items-grid">
                  <div 
                    v-for="q in sourceQuestions" 
                    :key="q.QuestionID" 
                    class="q-item-selectable"
                    :class="{ selected: isQuestionSelected(q.QuestionID) }"
                    @click="toggleManualQuestion(q)"
                  >
                    <img v-if="q.QuestionImg" :src="q.QuestionImg" class="q-thumb" />
                    <div v-else class="q-no-thumb">ID: {{ q.QuestionID }}</div>
                    <div class="q-sel-indicator">{{ isQuestionSelected(q.QuestionID) ? '✓' : '+' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 收藏夹内容 -->
          <div v-if="currentSourceTab === 'favorite'" class="source-content">
            <div v-if="loadingFavorites" class="loading-inline">加载收藏中...</div>
            <div v-else-if="favoriteQuestions.length === 0" class="no-data">暂无收藏题目</div>
            <div v-else class="q-items-grid">
              <div 
                v-for="f in favoriteQuestions" 
                :key="f.QuestionID" 
                class="q-item-selectable"
                :class="{ selected: isQuestionSelected(f.QuestionID) }"
                @click="toggleManualQuestion(f)"
              >
                <img v-if="f.QuestionImg" :src="f.QuestionImg" class="q-thumb" />
                <div v-else class="q-no-thumb">ID: {{ f.QuestionID }}</div>
                <div class="q-sel-indicator">{{ isQuestionSelected(f.QuestionID) ? '✓' : '+' }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="confirm-btn" @click="showSourceSelector = false">完成选择</button>
        </div>
      </div>
    </div>

    <!-- 命名弹窗 -->
    <div class="modal" v-if="showModal" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>试卷配置</h3>
          <span class="close-btn" @click="showModal = false">×</span>
        </div>
        <div class="modal-body">
          <div class="input-item">
            <label>试卷名称</label>
            <input 
              type="text" 
              v-model="paperTitle" 
              placeholder="请输入试卷名称" 
              class="paper-name-input"
              :focus="true"
              @input="(e) => paperTitle = e.detail.value"
            />
          </div>
          <div class="input-item">
            <label>备注信息</label>
            <textarea 
              v-model="paperRemark" 
              placeholder="请输入备注（可选）" 
              rows="3"
              class="paper-remark-textarea"
              @input="(e) => paperRemark = e.detail.value"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showModal = false">取消</button>
          <button class="confirm-btn" @click="confirmGenerate" :disabled="!paperTitle">确定组卷</button>
        </div>
      </div>
    </div>

    <!-- 范围选择弹窗 -->
    <div class="modal" v-if="showScopeModal" @click="showScopeModal = false">
      <div class="modal-content scope-modal" @click.stop>
        <div class="modal-header">
          <h3>选择组卷范围</h3>
          <span class="close-btn" @click="showScopeModal = false">×</span>
        </div>
        <div class="modal-body">
          <div class="book-list">
            <div v-for="book in availableBooks" :key="book.BookID" class="book-item">
              <div class="book-header" @click="toggleBookSelection(book.BookID)">
                <div class="checkbox" :class="{ checked: isBookSelected(book.BookID) }"></div>
                <span class="book-name">{{ book.BookTitle }}</span>
                <div class="expand-icon" @click.stop="toggleBookExpand(book.BookID)">
                  {{ expandedBooks.includes(book.BookID) ? '收起设置 ▲' : '配置题量/选择章节 ▼' }}
                </div>
              </div>

              <!-- 书籍层级的题量设置 -->
              <div v-if="expandedBooks.includes(book.BookID) && isBookSelected(book.BookID) && getSelectedChaptersCount(book.BookID) === 0" class="scope-config-area">
                <div class="config-label">整本书题量设置:</div>
                <div class="mini-counters">
                  <div class="mini-counter" v-for="type in ['choice', 'fill', 'analysis']" :key="type">
                    <span>{{ type === 'choice' ? '选' : type === 'fill' ? '填' : '解' }}:</span>
                    <div class="ctl">
                      <button @click.stop="updateScopeConfig(book.BookID, null, type, -1)">-</button>
                      <input type="number" :value="getScopeConfig(book.BookID)[type]" @input="e => getScopeConfig(book.BookID)[type] = parseInt(e.detail.value || 0)" @click.stop />
                      <button @click.stop="updateScopeConfig(book.BookID, null, type, 1)">+</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-if="expandedBooks.includes(book.BookID)" class="chapter-list">
                <div v-if="loadingChapters[book.BookID]" class="loading-inline">加载章节中...</div>
                <div v-else-if="!bookChapters[book.BookID] || bookChapters[book.BookID].length === 0" class="no-data">暂无章节信息</div>
                <div v-else>
                  <div class="chapter-actions">
                    <span @click="selectAllChapters(book.BookID)">全选章节</span>
                    <span @click="deselectAllChapters(book.BookID)">清空章节</span>
                  </div>
                  <div class="chapter-grid">
                    <div 
                      v-for="chapter in bookChapters[book.BookID]" 
                      :key="chapter.name"
                      class="chapter-item"
                      :class="{ active: isChapterSelected(book.BookID, chapter.name) }"
                      @click="toggleChapterSelection(book.BookID, chapter.name)"
                    >
                      <div class="chapter-info">
                        <span class="chapter-name-text">{{ chapter.name }}</span>
                        <div v-if="isChapterSelected(book.BookID, chapter.name)" class="chapter-mini-config" @click.stop>
                          <div class="m-cfg-item" v-for="type in ['choice', 'fill', 'analysis']" :key="type">
                            <span>{{ type === 'choice' ? '选' : type === 'fill' ? '填' : '解' }}:</span>
                            <input type="number" :value="getScopeConfig(book.BookID, chapter.name)[type]" @input="e => getScopeConfig(book.BookID, chapter.name)[type] = parseInt(e.detail.value || 0)" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="confirm-btn" @click="showScopeModal = false">确定</button>
        </div>
      </div>
    </div>
  </view>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import request from '@/utils/request';

const route = useRoute();

const subjects = ref([]);
const selectedSubjectId = ref(null);
const fixedSubject = ref(false);
const availableBooks = ref([]);
const bookChapters = ref({});
const expandedBooks = ref([]);
const loadingChapters = ref({});
const selectedScope = ref([]); // [{ bookId, chapters: [] }]
const scopeConfigs = ref({}); // { 'book-1': { choice, fill, analysis }, 'chapter-1-Name': { choice, fill, analysis } }
const showScopeModal = ref(false);

// 组卷模式：smart (智能), manual (手动)
const compositionMode = ref('smart');

// 手动组卷相关
const manualQuestions = ref([]); // { id, type, title, source }
const idInput = ref('');
const userBookshelf = ref([]);
const browsingSource = ref(null); // 当前正在浏览的书籍/试卷
const sourceChapters = ref([]);
const browsingChapter = ref(null);
const sourceQuestions = ref([]);
const loadingSourceQuestions = ref(false);
const showIdInputPopup = ref(false);
const showSourceSelector = ref(false);
const currentSourceTab = ref('bookshelf'); // 'bookshelf' | 'favorite'
const favoriteQuestions = ref([]);
const loadingFavorites = ref(false);

// 记录用户是否手动修改过全局题量
const userModifiedCounts = ref({
  choice: false,
  fill: false,
  analysis: false
});

const getBookTitle = (bookId) => {
  const book = availableBooks.value.find(b => b.BookID === bookId);
  return book ? book.BookTitle : '未知书籍';
};

const hasCustomConfig = (item) => {
  const bookConfig = scopeConfigs.value[`book-${item.bookId}`];
  if (bookConfig && (bookConfig.choice > 0 || bookConfig.fill > 0 || bookConfig.analysis > 0)) return true;
  
  return item.chapters.some(chapName => {
    const chapConfig = scopeConfigs.value[`chapter-${item.bookId}-${chapName}`];
    return chapConfig && (chapConfig.choice > 0 || chapConfig.fill > 0 || chapConfig.analysis > 0);
  });
};

const getScopeTotal = (item, type) => {
  let total = 0;
  if (item.chapters.length === 0) {
    const config = scopeConfigs.value[`book-${item.bookId}`];
    total = (config && config[type]) || 0;
  } else {
    item.chapters.forEach(chapName => {
      const chapConfig = scopeConfigs.value[`chapter-${item.bookId}-${chapName}`];
      total += (chapConfig && chapConfig[type]) || 0;
    });
  }
  return total;
};

const totalCustomCounts = computed(() => {
  const result = { choice: 0, fill: 0, analysis: 0 };
  selectedScope.value.forEach(item => {
    result.choice += getScopeTotal(item, 'choice');
    result.fill += getScopeTotal(item, 'fill');
    result.analysis += getScopeTotal(item, 'analysis');
  });
  return result;
});

const getScopeConfig = (bookId, chapterName = null) => {
  const key = chapterName ? `chapter-${bookId}-${chapterName}` : `book-${bookId}`;
  if (!scopeConfigs.value[key]) {
    scopeConfigs.value[key] = { choice: 0, fill: 0, analysis: 0 };
  }
  return scopeConfigs.value[key];
};

const updateScopeConfig = (bookId, chapterName, type, delta) => {
  const config = getScopeConfig(bookId, chapterName);
  const newVal = config[type] + delta;
  if (newVal >= 0) {
    config[type] = newVal;
  }
};

const counts = ref({
  choice: 10,
  fill: 6,
  analysis: 6
});

const generating = ref(false);
const showModal = ref(false);
const paperTitle = ref('');
const paperRemark = ref('');

const showNamingPopup = () => {
  if (!canGenerate.value) return;
  const subject = displaySubjects.value.find(s => s.id === selectedSubjectId.value);
  const subjectName = subject ? subject.name : '考研数学';
  const prefix = compositionMode.value === 'smart' ? '智能' : '手动';
  paperTitle.value = `${subjectName}${prefix}练习卷_${new Date().toLocaleDateString()}`;
  paperRemark.value = '';
  showModal.value = true;
};

const confirmGenerate = () => {
  showModal.value = false;
  generatePaper();
};

const displaySubjects = computed(() => {
  return subjects.value
    .filter(s => s && s.name && s.name !== '公共数学')
    .sort((a, b) => {
      const order = { '考研数学(一)': 1, '考研数学(二)': 2, '考研数学(三)': 3 };
      return (order[a.name] || 99) - (order[b.name] || 99);
    });
});

onMounted(() => {
  const options = route.query || {};
  if (options.subjectId) {
    selectedSubjectId.value = parseInt(options.subjectId);
    fixedSubject.value = true;
    fetchBooks(selectedSubjectId.value);
    fetchUserBookshelf(selectedSubjectId.value);
  } else {
    fetchSubjects();
  }
});

// 手动组卷函数
const fetchUserBookshelf = async (subjectId) => {
  try {
    const res = await request({ url: `/math/bookshelf?subjectId=${subjectId}` });
    userBookshelf.value = res.data || [];
  } catch (err) {
    console.error('获取书架失败:', err);
  }
};

const openSourceSelector = () => {
  showSourceSelector.value = true;
  if (currentSourceTab.value === 'favorite' && favoriteQuestions.value.length === 0) {
    fetchFavorites();
  }
};

const fetchFavorites = async () => {
  if (!selectedSubjectId.value) return;
  loadingFavorites.value = true;
  try {
    const res = await request({ 
      url: `/math/favorites?subjectId=${selectedSubjectId.value}` 
    });
    favoriteQuestions.value = res.data || [];
  } catch (err) {
    console.error('获取收藏失败:', err);
  } finally {
    loadingFavorites.value = false;
  }
};

const browseSource = async (book) => {
  browsingSource.value = book;
  browsingChapter.value = null;
  sourceChapters.value = [];
  try {
    const res = await request({ url: `/math/book-chapters/${book.BookID}` });
    sourceChapters.value = res.data || [];
  } catch (err) {
    console.error('获取章节失败:', err);
  }
};

const browseChapter = async (chap) => {
  browsingChapter.value = chap;
  loadingSourceQuestions.value = true;
  sourceQuestions.value = [];
  try {
    const res = await request({ 
      url: `/math/book-questions/${browsingSource.value.BookID}/${encodeURIComponent(chap.name)}` 
    });
    sourceQuestions.value = res.data || [];
  } catch (err) {
    console.error('获取题目失败:', err);
  } finally {
    loadingSourceQuestions.value = false;
  }
};

const toggleManualQuestion = (q) => {
  const index = manualQuestions.value.findIndex(mq => mq.id === q.QuestionID);
  if (index > -1) {
    manualQuestions.value.splice(index, 1);
  } else {
    manualQuestions.value.push({
      id: q.QuestionID,
      type: q.QuestionType || '未知',
      source: browsingSource.value ? browsingSource.value.BookTitle : '我的收藏',
      bookId: browsingSource.value ? browsingSource.value.BookID : 0,
      bookChapter: browsingChapter.value ? browsingChapter.value.name : ''
    });
  }
};

const isQuestionSelected = (id) => {
  return manualQuestions.value.some(mq => mq.id === id);
};

const removeManualQuestion = (index) => {
  manualQuestions.value.splice(index, 1);
};

const addQuestionsById = () => {
  const ids = idInput.value
    .split(/[\s,，]+/)
    .map(id => id.trim())
    .filter(id => id && !isNaN(id))
    .map(id => parseInt(id));
  
  if (ids.length === 0) {
    uni.showToast({ title: '请输入有效的 ID', icon: 'none' });
    return;
  }

  const newQuestions = ids
    .filter(id => !manualQuestions.value.some(mq => mq.id === id))
    .map(id => ({
      id,
      type: '未知',
      source: '手动输入'
    }));
  
  manualQuestions.value.push(...newQuestions);
  idInput.value = '';
  showIdInputPopup.value = false;
  uni.showToast({ title: `成功添加 ${newQuestions.length} 题`, icon: 'success' });
};

watch(currentSourceTab, (newTab) => {
  if (newTab === 'favorite' && favoriteQuestions.value.length === 0) {
    fetchFavorites();
  }
});

const totalQuestions = computed(() => {
  if (compositionMode.value === 'manual') {
    return manualQuestions.value.length;
  }
  return counts.value.choice + counts.value.fill + counts.value.analysis;
});

// 监听自定义题量的变化，自动调整全局题量
watch(totalCustomCounts, (newVal) => {
  ['choice', 'fill', 'analysis'].forEach(type => {
    const custom = newVal[type];
    if (custom > 0) {
      // 如果有自定义，且用户没手动改过全局（或者是全局小于自定义），则跟随自定义
      if (!userModifiedCounts.value[type] || counts.value[type] < custom) {
        counts.value[type] = custom;
      }
    } else {
      // 如果没有自定义，且用户没手动改过全局，则恢复默认
      if (!userModifiedCounts.value[type]) {
        const defaults = { choice: 10, fill: 6, analysis: 6 };
        counts.value[type] = defaults[type];
      }
    }
  });
}, { deep: true });

const canGenerate = computed(() => {
  if (compositionMode.value === 'manual') {
    return selectedSubjectId.value && manualQuestions.value.length > 0;
  }
  return selectedSubjectId.value && 
         selectedScope.value.length > 0 &&
         totalQuestions.value > 0;
});

const fetchSubjects = async () => {
  try {
    const res = await request({ url: '/math/subjects' });
    subjects.value = res.data || [];
    if (subjects.value.length > 0) {
      const savedId = uni.getStorageSync('math_selected_subject_id');
      if (savedId) {
        selectedSubjectId.value = parseInt(savedId);
      } else {
        selectedSubjectId.value = subjects.value[0].id;
      }
    }
  } catch (err) {
    console.error('Fetch subjects error:', err);
  }
};

const fetchBooks = async (subjectId) => {
  if (!subjectId) return;
  try {
    const res = await request({ 
      url: '/math/books-by-subject',
      method: 'GET',
      params: { subjectId }
    });
    availableBooks.value = res.data || [];
  } catch (err) {
    console.error('Fetch books error:', err);
  }
};

const selectSubject = (id) => {
  if (fixedSubject.value) return;
  selectedSubjectId.value = id;
  selectedScope.value = [];
  expandedBooks.value = [];
  fetchBooks(id);
  fetchUserBookshelf(id);
};

const toggleBookExpand = async (bookId) => {
  const index = expandedBooks.value.indexOf(bookId);
  if (index > -1) {
    expandedBooks.value.splice(index, 1);
  } else {
    expandedBooks.value.push(bookId);
    if (!bookChapters.value[bookId]) {
      await fetchBookChapters(bookId);
    }
  }
};

const fetchBookChapters = async (bookId) => {
  loadingChapters.value[bookId] = true;
  try {
    const res = await request({ url: `/math/books/${bookId}` });
    const questions = res.data.questions || [];
    
    const chapterMap = {};
    questions.forEach(q => {
      const chapterName = (q.BookChapter && q.BookChapter.trim() !== "") ? q.BookChapter.trim() : "未分类章节";
      if (!chapterMap[chapterName]) {
        chapterMap[chapterName] = { name: chapterName };
      }
    });
    bookChapters.value[bookId] = Object.values(chapterMap);
  } catch (err) {
    console.error('Fetch chapters error:', err);
  } finally {
    loadingChapters.value[bookId] = false;
  }
};

const toggleBookSelection = (bookId) => {
  const index = selectedScope.value.findIndex(s => s.bookId === bookId);
  if (index > -1) {
    selectedScope.value.splice(index, 1);
    // 清理该书籍及其章节的自定义配置
    delete scopeConfigs.value[`book-${bookId}`];
    // 清理该书下所有章节的配置
    Object.keys(scopeConfigs.value).forEach(key => {
      if (key.startsWith(`chapter-${bookId}-`)) {
        delete scopeConfigs.value[key];
      }
    });
  } else {
    selectedScope.value.push({ bookId, chapters: [] });
    if (!expandedBooks.value.includes(bookId)) {
      toggleBookExpand(bookId);
    }
  }
};

const isBookSelected = (bookId) => {
  return selectedScope.value.some(s => s.bookId === bookId);
};

const getSelectedChaptersCount = (bookId) => {
  const item = selectedScope.value.find(s => s.bookId === bookId);
  return item ? item.chapters.length : 0;
};

const toggleChapterSelection = (bookId, chapterName) => {
  let bookScope = selectedScope.value.find(s => s.bookId === bookId);
  if (!bookScope) {
    bookScope = { bookId, chapters: [chapterName] };
    selectedScope.value.push(bookScope);
  } else {
    const cIndex = bookScope.chapters.indexOf(chapterName);
    if (cIndex > -1) {
      bookScope.chapters.splice(cIndex, 1);
      // 清理该章节的自定义配置
      delete scopeConfigs.value[`chapter-${bookId}-${chapterName}`];
    } else {
      bookScope.chapters.push(chapterName);
    }
  }
};

const isChapterSelected = (bookId, chapterName) => {
  const bookScope = selectedScope.value.find(s => s.bookId === bookId);
  return bookScope ? bookScope.chapters.includes(chapterName) : false;
};

const selectAllChapters = (bookId) => {
  const chapters = bookChapters.value[bookId] || [];
  let bookScope = selectedScope.value.find(s => s.bookId === bookId);
  if (!bookScope) {
    bookScope = { bookId, chapters: [] };
    selectedScope.value.push(bookScope);
  }
  bookScope.chapters = chapters.map(c => c.name);
};

const deselectAllChapters = (bookId) => {
  const bookScope = selectedScope.value.find(s => s.bookId === bookId);
  if (bookScope) {
    // 清理这些章节的自定义配置
    bookScope.chapters.forEach(chapName => {
      delete scopeConfigs.value[`chapter-${bookId}-${chapName}`];
    });
    bookScope.chapters = [];
  }
};

const adjustCount = (type, delta) => {
  userModifiedCounts.value[type] = true;
  const newVal = counts.value[type] + delta;
  if (newVal >= 0) {
    counts.value[type] = newVal;
    // 轻微震动反馈
    uni.vibrateShort({ success: () => {}, fail: () => {} });
  }
};

const generatePaper = async () => {
  if (!canGenerate.value || generating.value) return;
  
  generating.value = true;
  uni.showLoading({ title: '高质量组卷中...', mask: true });

  let postData = {
    subjectId: selectedSubjectId.value,
    title: paperTitle.value,
    remark: paperRemark.value,
    mode: compositionMode.value
  };

  if (compositionMode.value === 'smart') {
    // 格式化 scope，包含每个 item 的自定义配置
    const formattedScope = selectedScope.value.map(item => {
      const bookConfig = scopeConfigs.value[`book-${item.bookId}`];
      const chaptersWithConfigs = item.chapters.map(chapName => ({
        name: chapName,
        counts: scopeConfigs.value[`chapter-${item.bookId}-${chapName}`] || null
      }));

      return {
        bookId: item.bookId,
        chapters: chaptersWithConfigs,
        counts: (item.chapters.length === 0) ? bookConfig : null
      };
    });
    
    postData.scope = formattedScope;
    postData.counts = counts.value;
  } else {
    // 手动模式
    postData.manualQuestions = manualQuestions.value;
  }

  try {
    const res = await request({
      url: '/math/smart-paper/generate',
      method: 'POST',
      data: postData
    });
    
    if (res.code === 0 && res.data.paperId) {
      uni.hideLoading();
      uni.navigateTo({
        url: `/pages/math/math-generated-paper?paperId=${res.data.paperId}`
      });
    } else {
      uni.showToast({ title: res.message || '生成失败', icon: 'none' });
    }
  } catch (err) {
    console.error('Generate paper error:', err);
    uni.showToast({ title: '服务器连接失败', icon: 'none' });
  } finally {
    generating.value = false;
    uni.hideLoading();
  }
};

watch(selectedSubjectId, (newId) => {
  if (newId) {
    fetchBooks(newId);
    fetchUserBookshelf(newId);
  }
});
</script>

<style scoped>
.config-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 120rpx;
}

.top-bar {
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx 20rpx;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.back-btn {
  font-size: 32rpx;
  color: #666;
  margin-right: 30rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.main-content {
  padding: 30rpx;
}

.config-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.03);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  border-left: 8rpx solid #3498db;
  padding-left: 20rpx;
}

.subject-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.subject-chip {
  padding: 18rpx 44rpx;
  background: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  color: #5d6d7e;
  border: 2rpx solid #e9ecef;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.subject-chip.active {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: #fff;
  border-color: #3498db;
  box-shadow: 0 8rpx 16rpx rgba(52, 152, 219, 0.25);
  transform: translateY(-2rpx);
}

.book-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.book-item {
  border: 2rpx solid #eee;
  border-radius: 12rpx;
  overflow: hidden;
}

.book-header {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  background: #fff;
  transition: all 0.2s;
}

.book-header:active {
  background: #f8f9fa;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ddd;
  border-radius: 50%;
  margin-right: 20rpx;
  position: relative;
}

.checkbox.checked {
  background: #3498db;
  border-color: #3498db;
}

.checkbox.checked::after {
  content: '✓';
  color: #fff;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24rpx;
}

.book-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.expand-icon {
  padding: 10rpx;
  color: #999;
  font-size: 24rpx;
}

.book-tag {
  font-size: 20rpx;
  background: #e1f5fe;
  color: #03a9f4;
  padding: 2rpx 12rpx;
  border-radius: 20rpx;
  margin-left: 10rpx;
}

.chapter-list {
  padding: 20rpx;
  background: #fff;
  border-top: 2rpx solid #eee;
}

.chapter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 30rpx;
  margin-bottom: 20rpx;
  font-size: 24rpx;
  color: #3498db;
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  padding: 10rpx 0;
}

.chapter-item {
  background: #f8f9fa;
  border: 2rpx solid #e9ecef;
  border-radius: 16rpx;
  padding: 24rpx 16rpx;
  font-size: 24rpx;
  color: #5d6d7e;
  text-align: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 90rpx;
  line-height: 1.3;
}

.chapter-item.active {
  background: #f0f7ff;
  color: #3498db;
  border-color: #3498db;
  font-weight: 500;
}

.chapter-item:active {
  transform: scale(0.96);
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.section-title::before {
  content: '';
  width: 8rpx;
  height: 36rpx;
  background: linear-gradient(to bottom, #3498db, #5dade2);
  border-radius: 4rpx;
}

.select-scope-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  font-size: 26rpx;
  padding: 12rpx 36rpx;
  border-radius: 40rpx;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(52, 152, 219, 0.2);
  transition: all 0.2s;
}

.select-scope-btn:active {
  transform: scale(0.96);
  box-shadow: 0 2rpx 6rpx rgba(52, 152, 219, 0.1);
}

.mode-toggle-section {
  margin-bottom: 40rpx;
}

.mode-tabs {
  display: flex;
  background: #ebf0f5;
  border-radius: 60rpx;
  padding: 8rpx;
  position: relative;
}

.mode-tab {
  flex: 1;
  text-align: center;
  padding: 22rpx 0;
  font-size: 28rpx;
  color: #7f8c8d;
  border-radius: 50rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

.mode-tab.active {
  background: #fff;
  color: #3498db;
  font-weight: 600;
  box-shadow: 0 4rpx 15rpx rgba(0,0,0,0.08);
}

.manual-actions {
  display: flex;
  gap: 20rpx;
}

.action-chip {
  padding: 12rpx 32rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  background: #fff;
  color: #5d6d7e;
  border: 2rpx solid #dcdde1;
  line-height: 1.5;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-chip::after {
  border: none;
}

.action-chip.primary {
  background: #3498db;
  color: #fff;
  border-color: #3498db;
  box-shadow: 0 4rpx 10rpx rgba(52, 152, 219, 0.2);
}

.action-chip:active {
  opacity: 0.8;
  transform: translateY(2rpx);
}

.manual-questions-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-top: 30rpx;
}

.manual-q-item {
  background: #fff;
  padding: 24rpx;
  border-radius: 16rpx;
  border: 2rpx solid #f0f3f5;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.manual-q-item:hover {
  border-color: #3498db50;
  box-shadow: 0 8rpx 20rpx rgba(52, 152, 219, 0.08);
  transform: translateY(-2rpx);
}

.manual-q-item:active {
  background: #fafbfc;
}

.q-main-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.q-idx {
  font-size: 26rpx;
  color: #95a5a6;
  font-family: monospace;
}

.q-type-tag {
  font-size: 22rpx;
  background: #eef7fe;
  color: #3498db;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-weight: 500;
}

.q-id-val {
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: 600;
}

.q-sub-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1rpx solid #f5f6f7;
  padding-top: 16rpx;
  margin-top: 8rpx;
}

.q-src {
  font-size: 24rpx;
  color: #7f8c8d;
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-q {
  font-size: 24rpx;
  color: #e74c3c;
  padding: 10rpx 24rpx;
  background: #fff5f5;
  border-radius: 30rpx;
  font-weight: 500;
  transition: all 0.2s;
}

.remove-q:active {
  background: #ffebeb;
  transform: scale(0.95);
}

.manual-empty-tip {
  padding: 120rpx 40rpx;
  text-align: center;
  background: #fcfdfe;
  border-radius: 24rpx;
  border: 2rpx dashed #d1d9e0;
  transition: all 0.3s;
}

.manual-empty-tip:hover {
  border-color: #3498db;
  background: #f7fbff;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
  display: block;
}

.tip {
  font-size: 28rpx;
  color: #95a5a6;
  line-height: 1.6;
}

/* 弹窗样式进一步优化 */
.full-modal {
  width: 100vw;
  height: 92vh;
  border-radius: 30rpx 30rpx 0 0;
  background: #fff;
}

.modal-header {
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #2c3e50;
}

.close-btn {
  font-size: 40rpx;
  color: #95a5a6;
  padding: 10rpx;
}

.source-tabs {
  padding: 0 20rpx;
}

.source-tab {
  padding: 28rpx 0;
  font-size: 30rpx;
}

.source-tab.active::after {
  height: 6rpx;
  border-radius: 3rpx;
}

.source-item {
  padding: 32rpx 24rpx;
  margin: 0 20rpx;
  border-radius: 16rpx;
  transition: background 0.2s;
}

.source-item:active {
  background: #f8f9fa;
}

.source-item-title {
  font-size: 30rpx;
  font-weight: 500;
}

.q-items-grid {
  padding: 10rpx;
}

.q-item-selectable {
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}

.q-item-selectable.selected {
  border-color: #3498db;
  background: #f0f7ff;
}

.q-sel-indicator {
  width: 44rpx;
  height: 44rpx;
  font-size: 26rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.2);
}

.id-textarea {
  border-radius: 16rpx;
  border-color: #e0e6ed;
  background: #f9fbff;
  padding: 30rpx;
  line-height: 1.6;
}

.id-textarea:focus {
  border-color: #3498db;
  background: #fff;
}

.input-desc {
  margin-bottom: 20rpx;
  color: #7f8c8d;
}

.no-data {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
  font-size: 28rpx;
}

.loading-inline {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 24rpx;
}

.config-label {
  font-size: 24rpx;
  color: #666;
}

.count-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.counter {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 40rpx;
  border: 2rpx solid #e9ecef;
  overflow: hidden;
  padding: 4rpx;
}

.counter button {
  width: 64rpx;
  height: 64rpx;
  border: none;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #3498db;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
  transition: all 0.2s;
  line-height: 1;
  padding: 0;
  margin: 0;
}

.counter button:active {
  background: #f0f7ff;
  transform: scale(0.9);
}

.counter button::after {
  border: none;
}

.counter input {
  width: 80rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 600;
  color: #2c3e50;
  background: transparent;
}

.generate-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: #fff;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 10rpx 20rpx rgba(52, 152, 219, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  border: none;
}

.generate-btn:disabled {
  background: #dcdde1;
  color: #fff;
  box-shadow: none;
  opacity: 0.8;
}

.generate-btn:not(:disabled) {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 10rpx 20rpx rgba(52, 152, 219, 0.3); }
  50% { box-shadow: 0 10rpx 30rpx rgba(52, 152, 219, 0.5); }
  100% { box-shadow: 0 10rpx 20rpx rgba(52, 152, 219, 0.3); }
}

.generate-btn:not(:disabled):active {
  transform: translateY(2rpx) scale(0.98);
  box-shadow: 0 4rpx 10rpx rgba(52, 152, 219, 0.2);
  animation: none;
}

.q-count-badge {
  font-size: 22rpx;
  background: #e74c3c;
  color: #fff;
  padding: 2rpx 12rpx;
  border-radius: 20rpx;
  margin-left: 10rpx;
  font-weight: normal;
}

.action-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 40rpx calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
  z-index: 90;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.action-footer .tip {
  font-size: 22rpx;
  margin: 0;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4rpx);
  display: flex;
  align-items: flex-end; /* 底部弹出更符合移动端习惯 */
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  width: 100%;
  border-radius: 30rpx 30rpx 0 0;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.modal-header {
  padding: 30rpx 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-footer {
  padding: 30rpx 40rpx;
  display: flex;
  gap: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  height: 90rpx;
  border-radius: 45rpx;
  font-size: 30rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-btn {
  background: #f5f6f7;
  color: #7f8c8d;
  border: none;
}

.confirm-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: #fff;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(52, 152, 219, 0.2);
}

.confirm-btn:disabled {
  opacity: 0.5;
  box-shadow: none;
}

.close-btn {
  font-size: 40rpx;
  color: #999;
  padding: 10rpx;
}

.modal-body {
  padding: 30rpx;
}

.input-item {
  margin-bottom: 30rpx;
}

.input-item label {
  display: block;
  font-size: 28rpx;
  color: #7f8c8d;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.paper-name-input, .paper-remark-textarea {
  width: 100%;
  background: #f8f9fa;
  border: 2rpx solid #e9ecef;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  transition: all 0.2s;
}

.paper-name-input:focus, .paper-remark-textarea:focus {
  background: #fff;
  border-color: #3498db;
  box-shadow: 0 0 0 4rpx rgba(52, 152, 219, 0.1);
}

.paper-remark-textarea {
  height: 180rpx;
}

.modal-footer {
  padding: 20rpx 30rpx;
  border-top: 2rpx solid #eee;
  display: flex;
  gap: 20rpx;
}

.modal-footer button {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background: #3498db;
  color: #fff;
}
</style>
