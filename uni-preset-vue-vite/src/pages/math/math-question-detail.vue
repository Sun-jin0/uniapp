 <template>
  <view class="app-container" :class="{ 'single-question-mode': isSingleQuestionMode }">
    <!-- 进度条与统计 - 单题模式下隐藏 -->
    <view v-if="!isSingleQuestionMode" class="progress-section">
      <view class="progress-info">
        <view class="progress-info-left">
          <!-- 左侧显示当前题型标签 -->
          <view class="question-type-tag">
            <text>{{ questionType }}</text>
          </view>
        </view>

        <view class="count-box">
          <text class="current">{{ currentQuestionIndex + 1 }}</text>
          <text class="total">/{{ totalQuestions }}</text>
          <view 
            class="recitation-toggle" 
            :class="{ active: studyMode === 'test' }"
            @click="switchMode(studyMode === 'practice' ? 'test' : 'practice')"
          >
            <text>{{ studyMode === 'test' ? '测试模式' : '背题模式' }}</text>
          </view>
        </view>
      </view>
      <view class="progress-bar-bg">
        <view class="progress-active" :style="{ width: ((currentQuestionIndex + 1) / totalQuestions * 100) + '%' }"></view>
      </view>
    </view>

    <!-- 侧边栏 - 单题模式下隐藏 -->
    <aside v-if="!isSingleQuestionMode" class="sidebar" :class="{ 'open': sidebarOpen }">
      <div class="sidebar-header">目录</div>
      <scroll-view class="sidebar-content" scroll-y :scroll-into-view="sidebarScrollIntoView" scroll-with-animation>
        <div v-if="loadingSidebar" class="loading-state sidebar-loading">
          <div class="loading-spinner"></div>
          <p>加载题目列表中...</p>
        </div>
        <div v-else-if="errorSidebar" class="error-placeholder">{{ errorSidebar }}</div>
        <div v-else-if="hasChapters">
          <div v-for="chapter in sidebarChapters" :key="chapter.name" class="chapter-group">
            <div class="chapter-header" @tap="toggleChapter(chapter.name)" :class="{ 'expanded': expandedChapters.includes(chapter.name) }">
              <div class="chapter-title">{{ chapter.name }}</div>
              <div class="arrow" :class="{ 'expanded': expandedChapters.includes(chapter.name) }">
                <SvgIcon name="right" size="24" fill="currentColor" />
              </div>
            </div>
            <div class="chapter-questions-container" :class="{ 'expanded': expandedChapters.includes(chapter.name) }">
              <div v-for="question in chapter.questions" :key="question.QuestionID" class="question-item" :id="'question-' + question.QuestionID">
                <div class="question-link" :class="{ 'active': String(currentVisibleSourceId) === String(question.QuestionID) }" @click="navigateToQuestion(question.QuestionID); toggleSidebar(false);">
                  <image v-if="question.QuestionImg" :src="question.QuestionImg.replace('http://', 'https://')" class="question-thumb" mode="widthFix" @error="handleImageError($event)"></image>
                  <div v-else class="no-image-placeholder">
                    <span class="placeholder-id">ID: {{ question.QuestionID }}</span>
                    <span class="placeholder-meta">页码: {{ question.QuestionPage || 'N/A' }}</span>
                  </div>
                  <div class="question-meta" v-if="question.QuestionImg">
                    ID: {{ question.QuestionID }} ({{ question.QuestionPage || 'N/A' }}-{{ question.QuestionSort || 'N/A' }})
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-chapter-list">
          <div v-for="sid in sortedBookQuestionSourceIDs" :key="sid" class="sidebar-question-card" :id="'question-' + sid" :class="{ 'active': String(currentVisibleSourceId) === String(sid) }" @click="navigateToQuestion(sid); toggleSidebar(false);">
            <div class="card-header">
              <span class="question-id">ID: {{ sid }}</span>
              <span class="question-pos">{{ getQuestionPage(sid) || 'N/A' }}-{{ getQuestionSort(sid) || 'N/A' }}</span>
            </div>
            <!-- #ifdef H5 -->
            <div class="card-preview" v-html="parseTextWithLatexForMp(getQuestionPreview(sid))"></div>
            <!-- #endif -->
            <!-- #ifdef APP-PLUS -->
            <rich-text class="card-preview" :nodes="parseTextWithLatexForMp(getQuestionPreview(sid))"></rich-text>
            <!-- #endif -->
            <!-- #ifdef MP-WEIXIN -->
            <towxml class="card-preview" :nodes="parseTextWithLatexForMp(getQuestionPreview(sid))"></towxml>
            <!-- #endif -->
          </div>
        </div>
      </scroll-view>
    </aside>
    <div v-if="!isSingleQuestionMode" class="sidebar-overlay" :class="{ 'active': sidebarOpen }" @tap="toggleSidebar(false)"></div>

    <main class="main-content">
      
      <div class="question-display-area" id="question-display-area">
        <div v-if="loadingQuestion" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在获取题目详情...</p>
        </div>
        <div v-else-if="errorQuestion" class="error-placeholder">
          <p>{{ errorQuestion }}</p>
          <view class="nav-btn secondary" style="margin-top: 16px; height: 36px; display: inline-flex;" @tap="fetchQuestionData(currentVisibleSourceId)">重新加载</view>
        </div>
        <view v-else-if="currentQuestionData" id="question-content">
          <view v-if="currentQuestionData.first_request && currentQuestionData.first_request[0]" class="question-main-card">
            <!-- #ifdef H5 -->
            <view class="question-text" v-if="currentQuestionData.first_request[0].QuestionText" v-html="parseTextWithLatexForMp(displayQuestionText)" :style="{ fontSize: fontSize + 'px' }"></view>
            <!-- #endif -->
            <!-- #ifdef APP-PLUS -->
            <rich-text class="question-text" v-if="currentQuestionData.first_request[0].QuestionText" :nodes="parseTextWithLatexForMp(displayQuestionText)" :style="{ fontSize: fontSize + 'px' }"></rich-text>
            <!-- #endif -->
            <!-- #ifdef MP-WEIXIN -->
            <towxml class="question-text" v-if="currentQuestionData.first_request[0].QuestionText" :nodes="questionTextNodes"></towxml>
            <!-- #endif -->
            
            <!-- 题目报错按钮 -->
            <view class="correction-btn-container">
              <view class="correction-btn" @click="openCorrectionModal">
                <SvgIcon name="feedback" size="16" fill="#999" />
                <span class="correction-text">题目报错</span>
              </view>
            </view>
            
            <view v-if="studyMode === 'test' && questionType === '选择题' && extractedOptions.length > 0" class="options-container">
              <view 
                v-for="option in extractedOptions" 
                :key="option.label" 
                class="option-item" 
                :class="{ 
                  'selected': userAnswers[currentVisibleSourceId] === option.label,
                  'correct': (isTestSubmitted && option.isCorrect) || (studyMode === 'practice' && analysisExpanded && option.isCorrect),
                  'wrong': (isTestSubmitted && userAnswers[currentVisibleSourceId] === option.label && !option.isCorrect) || (studyMode === 'practice' && analysisExpanded && userAnswers[currentVisibleSourceId] === option.label && !option.isCorrect)
                }"
                @click="selectOption(option.label)"
              >
                <view class="option-label">{{ option.label }}</view>
                <!-- #ifdef H5 -->
                <view class="option-content" v-html="parseTextWithLatexForMp(option.content)"></view>
                <!-- #endif -->
                <!-- #ifdef APP-PLUS -->
                <rich-text class="option-content" :nodes="parseTextWithLatexForMp(option.content)"></rich-text>
                <!-- #endif -->
                <!-- #ifdef MP-WEIXIN -->
                <towxml class="option-content" :nodes="optionNodesCache[option.label] || {}"></towxml>
                <!-- #endif -->
              </view>
            </view>
            
          </view>

          <view class="analysis-toggle-container" v-if="studyMode === 'test'">
            <view class="main-action-btn" @tap="analysisExpanded = !analysisExpanded">
              {{ analysisExpanded ? '收起解析' : '查看解析' }}
            </view>
          </view>
          
          <view v-if="analysisExpanded" class="analysis-section-wrapper">
            <!-- Tab 切换栏 -->
            <view class="detail-tabs">
              <view 
                v-for="tab in availableTabs" 
                :key="tab.key"
                class="detail-tab"
                :class="{ active: activeTab === tab.key }"
                @tap="activeTab = tab.key"
              >
                {{ tab.label }}
              </view>
            </view>

            <!-- 解析 Tab -->
            <view v-if="activeTab === 'analysis'" class="tab-content">
              <view v-if="otherDetails && otherDetails.length > 0">
                <view v-for="(item, index) in otherDetails" :key="index" class="analysis-card">
                  <view class="analysis-card-header">
                    <view class="analysis-card-dot"></view>
                    <!-- #ifdef H5 -->
                    <view class="analysis-card-title" v-html="parseTextWithLatexForMp(getDetailHeader(item))"></view>
                    <!-- #endif -->
                    <!-- #ifdef APP-PLUS -->
                    <rich-text class="analysis-card-title" :nodes="parseTextWithLatexForMp(getDetailHeader(item))"></rich-text>
                    <!-- #endif -->
                    <!-- #ifdef MP-WEIXIN -->
                    <towxml class="analysis-card-title" :nodes="parseTextWithLatexForMp(getDetailHeader(item))"></towxml>
                    <!-- #endif -->
                  </view>
                  <!-- #ifdef H5 -->
                  <view class="analysis-card-body" v-if="item.Context" v-html="parseTextWithLatexForMp(item.Context)" :style="{ fontSize: (fontSize - 2) + 'px' }"></view>
                  <!-- #endif -->
                  <!-- #ifdef APP-PLUS -->
                  <rich-text class="analysis-card-body" v-if="item.Context" :nodes="parseTextWithLatexForMp(item.Context)" :style="{ fontSize: (fontSize - 2) + 'px' }"></rich-text>
                  <!-- #endif -->
                  <!-- #ifdef MP-WEIXIN -->
                  <towxml class="analysis-card-body" v-if="item.Context" :nodes="parseTextWithLatexForMp(item.Context)"></towxml>
                  <!-- #endif -->
                </view>
              </view>
              <view v-else class="no-data-state">暂无解析内容</view>
            </view>

            <!-- 考点 Tab -->
            <view v-if="activeTab === 'kaodian'" class="tab-content">
              <view v-if="groupedKnowledgePoints.考点 && groupedKnowledgePoints.考点.length > 0" class="kaodian-list">
                <view v-for="(item, index) in groupedKnowledgePoints.考点" :key="'kao' + index" class="kaodian-item">
                  <view class="kaodian-header">
                    <view class="kaodian-dot"></view>
                    <view class="kaodian-title">考点{{ index + 1 }}: {{ item._question_code?.KPTitle || item._question_code?.Title || item.Title || '考点内容' }}</view>
                  </view>
                  <view class="kaodian-body">
                    <!-- #ifdef H5 -->
                    <view class="kaodian-content" v-if="item._question_code?.KPContent || item._question_code?.Content || item.Context" v-html="parseTextWithLatexForMp(item._question_code?.KPContent || item._question_code?.Content || item.Context)" :style="{ fontSize: (fontSize - 2) + 'px' }"></view>
                    <!-- #endif -->
                    <!-- #ifdef APP-PLUS -->
                    <rich-text v-if="item._question_code?.KPContent || item._question_code?.Content || item.Context" class="kaodian-content" :nodes="parseTextWithLatexForMp(item._question_code?.KPContent || item._question_code?.Content || item.Context)" :style="{ fontSize: (fontSize - 2) + 'px' }"></rich-text>
                    <!-- #endif -->
                    <!-- #ifdef MP-WEIXIN -->
                    <towxml v-if="item._question_code?.KPContent || item._question_code?.Content || item.Context" class="kaodian-content" :nodes="parseTextWithLatexForMp(item._question_code?.KPContent || item._question_code?.Content || item.Context)"></towxml>
                    <!-- #endif -->
                  </view>
                </view>
              </view>
              <view v-else class="no-data-state">暂无考点内容</view>
            </view>

            <!-- 其他 Tab（疑难点、技巧等） -->
            <view v-if="activeTab === 'other'" class="tab-content">
              <view v-if="otherCategoryDetails && otherCategoryDetails.length > 0" class="kaodian-list">
                <view v-for="(item, index) in otherCategoryDetails" :key="'other' + index" class="kaodian-item">
                  <view class="kaodian-header">
                    <view class="kaodian-dot"></view>
                    <view class="kaodian-title">{{ item.BusType || '其他' }}{{ index + 1 }}: {{ item._question_code?.KPTitle || item._question_code?.Title || item.Title || '' }}</view>
                  </view>
                  <view class="kaodian-body">
                    <!-- #ifdef H5 -->
                    <view class="kaodian-content" v-if="item._question_code?.KPContent || item._question_code?.Content || item.Context" v-html="parseTextWithLatexForMp(item._question_code?.KPContent || item._question_code?.Content || item.Context)" :style="{ fontSize: (fontSize - 2) + 'px' }"></view>
                    <!-- #endif -->
                    <!-- #ifdef APP-PLUS -->
                    <rich-text v-if="item._question_code?.KPContent || item._question_code?.Content || item.Context" class="kaodian-content" :nodes="parseTextWithLatexForMp(item._question_code?.KPContent || item._question_code?.Content || item.Context)" :style="{ fontSize: (fontSize - 2) + 'px' }"></rich-text>
                    <!-- #endif -->
                    <!-- #ifdef MP-WEIXIN -->
                    <towxml v-if="item._question_code?.KPContent || item._question_code?.Content || item.Context" class="kaodian-content" :nodes="parseTextWithLatexForMp(item._question_code?.KPContent || item._question_code?.Content || item.Context)"></towxml>
                    <!-- #endif -->
                  </view>
                </view>
              </view>
              <view v-else class="no-data-state">暂无其他内容</view>
            </view>

            <!-- 相关题 Tab -->
            <view v-if="activeTab === 'related'" class="tab-content">
              <view v-if="relatedQuestions && relatedQuestions.length > 0" class="related-tab-list">
                <view v-for="(rel, index) in relatedQuestions" :key="'rel' + index" class="related-tab-item" @tap="navigateToQuestion(rel.QuestionID)">
                  <view class="related-tab-header">
                    <view class="related-tab-index">{{ index + 1 }}</view>
                    <view class="related-tab-info">
                      <span class="related-tab-id">ID: {{ rel.QuestionID }}</span>
                      <span class="related-tab-type" v-if="rel.QuestionType">{{ rel.QuestionType }}</span>
                    </view>
                    <view class="related-tab-jump" @tap.stop="navigateToQuestion(rel.QuestionID)">
                      <SvgIcon name="right" size="20" fill="#4db6ac" />
                    </view>
                  </view>
                  <!-- #ifdef H5 -->
                  <image v-if="rel.QuestionImg" :src="rel.QuestionImg.replace('http://', 'https://')" class="related-tab-img" mode="widthFix" @error="handleImageError($event)"></image>
                  <view class="related-tab-preview" v-else-if="rel.QuestionText" v-html="parseTextWithLatexForMp(rel.QuestionText.substring(0, 150) + '...')" :style="{ fontSize: (fontSize - 3) + 'px' }"></view>
                  <!-- #endif -->
                  <!-- #ifdef APP-PLUS -->
                  <image v-if="rel.QuestionImg" :src="rel.QuestionImg.replace('http://', 'https://')" class="related-tab-img" mode="widthFix" @error="handleImageError($event)"></image>
                  <rich-text class="related-tab-preview" v-else-if="rel.QuestionText" :nodes="parseTextWithLatexForMp(rel.QuestionText.substring(0, 150) + '...')" :style="{ fontSize: (fontSize - 3) + 'px' }"></rich-text>
                  <!-- #endif -->
                  <!-- #ifdef MP-WEIXIN -->
                  <image v-if="rel.QuestionImg" :src="rel.QuestionImg.replace('http://', 'https://')" class="related-tab-img" mode="widthFix" @error="handleImageError($event)"></image>
                  <towxml class="related-tab-preview" v-else-if="rel.QuestionText" :nodes="parseTextWithLatexForMp(rel.QuestionText.substring(0, 150) + '...')"></towxml>
                  <!-- #endif -->
                </view>
              </view>
              <view v-else class="no-data-state">暂无相关题目</view>
            </view>
          </view>

          <view v-if="showRelatedQuestions && currentQuestionData.third_request && currentQuestionData.third_request.length > 0" class="related-section">
            <view class="section-header-modern" @tap="relatedExpanded = !relatedExpanded">
              <span class="section-title-text">相似题目</span>
              <view class="related-toggle-btn" :class="{ 'expanded': relatedExpanded }">
                <SvgIcon name="right" size="24" fill="#666666" />
              </view>
            </view>
            <view class="related-list-modern" v-show="relatedExpanded">
              <view v-for="(rel, index) in currentQuestionData.third_request" :key="'rel' + index" class="related-item-modern" @tap="navigateToQuestion(rel.RelatedQuestionID || rel.ID || rel.QuestionID, currentBookId)">
                <view class="related-item-header">
                  <span class="related-id">ID: {{ rel.RelatedQuestionID || rel.ID || rel.QuestionID }}</span>
                  <view class="jump-btn" @tap.stop="navigateToQuestion(rel.RelatedQuestionID || rel.ID || rel.QuestionID, currentBookId)">练习此题</view>
                </view>
                <!-- 优先显示图片 -->
                <!-- #ifdef H5 -->
                <image v-if="rel.QuestionImg" :src="rel.QuestionImg.replace('http://', 'https://')" class="related-question-img" mode="widthFix" @error="handleImageError($event)"></image>
                <view class="related-content" v-else-if="rel.RelatedQuestionText || rel.QuestionText" v-html="parseTextWithLatexForMp(rel.RelatedQuestionText || rel.QuestionText)" :style="{ fontSize: (fontSize - 3) + 'px' }"></view>
                <!-- #endif -->
                <!-- #ifdef APP-PLUS -->
                <image v-if="rel.QuestionImg" :src="rel.QuestionImg.replace('http://', 'https://')" class="related-question-img" mode="widthFix" @error="handleImageError($event)"></image>
                <rich-text class="related-content" v-else-if="rel.RelatedQuestionText || rel.QuestionText" :nodes="parseTextWithLatexForMp(rel.RelatedQuestionText || rel.QuestionText)" :style="{ fontSize: (fontSize - 3) + 'px' }"></rich-text>
                <!-- #endif -->
                <!-- #ifdef MP-WEIXIN -->
                <image v-if="rel.QuestionImg" :src="rel.QuestionImg.replace('http://', 'https://')" class="related-question-img" mode="widthFix" @error="handleImageError($event)"></image>
                <towxml class="related-content" v-else-if="rel.RelatedQuestionText || rel.QuestionText" :nodes="parseTextWithLatexForMp(rel.RelatedQuestionText || rel.QuestionText)"></towxml>
                <!-- #endif -->
              </view>
            </view>
          </view>
        </view>
      </div>
    </main>

    <!-- 底部操作栏 -->
    <view class="bottom-action-card" :class="{ 'single-mode': isSingleQuestionMode }">
      <view class="action-items">
        <view class="action-item" v-if="studyMode === 'test' && !isSingleQuestionMode">
          <SvgIcon name="correct" size="44" fill="#4caf50" />
        </view>
        <view class="action-item" v-if="studyMode === 'test' && !isSingleQuestionMode">
          <SvgIcon name="error" size="44" fill="#f44336" />
        </view>
        <view class="action-item" @click="toggleFavorite">
          <SvgIcon name="star" size="44" :fill="isFavorite ? '#ffb74d' : '#666'" />
        </view>
        <view class="action-item" @click="answerSheetOpen = !answerSheetOpen" v-if="studyMode === 'test' && !isSingleQuestionMode">
          <SvgIcon name="answer-sheet" size="44" fill="#666" />
        </view>
        <view class="action-item" v-if="!isSingleQuestionMode" @click="toggleSidebar">
          <SvgIcon name="menu" size="44" fill="#666" />
        </view>
        <view class="action-item" v-if="isSingleQuestionMode && previousQuestionId" @click="goBackToPreviousQuestion">
          <SvgIcon name="left" size="44" fill="#666" />
        </view>
      </view>

      <view v-if="!isSingleQuestionMode" class="nav-btns">
        <view class="nav-btn" :class="{ disabled: !hasPrevQuestion }" @click="goToPrevQuestion">上一题</view>
        <view class="nav-btn next" :class="{ disabled: !hasNextQuestion }" @click="goToNextQuestion">下一题</view>
      </view>
      <view v-if="isSingleQuestionMode && previousQuestionId" class="nav-btns single-mode-nav">
        <view class="nav-btn" @click="goBackToPreviousQuestion">返回原题目</view>
      </view>
    </view>

    <view class="search-modal-overlay" :class="{ 'active': searchModalOpen }" @tap="closeSearchModal">
      <view class="search-modal-content" @tap.stop>
        <view class="search-modal-header">
          <h2 class="search-modal-title">按题目ID搜索</h2>
          <view class="search-modal-close-btn" @tap="closeSearchModal" aria-label="关闭">
              <SvgIcon name="close" size="24" fill="currentColor" />
            </view>
        </view>
        <view class="search-modal-body">
          <view class="search-input-group">
            <input 
              type="text" 
              v-model="searchQuestionId" 
              placeholder="输入 Question ID (如: 1001)" 
              class="search-input"
              @keyup.enter="handleSearch"
            >
            <view class="search-submit-btn" @tap="handleSearch">搜索</view>
          </view>
          <view class="search-options">
            <view class="search-option-item" @tap="searchSingleMode = !searchSingleMode">
              <view class="checkbox" :class="{ checked: searchSingleMode }">
                <SvgIcon v-if="searchSingleMode" name="correct" size="14" fill="#fff" />
              </view>
              <text>单独查看（不关联当前书籍）</text>
            </view>
          </view>
          <p v-if="searchError" class="search-error-msg">{{ searchError }}</p>
        </view>
      </view>
    </view>
    
    <!-- 加入精选题库弹窗 -->
    <view class="curated-modal-overlay" :class="{ 'active': curatedModalOpen }" @tap="closeCuratedModal">
      <view class="curated-modal-content" @tap.stop>
        <view class="curated-modal-header">
          <h2 class="curated-modal-title">加入精选题库</h2>
          <view class="curated-modal-close-btn" @tap="closeCuratedModal">
            <SvgIcon name="close" size="24" fill="currentColor" />
          </view>
        </view>
        <view class="curated-modal-body">
          <!-- 步骤1: 选择题库 -->
          <view v-if="curatedStep === 1">
            <view class="curated-list-label">选择题库</view>
            <view v-if="userCuratedBanks && userCuratedBanks.length > 0" class="curated-items-list">
              <view 
                v-for="bank in userCuratedBanks" 
                :key="bank.BankID" 
                class="curated-item"
                @tap="selectCuratedBank(bank)"
              >
                <SvgIcon name="folder" size="24" fill="currentColor" />
                <span class="item-name">{{ bank.Title }}</span>
                <span class="item-arrow"><SvgIcon name="right" size="24" fill="currentColor" /></span>
              </view>
            </view>
            <view v-else class="curated-empty">
              <p>您还没有创建精选题库</p>
              <view class="create-bank-link" @tap="goToCreateBank">去创建题库</view>
            </view>
          </view>
          
          <!-- 步骤2: 选择章节 -->
          <view v-else-if="curatedStep === 2">
            <view class="curated-list-label">
              <span class="back-link" @tap="curatedStep = 1">← 返回题库</span>
              <span>选择章节 ({{ selectedBank?.Title }})</span>
            </view>
            <view v-if="userCuratedChapters && userCuratedChapters.length > 0" class="curated-items-list">
              <view 
                v-for="chapter in userCuratedChapters" 
                :key="chapter.ChapterID" 
                class="curated-item"
                @tap="confirmAddToCurated(chapter)"
              >
                <SvgIcon name="folder" size="24" fill="currentColor" />
                <span class="item-name">{{ chapter.Title }}</span>
                <view class="add-confirm-btn">加入</view>
              </view>
            </view>
            <view v-else class="curated-empty">
              <p>该题库下暂无章节</p>
              <view class="create-bank-link" @tap="goToBankDetail">去创建章节</view>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 纠错弹窗 -->
    <view class="correction-modal-overlay" :class="{ 'active': correctionModalOpen }" @tap="closeCorrectionModal">
      <view class="correction-modal-content" @tap.stop>
        <view class="correction-modal-header">
          <view class="header-title-group">
            <SvgIcon name="warning" size="24" fill="currentColor" />
            <h2 class="correction-modal-title">题目纠错</h2>
          </view>
          <view class="correction-modal-close-btn" @tap="closeCorrectionModal" aria-label="关闭">
            <SvgIcon name="close" size="24" fill="currentColor" />
          </view>
        </view>
        <view class="correction-modal-body">
          <view class="correction-type-grid">
            <view 
              v-for="type in correctionTypes" 
              :key="type" 
              class="type-tag"
              :class="{ active: selectedCorrectionType === type }"
              @click="selectedCorrectionType = type"
            >
              {{ type }}
            </view>
          </view>
          <textarea 
            v-model="correctionContent" 
            placeholder="请详细描述错误内容，例如：公式显示异常、答案错误、解析不清晰等..." 
            class="correction-textarea"
          ></textarea>
          <view class="correction-footer">
            <p class="correction-tip">感谢您的反馈，我们将尽快核实并修正。</p>
            <view class="correction-submit-btn" :class="{ disabled: !isCorrectionValid }" @tap="submitCorrection">提交反馈</view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 收藏分类弹窗 -->
    <view class="curated-modal-overlay" :class="{ 'active': favCategoryModalOpen }" @tap="favCategoryModalOpen = false">
      <view class="curated-modal-content" @tap.stop>
        <view class="curated-modal-header">
          <h2 class="curated-modal-title">选择收藏分类</h2>
          <view class="curated-modal-close-btn" @tap="favCategoryModalOpen = false">
            <SvgIcon name="close" size="24" fill="currentColor" />
          </view>
        </view>
        <view class="curated-modal-body">
          <view class="curated-list-label">选择分类</view>
          <view class="curated-items-list">
            <!-- 默认分类 -->
            <view class="curated-item" @tap="confirmToggleFavorite(null)">
              <SvgIcon name="folder" size="24" fill="currentColor" />
              <span class="item-name">默认收藏</span>
              <span class="item-arrow"><SvgIcon name="right" size="24" fill="currentColor" /></span>
            </view>
            <!-- 用户创建的分类 -->
            <view 
              v-for="cat in favoriteCategories" 
              :key="cat.CategoryID" 
              class="curated-item"
              @tap="confirmToggleFavorite(cat.CategoryID)"
            >
              <SvgIcon name="folder" size="24" fill="currentColor" />
              <span class="item-name">{{ cat.Title }}</span>
              <span class="item-arrow"><SvgIcon name="right" size="24" fill="currentColor" /></span>
            </view>
          </view>
          
          <!-- 创建新分类 -->
          <view class="create-category-section">
            <view v-if="!isCreatingCategory" class="create-btn-wrapper">
              <view class="create-category-text-btn" @tap="isCreatingCategory = true">新建分类</view>
            </view>
            <view v-else class="create-input-wrapper">
              <input 
                type="text" 
                v-model="newCategoryTitle" 
                placeholder="输入分类名称" 
                class="category-input"
                @keyup.enter="handleCreateCategory"
              >
              <view class="create-actions">
                <view class="action-btn cancel" @tap="isCreatingCategory = false">取消</view>
                <view class="action-btn confirm" @tap="handleCreateCategory">确定</view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 答题卡抽屉 -->
    <view class="answer-sheet-drawer" :class="{ 'active': answerSheetOpen }" v-if="studyMode === 'test'">
      <view class="answer-sheet-header">
        <view class="sheet-header-left">
          <span class="sheet-title">答题卡</span>
          <span class="sheet-subtitle">{{ Object.keys(userAnswers).length }}/{{ sortedBookQuestionSourceIDs.length }}</span>
        </view>
        <view class="sheet-header-right">
          <view class="sheet-submit-btn-mini" @tap="submitPaper">交卷</view>
          <view class="close-sheet-btn" @tap="answerSheetOpen = false">×</view>
        </view>
      </view>
      <view class="answer-sheet-grid">
        <view 
          v-for="(qid, index) in sortedBookQuestionSourceIDs" 
          :key="qid" 
          class="sheet-item"
          :class="{ 
            'done': userAnswers[qid],
            'current': String(currentVisibleSourceId) === String(qid)
          }"
          @tap="navigateToQuestion(qid); answerSheetOpen = false"
        >
          {{ index + 1 }}
        </view>
      </view>
    </view>

    <view v-if="studyMode === 'test' && false" class="test-toolbar">
      <view class="timer-display">{{ formatTime(testTime) }}</view>
      <view class="sheet-toggle-btn" @tap="answerSheetOpen = !answerSheetOpen">答题卡</view>
    </view>

    <view class="scroll-to-top" v-show="showScrollToTop" @tap="scrollToTop" id="scrollToTopBtn">︿</view>

    <!-- 设置弹窗 -->
    <view v-if="settingsModalOpen" class="settings-popup-overlay" @tap="closeSettingsModal"></view>
    <view v-if="settingsModalOpen" class="settings-popup-container">
      <view class="settings-popup">
        <view class="popup-header">
          <view class="popup-title">系统设置</view>
          <view class="close-btn" @tap="closeSettingsModal">×</view>
        </view>
        <view class="popup-content">
          <!-- 夜间模式 -->
          <view class="setting-item">
            <view class="setting-label">夜间模式</view>
            <view class="setting-control">
              <switch 
                :checked="isDarkMode" 
                @change="toggleTheme" 
                color="var(--primary-color)"
              />
            </view>
          </view>
          <!-- 字体大小 -->
          <view class="setting-item" style="margin-top: 30rpx;">
            <view class="setting-label">字体大小</view>
            <view class="font-size-options">
              <view 
                v-for="size in fontSizeOptions" 
                :key="size.value"
                class="font-size-btn"
                :class="{ active: fontSize === size.value }"
                @tap="fontSize = size.value"
              >
                {{ size.label }}
              </view>
            </view>
          </view>
          
          <!-- 相关题目显示 -->
          <view class="setting-item" style="margin-top: 30rpx;">
            <view class="setting-label">相关题目显示</view>
            <view class="setting-control">
              <switch 
                :checked="showRelatedQuestions" 
                @change="showRelatedQuestions = $event.target.checked"
                color="var(--primary-color)"
              />
            </view>
          </view>
          
          <!-- 考点显示 -->
          <view class="setting-item" style="margin-top: 30rpx;">
            <view class="setting-label">考点显示</view>
            <view class="setting-control">
              <switch 
                :checked="showKnowledgePoints" 
                @change="showKnowledgePoints = $event.target.checked"
                color="var(--primary-color)"
              />
            </view>
          </view>
        </view>
        <view class="popup-footer">
          <view class="btn-confirm" @tap="closeSettingsModal">完成</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import SvgIcon from '../../components/SvgIcon/SvgIcon.vue';
import { request } from '../../api/request';
import api from '../../api/index';
import publicApi from '../../api/public';
import { transformContextString, katexRenderWithRetry, parseTextWithLatexForMp } from '../../utils/latex';
import { checkTextContent } from '@/utils/contentSecurity.js';

// 兼容微信小程序的 URLSearchParams 替代方案
function getQueryParam(name) {
  // #ifdef H5 || APP-PLUS
  if (typeof window !== 'undefined' && window.location) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
  // #endif
  // #ifdef MP-WEIXIN
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  if (currentPage && currentPage.options) {
    return currentPage.options[name];
  }
  // #endif
  return null;
}

function setQueryParam(name, value) {
  // #ifdef H5 || APP-PLUS
  if (typeof window !== 'undefined' && window.history) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set(name, value);
    const newUrl = `${window.location.origin}${window.location.pathname}?${urlParams.toString()}${window.location.hash}`;
    window.history.pushState({}, '', newUrl);
  }
  // #endif
  // 微信小程序不支持修改 URL，使用 storage 替代
}

const allQuestionsData = ref({});
const bookQuestionsList = ref([]);
const sortedBookQuestionSourceIDs = ref([]);
const currentQuestionIndex = ref(-1);
const currentVisibleSourceId = ref(null);
const currentBookId = ref(null);
const currentQuestionData = ref(null);
const sidebarChapters = ref([]);
const expandedChapters = ref([]);
const sidebarOpen = ref(false);
const sidebarScrollIntoView = ref('');
const isSingleQuestionMode = ref(false);
const previousQuestionId = ref(null);
const loadingQuestion = ref(false);
const errorQuestion = ref('');
const loadingSidebar = ref(true);
const errorSidebar = ref('');
const topNavTitle = ref('题目详情');
const sidebarTitle = ref('章节题目');
const searchModalOpen = ref(false);
const searchQuestionId = ref('');
const searchSingleMode = ref(false);
const searchError = ref('');
const showScrollToTop = ref(false);
const relatedExpanded = ref(false);
const analysisExpanded = ref(false);
const activeTab = ref('analysis'); // 默认显示解析
const isDarkMode = ref(false);
const fontSize = ref(17);
const isFavorite = ref(false);
const relatedQuestions = ref([]);

// Towxml 解析结果缓存
const questionTextNodes = ref({});
const optionNodesCache = reactive({});

// #ifdef MP-WEIXIN
// 微信小程序下更新节点缓存
const updateQuestionTextNodes = (text) => {
  try {
    questionTextNodes.value = parseTextWithLatexForMp(text);
    console.log('Updated questionTextNodes:', questionTextNodes.value);
  } catch (e) {
    console.error('Update nodes error:', e);
  }
};

const updateOptionNodes = (key, text) => {
  try {
    optionNodesCache[key] = parseTextWithLatexForMp(text);
    console.log(`Updated optionNodes[${key}]:`, optionNodesCache[key]);
  } catch (e) {
    console.error(`Update option nodes error for ${key}:`, e);
  }
};
// #endif

// 新增状态
const studyMode = ref('practice'); // 'practice' | 'test' 默认为背题模式
const testTime = ref(0);
let timerInterval = null;
const userAnswers = reactive({});
const isSubmitted = ref(false);
const isTestSubmitted = ref(false); // 新增：专门记录测试模式下的提交状态
const correctionModalOpen = ref(false);
const correctionContent = ref('');
const correctionTypes = ['内容错误', '图片模糊', '解析有误', '分类错误', '其他问题'];
const selectedCorrectionType = ref('内容错误');
const answerSheetOpen = ref(false);

// 精选题库相关状态
const curatedModalOpen = ref(false);
const curatedStep = ref(1);
const userCuratedBanks = ref([]);
const userCuratedChapters = ref([]);
const selectedBank = ref(null);

// 收藏分类相关
const favCategoryModalOpen = ref(false);
const favoriteCategories = ref([]);
const newCategoryTitle = ref('');
const isCreatingCategory = ref(false);
const isLoadingFavorites = ref(false);

const settingsModalOpen = ref(false);
const autoNextQuestion = ref(false);
const videoAnalysisEnabled = ref(true);
const showRelatedQuestions = ref(false); // 控制是否显示相关题目
const showKnowledgePoints = ref(true); // 控制是否显示考点和疑难点
const fontSizeOptions = ref([
  { label: 'A较小', value: 14 },
  { label: 'A标准', value: 17 },
  { label: 'A较大', value: 20 },
  { label: 'A超大', value: 24 }
]);

// 状态栏高度
const statusBarHeight = ref(uni.getSystemInfoSync().statusBarHeight || 0);

const fetchFavoriteCategories = async () => {
  try {
    isLoadingFavorites.value = true;
    const response = await request({
      url: '/math/favorite-categories',
      method: 'GET'
    });
    favoriteCategories.value = response.data || [];
  } catch (error) {
    console.error('获取收藏分类失败:', error);
  } finally {
    isLoadingFavorites.value = false;
  }
};

const handleCreateCategory = async () => {
  if (!newCategoryTitle.value.trim()) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' });
    return;
  }
  try {
    const response = await request({
      url: '/math/favorite-categories',
      method: 'POST',
      data: { title: newCategoryTitle.value }
    });
    uni.showToast({ title: '分类创建成功', icon: 'success' });
    newCategoryTitle.value = '';
    isCreatingCategory.value = false;
    await fetchFavoriteCategories();
  } catch (error) {
    console.error('创建分类失败:', error);
  }
};

const isCorrectionValid = computed(() => {
  return correctionContent.value.trim().length >= 2;
});

const startTimer = () => {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    testTime.value++;
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
};

const renderKatex = () => {
  // #ifdef H5 || APP-PLUS
  nextTick(() => {
    setTimeout(() => {
      const mainElement = document.getElementById('question-content');
      if (mainElement) {
        katexRenderWithRetry(mainElement);
      }
      // 额外确保选项也被渲染
      const optionsElement = document.querySelector('.options-container');
      if (optionsElement) {
        katexRenderWithRetry(optionsElement);
      }
    }, 100);
  });
  // #endif
  // 微信小程序不需要手动渲染 KaTeX
};

// 统一的数学内容渲染方法
// H5 返回 HTML 字符串，小程序返回 rich-text nodes
const renderMath = (content) => {
  if (!content) return { type: 'html', content: '' };
  
  // #ifdef H5 || APP-PLUS
  return {
    type: 'html',
    content: parseTextWithLatexForMp(content)
  };
  // #endif

  // #ifdef MP-WEIXIN
  return {
    type: 'nodes',
    content: parseTextWithLatexForMp(content)
  };
  // #endif
};

const switchMode = (mode) => {
  studyMode.value = mode;
  if (mode === 'test') {
    startTimer();
    // 从背题模式改为测试模式时，解析默认收起
    analysisExpanded.value = false;
    relatedExpanded.value = false;
  } else {
    stopTimer();
    // 背题模式下直接展开答案解析
    analysisExpanded.value = true;
    relatedExpanded.value = true;
  }
  // 切换模式后重新渲染 LaTeX，确保选项渲染正确
  renderKatex();
};

const selectOption = (label) => {
  const qid = currentVisibleSourceId.value;
  if (studyMode.value === 'test') {
    if (isTestSubmitted.value) return;
    // 测试模式：选中即提交并显示解析
    userAnswers[qid] = label;
    isTestSubmitted.value = true;
    analysisExpanded.value = true;
    relatedExpanded.value = true;
    uni.setStorageSync(`test_submitted_${qid}`, true);
    
    // 测试模式下选择后立即更新进度到后端
    const isCorrect = checkUserAnswerIsCorrect();
    request({
      url: '/math/update-progress',
      method: 'POST',
      data: {
        questionId: qid,
        bookId: currentBookId.value,
        isCorrect: isCorrect ? 1 : 0,
        status: 1
      }
    }).catch(err => console.error('Failed to update math progress in test mode:', err));
  } else {
    // 背题模式：选中即提交并显示解析
    if (isSubmitted.value) return;
    userAnswers[qid] = label;
    isSubmitted.value = true;
    analysisExpanded.value = true;
    relatedExpanded.value = true;
    uni.setStorageSync(`submitted_${qid}`, true);
    
    // 背题模式下选择后立即更新进度到后端
    const isCorrect = checkUserAnswerIsCorrect();
    request({
      url: '/math/update-progress',
      method: 'POST',
      data: {
        questionId: qid,
        bookId: currentBookId.value,
        isCorrect: isCorrect ? 1 : 0,
        status: 1
      }
    }).catch(err => console.error('Failed to update math progress in practice mode:', err));
  }
};

const checkUserAnswerIsCorrect = () => {
  const qid = currentVisibleSourceId.value;
  const userAns = userAnswers[qid];
  if (!userAns) return false;
  
  const correctOption = extractedOptions.value.find(opt => opt.isCorrect);
  return correctOption && userAns.toUpperCase() === correctOption.label.toUpperCase();
};

const submitCurrentAnswer = () => {
  const qid = currentVisibleSourceId.value;
  const isCorrect = checkUserAnswerIsCorrect(); // 需要实现一个检查对错的方法

  if (studyMode.value === 'test') {
    isTestSubmitted.value = true;
    uni.setStorageSync(`test_submitted_${qid}`, true);
  } else {
    isSubmitted.value = true;
  }
  analysisExpanded.value = true;

  // 记录进度到后端
  request({
    url: '/math/update-progress',
    method: 'POST',
    data: {
      questionId: qid,
      bookId: currentBookId.value,
      isCorrect: isCorrect ? 1 : 0,
      status: 1
    }
  }).catch(err => console.error('Failed to update math progress:', err));
};

const retakeCurrentQuestion = () => {
  const qid = currentVisibleSourceId.value;
  isTestSubmitted.value = false;
  isSubmitted.value = false;
  delete userAnswers[qid];
  uni.removeStorageSync(`test_submitted_${qid}`);
  uni.removeStorageSync(`submitted_${qid}`);
  analysisExpanded.value = false;
};

const submitPaper = () => {
  const total = sortedBookQuestionSourceIDs.value.length;
  const answered = Object.keys(userAnswers).length;
  
  uni.showModal({
    title: '交卷确认',
    content: `共 ${total} 题，已作答 ${answered} 题。确定要交卷吗？`,
    success: (res) => {
      if (res.confirm) {
        stopTimer();
        // 标记所有已答题目为已提交状态
        Object.keys(userAnswers).forEach(qid => {
          uni.setStorageSync(`test_submitted_${qid}`, true);
        });
        isTestSubmitted.value = true;
        analysisExpanded.value = true; 
        answerSheetOpen.value = false;
        uni.showToast({
          title: '交卷成功',
          icon: 'success'
        });
      }
    }
  });
};

const openCorrectionModal = () => {
  correctionModalOpen.value = true;
};

const closeCorrectionModal = () => {
  correctionModalOpen.value = false;
  correctionContent.value = '';
  selectedCorrectionType.value = '内容错误';
};

const submitCorrection = async () => {
  if (!isCorrectionValid.value) {
    uni.showToast({ title: '请详细描述错误内容', icon: 'none' });
    return;
  }

  // 内容安全检测
  uni.showLoading({ title: '内容检测中...' });
  const checkResult = await checkTextContent(correctionContent.value);
  uni.hideLoading();

  if (!checkResult.isSafe) {
    uni.showToast({
      title: checkResult.message,
      icon: 'none',
      duration: 3000
    });
    return;
  }

  try {
    await request({
      url: '/math/corrections',
      method: 'POST',
      data: {
        questionId: currentVisibleSourceId.value,
        type: selectedCorrectionType.value,
        content: correctionContent.value,
        bookId: currentBookId.value
      }
    });
    uni.showToast({ title: '反馈已提交', icon: 'success' });
    closeCorrectionModal();
  } catch (error) {
    console.error('Failed to submit correction:', error);
    uni.showToast({ title: '提交失败，请稍后重试', icon: 'none' });
  }
};

// 精选题库相关功能
const openCuratedModal = async () => {
  curatedModalOpen.value = true;
  curatedStep.value = 1;
  await fetchCuratedBanks();
};

const closeCuratedModal = () => {
  curatedModalOpen.value = false;
  selectedBank.value = null;
};

// 设置弹窗方法
const openSettingsModal = () => {
  settingsModalOpen.value = true;
};

const closeSettingsModal = () => {
  settingsModalOpen.value = false;
};

const fetchCuratedBanks = async () => {
  try {
    const response = await request({
      url: '/math/curated-banks',
      method: 'GET'
    });
    userCuratedBanks.value = response.data || [];
  } catch (error) {
    console.error('获取精选题库失败:', error);
  }
};

const selectCuratedBank = async (bank) => {
  selectedBank.value = bank;
  try {
    const response = await request({
      url: `/math/curated-banks/${bank.BankID}/chapters`,
      method: 'GET'
    });
    userCuratedChapters.value = response.data || [];
    curatedStep.value = 2;
  } catch (error) {
    console.error('获取题库章节失败:', error);
  }
};

const confirmAddToCurated = async (chapter) => {
  if (!currentVisibleSourceId.value) return;
  
  try {
    await request({
      url: `/math/curated-chapters/${chapter.ChapterID}/questions`,
      method: 'POST',
      data: {
        questionIds: [currentVisibleSourceId.value]
      }
    });
    uni.showToast({
      title: '已加入精选题库',
      icon: 'success'
    });
    closeCuratedModal();
  } catch (error) {
    console.error('加入精选题库失败:', error);
    uni.showToast({
      title: '加入失败',
      icon: 'none'
    });
  }
};

const goToCreateBank = () => {
  uni.navigateTo({
    url: '/pages/math/math-curated-bank'
  });
  closeCuratedModal();
};

const goToBankDetail = () => {
  if (selectedBank.value) {
    uni.navigateTo({
      url: `/pages/math/math-curated-bank-detail?bankId=${selectedBank.value.BankID}`
    });
    closeCuratedModal();
  }
};

const displayQuestionText = computed(() => {
  if (!currentQuestionData.value || !currentQuestionData.value.first_request || !currentQuestionData.value.first_request[0]) {
    return '';
  }
  
  let text = currentQuestionData.value.first_request[0].QuestionText || '';
  
  // 如果是在测试模式且提取到了选项，则在正文中隐藏它们，避免重复显示
  if (studyMode.value === 'test' && questionType.value === '选择题' && extractedOptions.value.length >= 2) {
    // 找到第一个选项出现的位置
    const labelPattern = /(?:\\\(|\\\[|\$)?\s*(?:\\left\(\s*)?(?:\\mathrm\{|\\\{\\rm\s*|（|\()?([A-D])(?:\s*\})?(?:\s*\\right\))?(?:\s*）|\))?\s*(?:\\\)|\\\]|\$)?[\.\s\、\)\:]/i;
    const match = text.match(labelPattern);
    if (match) {
      // 只有当匹配到的 label 是提取到的第一个选项时才截断
      if (match[1] === extractedOptions.value[0].label) {
        text = text.substring(0, match.index).trim();
      }
    }
  }
  
  return text;
});

// #ifdef MP-WEIXIN
// 监听题目文本变化，更新 Towxml 节点
watch(displayQuestionText, (newText) => {
  if (newText) {
    updateQuestionTextNodes(newText);
  }
}, { immediate: true });

// 监听选项变化，更新选项节点缓存
watch(extractedOptions, (newOptions) => {
  if (newOptions && newOptions.length > 0) {
    newOptions.forEach((option) => {
      if (option.content) {
        updateOptionNodes(option.label, option.content);
      }
    });
  }
}, { deep: true, immediate: true });
// #endif

const extractedOptions = computed(() => {
  if (questionType.value !== '选择题' || !currentQuestionData.value || !currentQuestionData.value.first_request[0]) {
    return [];
  }
  
  const text = currentQuestionData.value.first_request[0].QuestionText || '';
  const options = [];
  
  // 改进的选项提取正则：将末尾的分隔符改为可选 (?)，以适应更多紧凑排列的题目
  const labelPattern = /(?:\\\(|\\\[|\$)?\s*(?:\\left\(\s*)?(?:\\mathrm\{|\\\{\\rm\s*|（|\()?([A-D])(?:\s*\})?(?:\s*\\right\))?(?:\s*）|\))?\s*(?:\\\)|\\\]|\$)?[\.\s\、\)\:]?/g;
  
  const matches = [];
  let m;
  const tempRegex = new RegExp(labelPattern);
  while ((m = tempRegex.exec(text)) !== null) {
    matches.push({
      index: m.index,
      length: m[0].length,
      label: m[1],
      fullMatch: m[0]
    });
  }
  
  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index + matches[i].length;
      const end = (i < matches.length - 1) ? matches[i+1].index : text.length;
      let content = text.substring(start, end).trim();
      
      // 修复：如果内容包含 LaTeX 指令但没有分隔符，且看起来像是因为分割导致的残余，进行补偿
      if (content.includes('\\') && !content.includes('$') && !content.includes('\\(')) {
        // 如果内容以 \right) 开头或以 \left( 结尾，说明分割点在 LaTeX 内部
        // 这种情况下，我们尝试修复它
        if (content.startsWith('\\right)')) {
          content = '\\left(' + content;
        }
        if (content.endsWith('\\left(')) {
          content = content + '\\right)';
        }
        // 如果仍然没有分隔符，包裹它
        if (!content.includes('\\(')) {
          content = '\\(' + content + '\\)';
        }
      }
      
      options.push({
        label: matches[i].label,
        content: content,
        isCorrect: false
      });
    }
  } else {
    // 备用方案：原来的普通匹配
    const optionRegex = /([A-D])[\.\s\、\)]\s*([\s\S]*?)(?=(?:\s*[A-D][\.\s\、\)])|$)/g;
    let match;
    while ((match = optionRegex.exec(text)) !== null) {
      options.push({
        label: match[1],
        content: match[2].trim(),
        isCorrect: false
      });
    }
  }
  
  // 查找正确答案 (通常在解析中)
  const correctOptionMatch = text.match(/【答案】\s*([A-D])/i) || (currentQuestionData.value.second_request && JSON.stringify(currentQuestionData.value.second_request).match(/【答案】\s*([A-D])/i));
  if (correctOptionMatch) {
    const correctLabel = correctOptionMatch[1].toUpperCase();
    options.forEach(opt => {
      if (opt.label.toUpperCase() === correctLabel) {
        opt.isCorrect = true;
      }
    });
  }
  
  return options;
});

const toggleFavorite = async () => {
  if (!currentVisibleSourceId.value) return;
  
  // 如果已经是收藏状态，点击直接取消收藏
  if (isFavorite.value) {
    try {
      const response = await request({
        url: '/math/favorites/toggle',
        method: 'POST',
        data: { 
          questionId: currentVisibleSourceId.value,
          bookId: currentBookId.value
        }
      });
      isFavorite.value = response.data.isFavorite;
      uni.showToast({
        title: '已取消收藏',
        icon: 'success',
        duration: 1500
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      uni.showToast({
        title: '操作失败，请稍后重试',
        icon: 'none',
        duration: 1500
      });
    }
    return;
  }

  // 如果不是收藏状态，打开分类选择弹窗
  // 使用异步操作，避免阻塞界面
  fetchFavoriteCategories().then(() => {
    favCategoryModalOpen.value = true;
  }).catch(error => {
    console.error('获取收藏分类失败:', error);
    uni.showToast({
      title: '获取分类失败，请稍后重试',
      icon: 'none',
      duration: 1500
    });
  });
};

const confirmToggleFavorite = async (categoryId = null) => {
  try {
    isLoadingFavorites.value = true;
    const response = await request({
      url: '/math/favorites/toggle',
      method: 'POST',
      data: { 
        questionId: currentVisibleSourceId.value,
        bookId: currentBookId.value,
        categoryId: categoryId
      }
    });
    isFavorite.value = response.data.isFavorite;
    uni.showToast({
      title: '收藏成功',
      icon: 'success',
      duration: 1500
    });
    favCategoryModalOpen.value = false;
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    uni.showToast({
      title: '收藏失败，请稍后重试',
      icon: 'none',
      duration: 1500
    });
  } finally {
    isLoadingFavorites.value = false;
  }
};

const checkFavoriteStatus = async (questionId) => {
  if (!questionId) return;
  try {
    const response = await request({
      url: `/math/favorites/check?questionId=${questionId}`,
      method: 'GET'
    });
    isFavorite.value = response.data.isFavorite;
  } catch (error) {
    console.error('Failed to check favorite status:', error);
  }
};

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  // 可以保存到本地存储
  uni.setStorageSync('math-theme', isDarkMode.value ? 'dark' : 'light');
};

const changeFontSize = (delta) => {
  const newSize = fontSize.value + delta;
  if (newSize >= 12 && newSize <= 30) {
    fontSize.value = newSize;
    uni.setStorageSync('math-font-size', newSize);
  }
};

watch(analysisExpanded, async (newVal) => {
  if (newVal) {
    await nextTick();
    // #ifdef H5 || APP-PLUS
    setTimeout(() => {
      const analysisSection = document.querySelector('.analysis-section-wrapper');
      if (analysisSection) {
        katexRenderWithRetry(analysisSection);
      }
    }, 100);
    // #endif
    // 展开答案解析时也展开相似题
    relatedExpanded.value = true;
  } else {
    // 收起解析时相似题也要被收起
    relatedExpanded.value = false;
  }
});

watch(relatedExpanded, async (newVal) => {
  if (newVal) {
    await nextTick();
    // #ifdef H5 || APP-PLUS
    setTimeout(() => {
      const relatedSection = document.querySelector('.related-section');
      if (relatedSection) {
        katexRenderWithRetry(relatedSection);
      }
    }, 100);
    // #endif
  }
});

// 监听夜间模式变化
watch(isDarkMode, async (newVal) => {
  console.log('Night mode changed:', newVal);
  // 微信小程序使用不同的方式处理夜间模式
  // #ifdef H5 || APP-PLUS
  await nextTick(); // 确保 DOM 元素已经渲染完成
  const appContainer = document.querySelector('.app-container');
  console.log('App container found:', appContainer);
  if (appContainer) {
    if (newVal) {
      appContainer.classList.add('night-mode');
      console.log('Added night-mode class');
    } else {
      appContainer.classList.remove('night-mode');
      console.log('Removed night-mode class');
    }
    console.log('App container classes:', appContainer.className);
  }
  // #endif
});

const hasChapters = computed(() => {
  return bookQuestionsList.value.some(q => {
    const chapName = q.BookChapter || '';
    return typeof chapName === 'string' && chapName.trim() !== '';
  });
});

const totalQuestions = computed(() => {
  return sortedBookQuestionSourceIDs.value.length || (currentQuestionData.value ? 1 : 0);
});

const hasPrevQuestion = computed(() => {
  return currentQuestionIndex.value > 0;
});

const hasNextQuestion = computed(() => {
  return currentQuestionIndex.value >= 0 && currentQuestionIndex.value < sortedBookQuestionSourceIDs.value.length - 1;
});

const otherDetails = computed(() => {
  if (!currentQuestionData.value || !currentQuestionData.value.second_request) return [];
  
  const KAO_DIAN_BUS_TYPE = '考点';
  const YI_NAN_DIAN_BUS_TYPE = '疑难点';
  
  // 过滤掉考点和疑难点
  const filtered = currentQuestionData.value.second_request.filter(item => {
    const busType = item.BusType;
    return busType !== KAO_DIAN_BUS_TYPE && busType !== YI_NAN_DIAN_BUS_TYPE;
  });

  // 排序逻辑：优先展示包含“题目详解”的内容
  return [...filtered].sort((a, b) => {
    const titleA = getDetailHeader(a);
    const titleB = getDetailHeader(b);
    
    const priorityA = titleA.includes('题目详解') ? 1 : 0;
    const priorityB = titleB.includes('题目详解') ? 1 : 0;
    
    return priorityB - priorityA;
  });
});

// 方法类详情（答题技巧、一题多解等）
const methodDetails = computed(() => {
  if (!currentQuestionData.value || !currentQuestionData.value.second_request) return [];
  
  const METHOD_BUS_TYPES = ['答题技巧', '一题多解', '解题方法', '方法'];
  
  return currentQuestionData.value.second_request.filter(item => {
    return METHOD_BUS_TYPES.includes(item.BusType);
  });
});

// 其他类详情（疑难点、技巧等非解析和考点的内容）
const otherCategoryDetails = computed(() => {
  if (!currentQuestionData.value || !currentQuestionData.value.second_request) return [];
  
  return currentQuestionData.value.second_request.filter(item => {
    const busType = item.BusType;
    return busType === '疑难点' || busType === '答题技巧' || busType === '一题多解' || busType === '解题方法' || busType === '方法';
  });
});

const groupedKnowledgePoints = computed(() => {
  if (!currentQuestionData.value || !currentQuestionData.value.second_request) return {};
  
  const grouped = {};
  
  currentQuestionData.value.second_request.forEach(item => {
    const busType = item.BusType;
    // 使用 includes 来匹配，因为 BusType 可能包含其他字符
    if (busType && busType.includes('考点')) {
      if (!grouped['考点']) {
        grouped['考点'] = [];
      }
      grouped['考点'].push(item);
    } else if (busType && busType.includes('疑难')) {
      if (!grouped['疑难点']) {
        grouped['疑难点'] = [];
      }
      grouped['疑难点'].push(item);
    }
  });
  
  return grouped;
});

// 可用的 Tab 列表
const availableTabs = computed(() => {
  const tabs = [];
  
  // 解析 Tab - 只包含题目详解等解析内容
  if (otherDetails.value && otherDetails.value.length > 0) {
    tabs.push({ key: 'analysis', label: '解析' });
  }
  
  // 考点 Tab
  if (groupedKnowledgePoints.value.考点 && groupedKnowledgePoints.value.考点.length > 0) {
    tabs.push({ key: 'kaodian', label: '考点' });
  }
  
  // 其他 Tab（疑难点、技巧等非解析和考点的内容）
  if (otherCategoryDetails.value && otherCategoryDetails.value.length > 0) {
    tabs.push({ key: 'other', label: '其他' });
  }
  
  // 相关题 Tab
  if (relatedQuestions.value && relatedQuestions.value.length > 0) {
    tabs.push({ key: 'related', label: '相关题' });
  }
  
  return tabs;
});

const toggleSidebar = (forceState) => {
  const newState = forceState !== undefined ? forceState : !sidebarOpen.value;
  sidebarOpen.value = newState;
};

const goBackToPreviousQuestion = () => {
  if (previousQuestionId.value) {
    isSingleQuestionMode.value = false;
    const prevId = previousQuestionId.value;
    previousQuestionId.value = null;
    currentVisibleSourceId.value = prevId;
    fetchQuestionData(prevId);
  }
};

// 使用 watch 监听 sidebarOpen 状态来控制 body 滚动
watch(sidebarOpen, (newVal) => {
  // #ifdef H5 || APP-PLUS
  if (newVal) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  // #endif
});

onUnmounted(() => {
  // 组件卸载时确保恢复滚动
  // #ifdef H5 || APP-PLUS
  document.body.style.overflow = '';
  // #endif
});

const toggleChapter = (chapterName) => {
  const index = expandedChapters.value.indexOf(chapterName);
  if (index > -1) {
    expandedChapters.value.splice(index, 1);
  } else {
    // Collapse all other chapters before expanding this one
    expandedChapters.value = [chapterName];
  }
};

const openSearchModal = () => {
  searchModalOpen.value = true;
  searchError.value = '';
  searchQuestionId.value = '';
};

const closeSearchModal = () => {
  searchModalOpen.value = false;
};

const handleSearch = async () => {
  const qid = searchQuestionId.value.trim();
  searchError.value = '';
  
  if (!qid) {
    searchError.value = '请输入题目ID。';
    return;
  }
  
  if (!/^\d+$/.test(qid)) {
    searchError.value = '题目ID必须是纯数字。';
    return;
  }
  
  closeSearchModal();
  // 根据 searchSingleMode 决定是否进入单题模式
  if (searchSingleMode.value) {
    isSingleQuestionMode.value = true;
    currentBookId.value = null;
    sortedBookQuestionSourceIDs.value = [];
    navigateToQuestion(qid, null);
  } else {
    navigateToQuestion(qid, currentBookId.value || null);
  }
};

const questionType = computed(() => {
  if (!currentQuestionData.value || !currentQuestionData.value.first_request || !currentQuestionData.value.first_request[0]) {
    return '';
  }
  
  const fr = currentQuestionData.value.first_request[0];
  if (fr.QuestionType) {
    return fr.QuestionType;
  }
  
  const text = fr.QuestionText || '';
  
  // 选择题判断逻辑：更严谨的匹配，通常 A 和 B 会同时出现
  const hasA = /[A][\.\s\、\)\:]|\([A]\)|（[A]）|\\mathrm\{A\}|\\rm\{A\}/i.test(text);
  const hasB = /[B][\.\s\、\)\:]|\([B]\)|（[B]）|\\mathrm\{B\}|\\rm\{B\}/i.test(text);
  const hasOptionPlaceholder = /\(\s*\\quad\s*\\;\s*\\;\s*\)|\(\s*\\quad\s*\)|\(\s*\\qquad\s*\)|\(\s*\\;\s*\)/.test(text);
  
  // 填空题判断逻辑：下划线、空括号等
  const fillRegex = /\\underline\{[\s\S]*?\}|\\underline\{\s*(?:\\;|\\quad|\\qquad|\s)+\s*\}|_{3,}|（\s*）|\(\s*\)/;

  if ((hasA && hasB) || hasOptionPlaceholder) {
    return '选择题';
  } else if (fillRegex.test(text)) {
    return '填空题';
  }
  
  return '解答题';
});

const navigateToQuestion = (sourceId, bookIdForNav = null) => {
  const targetBookId = bookIdForNav || currentBookId.value;
  
  // 判断是否为单题模式
  if (!targetBookId && sortedBookQuestionSourceIDs.value.length === 0) {
    // 如果当前不是单题模式，保存原题目ID
    if (!isSingleQuestionMode.value && currentVisibleSourceId.value) {
      previousQuestionId.value = currentVisibleSourceId.value;
    }
    isSingleQuestionMode.value = true;
    currentBookId.value = null;
  } else {
    isSingleQuestionMode.value = false;
  }
  
  // 切换题目时，重置解析和相关题目展开状态
  analysisExpanded.value = false;
  relatedExpanded.value = false;
  isSubmitted.value = uni.getStorageSync(`submitted_${sourceId}`) || false;
  isTestSubmitted.value = uni.getStorageSync(`test_submitted_${sourceId}`) || false;
  
  // 切换题目时，自动滚动到顶部
  // #ifdef H5 || APP-PLUS
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // #endif
  // #ifdef MP-WEIXIN
  uni.pageScrollTo({ scrollTop: 0, duration: 300 });
  // #endif

  // 如果当前在题目列表模式（ids 模式），且没有传入新的 bookId，则保持当前列表
  if (sortedBookQuestionSourceIDs.value.length > 0 && !bookIdForNav) {
    currentVisibleSourceId.value = String(sourceId);
    
    // 更新 URL，保留 ids 参数
    setQueryParam('questionId', sourceId);
    return;
  }

  // 单题模式：没有 bookId 且没有题目列表
  if (isSingleQuestionMode.value) {
    currentVisibleSourceId.value = String(sourceId);
    fetchQuestionData(sourceId);
    topNavTitle.value = '题目详情';
    return;
  }

  // 如果bookId不同，先更新bookId并重新获取书本详情
  if (targetBookId !== currentBookId.value) {
    currentBookId.value = targetBookId;
    fetchBookDetails().then(() => {
      currentVisibleSourceId.value = sourceId;
    });
  } else {
    // 直接更新题目ID
    currentVisibleSourceId.value = sourceId;
  }
  
  // 保存进度
  if (targetBookId) {
    uni.setStorageSync(`last_question_${targetBookId}`, sourceId);
    uni.setStorageSync('last_book_id', targetBookId);
  }

  // 更新URL历史记录
  // #ifdef H5 || APP-PLUS
  if (typeof window !== 'undefined' && window.history) {
    // 从 topNavTitle 获取当前书本标题，用于URL构建
    let currentBookTitle = topNavTitle.value || '';
    // 构建完整的URL，包含路由路径
    const newUrl = `${window.location.origin}${window.location.pathname}?questionId=${sourceId}&bookId=${targetBookId}#/pages/math/math-question-detail?bookId=${targetBookId}&bookTitle=${encodeURIComponent(currentBookTitle)}&questionId=${sourceId}`;
    window.history.pushState(
      { sourceId, bookId: targetBookId },
      `题目 ${sourceId}`,
      newUrl
    );
  }
  // #endif
};

const getQuestionPreview = (sourceId) => {
  const question = bookQuestionsList.value.find(q => String(q.QuestionID) === String(sourceId));
  if (question && question.QuestionText) {
    return transformContextString(question.QuestionText.substring(0, 100) + '...');
  }
  return '(无内容)';
};

const getQuestionPage = (sourceId) => {
  const question = bookQuestionsList.value.find(q => String(q.QuestionID) === String(sourceId));
  return question ? question.QuestionPage : null;
};

const getQuestionSort = (sourceId) => {
  const question = bookQuestionsList.value.find(q => String(q.QuestionID) === String(sourceId));
  return question ? question.QuestionSort : null;
};

const getQuestionIdentifier = () => {
  if (!currentQuestionData.value || !currentQuestionData.value.first_request || !currentQuestionData.value.first_request[0]) {
    return '';
  }
  
  const fr = currentQuestionData.value.first_request[0];
  const globalId = fr.GlobalQuestionID || currentVisibleSourceId.value;
  let displayText = '';
  
  if (fr.CurrentBrowsingBookID && fr.CurrentBookTitle) {
    let pageSortPart = '';
    const bookPage = fr.CurrentBookQuestionPage;
    const bookSort = fr.CurrentBookQuestionSort;
    if (bookPage && bookSort) {
      pageSortPart = `(${bookPage}-${bookSort})`;
    } else if (bookPage) {
      pageSortPart = `(页码: ${bookPage})`;
    } else if (bookSort) {
      pageSortPart = `(序号: ${bookSort})`;
    }
    displayText = pageSortPart ? `${pageSortPart} ID: ${globalId} 《${fr.CurrentBookTitle}》` : `ID: ${globalId} 《${fr.CurrentBookTitle}》`;
  } else {
    let pageContextPart = fr.LegacyOriginalQuestionSort ? `(序号: ${fr.LegacyOriginalQuestionSort})` : '';
    displayText = `ID: ${globalId}`;
    if (pageContextPart) {
      displayText = `${pageContextPart} ${displayText}`;
    }
    if (fr.LegacyOriginalBookTitle) {
      displayText += ` 《${fr.LegacyOriginalBookTitle}》`;
    } else if (fr.LegacyOriginalBookID) {
      displayText += ` (原书ID: ${fr.LegacyOriginalBookID})`;
    }
  }
  
  return displayText.trim();
};

const getDetailHeader = (item) => {
  let headerHtml = '';
  const itemBusType = item.BusType;
  
  if (itemBusType) {
    if (itemBusType === '答案') {
      headerHtml += `<span class="answer-label">${itemBusType}</span> `;
    } else if (['解析', '证明'].includes(itemBusType)) {
      headerHtml += `<span class="tag-label-${itemBusType.toLowerCase()}">${itemBusType}</span> `;
    } else if (['步骤'].includes(itemBusType)) {
      headerHtml += `<span class="tag-label-steps">${itemBusType}</span> `;
    } else if (['分析', '思路分析', '注释'].includes(itemBusType)) {
      headerHtml += `<span class="tag-label-analysis">${itemBusType}</span> `;
    } else {
      headerHtml += `<span class="bus-type-label">${itemBusType}</span>`;
    }
  }
  
  const itemTitle = item.KPTitle || (item._question_code && item._question_code.KPTitle) || item.Title;
  if (itemTitle) {
    headerHtml += `<span class="detail-title">${transformContextString(itemTitle)}</span>`;
  }
  
  if (headerHtml) {
    headerHtml += '<hr style="border:0; border-top:1px solid var(--light-border-color); margin:8px 0;">';
  }
  
  return headerHtml;
};

const getRelatedQuestionHeader = (relItem) => {
  const relSourceId = relItem.ID || relItem.QuestionID || 'N/A';
  const relLegacyQuestionId = relItem.QuestionID;
  let relHeaderBaseText = `<strong>相关题 (源ID: ${relSourceId}`;
  
  if (relLegacyQuestionId && String(relLegacyQuestionId) !== String(relSourceId)) {
    relHeaderBaseText += `, 旧关联ID: ${relLegacyQuestionId}`;
  }
  
  relHeaderBaseText += `)</strong>`;
  let fullRelHeaderHtml = relHeaderBaseText;
  
  if (relSourceId !== 'N/A') {
    fullRelHeaderHtml += ` <a href="#" class="related-question-link" @click.prevent="navigateToQuestion(${relSourceId}, ${currentBookId.value})">跳转此题</a>`;
  }
  
  return fullRelHeaderHtml + '<hr style="border:0; border-top:1px solid var(--light-border-color); margin:8px 0;">';
};

const goToPrevQuestion = () => {
  if (hasPrevQuestion.value) {
    const prevQuestionId = sortedBookQuestionSourceIDs.value[currentQuestionIndex.value - 1];
    navigateToQuestion(prevQuestionId, currentBookId.value);
  }
};

const goToNextQuestion = () => {
  if (hasNextQuestion.value) {
    const nextQuestionId = sortedBookQuestionSourceIDs.value[currentQuestionIndex.value + 1];
    navigateToQuestion(nextQuestionId, currentBookId.value);
  }
};

const goToBookshelf = () => {
  uni.navigateTo({
    url: '/pages/math/math-bookshelf'
  });
};

const scrollToTop = () => {
  // #ifdef H5 || APP-PLUS
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // #endif
  // #ifdef MP-WEIXIN
  uni.pageScrollTo({ scrollTop: 0, duration: 300 });
  // #endif
};

const handleImageError = (event) => {
  // #ifdef H5 || APP-PLUS
  event.target.alt = '图片加载失败';
  event.target.style.display = 'none';
  // #endif
  // 微信小程序中图片错误处理不同
};

// 转换图片 URL 为 HTTPS
const getSecureImageUrl = (url) => {
  if (!url) return url;
  return url.replace(/^http:\/\//i, 'https://');
};

// 增加刷题计数
const increaseQuestionCount = async (isCorrect = undefined) => {
  try {
    // 调用后端接口增加刷题计数
    const res = await api.userApi.increaseQuestionCount({ isCorrect });
    if (res.code === 0) {
      console.log('增加刷题计数成功（后端）:', res.data);
      
      // 更新首页的今日刷题数
      await updateHomePageStats();
    }
  } catch (error) {
    console.error('增加刷题计数失败（后端）:', error);
    // 后端失败时，仍然使用本地存储作为备用
    increaseQuestionCountLocal();
  }
};

// 本地存储实现刷题计数（备用）
const increaseQuestionCountLocal = () => {
  try {
    // 获取今日日期
    const today = new Date().toISOString().split('T')[0];
    
    // 获取本地存储的刷题数据
    const studyData = JSON.parse(uni.getStorageSync('study_data') || '{}');
    
    // 初始化今日数据
    if (!studyData[today]) {
      studyData[today] = {
        questions: 0,
        correct: 0
      };
    }
    
    // 增加今日刷题数
    studyData[today].questions += 1;
    
    // 增加累计刷题数
    studyData.totalQuestions = (studyData.totalQuestions || 0) + 1;
    
    // 保存到本地存储
    uni.setStorageSync('study_data', JSON.stringify(studyData));
    console.log('刷题计数已增加（本地）:', studyData);
    
    // 更新首页的今日刷题数
    updateHomePageStats();
  } catch (error) {
    console.error('增加刷题计数失败（本地）:', error);
  }
};

// 更新首页的今日刷题数
const updateHomePageStats = async () => {
  try {
    // 尝试从后端获取用户信息
    try {
      const userInfoRes = await api.userApi.getUserInfo();
      if (userInfoRes.code === 0) {
        // 从后端获取今日统计数据
        const statsRes = await api.wrongBookApi.getHomeOverview();
        if (statsRes.code === 0 && statsRes.data && statsRes.data.todayStats) {
          // 发送全局事件，通知首页更新数据
          uni.$emit('updateTodayStats', {
            todayQuestions: statsRes.data.todayStats.todayQuestions,
            todayAccuracy: statsRes.data.todayStats.todayAccuracy
          });
          console.log('已通知首页更新数据（后端）');
          return;
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
    
    // 后端获取失败时，使用本地存储数据
    const studyData = JSON.parse(uni.getStorageSync('study_data') || '{}');
    const today = new Date().toISOString().split('T')[0];
    const todayQuestions = studyData[today] ? studyData[today].questions : 0;
    
    // 发送全局事件，通知首页更新数据
    uni.$emit('updateTodayStats', {
      todayQuestions: todayQuestions,
      todayAccuracy: studyData[today] ? Math.round((studyData[today].correct / todayQuestions) * 100) : 0
    });
    console.log('已通知首页更新数据（本地）');
  } catch (error) {
    console.error('更新首页数据失败:', error);
  }
};

const fetchQuestionData = async (qid, forceReload = false) => {
  if (!qid) return;
  
  if (!forceReload && allQuestionsData.value[qid]) {
    currentQuestionData.value = allQuestionsData.value[qid];
    loadingQuestion.value = false;
    checkFavoriteStatus(qid);
    // 获取相关题目
    fetchRelatedQuestions(qid);
    await increaseQuestionCount();
    await nextTick();
    // #ifdef H5 || APP-PLUS
    setTimeout(() => {
      const element = document.getElementById('question-content');
      if (element) {
        katexRenderWithRetry(element);
      }
    }, 100);
    // #endif
    return;
  }
  
  loadingQuestion.value = true;
  errorQuestion.value = '';
  checkFavoriteStatus(qid);
  try {
    const response = await request({
      url: `/math/questions/${qid}?book_id=${currentBookId.value || ''}`,
      method: 'GET'
    });
    
    if (response.data && response.data[qid]) {
      allQuestionsData.value[qid] = response.data[qid];
      currentQuestionData.value = response.data[qid];
      console.log('Question data loaded:', qid);
      console.log('second_request:', response.data[qid].second_request);
      
      // 获取相关题目
      fetchRelatedQuestions(qid);
      
      // 增加刷题计数
      await increaseQuestionCount();
      
      await nextTick();
      // #ifdef H5 || APP-PLUS
      setTimeout(() => {
        const element = document.getElementById('question-content');
        if (element) {
          katexRenderWithRetry(element);
        }
      }, 100);
      // #endif
    } else {
      throw new Error(`题目 ${qid} 未找到`);
    }
  } catch (err) {
    console.error('Error fetching question data:', err);
    errorQuestion.value = `加载题目 ${qid} 失败: ${err.message}`;
    // 使用弹窗提示题目不存在
    if (err.message.includes('题目不存在') || err.message.includes('未找到')) {
      uni.showModal({
        title: '提示',
        content: '题目不存在，请检查题目ID是否正确',
        showCancel: false,
        confirmText: '确定'
      });
    }
  } finally {
    loadingQuestion.value = false;
  }
};

const fetchRelatedQuestions = async (qid) => {
  if (!qid) return;
  try {
    const response = await request({
      url: `/math/related-questions/${qid}`,
      method: 'GET'
    });
    relatedQuestions.value = response.data || [];
  } catch (err) {
    console.error('Error fetching related questions:', err);
    relatedQuestions.value = [];
  }
};

const sortQuestions = (qA, qB) => {
  const pageA = parseInt(qA.QuestionPage || 'Infinity', 10);
  const pageB = parseInt(qB.QuestionPage || 'Infinity', 10);
  const sortValA = parseInt(qA.QuestionSort || 'Infinity', 10);
  const sortValB = parseInt(qB.QuestionSort || 'Infinity', 10);

  const pA = isNaN(pageA) ? Infinity : pageA;
  const pB = isNaN(pageB) ? Infinity : pageB;
  const sA = isNaN(sortValA) ? Infinity : sortValA;
  const sB = isNaN(sortValB) ? Infinity : sortValB;

  if (pA !== pB) {
    return pA - pB;
  }
  if (sA !== sB) {
    return sA - sB;
  }
  const idA = parseInt(qA.QuestionID || '0', 10);
  const idB = parseInt(qB.QuestionID || '0', 10);
  return (isNaN(idA) ? Infinity : idA) - (isNaN(idB) ? Infinity : idB);
};

const fetchBookDetails = async () => {
  // 如果已经有题目列表（如从收藏夹跳转过来），则不需要加载书本详情
  if (sortedBookQuestionSourceIDs.value.length > 0 && !currentBookId.value) {
    loadingSidebar.value = false;
    return;
  }
  
  if (!currentBookId.value) {
    loadingSidebar.value = false;
    return;
  }

  loadingSidebar.value = true;
  errorSidebar.value = '';
  try {
    const response = await request({
      url: `/math/books/${currentBookId.value}`,
      method: 'GET'
    });
    
    if (!response.data || !response.data.questions) {
      bookQuestionsList.value = [];
      errorSidebar.value = '本书没有题目。';
      return;
    }
    
    bookQuestionsList.value = response.data.questions;
    
    if (bookQuestionsList.value.length === 0) {
      errorSidebar.value = '本书没有题目。';
      return;
    }
    
    const fetchedBookTitle = response.data.BookTitle || `书本ID:${currentBookId.value}`;
    sidebarTitle.value = fetchedBookTitle;
    topNavTitle.value = fetchedBookTitle;
    
    if (hasChapters.value) {
      const chapters = {};
      bookQuestionsList.value.forEach(q => {
        const chapName = (q.BookChapter || '').trim() || '未分类章节';
        const chapSortKey = parseInt(q.ChapterSort || 'Infinity', 10);
        if (!chapters[chapName]) {
          chapters[chapName] = {
            name: chapName,
            sortKey: isNaN(chapSortKey) ? Infinity : chapSortKey,
            questions: []
          };
        }
        chapters[chapName].questions.push(q);
      });
      
      const sortedChapterNames = Object.keys(chapters).sort((a, b) => chapters[a].sortKey - chapters[b].sortKey);
      sidebarChapters.value = sortedChapterNames.map(name => {
        const chapter = chapters[name];
        chapter.questions.sort(sortQuestions);
        return chapter;
      });
      
      sortedBookQuestionSourceIDs.value = [];
      sidebarChapters.value.forEach(chapterData => {
        chapterData.questions.forEach(q_item => {
          const sid = String(q_item.QuestionID || '');
          if (sid && sid !== 'null' && sid !== 'undefined') {
            sortedBookQuestionSourceIDs.value.push(sid);
          }
        });
      });
    } else {
      bookQuestionsList.value.sort(sortQuestions);
      
      sortedBookQuestionSourceIDs.value = bookQuestionsList.value
        .map(q => String(q.QuestionID || ''))
        .filter(id => id && id !== 'null' && id !== 'undefined');
    }

    // 如果当前没有题目ID，且书本有题目，则默认选中第一个题目
    if (!currentVisibleSourceId.value && sortedBookQuestionSourceIDs.value.length > 0) {
      currentVisibleSourceId.value = sortedBookQuestionSourceIDs.value[0];
      fetchQuestionData(currentVisibleSourceId.value);
      
      // 更新URL记录
      // #ifdef H5 || APP-PLUS
      if (typeof window !== 'undefined' && window.history) {
        const newUrl = `${window.location.origin}${window.location.pathname}?questionId=${currentVisibleSourceId.value}&bookId=${currentBookId.value}`;
        window.history.replaceState(
          { sourceId: currentVisibleSourceId.value, bookId: currentBookId.value },
          `题目 ${currentVisibleSourceId.value}`,
          newUrl
        );
      }
      // #endif
    }
  } catch (err) {
    console.error('Error fetching book details:', err);
    errorSidebar.value = `加载书本失败: ${err.message}`;
  } finally {
    loadingSidebar.value = false;
  }
};

const updateCurrentQuestionIndex = () => {
  if (currentVisibleSourceId.value && sortedBookQuestionSourceIDs.value.length > 0) {
    currentQuestionIndex.value = sortedBookQuestionSourceIDs.value.indexOf(String(currentVisibleSourceId.value));
  } else {
    currentQuestionIndex.value = -1;
  }
};

// 页面加载时获取参数
onLoad((options) => {
  options = options || {};

  // 处理练习模式的题目列表
  if (options.ids) {
    const ids = options.ids.split(',').filter(id => id);
    if (ids.length > 0) {
      sortedBookQuestionSourceIDs.value = ids;
      currentVisibleSourceId.value = options.questionId || ids[0];
      updateCurrentQuestionIndex();
      studyMode.value = options.mode || 'practice';
      fetchQuestionData(currentVisibleSourceId.value);

      // 如果没有 bookId，更新标题为题目集
      if (!options.bookId) {
        topNavTitle.value = '题目列表';
        sidebarTitle.value = '题目列表';
      }

      if (options.bookId) {
        currentBookId.value = options.bookId;
        fetchBookDetails();
      }
      return;
    }
  }

  // 判断是否为单题模式：只有 questionId，没有 bookId 和 ids
  if (options.questionId && !options.bookId && !options.ids) {
    isSingleQuestionMode.value = true;
    currentVisibleSourceId.value = options.questionId;
    topNavTitle.value = '题目详情';
    fetchQuestionData(currentVisibleSourceId.value);
    isSubmitted.value = uni.getStorageSync(`submitted_${currentVisibleSourceId.value}`) || false;
    isTestSubmitted.value = uni.getStorageSync(`test_submitted_${currentVisibleSourceId.value}`) || false;
    // 背题模式下直接展开答案解析
    if (studyMode.value === 'practice') {
      analysisExpanded.value = true;
    }
    return;
  }

  currentBookId.value = options.bookId;
  currentVisibleSourceId.value = options.questionId;

  // 如果 URL 中没有，尝试从本地存储加载
  if (!currentBookId.value) {
    currentBookId.value = uni.getStorageSync('last_book_id');
  }

  if (currentBookId.value && !currentVisibleSourceId.value) {
    currentVisibleSourceId.value = uni.getStorageSync(`last_question_${currentBookId.value}`);
  }

  if (!currentVisibleSourceId.value || !currentBookId.value) {
    if (!currentVisibleSourceId.value) currentVisibleSourceId.value = getQueryParam('questionId');
    if (!currentBookId.value) currentBookId.value = getQueryParam('bookId');
  }

  if (currentBookId.value) {
    fetchBookDetails();
  }

  if (currentVisibleSourceId.value) {
    fetchQuestionData(currentVisibleSourceId.value);
    isSubmitted.value = uni.getStorageSync(`submitted_${currentVisibleSourceId.value}`) || false;
    isTestSubmitted.value = uni.getStorageSync(`test_submitted_${currentVisibleSourceId.value}`) || false;
    // 背题模式下直接展开答案解析
    if (studyMode.value === 'practice') {
      analysisExpanded.value = true;
    }
    // 初始加载后更新索引
    nextTick(() => {
      updateCurrentQuestionIndex();
    });
  }

  // 初始化主题和字号
  const savedTheme = uni.getStorageSync('math-theme');
  if (savedTheme) {
    isDarkMode.value = savedTheme === 'dark';
  }
  const savedFontSize = uni.getStorageSync('math-font-size');
  if (savedFontSize) {
    fontSize.value = parseInt(savedFontSize);
  }
});

onMounted(() => {
  // #ifdef H5 || APP-PLUS
  window.addEventListener('scroll', () => {
    showScrollToTop.value = window.pageYOffset > 200;
  });

  window.addEventListener('popstate', (event) => {
    const state = event.state || {};
    const newSourceId = state.sourceId;
    const newBookId = state.bookId;

    if (newSourceId) {
      currentVisibleSourceId.value = newSourceId;
    }

    if (newBookId) {
      currentBookId.value = newBookId;
      fetchBookDetails();
    }
  });
  // #endif
});

onUnmounted(() => {
  // #ifdef H5 || APP-PLUS
  window.removeEventListener('scroll', () => {
    showScrollToTop.value = window.pageYOffset > 200;
  });

  window.removeEventListener('popstate', () => {});

  document.body.style.overflow = '';
  // #endif
});

watch(() => currentVisibleSourceId.value, async (newVal) => {
  if (newVal) {
    updateCurrentQuestionIndex();
    isSubmitted.value = uni.getStorageSync(`submitted_${newVal}`) || false;
    isTestSubmitted.value = uni.getStorageSync(`test_submitted_${newVal}`) || false;
    // 背题模式下保持答案解析展开状态，测试模式下默认收起
    analysisExpanded.value = studyMode.value === 'practice';
    // 与解析一起展开相似题
    relatedExpanded.value = analysisExpanded.value;
    // 重置 Tab 为解析
    activeTab.value = 'analysis';
    
    if (allQuestionsData.value[newVal]) {
      currentQuestionData.value = allQuestionsData.value[newVal];
      // 增加刷题计数
      await increaseQuestionCount();
      renderKatex();
    } else {
      fetchQuestionData(newVal);
    }
  }
});

watch(() => extractedOptions.value, (newVal) => {
  if (newVal && newVal.length > 0) {
    renderKatex();
  }
}, { deep: true });

watch(() => sortedBookQuestionSourceIDs.value, () => {
  updateCurrentQuestionIndex();
});

watch(() => sidebarOpen.value, (newVal) => {
  if (newVal) {
    // 侧边栏打开时，找到当前题目所在的章节，展开并滚动
    const currentId = String(currentVisibleSourceId.value);
    let targetChapterName = null;
    
    for (const chapter of sidebarChapters.value) {
      const found = chapter.questions.some(q => String(q.QuestionID) === currentId);
      if (found) {
        targetChapterName = chapter.name;
        break;
      }
    }
    
    // 始终展开对应章节（即使之前已展开其他章节）
    if (targetChapterName) {
      expandedChapters.value = [targetChapterName];
    }
    
    // #ifdef H5 || APP-PLUS
    // 等待侧边栏打开和章节展开动画完成
    setTimeout(() => {
      const activeItem = document.querySelector('.question-link.active, .sidebar-question-card.active');

      if (activeItem) {
        activeItem.scrollIntoView({
          block: 'center',
          behavior: 'smooth'
        });
      }
    }, 400);
    // #endif
    
    // #ifdef MP-WEIXIN
    // 小程序端需要等待章节展开动画完成
    setTimeout(() => {
      sidebarScrollIntoView.value = '';
      nextTick(() => {
        sidebarScrollIntoView.value = 'question-' + currentId;
      });
    }, 600);
    // #endif
  }
  nextTick(() => {
    // 移除 marginLeft 偏移，保持居中
    // #ifdef H5 || APP-PLUS
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.style.marginLeft = 'auto';
      appContainer.style.marginRight = 'auto';
    }
    // #endif
  });
});

watch(relatedExpanded, (newVal) => {
  if (newVal) {
    // When related questions are expanded, re-render LaTeX in the entire question content area
    // #ifdef H5 || APP-PLUS
    setTimeout(() => {
      const element = document.getElementById('question-content');
      if (element) {
        katexRenderWithRetry(element);
      }
    }, 100);
    // #endif
  }
});
</script>

<style lang="scss" scoped>
/* 基础变量 */
.app-container {
  --primary-color: #4db6ac;
  --primary-dark: #388e8a;
  --primary-gradient: linear-gradient(135deg, #4db6ac 0%, #26a69a 100%);
  --dark-gradient: linear-gradient(135deg, #2c3e50 0%, #000000 100%);
  --bg-color: #f8f9fa;
  --card-bg: #ffffff;
  --text-main: #1a1a1a;
  --text-secondary: #666666;
  --text-light: #94a3b8;
  --border-color: rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.12);
  --sidebar-width: 240px;
}



.app-container {
  width: 100%;
  background-color: var(--bg-color);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s;
  color: var(--text-main);
}



/* 深色模式变量 */
.app-container.night-mode {
  --primary-color: #64d8cb;
  --primary-dark: #4db6ac;
  --primary-gradient: linear-gradient(135deg, #64d8cb 0%, #4db6ac 100%);
  --bg-color: #121212;
  --card-bg: #1e1e1e;
  --text-main: #e0e0e0;
  --text-secondary: #aaaaaa;
  --text-light: #666666;
  --border-color: rgba(255, 255, 255, 0.1);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.6);
  background-color: #121212;
  color: #e0e0e0;
  
  .status-bar {
    background-color: #1f1f1f;
  }
  
  .nav-bar {
    background-color: #1f1f1f;
  }
  
  .sidebar {
    background: #1e1e1e;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
  }
  
  .sidebar-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
  }
  
  .chapter-header {
    background: #1e1e1e;
  }
  
  .chapter-header:active {
    background: #2c2c2c;
  }
  
  .chapter-header .chapter-title {
    color: #e0e0e0;
  }
  
  .chapter-header .arrow {
    color: #888;
  }
  
  .chapter-header.expanded .arrow {
    color: #64d8cb;
  }
  
  .chapter-questions-container {
    background: #121212;
  }
  
  .question-link {
    background: #1e1e1e;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .question-link.active {
    background: rgba(100, 216, 203, 0.1);
    border-color: #64d8cb;
    box-shadow: 0 0 0 2px rgba(100, 216, 203, 0.2);
  }
  
  .no-image-placeholder {
    background: #2c2c2c;
    color: #aaaaaa;
  }
  
  .question-meta {
    color: #aaaaaa;
  }
  
  .sidebar-question-card {
    background: #1e1e1e;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .sidebar-question-card.active {
    background: rgba(100, 216, 203, 0.1);
    border-color: #64d8cb;
  }
  
  /* 设置弹窗夜间模式 */
  .settings-popup-overlay {
    background: rgba(0, 0, 0, 0.7);
  }
  
  .settings-popup {
    background: #1e1e1e;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }
  
  .popup-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .popup-title {
    color: #e0e0e0;
  }
  
  .close-btn {
    color: #e0e0e0;
  }
  
  .popup-content {
    background: #1e1e1e;
  }
  
  .setting-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .setting-label {
    color: #e0e0e0;
  }
  
  .font-size-options {
    background: #2c2c2c;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .font-size-btn {
    color: #aaaaaa;
    background: #2c2c2c;
  }
  
  .font-size-btn.active {
    background: #64d8cb;
    color: #121212;
  }
  
  .popup-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .btn-confirm {
    background: #64d8cb;
    color: #121212;
  }
  
  /* 答题卡夜间模式 */
  .answer-sheet-drawer {
    background: #1e1e1e;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.3);
  }
  
  .sheet-header-left .sheet-title {
    color: #e0e0e0;
  }
  
  .sheet-header-left .sheet-subtitle {
    color: #aaaaaa;
  }
  
  .sheet-submit-btn-mini {
    background: #64d8cb;
    color: #121212;
    box-shadow: 0 2px 6px rgba(100, 216, 203, 0.3);
  }
  
  .close-sheet-btn {
    color: #aaaaaa;
  }
  
  .sheet-item {
    background: #1e1e1e;
    border: 2px solid rgba(255, 255, 255, 0.1);
    color: #aaaaaa;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .sheet-item.done {
    background: rgba(100, 216, 203, 0.1);
    border-color: #64d8cb;
    color: #64d8cb;
    box-shadow: 0 2px 4px rgba(100, 216, 203, 0.3);
  }
  
  .sheet-item.current {
    background: rgba(100, 216, 203, 0.2);
    border-color: #64d8cb;
    color: #64d8cb;
    box-shadow: 0 2px 8px rgba(100, 216, 203, 0.4);
  }
}

.status-bar {
  width: 100%;
  background-color: #4db6ac;
  transition: all 0.3s;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  height: 88rpx;
  background-color: #4db6ac;
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
  .back-btn {
    width: 60rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    font-size: 40rpx;
  }
  .nav-title {
    font-size: 32rpx;
    font-weight: 500;
    flex: 1;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nav-right {
    display: flex;
    align-items: center;
    .nav-icon-btn {
      width: 60rpx;
      height: 88rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36rpx;
      margin-left: 10rpx;
    }
  }
}

.progress-section {
  padding: 10rpx 30rpx;
  background-color: #fff;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 99;
  /* #ifdef MP-WEIXIN */
  margin-top: 0;
  /* #endif */
  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8rpx;
    
    .progress-info-left {
      display: flex;
      align-items: center;
      
      .question-type-tag {
        background-color: #e0f2f1;
        color: #4db6ac;
        font-size: 20rpx;
        padding: 4rpx 16rpx;
        border-radius: 8rpx;
        font-weight: bold;
        border: 1rpx solid rgba(77, 182, 172, 0.3);
        box-shadow: 0 2rpx 4rpx rgba(77, 182, 172, 0.1);
      }
    }
    
    .count-box {
      display: flex;
      align-items: center;
      font-size: 26rpx;
      .current {
        color: #4db6ac;
        font-weight: bold;
      }
      .total {
        color: #999;
      }
      .recitation-toggle {
        font-size: 24rpx;
        padding: 6rpx 20rpx;
        border-radius: 30rpx;
        background-color: #f0f0f0;
        color: #666;
        margin-left: 20rpx;
        transition: all 0.3s;
        &.active {
          background-color: #e0f2f1;
          color: #4db6ac;
          border: 1rpx solid #4db6ac;
        }
      }
    }
  }
  .progress-bar-bg {
    height: 6rpx;
    background-color: #eee;
    border-radius: 3rpx;
    overflow: hidden;
    .progress-active {
      height: 100%;
      background-color: #4db6ac;
      transition: width 0.3s ease;
    }
  }
}

.app-container.night-mode .progress-section {
  background-color: #1e1e1e;
  .progress-info {
    .question-type-tag {
      background-color: rgba(77, 182, 172, 0.15);
      color: #4db6ac;
      border-color: rgba(77, 182, 172, 0.3);
    }
  }
  .progress-bar-bg { background-color: #333; }
}

/* 侧边栏 */
.sidebar {
  position: fixed;
  top: 0;
  left: -240px;
  width: 240px;
  height: 100%;
  background: #ffffff;
  z-index: 1001;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar.open {
  left: 0;
}

.sidebar-header {
  padding: 24px 20px;
  font-size: 18px;
  font-weight: 800;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-main);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.sidebar-overlay.active {
  opacity: 1;
  visibility: visible;
}

/* 侧边栏章节和题目 */
.chapter-group {
  margin-bottom: 4px;
}

.chapter-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  background: var(--card-bg);
  transition: all 0.2s;
  min-height: 48px;
  box-sizing: border-box;
}

.chapter-header:active {
  background: var(--bg-color);
}

.chapter-header .chapter-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  flex: 1;
  margin-right: 12px;
  white-space: normal;
  line-height: 1.4;
  min-width: 0;
}

.chapter-header .arrow {
  font-size: 12px;
  color: var(--text-light);
  transition: transform 0.3s;
  flex-shrink: 0;
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
}

.chapter-header.expanded .arrow {
  transform: rotate(90deg);
  color: var(--primary-color);
}

.chapter-questions-container {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--bg-color);
}

.chapter-questions-container.expanded {
  max-height: 2000px;
}

.question-item {
  padding: 4px 12px;
}

.question-link {
  display: block;
  padding: 12px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.2s;
  cursor: pointer;
}

.question-link.active {
  background: rgba(0, 122, 255, 0.1);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.question-link img,
.question-thumb {
  width: 100%;
  height: auto;
  border-radius: 6px;
  margin-bottom: 8px;
  display: block;
}

.no-image-placeholder {
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  border-radius: 8px;
  color: var(--text-secondary);
}

.placeholder-id {
  font-size: 12px;
  font-weight: 700;
}

.placeholder-meta {
  font-size: 10px;
}

.question-meta {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
  font-weight: 500;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  padding: 20rpx;
  padding-bottom: 100rpx;
  max-width: 1200rpx;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  background: #ffffff;
  position: relative;
  z-index: 1;
}

.app-container.single-question-mode .main-content {
  padding-top: 20rpx;
}

.app-container.night-mode .main-content {
  background: #1e1e1e;
}

/* 解析内容样式 */
.analysis-card-body {
  font-size: 16px;
  line-height: 1.8;
  color: #333333;
  text-align: left;
}

.analysis-card-body p {
  margin: 16px 0;
}

.analysis-card-body strong {
  font-weight: 700;
  color: #000000;
}

.analysis-card-body em {
  font-style: italic;
}

/* 思路分析样式 */
.analysis-card-body .thinking-analysis {
  color: #666666;
  margin: 12px 0;
}

/* 步骤标题样式 */
.analysis-card-body .step-title {
  font-weight: 700;
  color: #000000;
  margin: 12px 0 8px 0;
}

/* 进度条 */
.progress-bar-container {
  padding: 4px 12px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.progress-info {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.progress-track {
  height: 3px;
  background: var(--bg-color);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-gradient);
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px rgba(0, 122, 255, 0.3);
}

/* 题目卡片 */
.question-main-card {
  margin: 2px 0;
  padding: 12px 15px;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
  transition: all 0.3s ease;
}

.question-main-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* 题目详解标题 */
.question-detail-header {
  margin: 2px 0;
  padding-left: 12px;
  border-left: 4px solid #4db6ac;
}

.question-detail-title {
  font-size: 18px;
  font-weight: 700;
  color: #4db6ac;
  margin: 0;
}

/* 答案标签 */
.answer-label {
  display: inline-block;
  background: #4db6ac;
  color: #ffffff;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  margin-right: 10px;
}

/* 分析卡片 */
.analysis-card {
  margin: 2px 0;
  padding: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  border: none;
}

.analysis-card-header {
  margin-bottom: 2px;
}

.analysis-card-body {
  margin-left: 0;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.question-header-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  width: 100%;
}

.question-id-badge {
  background: var(--bg-color);
  color: var(--text-secondary);
  padding: 5px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
}

.question-type-badge {
  padding: 5px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
}

.question-type-badge.type-choice {
  background-color: rgba(0, 122, 255, 0.1);
  color: #007aff;
}

.question-type-badge.type-fill {
  background-color: rgba(255, 149, 0, 0.1);
  color: #ff9500;
}

.question-type-badge.type-answer {
  background-color: rgba(52, 199, 89, 0.1);
  color: #34c759;
}

.correction-btn {
  background: none;
  border: none;
  color: #4db6ac;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-left: auto;
  flex-shrink: 0;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  width: 44px;
  height: 44px;
}

.correction-btn:active {
  background: rgba(77, 182, 172, 0.1);
  transform: scale(0.95);
}

/* 模式切换 */
.mode-switch {
  display: flex;
  background: var(--bg-color);
  padding: 2px;
  border-radius: 8px;
  border: none;
}

.mode-btn {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
  white-space: nowrap;
}

.mode-btn.active {
  background: var(--primary-color);
  color: #fff;
  box-shadow: 0 1px 4px rgba(0, 122, 255, 0.2);
}

.test-timer {
  font-family: "Courier New", Courier, monospace;
  font-size: 12px;
  color: #ff4d4f;
  font-weight: 800;
  padding: 0 4px;
  background: rgba(255, 77, 79, 0.1);
  border-radius: 4px;
  margin-right: 4px;
}

.sheet-toggle-btn-inline {
  background: var(--primary-color);
  color: #fff;
  border: none;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 确保移除uni-app默认按钮样式 */
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.sheet-toggle-btn-inline:active {
  transform: scale(0.95);
  background: var(--primary-dark);
}

.sheet-toggle-btn-inline:active {
  transform: scale(0.95);
  opacity: 0.9;
}

/* 选项样式 */
.options-container {
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 6px 10px;
  background: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  z-index: 1;
  pointer-events: auto;
  min-height: 32px;
  margin-bottom: 4px;
}

.option-item .option-label,
.option-item .option-content {
  pointer-events: none;
}

.option-item.selected {
  border-color: #4db6ac;
  background: rgba(77, 182, 172, 0.05);
  box-shadow: 0 4px 12px rgba(77, 182, 172, 0.1);
}

.option-item.correct {
  border-color: #4cd964 !important;
  background: rgba(76, 217, 100, 0.08) !important;
  box-shadow: 0 4px 12px rgba(76, 217, 100, 0.1) !important;
}

.option-item.wrong {
  border-color: #4db6ac !important;
  background: rgba(77, 182, 172, 0.08) !important;
  box-shadow: 0 4px 12px rgba(77, 182, 172, 0.1) !important;
}

.option-item.non-interactive {
  cursor: default;
}

.option-item.non-interactive:active {
  transform: none;
}

.option-label {
  font-weight: 700;
  margin-right: 16px;
  min-width: 24px;
  text-align: left;
  color: #333333;
  font-size: 16px;
  flex-shrink: 0;
}

.option-content {
  flex: 1;
  color: #333333;
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: break-word;
}

.option-content :deep(img),
.option-content :deep(uni-image) {
  max-width: 100% !important;
  height: auto !important;
  display: block;
  margin: 5px 0;
}

/* 题目纠错按钮容器 */
.correction-btn-container {
  position: absolute;
  bottom: 2px;
  right: 16px;
  z-index: 10;
}

.correction-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
  transition: all 0.2s;
  box-shadow: none;
  height: 10px;
}

.correction-btn .svg-icon {
  width: 12px !important;
  height: 12px !important;
  flex-shrink: 0;
}

.correction-btn:active {
  background-color: rgba(255, 59, 48, 0.1);
  transform: scale(0.95);
}

.app-container.night-mode .correction-btn {
  background: transparent;
  border: none;
  color: #ff4d4f;
  box-shadow: none;
}

.app-container.night-mode .correction-btn:active {
  background: rgba(255, 77, 79, 0.2);
}

.correction-text {
  font-size: 12px;
}

/* 主操作按钮样式 */
.main-action-btn {
  display: block;
  width: 100%;
  background: linear-gradient(135deg, #4db6ac, #26a69a);
  color: #fff;
  border: none;
  border-radius: 24px;
  padding: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 24px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(77, 182, 172, 0.3);
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-action-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(77, 182, 172, 0.4);
}

/* 夜间模式下的按钮样式 */
.app-container.night-mode .correction-btn {
  color: #666;
}

.app-container.night-mode .correction-btn:active {
  background: rgba(255, 255, 255, 0.05);
}

.app-container.night-mode .main-action-btn {
  background: linear-gradient(135deg, #00796b, #004d40);
  box-shadow: 0 4px 12px rgba(0, 121, 107, 0.4);
}

/* 测试模式操作 */
.test-action-container {
  margin-top: 5px;
  display: flex;
  justify-content: center;
}

.submit-answer-btn {
  background: var(--primary-color);
  color: #fff;
  border: none;
  padding: 6px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 30px;
}

.submit-answer-btn:active {
  transform: scale(0.95);
  opacity: 0.9;
}

.submit-answer-btn:disabled {
  background: var(--bg-color);
  color: var(--text-light);
}

.retake-btn {
  background: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  padding: 6px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 30px;
}

.retake-btn:active {
  background: var(--active-color);
  transform: scale(0.95);
}

/* 弹窗样式优化 */
.correction-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.correction-modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

.correction-modal-content {
  background: #ffffff;
  width: 90%;
  max-width: 420px;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  transform: scale(0.9);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.correction-modal-overlay.active .correction-modal-content {
  transform: scale(1);
}

.correction-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-icon {
  font-size: 24px;
}

.correction-modal-title {
  font-size: 20px;
  font-weight: 800;
  margin: 0;
  color: var(--text-main);
}

.correction-modal-close-btn {
  background: var(--bg-color);
  border: none;
  color: var(--text-secondary);
  width: 32px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
}

.correction-type-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
  width: 100%;
}

.type-tag {
  padding: 6px 12px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.type-tag.active {
  background: #4db6ac;
  color: #ffffff;
  border-color: #4db6ac;
}

.correction-textarea {
  width: 100%;
  height: 100px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-main);
  box-sizing: border-box;
}

.correction-footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.correction-tip {
  font-size: 12px;
  color: var(--text-light);
  margin: 0;
  text-align: center;
}

.correction-submit-btn {
  width: 100%;
  background: #007aff;
  color: #fff;
  border: none;
  padding: 5px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  transition: all 0.2s;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}



.correction-submit-btn:disabled {
  background: #e0e0e0;
  box-shadow: none;
  color: #a0a0a0;
}

.dark-mode .correction-submit-btn:disabled {
  background: #444;
  color: #666;
}

.correction-submit-btn:not(:disabled):active {
  transform: scale(0.98);
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.2);
}

/* 答题卡样式 */
.answer-sheet-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 16px;
  z-index: 1001;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.12);
}

.answer-sheet-drawer.active {
  transform: translateY(0);
}

.answer-sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.sheet-header-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.sheet-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-main);
}

.sheet-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.sheet-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sheet-submit-btn-mini {
  background: var(--primary-color);
  color: #fff;
  border: none;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(77, 182, 172, 0.2);
}

.close-sheet-btn {
  background: none;
  border: none;
  color: var(--text-light);
  font-size: 24px;
  line-height: 1;
  padding: 0;
  cursor: pointer;
}

.answer-sheet-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
  padding: 4px;
}

.sheet-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 2px solid var(--primary-color);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--primary-color);
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(77, 182, 172, 0.1);
}

.sheet-item.done {
  background: rgba(77, 182, 172, 0.1);
  border-color: var(--primary-color);
  color: var(--primary-color);
  box-shadow: 0 2px 4px rgba(77, 182, 172, 0.2);
}

.sheet-item.current {
  background: rgba(77, 182, 172, 0.2);
  border-color: var(--primary-color);
  color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(77, 182, 172, 0.3);
}

.sheet-item:active {
  transform: scale(0.9);
}

.test-toolbar {
  position: fixed;
  bottom: 80px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 99;
}

.sheet-toggle-btn {
  background: var(--primary-color);
  color: #fff;
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 25px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.timer-display {
  background: var(--card-bg);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-family: monospace;
  box-shadow: var(--shadow-sm);
  text-align: center;
}

.question-text {
  line-height: 1.7;
  color: var(--text-main);
  transition: font-size 0.2s;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: break-word;
}

.question-text :deep(img),
.question-text :deep(uni-image) {
  max-width: 100% !important;
  height: auto !important;
  display: block;
  margin: 10px auto;
  width: auto;
}

/* 解析开关 */
.analysis-toggle-container {
  padding: 0 16px;
  margin-bottom: 5px;
}

.analysis-toggle {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}

.analysis-toggle:active {
  transform: scale(0.98);
  background: var(--bg-color);
}

.toggle-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary-color);
  margin-right: 6px;
}

.toggle-icon {
  font-size: 10px;
  color: var(--primary-color);
  transition: transform 0.3s;
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}

/* 解析内容区域 */
.analysis-section-wrapper {
  padding: 0;
}

/* Tab 切换样式 */
.detail-tabs {
  display: flex;
  background: var(--bg-color, #f5f7fa);
  border-radius: 20px;
  padding: 3px;
  margin-bottom: 8px;
  gap: 3px;
}

.detail-tab {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  font-size: 14px;
  color: var(--text-secondary, #666);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 500;
  line-height: 1.2;
}

.detail-tab.active {
  background: var(--primary-color, #4db6ac);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(77, 182, 172, 0.3);
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 考点列表样式 */
.kaodian-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kaodian-item {
  background: var(--card-bg, #fff);
  border-radius: 10px;
  border: 1px solid var(--border-color, #e8e8e8);
  overflow: hidden;
}

.kaodian-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: rgba(77, 182, 172, 0.1);
  border-bottom: 1px solid rgba(77, 182, 172, 0.2);
}

.kaodian-dot {
  width: 6px;
  height: 6px;
  background: var(--primary-color, #4db6ac);
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}

.kaodian-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main, #333);
  line-height: 1.4;
}

.kaodian-body {
  padding: 12px;
}

.kaodian-content {
  line-height: 1.7;
  color: var(--text-secondary, #555);
}

/* 疑难点样式（使用不同颜色） */
.kaodian-item.yinandian .kaodian-dot {
  background: #ff9500;
}

.kaodian-item.yinandian .kaodian-header {
  background: rgba(255, 149, 0, 0.12);
  border-bottom: 1px solid rgba(255, 149, 0, 0.25);
}

.analysis-card {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.analysis-card:hover {
  box-shadow: var(--shadow-md);
}

.analysis-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.analysis-card-dot {
  width: 6px;
  height: 6px;
  background: var(--primary-color);
  border-radius: 50%;
  margin-right: 8px;
}

.analysis-card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
}

.analysis-card-body {
  line-height: 1.7;
  color: var(--text-secondary);
  transition: font-size 0.2s;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: break-word;
}

.analysis-card-body :deep(img),
.analysis-card-body :deep(uni-image) {
  max-width: 100% !important;
}

.related-tab-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.related-tab-item {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
  cursor: pointer;
}

.related-tab-item:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}

.related-tab-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.related-tab-index {
  width: 22px;
  height: 22px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 8px;
}

.related-tab-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.related-tab-id {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.related-tab-type {
  font-size: 11px;
  color: var(--primary-color);
  background: rgba(77, 182, 172, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.related-tab-jump {
  padding: 4px;
}

.related-tab-preview {
  line-height: 1.6;
  color: var(--text-secondary);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.related-tab-img {
  width: 100%;
  display: block;
  margin-top: 8px;
  border-radius: 6px;
}

.analysis-card-body :deep(img),
.analysis-card-body :deep(uni-image) {
  max-width: 100% !important;
  height: auto !important;
  display: block;
  margin: 10px auto;
  width: auto;
}

/* 知识点卡片 */
.knowledge-card {
  border-radius: 12px;
  overflow: visible;
  margin-bottom: 8px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.knowledge-card:hover {
  box-shadow: var(--shadow-md);
}

.knowledge-card.kaodian {
  border-left: 4px solid var(--primary-color);
}

.knowledge-card.kaodian .knowledge-card-header {
  background: linear-gradient(135deg, rgba(0, 150, 136, 0.08) 0%, rgba(0, 150, 136, 0.02) 100%);
  color: var(--primary-color);
}

.knowledge-card.yinandian {
  border-left: 4px solid #ff9500;
}

.knowledge-card.yinandian .knowledge-card-header {
  background: linear-gradient(135deg, rgba(255, 149, 0, 0.08) 0%, rgba(255, 149, 0, 0.02) 100%);
  color: #ff9500;
}

.knowledge-card-header {
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid var(--border-color);
}

.knowledge-card-body {
  padding: 14px;
}

.kp-item {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--border-color);
}

.kp-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.kp-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.kp-title::before {
  content: "";
  width: 4px;
  height: 14px;
  background: currentColor;
  border-radius: 2px;
  margin-right: 8px;
  opacity: 0.3;
}

.kp-name {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.kaodian .kp-name {
  background: linear-gradient(135deg, rgba(0, 150, 136, 0.15) 0%, rgba(0, 150, 136, 0.05) 100%);
  color: var(--primary-color);
  border: 1px solid rgba(0, 150, 136, 0.2);
}

.yinandian .kp-name {
  background: linear-gradient(135deg, rgba(255, 149, 0, 0.15) 0%, rgba(255, 149, 0, 0.05) 100%);
  color: #ff9500;
  border: 1px solid rgba(255, 149, 0, 0.2);
}

.kp-content {
  line-height: 1.6;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: break-word;
}

.kp-content :deep(img),
.kp-content :deep(uni-image) {
  max-width: 100% !important;
  height: auto !important;
  display: block;
  margin: 8px 0;
}

/* 相关题目 */
.related-section {
  margin: 12px 8px;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.section-header-modern {
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-color);
  cursor: pointer;
}

.section-title-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
}

.related-toggle-btn {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-light);
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.3s;
  padding: 5px;
}

.related-toggle-btn.expanded {
  transform: rotate(90deg);
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.related-list-modern {
  padding: 8px;
}

.related-item-modern {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.related-item-modern:last-child {
  border-bottom: none;
}

.related-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.related-id {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-light);
}

.jump-btn {
  padding: 5px;
  background: var(--primary-color);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.jump-btn:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.related-content {
  line-height: 1.6;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: break-word;
}

.related-content :deep(img),
.related-content :deep(uni-image) {
  max-width: 100% !important;
  height: auto !important;
  display: block;
  margin: 8px 0;
}

.related-question-img {
  width: 100%;
  display: block;
  margin-top: 10px;
  border-radius: 8px;
}

/* 底部导航 */
/* KaTeX 溢出处理 */
:deep(.math-display-scrollable),
:deep(.katex-display) {
  display: block;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  padding: 12px 0;
  margin: 8px 0;
  -webkit-overflow-scrolling: touch;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

:deep(.math-display-scrollable)::-webkit-scrollbar,
:deep(.katex-display)::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

:deep(.katex) {
  white-space: normal !important;
  font-size: 1.1em;
  max-width: 100%;
  display: inline-block;
  vertical-align: middle;
}

:deep(.katex-html) {
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
  display: inline-block;
  vertical-align: middle;
  padding: 4px 0;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:deep(.katex-html)::-webkit-scrollbar {
  display: none;
}

.question-text, .analysis-card-body, .option-content, .kp-content, .related-content {
  max-width: 100% !important;
  box-sizing: border-box;
  word-wrap: break-word;
  word-break: break-all;
  overflow-wrap: break-word;
  hyphens: auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.question-text::-webkit-scrollbar, 
.analysis-card-body::-webkit-scrollbar, 
.option-content::-webkit-scrollbar, 
.kp-content::-webkit-scrollbar, 
.related-content::-webkit-scrollbar {
  display: none;
}

.question-text image,
.question-text img,
.analysis-card-body image,
.analysis-card-body img,
.option-content image,
.option-content img,
.kp-content image,
.kp-content img,
.related-content image,
.related-content img {
  max-width: 100% !important;
  box-sizing: border-box;
}

.nav-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #ffffff;
  border-top: 1px solid #e0e0e0;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 90;
  max-width: 960px;
  margin: 0 auto;
  box-sizing: border-box;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.nav-controls-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-controls-center {
  flex: 1;
  text-align: center;
  margin: 0 16px;
}

.nav-controls-right {
  flex-shrink: 0;
}

.icon-btn {
  background: transparent;
  border: none;

  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  transition: all 0.2s;
}

.icon-btn:active {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(0.95);
}

.favorite-btn.is-favorite {
  color: #ffcc00;
}

.nav-btn {
  padding: 6px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  outline: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  min-width: 100px;
  text-align: center;
}

.nav-btn.primary {
  background: #007aff;
  color: #fff;
  font-weight: 700;
}

.nav-btn.secondary {
  background: #f0f0f0;
  color: #666666;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-btn:active:not(:disabled) {
  transform: scale(0.95);
  opacity: 0.9;
}

/* 搜索弹窗 */
.search-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;
}

.search-modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

.search-modal-content {
  width: 85%;
  max-width: 340px;
  background: var(--card-bg);
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  transform: translateY(30px);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  position: relative;
}

.search-modal-overlay.active .search-modal-content {
  transform: translateY(0);
}

.search-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-modal-title {
  font-size: 19px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.5px;
}

.search-modal-close-btn {
  background: var(--bg-color);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  font-size: 20px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.search-modal-close-btn:active {
  transform: scale(0.9);
  background: var(--border-color);
}

.search-input-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  height: 52px;
  background: var(--bg-color);
  border: 2px solid transparent;
  border-radius: 16px;
  padding: 0 16px;
  font-size: 15px;
  color: var(--text-main);
  outline: none;
  transition: all 0.3s ease;
}

.search-input :deep(.uni-input-wrapper) {
  padding: 0;
}

.search-input :deep(.uni-input-input) {
  height: 100%;
  font-size: 15px;
}

.search-input :deep(.uni-input-placeholder) {
  color: var(--text-secondary);
  line-height: 52px;
}

.search-input:focus,
.search-input.focused {
  border-color: var(--primary-color);
  background: var(--card-bg);
  box-shadow: 0 8px 20px rgba(0, 122, 255, 0.15);
}

.search-submit-btn {
  width: 100%;
  height: 52px;
  background: var(--primary-gradient);
  color: #fff !important;
  border: none !important;
  border-radius: 16px !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 20px rgba(0, 122, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1 !important;
}

.search-submit-btn::after {
  border: none !important;
}

.search-submit-btn:active {
  transform: translateY(2px);
  box-shadow: 0 5px 10px rgba(0, 122, 255, 0.2);
}

.search-options {
  margin-top: 12px;
  padding: 8px 0;
}

.search-option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.search-option-item .checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.search-option-item .checkbox.checked {
  background: #4db6ac;
  border-color: #4db6ac;
}

.search-error-msg {
  color: #ff4d4f;
  font-size: 13px;
  margin-top: 12px;
  text-align: center;
  font-weight: 500;
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

/* 加载和错误状态 */
.loading-state, .error-placeholder, .message {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--bg-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  margin: 0 auto 12px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 返回顶部 */
.scroll-to-top {
  position: fixed;
  bottom: 120px;
  right: 20px;
  width: 44px;
  height: 44px;
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-main);
  font-size: 20px;
  text-decoration: none;
  box-shadow: var(--shadow-md);
  z-index: 99;
  transition: all 0.2s;
  border: 1px solid var(--border-color);
}

.scroll-to-top:active {
  transform: scale(0.9);
}

/* 移动端适配 */
@media screen and (max-width: 480px) {
  .app-container {
    width: 100%;
  }
}

/* 精选题库按钮样式 */
.curated-btn {
  color: #007aff;
  font-size: 18px;
}

/* 精选题库弹窗样式 */
.curated-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.curated-modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

.curated-modal-content {
  width: 85%;
  max-width: 360px;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  max-height: 70vh;
}

.curated-modal-overlay.active .curated-modal-content {
  transform: translateY(0);
}

.curated-modal-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.curated-modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.curated-modal-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-light);
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.curated-modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.curated-list-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-link {
  color: var(--primary-color);
  cursor: pointer;
  font-weight: 600;
}

.curated-items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  max-height: 300px;
  padding-right: 4px;
}

.curated-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--bg-color);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.curated-item:active {
  transform: scale(0.98);
  background: var(--border-color);
}

.item-icon {
  font-size: 20px;
  margin-right: 12px;
}

.item-name {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
}

.item-arrow {
  color: var(--text-light);
  font-size: 12px;
}

.add-confirm-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 5px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.curated-empty {
  text-align: center;
  padding: 40px 0;
}

.curated-empty p {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 20px;
}

.create-bank-link {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 5px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(77, 182, 172, 0.3);
}

/* 收藏分类弹窗样式 */
.fav-category-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fav-category-modal-overlay.active {
  opacity: 1;
  visibility: visible;
}

.fav-category-modal-content {
  width: 85%;
  max-width: 360px;
  background: #ffffff;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.fav-category-modal-overlay.active .fav-category-modal-content {
  transform: translateY(0);
}

.fav-category-modal-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.fav-category-modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.fav-category-modal-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-light);
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.fav-category-modal-body {
  padding: 20px;
  max-height: 50vh;
  overflow-y: auto;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-item {
  padding: 12px 16px;
  background: var(--bg-color);
  border-radius: 12px;
  font-size: 15px;
  color: var(--text-main);
  transition: all 0.2s;
  border: 1px solid transparent;
}

.category-item:active {
  background: var(--border-color);
  transform: scale(0.98);
}

.category-item.default-item {
  border: 1px dashed var(--primary-color);
  color: var(--primary-color);
  font-weight: 600;
}

.fav-category-modal-footer {
  padding: 20px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-color);
}

.new-category-input-group {
  display: flex;
  gap: 10px;
}

.category-input {
  flex: 1;
  height: 40px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
  color: var(--text-main);
}

.create-category-btn {
  height: 40px;
  padding: 0 16px;
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.create-category-btn:active {
  transform: scale(0.95);
}

/* 设置弹窗样式 */
.settings-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 9998;
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-popup-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: transparent;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.settings-popup {
  background-color: #ffffff;
  border-radius: 40rpx 40rpx 0 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  z-index: 9999 !important;
  box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.15);
  border-top: 1rpx solid var(--border-color);
  opacity: 1;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid var(--border-color);
}

.popup-title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: 0.5rpx;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.close-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--bg-color);
  position: relative;
  z-index: 10000;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 40rpx;
  color: var(--text-tertiary);
  font-weight: 300;
  line-height: 1;
}

.close-btn:active {
  background-color: var(--active-color);
  transform: scale(0.95);
}

.popup-content {
  margin-bottom: 16rpx;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
  padding: 12rpx;
  background-color: var(--bg-color);
  border-radius: 16rpx;
  transition: all 0.3s ease;
}

.setting-item:active {
  background-color: var(--active-color);
  transform: scale(0.98);
}

.setting-label {
  font-size: 30rpx;
  color: var(--text-main);
  font-weight: 600;
  flex: 1;
  margin-right: 20rpx;
  line-height: 1.4;
}

.setting-desc {
  margin-bottom: 24rpx;
  padding: 16rpx;
  background-color: var(--bg-color);
  border-radius: 16rpx;
  border-left: 4rpx solid var(--primary-color);
}

.desc-text {
  font-size: 26rpx;
  color: var(--text-secondary);
  line-height: 1.6;
  font-weight: 400;
}

.popup-footer {
  padding-top: 20rpx;
  border-top: 1rpx solid var(--border-color);
  margin-top: 8rpx;
}

.btn-confirm {
  width: 100%;
  height: 96rpx;
  background: var(--primary-color);
  color: white;
  border-radius: 20rpx;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  position: relative;
  z-index: 10000;
  transition: all 0.3s ease;
  box-shadow: 0 8rpx 24rpx rgba(77, 182, 172, 0.3);
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.btn-confirm:active {
  opacity: 0.9;
  transform: scale(0.98);
  box-shadow: 0 4rpx 16rpx rgba(77, 182, 172, 0.4);
}

.btn-confirm::after {
  display: none;
}

/* 开关控件样式优化 */
.setting-control {
  position: relative;
  z-index: 1;
}

.setting-control switch {
  transform: scale(1.1);
}

.setting-control switch::after {
  border-radius: 50%;
  background-color: white;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

.setting-control switch[checked] {
  background-color: var(--primary-color);
}

.setting-control switch[checked]::after {
  background-color: white;
  transform: translateX(100%);
}

/* 字体大小选项样式 */
.font-size-options {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.font-size-btn {
  padding: 12rpx 24rpx;
  border-radius: 12rpx;
  border: 1px solid var(--border-color);
  background-color: var(--bg-color);
  color: var(--text-main);
  font-size: 24rpx;
  font-weight: 600;
  transition: all 0.3s ease;
}

.font-size-btn.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
}

.font-size-btn:active {
  transform: scale(0.95);
}

/* 夜间模式适配 */
.dark-mode .settings-popup {
  background-color: #1e1e1e;
  border-color: #333;
}

.dark-mode .setting-item {
  background-color: rgba(255, 255, 255, 0.05);
}

.dark-mode .setting-item:active {
  background-color: rgba(10, 132, 255, 0.2);
}

.dark-mode .setting-desc {
  background-color: rgba(255, 255, 255, 0.05);
  border-left-color: var(--primary-color);
}

.dark-mode .btn-confirm {
  background: linear-gradient(135deg, #0a84ff 0%, #0066cc 100%);
  box-shadow: 0 8rpx 24rpx rgba(10, 132, 255, 0.4);
  color: #ffffff;
}

.dark-mode .correction-submit-btn {
  background: linear-gradient(135deg, #0a84ff 0%, #0066cc 100%);
  color: #ffffff;
}

.dark-mode .create-bank-link {
  background: linear-gradient(135deg, #0a84ff 0%, #0066cc 100%);
  color: #ffffff;
}

.dark-mode .close-btn {
  background-color: var(--bg-color);
}

/* 底部操作栏样式 */
.bottom-action-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 20rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 70rpx;
  
  .action-items {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }
  
  .action-item {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rpx;
    border-radius: 8rpx;
    transition: all 0.2s;
    
    &:active {
      background-color: #f5f5f5;
      transform: scale(0.95);
    }
  }
  
  .nav-btns {
      display: flex;
      gap: 8rpx;
      
      .nav-btn {
        padding: 8rpx 16rpx;
        background-color: #f5f5f5;
        color: #333;
        border-radius: 50px;
        font-size: 24rpx;
        font-weight: bold;
        text-align: center;
        transition: all 0.2s;
        min-width: 90rpx;
        border: none;
        outline: none;
        
        &:active {
          background-color: #e0e0e0;
          transform: scale(0.95);
        }
        
        &.next {
          background-color: #4db6ac;
          color: #fff;
          
          &:active {
            background-color: #388e3c;
          }
        }
        
        &.disabled {
          opacity: 0.5;
          pointer-events: none;
        }
      }
    }
}

.bottom-action-card.single-mode {
  justify-content: center;
  
  .action-items {
    justify-content: center;
  }
}

.app-container.night-mode .bottom-action-card {
  background-color: #1e1e1e;
  border-top: 1px solid #333;
  .action-item {
    color: #bbb;
  }
  
  .nav-btns {
    .nav-btn {
      background-color: #2c2c2c;
      color: #e0e0e0;
      
      &:active {
        background-color: #3c3c3c;
      }
      
      &.next {
        background-color: #64d8cb;
        color: #121212;
        
        &:active {
          background-color: #4db6ac;
        }
      }
    }
  }
}

/* 创建分类区域样式 */
.create-category-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.create-btn-wrapper {
  display: flex;
  justify-content: center;
}

.create-category-text-btn {
  font-size: 14px;
  color: var(--primary-color);
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  transition: opacity 0.2s;
}

.create-category-text-btn:active {
  opacity: 0.7;
}

.create-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.create-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.action-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  min-width: 72px;
}

.action-btn.cancel {
  background: var(--bg-color);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.action-btn.cancel:active {
  background: var(--border-color);
}

.action-btn.confirm {
  background: var(--primary-gradient);
  color: white;
  border: none;
}

.action-btn.confirm:active {
  transform: scale(0.95);
  opacity: 0.9;
}

/* 分类列表滚动条样式 */
.curated-items-list::-webkit-scrollbar {
  width: 4px;
}

.curated-items-list::-webkit-scrollbar-track {
  background: transparent;
}

.curated-items-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}
</style>
