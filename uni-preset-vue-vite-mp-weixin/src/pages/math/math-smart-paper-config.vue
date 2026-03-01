<template>
  <view class="config-container">
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
          <div 
            class="mode-tab" 
            :class="{ active: compositionMode === 'my-papers' }"
            @click="compositionMode = 'my-papers'; fetchGeneratedPapers();"
          >
            我的组卷
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
      <template v-else-if="compositionMode === 'manual'">
        <section class="config-section manual-section">
          <div class="section-header-row">
            <div class="manual-header-info">
              <span class="manual-count" v-if="manualQuestions.length > 0">已选 {{ manualQuestions.length }} 题</span>
              <button v-if="manualQuestions.length > 0" class="clear-btn" @click="clearManualQuestions">清空</button>
            </div>
            <div class="manual-actions">
              <button class="action-chip" @click="searchByQuestionId">ID 添加</button>
              <button class="action-chip primary" @click="openSourceSelector">资源选择</button>
            </div>
          </div>

          <!-- 已选题目列表 -->
          <div v-if="manualQuestions.length > 0" class="manual-questions-grid">
            <div 
              v-for="(q, index) in manualQuestions" 
              :key="q.id + index" 
              class="manual-q-item"
              :class="{ dragging: dragIndex === index }"
              draggable="true"
              @dragstart="onDragStart($event, index)"
              @dragover.prevent="onDragOver($event, index)"
              @drop="onDrop($event, index)"
              @dragend="onDragEnd"
            >
              <img v-if="q.img" :src="q.img.replace('http://', 'https://')" class="manual-q-thumb" mode="widthFix" />
              <div v-else class="manual-q-no-thumb">
                <span class="q-type-tag">{{ q.type }}</span>
              </div>
              <div class="manual-q-number">{{ index + 1 }}</div>
              <div class="manual-q-remove" @click.stop="removeManualQuestion(index)">✕</div>
            </div>
          </div>
          <div class="manual-empty-tip" v-else>
            <span class="empty-icon">📂</span>
            <p class="tip">还没有添加题目，点击上方按钮开始挑选</p>
            <p class="tip" style="font-size: 24rpx; margin-top: 10rpx;">您可以从书架、收藏夹选择，或直接输入 ID</p>
          </div>
        </section>
      </template>

      <!-- 我的组卷列表 -->
      <template v-if="compositionMode === 'my-papers'">
        <div class="papers-list" v-if="generatedPapers.length > 0">
          <div v-for="paper in generatedPapers" :key="paper.PaperID" class="paper-item" @click="goToPaper(paper.PaperID)">
            <div class="paper-info">
              <h3 class="paper-title">{{ paper.Title }}</h3>
              <p class="paper-meta">
                <span>{{ formatDate(paper.CreatedAt) }}</span>
                <span class="meta-divider">|</span>
                <span>{{ paper.QuestionCount }} 道题目</span>
              </p>
            </div>
            <div class="paper-action">
              <span class="action-btn">练习</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">📝</div>
          <p>暂无组卷记录</p>
          <p class="tip">点击上方"智能组卷"或"手动组卷"开始</p>
        </div>
      </template>

      <div class="action-footer" v-if="compositionMode !== 'my-papers'">
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
            <div v-for="tab in ['bookshelf', 'favorite']" 
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
              <scroll-view v-if="!browsingChapter" class="chapter-list-simple" scroll-y>
                <div v-for="chap in sortedSourceChapters" :key="chap.name" class="chapter-row" @click="browseChapter(chap)">
                  <span>{{ chap.name }}</span>
                  <span class="q-count">{{ chap.questionCount || 0 }}题 ❯</span>
                </div>
              </scroll-view>

              <!-- 题目列表 -->
              <div v-else class="question-list-simple">
                <div class="detail-header sub" @click="browsingChapter = null">
                  <span class="back-icon">❮</span>
                  <span class="detail-title">{{ browsingChapter.name }}</span>
                </div>
                <scroll-view class="q-scroll-area" scroll-y>
                  <div v-if="loadingSourceQuestions" class="loading-inline">加载题目中...</div>
                  <div v-else class="q-items-grid">
                    <div 
                      v-for="q in sourceQuestions" 
                      :key="q.QuestionID" 
                      class="q-item-selectable"
                      :class="{ selected: isQuestionSelected(q.QuestionID) }"
                      @click="toggleManualQuestion(q)"
                    >
                      <img v-if="q.QuestionImg" :src="q.QuestionImg.replace('http://', 'https://')" class="q-thumb" mode="widthFix" />
                      <div v-else class="q-no-thumb">ID: {{ q.QuestionID }}</div>
                    </div>
                  </div>
                </scroll-view>
              </div>
            </div>
          </div>

          <!-- 收藏夹内容 -->
          <div v-if="currentSourceTab === 'favorite'" class="source-content">
            <scroll-view class="q-scroll-area" scroll-y>
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
                  <img v-if="f.QuestionImg" :src="f.QuestionImg.replace('http://', 'https://')" class="q-thumb" mode="widthFix" />
                  <div v-else class="q-no-thumb">ID: {{ f.QuestionID }}</div>
                </div>
              </div>
            </scroll-view>
          </div>
        </div>
      </div>
      <div class="modal-footer-fixed">
        <button class="confirm-btn" @click="showSourceSelector = false">完成选择</button>
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
            <textarea 
              v-model="paperTitle"
              placeholder="请输入试卷名称" 
              class="paper-name-input"
              rows="1"
            ></textarea>
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
                  <div class="chapter-list-vertical">
                    <div 
                      v-for="(chapter, cIndex) in bookChapters[book.BookID]" 
                      :key="chapter.name"
                      class="chapter-row-item"
                      :class="{ active: isChapterSelected(book.BookID, chapter.name) }"
                      @click="toggleChapterSelection(book.BookID, chapter.name)"
                    >
                      <div class="chapter-row-left">
                        <span class="chapter-index">{{ cIndex + 1 }}</span>
                        <span class="chapter-name-text">{{ chapter.name }}</span>
                      </div>
                      <div v-if="isChapterSelected(book.BookID, chapter.name)" class="chapter-row-config" @click.stop>
                        <div class="m-cfg-item" v-for="type in ['choice', 'fill', 'analysis']" :key="type">
                          <span>{{ type === 'choice' ? '选' : type === 'fill' ? '填' : '解' }}</span>
                          <input type="number" :value="getScopeConfig(book.BookID, chapter.name)[type]" @input="e => getScopeConfig(book.BookID, chapter.name)[type] = parseInt(e.detail.value || 0)" />
                        </div>
                      </div>
                      <div v-else class="chapter-check-icon">
                        <span>+</span>
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
import { request, BASE_URL } from '../../api/request';
import { onLoad } from '@dcloudio/uni-app';

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

// 组卷模式：smart (智能), manual (手动), my-papers (我的组卷)
const compositionMode = ref('smart');

// 我的组卷列表
const generatedPapers = ref([]);

const fetchGeneratedPapers = async () => {
  const subjectId = selectedSubjectId.value || uni.getStorageSync('math_selected_subject_id');
  try {
    const res = await request({
      url: '/math/smart-papers',
      data: { subjectId }
    });
    generatedPapers.value = res.data || [];
  } catch (error) {
    console.error('获取组卷列表失败:', error);
  }
};

const goToPaper = (paperId) => {
  uni.navigateTo({
    url: `/pages/math/math-generated-paper?paperId=${paperId}`
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 手动组卷相关
const manualQuestions = ref([]);
const userBookshelf = ref([]);
const browsingSource = ref(null);
const sourceChapters = ref([]);
const browsingChapter = ref(null);
const sourceQuestions = ref([]);
const loadingSourceQuestions = ref(false);
const showSourceSelector = ref(false);
const currentSourceTab = ref('bookshelf');
const favoriteQuestions = ref([]);
const loadingFavorites = ref(false);

const LOCAL_STORAGE_KEY = 'math_manual_questions_draft';

const loadDraftFromStorage = () => {
  try {
    const saved = uni.getStorageSync(LOCAL_STORAGE_KEY);
    if (saved) {
      manualQuestions.value = JSON.parse(saved);
    }
  } catch (e) {
    console.error('加载草稿失败:', e);
  }
};

const saveDraftToStorage = () => {
  try {
    uni.setStorageSync(LOCAL_STORAGE_KEY, JSON.stringify(manualQuestions.value));
  } catch (e) {
    console.error('保存草稿失败:', e);
  }
};

watch(manualQuestions, () => {
  saveDraftToStorage();
}, { deep: true });

onMounted(() => {
  loadDraftFromStorage();
});

const searchByQuestionId = () => {
  uni.showModal({
    title: '通过 ID 添加题目',
    editable: true,
    placeholderText: '请输入题目 ID (多个用逗号分隔)',
    success: async (res) => {
      if (res.confirm && res.content) {
        const input = res.content.trim();
        const ids = input
          .split(/[\s,，]+/)
          .map(id => id.trim())
          .filter(id => id && !isNaN(id))
          .map(id => parseInt(id));
        
        if (ids.length === 0) {
          uni.showToast({ title: '请输入有效的数字 ID', icon: 'none' });
          return;
        }

        const newIds = ids.filter(id => !manualQuestions.value.some(mq => mq.id === id));
        
        if (newIds.length === 0) {
          uni.showToast({ title: '所有题目已存在', icon: 'none' });
          return;
        }

        uni.showLoading({ title: '验证题目中...' });
        
        try {
          const result = await request({
            url: '/math/questions/batch',
            method: 'POST',
            data: { ids: newIds }
          });
          
          uni.hideLoading();
          
          const questions = result.data || [];
          
          if (questions.length > 0) {
            const existingIds = new Set(questions.map(q => q.QuestionID));
            const notFoundIds = newIds.filter(id => !existingIds.has(id));
            
            if (notFoundIds.length > 0) {
              uni.showToast({ 
                title: `ID ${notFoundIds.slice(0, 3).join(', ')}${notFoundIds.length > 3 ? '...' : ''} 不存在`, 
                icon: 'none',
                duration: 2000
              });
            }
            
            const questionsToAdd = questions.map(q => ({
              id: q.QuestionID,
              type: q.QuestionType || '未知',
              source: 'ID添加',
              img: q.QuestionImg || ''
            }));
            
            manualQuestions.value.push(...questionsToAdd);
            
            if (questionsToAdd.length > 0) {
              uni.showToast({ 
                title: `成功添加 ${questionsToAdd.length} 题`, 
                icon: 'success' 
              });
            }
          } else {
            uni.showToast({ title: '未找到任何题目', icon: 'none' });
          }
        } catch (e) {
          uni.hideLoading();
          console.error('查询题目失败:', e);
          uni.showToast({ title: '网络错误', icon: 'none' });
        }
      }
    }
  });
};

const sortedSourceChapters = computed(() => {
  if (!sourceChapters.value || sourceChapters.value.length === 0) return [];
  return [...sourceChapters.value].sort((a, b) => {
    const extractChapterNum = (name) => {
      const match = name.match(/第([一二三四五六七八九十百零\d]+)章/);
      if (match) {
        const chineseToNum = (str) => {
          const map = { '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '百': 100 };
          if (/^\d+$/.test(str)) return parseInt(str);
          let result = 0;
          for (let char of str) {
            if (map[char] !== undefined) {
              result = result * 10 + map[char];
            }
          }
          return result;
        };
        return chineseToNum(match[1]);
      }
      return 999;
    };
    return extractChapterNum(a.name) - extractChapterNum(b.name);
  });
});

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

onLoad((options) => {
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
      bookChapter: browsingChapter.value ? browsingChapter.value.name : '',
      img: q.QuestionImg || ''
    });
  }
};

const isQuestionSelected = (id) => {
  return manualQuestions.value.some(mq => mq.id === id);
};

const removeManualQuestion = (index) => {
  manualQuestions.value.splice(index, 1);
};

const clearManualQuestions = () => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有已选题目吗？',
    success: (res) => {
      if (res.confirm) {
        manualQuestions.value = [];
        uni.showToast({ title: '已清空', icon: 'success' });
      }
    }
  });
};

const dragIndex = ref(-1);

const onDragStart = (e, index) => {
  dragIndex.value = index;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', index.toString());
};

const onDragOver = (e, index) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

const onDrop = (e, targetIndex) => {
  e.preventDefault();
  if (dragIndex.value === -1 || dragIndex.value === targetIndex) return;
  
  const items = [...manualQuestions.value];
  const [removed] = items.splice(dragIndex.value, 1);
  items.splice(targetIndex, 0, removed);
  manualQuestions.value = items;
};

const onDragEnd = () => {
  dragIndex.value = -1;
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
      data: { subjectId }
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
  padding: 16rpx;
}

.config-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.03);
}

.manual-section {
  padding: 16rpx;
}

.selected-scope-preview {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-top: 12rpx;
}

.scope-preview-item {
  background: #f5f7fa;
  border-radius: 10rpx;
  padding: 12rpx 14rpx;
  border: 1rpx solid #e9ecef;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.book-name {
  font-size: 24rpx;
  color: #333;
  font-weight: 500;
}

.chapter-count {
  font-size: 20rpx;
  color: #4db6ac;
  background: rgba(77, 182, 172, 0.1);
  padding: 2rpx 10rpx;
  border-radius: 12rpx;
}

.item-configs {
  display: flex;
  gap: 8rpx;
  margin-top: 8rpx;
  padding-top: 8rpx;
  border-top: 1rpx solid #e0e0e0;
}

.config-tag {
  font-size: 20rpx;
  color: #4db6ac;
  background: rgba(77, 182, 172, 0.1);
  padding: 4rpx 10rpx;
  border-radius: 6rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
  border-left: 8rpx solid #4db6ac;
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
  background: linear-gradient(135deg, #4db6ac, #26a69a);
  color: #fff;
  border-color: #4db6ac;
  box-shadow: 0 8rpx 16rpx rgba(77, 182, 172, 0.25);
  transform: translateY(-2rpx);
}

.book-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.book-item {
  border: 1rpx solid #eee;
  border-radius: 10rpx;
  overflow: hidden;
}

.book-header {
  display: flex;
  align-items: center;
  padding: 16rpx 16rpx;
  background: #fff;
  transition: all 0.2s;
}

.book-header:active {
  background: #f5f7fa;
}

.checkbox {
  width: 32rpx;
  height: 32rpx;
  border: 1rpx solid #ddd;
  border-radius: 50%;
  margin-right: 12rpx;
  position: relative;
}

.checkbox.checked {
  background: #4db6ac;
  border-color: #4db6ac;
}

.checkbox.checked::after {
  content: '✓';
  color: #fff;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20rpx;
}

.book-name {
  flex: 1;
  font-size: 24rpx;
  color: #333;
  font-weight: 500;
}

.expand-icon {
  padding: 6rpx;
  color: #999;
  font-size: 22rpx;
}

.book-tag {
  font-size: 18rpx;
  background: rgba(77, 182, 172, 0.1);
  color: #4db6ac;
  padding: 2rpx 10rpx;
  border-radius: 16rpx;
  margin-left: 8rpx;
}

.chapter-list {
  padding: 12rpx;
  background: #fff;
  border-top: 1rpx solid #eee;
}

.chapter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-bottom: 10rpx;
  font-size: 22rpx;
  color: #4db6ac;
}

.chapter-actions span {
  padding: 4rpx 8rpx;
}

.chapter-list-vertical {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 4rpx 0;
}

.chapter-row-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14rpx 16rpx;
  background: #fff;
  border: 1rpx solid #e9ecef;
  border-radius: 10rpx;
  transition: all 0.2s;
}

.chapter-row-item.active {
  background: rgba(77, 182, 172, 0.1);
  border-color: #4db6ac;
}

.chapter-row-item:active {
  background: #f5f7fa;
}

.chapter-row-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
}

.chapter-index {
  width: 36rpx;
  height: 36rpx;
  background: #f0f0f0;
  color: #666;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: 500;
  flex-shrink: 0;
}

.chapter-row-item.active .chapter-index {
  background: #4db6ac;
  color: #fff;
}

.chapter-name-text {
  font-size: 24rpx;
  color: #333;
  flex: 1;
}

.chapter-row-config {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.chapter-check-icon {
  width: 36rpx;
  height: 36rpx;
  background: #f0f0f0;
  color: #999;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10rpx;
  padding: 4rpx 0;
}

.chapter-item {
  background: #f5f7fa;
  border: 1rpx solid #e9ecef;
  border-radius: 10rpx;
  padding: 16rpx 12rpx;
  font-size: 22rpx;
  color: #5d6d7e;
  text-align: center;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70rpx;
  line-height: 1.3;
}

.chapter-item.active {
  background: rgba(77, 182, 172, 0.1);
  color: #4db6ac;
  border-color: #4db6ac;
}

.chapter-item:active {
  transform: scale(0.98);
}

.m-cfg-item {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 20rpx;
  color: #4db6ac;
  background: rgba(77, 182, 172, 0.1);
  padding: 4rpx 8rpx;
  border-radius: 6rpx;
}

.m-cfg-item input {
  width: 44rpx;
  height: 32rpx;
  text-align: center;
  font-size: 20rpx;
  background: #fff;
  border: 1rpx solid #4db6ac;
  border-radius: 4rpx;
  padding: 0;
  color: #4db6ac;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.section-title::before {
  content: '';
  width: 6rpx;
  height: 28rpx;
  background: linear-gradient(to bottom, #4db6ac, #26a69a);
  border-radius: 3rpx;
}

.select-scope-btn {
  background: linear-gradient(135deg, #4db6ac, #26a69a);
  color: white;
  font-size: 22rpx;
  padding: 8rpx 20rpx;
  border-radius: 28rpx;
  border: none;
  transition: all 0.2s;
  line-height: 1.4;
  height: auto;
}

.select-scope-btn:active {
  transform: scale(0.96);
}

.mode-toggle-section {
  margin-bottom: 16rpx;
}

.mode-tabs {
  display: flex;
  background: #ebf0f5;
  border-radius: 50rpx;
  padding: 6rpx;
  position: relative;
}

.mode-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 26rpx;
  color: #7f8c8d;
  border-radius: 40rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

.mode-tab.active {
  background: #fff;
  color: #4db6ac;
  font-weight: 600;
  box-shadow: 0 4rpx 15rpx rgba(0,0,0,0.08);
}

.manual-header-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.manual-count {
  font-size: 26rpx;
  color: #4db6ac;
  font-weight: 500;
}

.clear-btn {
  padding: 6rpx 16rpx;
  border-radius: 24rpx;
  font-size: 22rpx;
  background: #fff;
  color: #e74c3c;
  border: 1rpx solid #e74c3c;
  line-height: 1.4;
}

.clear-btn:active {
  background: #e74c3c;
  color: #fff;
}

.manual-actions {
  display: flex;
  gap: 12rpx;
}

.action-chip {
  padding: 8rpx 20rpx;
  border-radius: 28rpx;
  font-size: 24rpx;
  background: #fff;
  color: #5d6d7e;
  border: 1rpx solid #dcdde1;
  line-height: 1.4;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-chip::after {
  border: none;
}

.action-chip.primary {
  background: #4db6ac;
  color: #fff;
  border-color: #4db6ac;
}

.action-chip:active {
  opacity: 0.8;
  transform: translateY(1rpx);
}

.manual-questions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  margin-top: 16rpx;
}

.manual-q-item {
  background: #fff;
  border-radius: 12rpx;
  border: 2rpx solid #f0f0f0;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  cursor: grab;
}

.manual-q-item.dragging {
  opacity: 0.5;
  border-color: #4db6ac;
  box-shadow: 0 8rpx 24rpx rgba(77, 182, 172, 0.3);
}

.manual-q-item:active {
  cursor: grabbing;
}

.manual-q-item:active {
  transform: scale(0.98);
  border-color: #e74c3c;
}

.manual-q-thumb {
  width: 100%;
  display: block;
}

.manual-q-no-thumb {
  width: 100%;
  height: 100rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  gap: 8rpx;
}

.manual-q-no-thumb .q-idx {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}

.manual-q-no-thumb .q-type-tag {
  font-size: 20rpx;
  background: rgba(77, 182, 172, 0.1);
  color: #4db6ac;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.manual-q-number {
  position: absolute;
  top: 8rpx;
  left: 8rpx;
  min-width: 36rpx;
  height: 36rpx;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  padding: 0 8rpx;
}

.manual-q-remove {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 36rpx;
  height: 36rpx;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
}

.q-idx {
  font-size: 26rpx;
  color: #95a5a6;
  font-family: monospace;
}

.q-type-tag {
  font-size: 22rpx;
  background: rgba(77, 182, 172, 0.1);
  color: #4db6ac;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-weight: 500;
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
  border-color: #4db6ac;
  background: rgba(77, 182, 172, 0.05);
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
  height: calc(100vh - 120rpx - env(safe-area-inset-bottom));
  border-radius: 30rpx 30rpx 0 0;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.source-selector-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 0;
}

.modal-header {
  padding: 24rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #f0f0f0;
  flex-shrink: 0;
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
  display: flex;
  background: #f0f2f5;
  padding: 4rpx;
  border-radius: 10rpx;
  margin: 0 12rpx 12rpx;
}

.source-tab {
  flex: 1;
  text-align: center;
  padding: 12rpx 0;
  font-size: 24rpx;
  color: #666;
  border-radius: 8rpx;
  transition: all 0.2s;
}

.source-tab.active {
  background: #fff;
  color: #4db6ac;
  font-weight: 500;
}

.source-tab.active::after {
  display: none;
}

.source-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.source-list {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 12rpx;
}

.source-item {
  display: flex;
  align-items: center;
  padding: 16rpx 14rpx;
  margin: 0 12rpx 8rpx;
  border-radius: 10rpx;
  background: #fff;
  border: 1rpx solid #f0f0f0;
  transition: all 0.2s;
}

.source-item:active {
  background: #f5f7fa;
  border-color: #4db6ac;
}

.source-item-title {
  font-size: 26rpx;
  font-weight: 500;
  color: #333;
}

.q-items-grid {
  padding: 8rpx;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8rpx;
}

.q-item-selectable {
  border-radius: 10rpx;
  border: 1rpx solid #f0f0f0;
  overflow: hidden;
  background: #fff;
  transition: all 0.2s;
  position: relative;
}

.q-item-selectable.selected {
  border-color: #4db6ac;
  background: rgba(77, 182, 172, 0.1);
  box-shadow: 0 4rpx 12rpx rgba(77, 182, 172, 0.2);
}

.q-item-selectable.selected::after {
  content: '✓';
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 36rpx;
  height: 36rpx;
  background: #4db6ac;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: bold;
}

.q-thumb {
  width: 100%;
  display: block;
}

.q-no-thumb {
  width: 100%;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #999;
  font-size: 22rpx;
}

.id-textarea {
  border-radius: 16rpx;
  border-color: #e0e6ed;
  background: #f9fbff;
  padding: 30rpx;
  line-height: 1.6;
}

.id-textarea:focus {
  border-color: #4db6ac;
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
  font-size: 22rpx;
  color: #666;
}

.scope-config-area {
  padding: 12rpx 16rpx;
  background: #f5f7fa;
  border-top: 1rpx solid #eee;
}

.mini-counters {
  display: flex;
  gap: 16rpx;
  margin-top: 8rpx;
}

.mini-counter {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 22rpx;
  color: #666;
}

.mini-counter .ctl {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  border: 1rpx solid #e0e0e0;
  overflow: hidden;
}

.mini-counter button {
  width: 40rpx;
  height: 40rpx;
  border: none;
  background: transparent;
  color: #4db6ac;
  font-size: 28rpx;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-counter button::after {
  border: none;
}

.mini-counter input {
  width: 48rpx;
  height: 40rpx;
  text-align: center;
  font-size: 22rpx;
  background: transparent;
  border: none;
  padding: 0;
}

.count-setters {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.type-info {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.type-label {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.custom-hint {
  font-size: 22rpx;
  color: #999;
}

.count-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
}

.counter {
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border-radius: 32rpx;
  border: 1rpx solid #e9ecef;
  overflow: hidden;
  padding: 2rpx;
}

.counter button {
  width: 52rpx;
  height: 52rpx;
  border: none;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #4db6ac;
  transition: all 0.2s;
  line-height: 1;
  padding: 0;
  margin: 0;
}

.counter button:active {
  background: rgba(77, 182, 172, 0.1);
  transform: scale(0.9);
}

.counter button::after {
  border: none;
}

.counter input {
  width: 60rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: 600;
  color: #2c3e50;
  background: transparent;
}

.generate-btn {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #4db6ac, #26a69a);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 16rpx rgba(77, 182, 172, 0.3);
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
  0% { box-shadow: 0 10rpx 20rpx rgba(77, 182, 172, 0.3); }
  50% { box-shadow: 0 10rpx 30rpx rgba(77, 182, 172, 0.5); }
  100% { box-shadow: 0 10rpx 20rpx rgba(77, 182, 172, 0.3); }
}

.generate-btn:not(:disabled):active {
  transform: translateY(2rpx) scale(0.98);
  box-shadow: 0 4rpx 10rpx rgba(77, 182, 172, 0.2);
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

.papers-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 20rpx 24rpx;
}

.paper-item {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.paper-info {
  flex: 1;
}

.paper-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.paper-meta {
  font-size: 24rpx;
  color: #999;
}

.meta-divider {
  margin: 0 12rpx;
}

.paper-action {
  padding-left: 20rpx;
}

.action-btn {
  font-size: 26rpx;
  color: #4db6ac;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 80rpx 40rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-state p {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.empty-state .tip {
  font-size: 24rpx;
  color: #999;
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
  background: linear-gradient(135deg, #4db6ac, #26a69a);
  color: #fff;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(77, 182, 172, 0.2);
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
  flex: 1;
  overflow-y: auto;
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
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  transition: all 0.2s;
}

.paper-name-input {
  height: 76rpx;
  min-height: 76rpx;
  max-height: 76rpx;
  resize: none;
}

.paper-name-input:focus, .paper-remark-textarea:focus {
  background: #fff;
  border-color: #4db6ac;
  box-shadow: 0 0 0 4rpx rgba(77, 182, 172, 0.1);
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
  background: #4db6ac;
  color: #fff;
}

.source-detail {
  background: #fff;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.detail-header {
  display: flex;
  align-items: center;
  padding: 14rpx 16rpx;
  background: #f5f7fa;
  border-bottom: 1rpx solid #eee;
  flex-shrink: 0;
}

.detail-header.sub {
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
  padding: 12rpx 16rpx;
}

.back-icon {
  font-size: 24rpx;
  color: #4db6ac;
  margin-right: 10rpx;
  padding: 4rpx;
}

.detail-title {
  font-size: 26rpx;
  font-weight: 500;
  color: #2c3e50;
  flex: 1;
}

.chapter-list-simple {
  padding: 12rpx;
  flex: 1;
  height: 0;
}

.chapter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14rpx 12rpx;
  background: #f5f7fa;
  border-radius: 10rpx;
  margin-bottom: 8rpx;
  border: 1rpx solid #e9ecef;
  transition: all 0.2s;
}

.chapter-row:active {
  background: rgba(77, 182, 172, 0.1);
  border-color: #4db6ac;
}

.chapter-row span:first-child {
  font-size: 24rpx;
  color: #333;
  flex: 1;
}

.q-count {
  font-size: 20rpx;
  color: #4db6ac;
  background: rgba(77, 182, 172, 0.1);
  padding: 4rpx 10rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.question-list-simple {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.q-scroll-area {
  flex: 1;
  height: 0;
}

.modal-footer-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 30rpx calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
  z-index: 1001;
}

.modal-footer-fixed .confirm-btn {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(135deg, #4db6ac, #26a69a);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.source-item-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.source-item-info {
  flex: 1;
}

.source-item-meta {
  font-size: 20rpx;
  color: #999;
  margin-top: 2rpx;
}

.source-item-arrow {
  color: #ccc;
  font-size: 22rpx;
}
</style>
