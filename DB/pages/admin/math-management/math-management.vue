<!--
  管理后台：纠错反馈与书籍管理
  Version: 1.0.1
-->
<template>
  <view class="admin-container">
    <!-- 顶部管理栏 -->
    <view class="admin-header">
      <view class="header-left">
        <view class="sider-toggle" @click="isSidebarCollapsed = !isSidebarCollapsed">
          <text class="toggle-icon">{{ isSidebarCollapsed ? '≡' : '◀' }}</text>
        </view>
        <text class="admin-logo">OJLD</text>
        <text class="admin-title" v-if="!isSidebarCollapsed">数学后台管理系统</text>
      </view>
      <view class="header-right">
        <view class="admin-user">
          <text class="user-name">Admin</text>
          <text class="logout-btn" @click="handleExit">退出</text>
        </view>
      </view>
    </view>

    <view class="layout-wrapper" :class="{ 'sider-collapsed': isSidebarCollapsed }">
      <!-- 左侧边栏：导航 -->
      <view class="sider" :class="{ collapsed: isSidebarCollapsed }">
        <view class="nav-menu">
          <view class="nav-item" :class="{ active: activeTab === 'corrections' }" @click="activeTab = 'corrections'">
            <text class="nav-icon">📢</text>
            <text class="nav-text" v-if="!isSidebarCollapsed">纠错反馈</text>
            <text v-if="correctionTotal > 0 && !isSidebarCollapsed" class="nav-badge">{{ correctionTotal }}</text>
          </view>
          <view class="nav-item" :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">
            <text class="nav-icon">🔍</text>
            <text class="nav-text" v-if="!isSidebarCollapsed">题目搜索</text>
          </view>
          <view class="nav-item" :class="{ active: activeTab === 'books' }" @click="activeTab = 'books'">
            <text class="nav-icon">📚</text>
            <text class="nav-text" v-if="!isSidebarCollapsed">书籍管理</text>
          </view>
          <view class="nav-item" :class="{ active: activeTab === 'entry' }" @click="activeTab = 'entry'">
            <text class="nav-icon">✏️</text>
            <text class="nav-text" v-if="!isSidebarCollapsed">录入试题</text>
          </view>
          <view class="nav-item" :class="{ active: activeTab === 'import' }" @click="activeTab = 'import'">
            <text class="nav-icon">📤</text>
            <text class="nav-text" v-if="!isSidebarCollapsed">题目导入</text>
          </view>
        </view>
        
        <!-- 侧边栏底部统计或信息 -->
        <view class="sider-footer" v-if="!isSidebarCollapsed">
          <view class="stats-item">
            <text class="stats-label">待处理纠错</text>
            <text class="stats-value">{{ correctionTotal }}</text>
          </view>
        </view>
      </view>

      <!-- 中间列表区 -->
      <view class="main-list">
        <view class="tab-content" v-show="activeTab === 'corrections'">
          <view class="content-header">
            <view class="h2">全部反馈</view>
            <view class="refresh-btn" @click="fetchCorrections">刷新数据</view>
          </view>
          
          <view class="filter-card">
            <view class="filter-row">
              <view class="filter-item">
                <text class="filter-label-inline">处理状态</text>
                <picker @change="onStatusChange" :value="statusIndex" :range="statusOptions" range-key="label">
                  <view class="picker-val">{{ statusOptions[statusIndex].label }}</view>
                </picker>
              </view>
              <view class="filter-item">
                <text class="filter-label-inline">反馈类型</text>
                <picker @change="onCorrectionTypeChange" :value="correctionTypeIndex" :range="correctionTypeOptions" range-key="label">
                  <view class="picker-val">{{ correctionTypeOptions[correctionTypeIndex].label }}</view>
                </picker>
              </view>
              <view class="filter-item">
                <text class="filter-label-inline">排序</text>
                <picker @change="onCorrectionSortChange" :value="correctionSortOptions.findIndex(o => o.sortBy === correctionSortBy && o.sortOrder === correctionSortOrder)" :range="correctionSortOptions" range-key="label">
                  <view class="picker-val">{{ correctionSortOptions.find(o => o.sortBy === correctionSortBy && o.sortOrder === correctionSortOrder)?.label || '默认排序' }}</view>
                </picker>
              </view>
            </view>
          </view>
          
          <view class="table-container">
            <view class="table-scroll-view">
              <view class="table-header">
                <view class="th col-status">状态</view>
                <view class="th col-type">类型</view>
                <view class="th col-content">内容摘要</view>
                <view class="th col-time">提交时间</view>
                <view class="th col-user">处理人</view>
                <view class="th col-time">处理时间</view>
              </view>
              <view class="table-body-wrapper">
                <scroll-view scroll-y class="list-scroll table-body">
                  <view v-if="loadingList" class="loading-text">加载中...</view>
                  <view v-else-if="corrections.length === 0" class="empty-text">暂无数据</view>
                  <template v-for="item in corrections" :key="item.id">
                    <view class="tr" 
                          :class="{ 
                            selected: currentCorrection?.id === item.id,
                            'editing-row': editingQuestionId === item.QuestionID && currentCorrection?.id === item.id,
                            'tr-pending': item.Status !== 1,
                            'tr-success': item.Status === 1
                          }"
                          @click="selectCorrection(item)">
                      <view class="td col-status">
                        <text class="status-dot" :class="item.Status === 1 ? 'success' : 'pending'"></text>
                        <text :class="item.Status === 1 ? 'text-success' : 'text-danger'">{{ item.Status === 1 ? '已处理' : '待处理' }}</text>
                      </view>
                      <view class="td col-type">{{ item.Type }}</view>
                      <view class="td col-content text-ellipsis">{{ item.Content }}</view>
                      <view class="td col-time">{{ formatTime(item.CreatedAt) }}</view>
                      <view class="td col-user">{{ item.UpdaterName || '-' }}</view>
                      <view class="td col-time">{{ item.UpdatedAt ? formatTime(item.UpdatedAt) : '-' }}</view>
                    </view>
                    
                    <!-- 纠错题目内联编辑 -->
                    <view v-if="editingQuestionId === item.QuestionID && currentCorrection?.id === item.id" class="inline-edit-row" @click.stop>
                      <view class="inline-edit-container">
                        <!-- 反馈内容展示 -->
                        <view class="correction-alert" :class="{ 'alert-success': item.Status === 1 }">
                          <text class="alert-title">用户反馈 [{{ item.Type }}]</text>
                          <text class="alert-content">{{ item.Content }}</text>
                          <text class="alert-time">{{ formatTime(item.CreatedAt) }}</text>
                          <view class="modifier-row-inline" v-if="item.Status === 1">
                            <text class="modifier-label">处理人:</text>
                            <text class="form-view-value">{{ item.UpdaterName || '管理员' }}</text>
                            <text class="modifier-label">时间:</text>
                            <text class="form-view-value">{{ item.UpdatedAt ? formatTime(item.UpdatedAt) : '-' }}</text>
                          </view>
                          <view v-else class="pending-status-inline">
                            <text class="pending-tag">待处理</text>
                          </view>
                        </view>

                        <!-- 题目编辑表单 -->
                        <view class="main-form" v-if="selectedQuestion">
                          <view class="form-item w-120px">
                            <text class="form-label">题型</text>
                            <picker @change="onQuestionTypeChange" :value="questionTypeOptions.indexOf(editForm.questionType)" :range="questionTypeOptions">
                              <view class="form-picker">{{ editForm.questionType || '请选择题型' }}</view>
                            </picker>
                          </view>

                          <view class="content-container">
                            <!-- 左侧：编辑区域 -->
                            <view class="editor-section">
                              <view class="form-card question-section">
                                <text class="form-label">题干内容 (支持 LaTeX)</text>
                                <textarea class="form-textarea" v-model="editForm.questionText" auto-height maxlength="-1" @focus="lastFocusedField = { type: 'questionText' }" />
                              </view>
                              
                              <view class="form-card answer-section">
                                <text class="form-label">答案内容 (支持 LaTeX)</text>
                                <textarea class="form-textarea" v-model="editForm.answerText" auto-height maxlength="-1" @focus="lastFocusedField = { type: 'answerText' }" />
                              </view>
                            </view>
                            
                            <!-- 右侧：预览区域 -->
                            <view class="preview-section">
                              <view class="form-card preview-question">
                                <text class="form-label">题干预览</text>
                                <view class="latex-preview" v-html="renderLatex(editForm.questionText)"></view>
                              </view>
                              
                              <view class="form-card preview-answer">
                                <text class="form-label">答案预览</text>
                                <view class="latex-preview" v-html="renderLatex(editForm.answerText)"></view>
                              </view>
                            </view>
                          </view>

                          <view class="details-container">
                            <view class="details-left">
                              <view class="details-section">
                                <view class="section-title">
                                  <text class="h4">题目详情内容 (编辑)</text>
                                  <view class="add-btn" @click="addDetail">+ 新增详情卡片</view>
                                </view>

                                <view class="detail-list" ref="leftDetailList">
                                  <view v-for="(detail, index) in editForm.details" :key="detail.ID || detail._tmpId" class="detail-card" :data-tmpid="detail._tmpId" :data-type="detail.BusType">
                                    <view class="detail-card-header" @click="toggleDetail(index)">
                                      <text class="bus-type-tag" :class="getBusTypeClass(detail.BusType)">{{ detail.BusType }}</text>
                                      <text class="detail-title-text">{{ detail.Title || '无标题' }}</text>
                                      <view class="detail-actions">
                                        <text class="move-icon" v-if="index > 0" @click.stop="moveDetail(index, -1)">↑</text>
                                        <text class="move-icon" v-if="index < editForm.details.length - 1" @click.stop="moveDetail(index, 1)">↓</text>
                                        <text class="delete-link" @click.stop="removeDetail(index)">删除</text>
                                        <text class="expand-icon">{{ detail._expanded ? '▲' : '▼' }}</text>
                                      </view>
                                    </view>
                                    
                                    <view class="detail-card-body" v-show="detail._expanded">
                                      <view class="form-container">
                                        <view class="form-item w-120px">
                                          <text class="small-label">业务类型</text>
                                          <picker @change="(e) => { detail.BusType = busTypeOptions[e.detail.value]; sortDetails(); }" :value="busTypeOptions.indexOf(detail.BusType)" :range="busTypeOptions">
                                            <view class="small-picker">{{ detail.BusType }}</view>
                                          </picker>
                                        </view>
                                        <view class="form-item w-200px">
                                          <text class="small-label">标题</text>
                                          <input class="small-input" v-model="detail.Title" />
                                        </view>
                                        <view class="form-item w-80px">
                                          <text class="small-label">排序权重</text>
                                          <input class="small-input" type="number" v-model="detail.Give" @blur="sortDetails" />
                                        </view>
                                        <view class="form-item w-100">
                                          <text class="small-label">关联考点ID (输入ID自动拉取内容)</text>
                                          <view class="kp-input-group">
                                            <input class="small-input kp-id-input" type="number" v-model="detail.LinkedKnowledgePointID" @blur="pullKpContent(index)" />
                                            <view class="icon-btn" @click="openKpSelector(index)" title="选择考点">🔍</view>
                                            <view class="icon-btn" v-if="detail.LinkedKnowledgePointID" @click="pullKpContent(index)" title="重新同步内容">📥</view>
                                            <view class="icon-btn" v-if="detail.LinkedKnowledgePointID" @click="editLinkedKp(detail.LinkedKnowledgePointID)" title="直接修改考点库">📝</view>
                                          </view>
                                        </view>
                                        
                                        <view class="form-item w-100">
                                          <text class="small-label">主要内容 (Context)</text>
                                          <textarea class="form-textarea small-textarea" v-model="detail.Context" auto-height maxlength="-1" @focus="lastFocusedField = { type: 'detailContext', index }" />
                                        </view>
                                        
                                        <view class="form-item w-100">
                                          <text class="small-label">备注/辅助内容 (Notes)</text>
                                          <textarea class="form-textarea small-textarea" v-model="detail.Notes" auto-height maxlength="-1" @focus="lastFocusedField = { type: 'detailNotes', index }" />
                                        </view>
                                      </view>
                                    </view>
                                  </view>
                                </view>
                              </view>
                            </view>
                            <view class="details-right">
                              <view class="details-section">
                                <view class="section-title">
                                  <text class="h4">题目详情内容 (预览)</text>
                                </view>

                                <view class="detail-list" ref="rightDetailList">
                                  <view v-for="(detail, index) in editForm.details" :key="detail.ID || detail._tmpId" class="detail-card" :data-type="detail.BusType">
                                    <view class="detail-card-header">
                                      <text class="bus-type-tag" :class="getBusTypeClass(detail.BusType)">{{ detail.BusType }}</text>
                                      <text class="detail-title-text">{{ detail.Title || '无标题' }}</text>
                                    </view>
                                    
                                    <view class="detail-card-body" v-show="detail._expanded">
                                      <view class="form-container">
                                        <view class="form-item w-100">
                                          <text class="small-label">主要内容 (Context)</text>
                                          <view class="latex-preview" v-html="renderLatex(detail.Context)"></view>
                                        </view>
                                        
                                        <view class="form-item w-100">
                                          <text class="small-label">备注/辅助内容 (Notes)</text>
                                          <view class="latex-preview" v-html="renderLatex(detail.Notes)"></view>
                                        </view>
                                      </view>
                                    </view>
                                  </view>
                                </view>
                              </view>
                            </view>
                          </view>

                          <!-- 可视化数学输入辅助 -->
                          <view class="math-assistant">
                            <view class="section-title" @click="isMathAssistantExpanded = !isMathAssistantExpanded">
                              <text class="h4">可视化公式助手</text>
                              <text class="expand-icon">{{ isMathAssistantExpanded ? '▲ 收起' : '▼ 展开' }}</text>
                            </view>
                            <view class="math-toolbar" v-if="isMathAssistantExpanded">
                              <view v-for="sym in mathSymbols" :key="sym.code" class="sym-btn" @click="insertSymbol(sym.code)" :title="sym.label">
                                <view class="sym-preview" v-html="renderLatex(sym.code)"></view>
                                <text class="sym-label">{{ sym.label }}</text>
                              </view>
                            </view>
                          </view>
                        </view>
                        
                        <view class="inline-edit-footer">
                          <view class="btn btn-default btn-sm" @click="ignoreCurrent" v-if="item.Status !== 1">忽略反馈</view>
                          <view style="flex: 1"></view>
                          <view class="btn btn-default btn-sm" @click="editingQuestionId = null; currentCorrection = null;">取消</view>
                          <view class="btn btn-primary btn-sm" @click="saveChanges" :class="{ disabled: saving }">
                            {{ saving ? '保存中...' : '保存修改' }}
                          </view>
                        </view>
                      </view>
                    </view>
                  </template>
                </scroll-view>
              </view>
            </view>
            <view class="table-footer">
              <view class="pagination">
                <view class="page-info">共 {{ correctionTotal }} 条</view>
                <view class="page-btns">
                  <view class="page-btn" :class="{ disabled: correctionPage <= 1 }" @click="changeCorrectionPage(-1)">
                    <text class="page-arrow">&lt;</text>
                  </view>
                  <view class="page-num">{{ correctionPage }}</view>
                  <view class="page-btn" :class="{ disabled: correctionPage * correctionPageSize >= correctionTotal }" @click="changeCorrectionPage(1)">
                    <text class="page-arrow">&gt;</text>
                  </view>
                </view>
                <view class="page-size-container">
                  <picker @change="onCorrectionPageSizeChange" :value="pageSizeOptions.indexOf(correctionPageSize)" :range="pageSizeOptions">
                    <view class="page-size-picker">{{ correctionPageSize }} 条/页</view>
                  </picker>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="tab-content" v-show="activeTab === 'search'">
          <view class="content-header">
            <view class="h2">全局题目搜索</view>
          </view>
          <view class="filter-card">
            <view class="search-row">
              <input class="search-input" v-model="searchKeyword" placeholder="请输入题目ID或关键词" @confirm="handleSearch" />
              <view class="search-btn" @click="handleSearch">搜索</view>
            </view>
          </view>
          
          <view class="table-container">
            <view class="table-scroll-view">
              <view class="table-header">
                <view class="th col-id">ID</view>
                <view class="th col-text">题目内容</view>
              </view>
              <view class="table-body-wrapper">
                <scroll-view scroll-y class="list-scroll table-body">
                  <view v-if="loadingSearch" class="loading-text">搜索中...</view>
                  <view v-else-if="searchResults.length === 0" class="empty-text">请输入关键词搜索</view>
                  <view v-for="item in searchResults" 
                        :key="item.QuestionID" 
                        class="tr-group"
                        :class="{ 'editing-row': editingQuestionId === item.QuestionID && !currentCorrection }">
                    <view class="tr" 
                        :class="{ selected: editingQuestionId === item.QuestionID && !currentCorrection }"
                        @click="selectFromSearch(item)">
                      <view class="td col-id">{{ item.QuestionID }}</view>
                      <view class="td col-text text-ellipsis" v-html="stripHtml(item.QuestionText)"></view>
                    </view>
                    
                    <!-- 搜索题目内联编辑 -->
                    <view v-if="editingQuestionId === item.QuestionID && !currentCorrection" class="inline-edit-row" @click.stop>
                      <view class="inline-edit-container">
                        <!-- 题目编辑表单 -->
                        <view class="main-form" v-if="selectedQuestion">
                          <view class="form-item w-120px">
                            <text class="form-label">题型</text>
                            <picker @change="onQuestionTypeChange" :value="questionTypeOptions.indexOf(editForm.questionType)" :range="questionTypeOptions">
                              <view class="form-picker">{{ editForm.questionType || '请选择题型' }}</view>
                            </picker>
                          </view>

                          <view class="content-container">
                            <view class="editor-section">
                              <view class="form-item w-100 question-section">
                                <text class="form-label">题干内容 (支持 LaTeX)</text>
                                <textarea class="form-textarea" v-model="editForm.questionText" auto-height maxlength="-1" @focus="lastFocusedField = { type: 'questionText' }" />
                              </view>

                              <view class="form-item w-100 answer-section">
                                <text class="form-label">答案内容 (支持 LaTeX)</text>
                                <textarea class="form-textarea" v-model="editForm.answerText" auto-height maxlength="-1" @focus="lastFocusedField = { type: 'answerText' }" />
                              </view>
                            </view>
                            
                            <view class="preview-section">
                              <view class="form-item w-100 preview-question">
                                <text class="form-label">题干预览</text>
                                <view class="latex-preview" v-html="renderLatex(editForm.questionText)"></view>
                              </view>

                              <view class="form-item w-100 preview-answer">
                                <text class="form-label">答案预览</text>
                                <view class="latex-preview" v-html="renderLatex(editForm.answerText)"></view>
                              </view>
                            </view>
                          </view>

                          <view class="details-container">
                            <view class="details-left">
                              <view class="details-section">
                                <view class="section-title">
                                  <text class="h4">题目详情内容 (编辑)</text>
                                  <view class="add-btn" @click="addDetail">+ 新增详情卡片</view>
                                </view>

                                <view class="detail-list">
                                  <view v-for="(detail, index) in editForm.details" :key="detail.ID || detail._tmpId" class="detail-card" :data-tmpid="detail._tmpId">
                                    <view class="detail-card-header" @click="toggleDetail(index)">
                                      <text class="bus-type-tag" :class="getBusTypeClass(detail.BusType)">{{ detail.BusType }}</text>
                                      <text class="detail-title-text">{{ detail.Title || '无标题' }}</text>
                                      <view class="detail-actions">
                                        <text class="move-icon" v-if="index > 0" @click.stop="moveDetail(index, -1)">↑</text>
                                        <text class="move-icon" v-if="index < editForm.details.length - 1" @click.stop="moveDetail(index, 1)">↓</text>
                                        <text class="delete-link" @click.stop="removeDetail(index)">删除</text>
                                        <text class="expand-icon">{{ detail._expanded ? '▲' : '▼' }}</text>
                                      </view>
                                    </view>
                                    
                                    <view class="detail-card-body" v-show="detail._expanded">
                                      <view class="form-container">
                                        <view class="form-item w-120px">
                                          <text class="small-label">业务类型</text>
                                          <picker @change="(e) => { detail.BusType = busTypeOptions[e.detail.value]; sortDetails(); }" :value="busTypeOptions.indexOf(detail.BusType)" :range="busTypeOptions">
                                            <view class="small-picker">{{ detail.BusType }}</view>
                                          </picker>
                                        </view>
                                        <view class="form-item w-200px">
                                          <text class="small-label">标题</text>
                                          <input class="small-input" v-model="detail.Title" />
                                        </view>
                                        <view class="form-item w-80px">
                                          <text class="small-label">排序权重</text>
                                          <input class="small-input" type="number" v-model="detail.Give" @blur="sortDetails" />
                                        </view>
                                        <view class="form-item w-100">
                                          <text class="small-label">关联考点ID (输入ID自动拉取内容)</text>
                                          <view class="kp-input-group">
                                            <input class="small-input kp-id-input" type="number" v-model="detail.LinkedKnowledgePointID" @blur="pullKpContent(index)" />
                                            <view class="icon-btn" @click="openKpSelector(index)" title="选择考点">🔍</view>
                                            <view class="icon-btn" v-if="detail.LinkedKnowledgePointID" @click="pullKpContent(index)" title="重新同步内容">📥</view>
                                            <view class="icon-btn" v-if="detail.LinkedKnowledgePointID" @click="editLinkedKp(detail.LinkedKnowledgePointID)" title="直接修改考点库">📝</view>
                                          </view>
                                        </view>
                                        
                                        <view class="form-item w-100">
                                          <text class="small-label">主要内容 (Context)</text>
                                          <textarea class="form-textarea small-textarea" v-model="detail.Context" auto-height maxlength="-1" @focus="lastFocusedField = { type: 'detailContext', index }" />
                                        </view>
                                        
                                        <view class="form-item w-100">
                                          <text class="small-label">备注/辅助内容 (Notes)</text>
                                          <textarea class="form-textarea small-textarea" v-model="detail.Notes" auto-height maxlength="-1" @focus="lastFocusedField = { type: 'detailNotes', index }" />
                                        </view>
                                      </view>
                                    </view>
                                  </view>
                                </view>
                              </view>
                            </view>
                            <view class="details-right">
                              <view class="details-section">
                                <view class="section-title">
                                  <text class="h4">题目详情内容 (预览)</text>
                                </view>

                                <view class="detail-list">
                                  <view v-for="(detail, index) in editForm.details" :key="detail.ID || detail._tmpId" class="detail-card">
                                    <view class="detail-card-header">
                                      <text class="bus-type-tag" :class="getBusTypeClass(detail.BusType)">{{ detail.BusType }}</text>
                                      <text class="detail-title-text">{{ detail.Title || '无标题' }}</text>
                                    </view>
                                    
                                    <view class="detail-card-body">
                                      <view class="form-container">
                                        <view class="form-item w-100">
                                          <text class="small-label">主要内容 (Context)</text>
                                          <view class="latex-preview" v-html="renderLatex(detail.Context)"></view>
                                        </view>
                                        
                                        <view class="form-item w-100">
                                          <text class="small-label">备注/辅助内容 (Notes)</text>
                                          <view class="latex-preview" v-html="renderLatex(detail.Notes)"></view>
                                        </view>
                                      </view>
                                    </view>
                                  </view>
                                </view>
                              </view>
                            </view>
                          </view>

                          <!-- 可视化数学输入辅助 -->
                          <view class="math-assistant">
                            <view class="section-title" @click="isMathAssistantExpanded = !isMathAssistantExpanded">
                              <text class="h4">可视化公式助手</text>
                              <text class="expand-icon">{{ isMathAssistantExpanded ? '▲ 收起' : '▼ 展开' }}</text>
                            </view>
                            <view class="math-toolbar" v-if="isMathAssistantExpanded">
                              <view v-for="sym in mathSymbols" :key="sym.code" class="sym-btn" @click="insertSymbol(sym.code)" :title="sym.label">
                                <view class="sym-preview" v-html="renderLatex(sym.code)"></view>
                                <text class="sym-label">{{ sym.label }}</text>
                              </view>
                            </view>
                          </view>
                        </view>
                        
                        <view class="inline-edit-footer">
                          <view style="flex: 1"></view>
                          <view class="btn btn-default btn-sm" @click="editingQuestionId = null; selectedQuestion = null;">取消</view>
                          <view class="btn btn-primary btn-sm" @click="saveChanges" :class="{ disabled: saving }">
                            {{ saving ? '保存中...' : '保存修改' }}
                          </view>
                        </view>
                      </view>
                    </view>
                  </view>
                </scroll-view>
              </view>
            </view>
          </view>
        </view>

        <view class="tab-content" v-show="activeTab === 'books'">
          <view class="content-header">
            <view class="h2">书籍与试卷管理</view>
            <view class="header-actions">
              <view class="add-btn-main" @click="addNewBook">+ 新增书籍</view>
              <view class="refresh-btn" @click="fetchBooks">刷新</view>
            </view>
          </view>
          
          <view class="filter-card">
            <view class="filter-row">
              <view class="filter-item main-search">
                <input class="search-input" v-model="bookKeyword" placeholder="搜索书籍ID或标题" @confirm="fetchBooks" />
              </view>
              <view class="filter-item">
                <text class="filter-label-inline">科目</text>
                <picker @change="onBookSubjectFilterChange" :value="subjectFilterOptions.findIndex(o => o.value === bookSubjectId)" :range="subjectFilterOptions" range-key="label">
                  <view class="picker-val">{{ subjectFilterOptions.find(o => o.value === bookSubjectId)?.label || '全部科目' }}</view>
                </picker>
              </view>
              <view class="filter-item">
                <text class="filter-label-inline">排序方式</text>
                <picker @change="onBookSortChange" :value="bookSortOptions.findIndex(o => o.sortBy === bookSortBy && o.sortOrder === bookSortOrder)" :range="bookSortOptions" range-key="label">
                  <view class="picker-val">{{ bookSortOptions.find(o => o.sortBy === bookSortBy && o.sortOrder === bookSortOrder)?.label || '默认排序' }}</view>
                </picker>
              </view>
            </view>
            
            <view class="filter-row tags-row">
              <view class="filter-item">
                <text class="filter-label-inline">内容类型</text>
                <picker @change="e => { bookFilterType = bookFilterOptions[e.detail.value].value; bookPage = 1; fetchBooks(); }" 
                        :value="bookFilterOptions.findIndex(o => o.value === bookFilterType)" 
                        :range="bookFilterOptions" 
                        range-key="label">
                  <view class="picker-val">{{ bookFilterOptions.find(o => o.value === bookFilterType)?.label || '全部类型' }}</view>
                </picker>
              </view>
              <view class="filter-item">
                <text class="filter-label-inline">业务标签</text>
                <picker @change="e => { bookCountType = countTypeOptions[e.detail.value].value; bookPage = 1; fetchBooks(); }" 
                        :value="countTypeOptions.findIndex(o => o.value === bookCountType)" 
                        :range="countTypeOptions" 
                        range-key="label">
                  <view class="picker-val">{{ countTypeOptions.find(o => o.value === bookCountType)?.label || '全部标签' }}</view>
                </picker>
              </view>
            </view>
          </view>
          
          <view class="table-container">
            <view class="table-scroll-view">
              <view class="table-header">
                <view class="th col-id">ID</view>
                <view class="th col-type">分类</view>
                <view class="th col-title">书籍/试卷标题</view>
                <view class="th col-subject">科目</view>
                <view class="th col-learner">人数</view>
                <view class="th col-time">修改时间</view>
              </view>
              <view class="table-body-wrapper">
                <scroll-view scroll-y class="list-scroll table-body">
                  <view v-if="loadingBooks" class="loading-text">加载中...</view>
                  
                  <!-- 新增书籍内联编辑 -->
                  <view v-if="editingBookId && editingBookId.toString().startsWith('NEW_')" class="inline-edit-row" @click.stop>
                    <view class="inline-edit-container">
                      <view class="form-container">
                        <view class="form-item w-100">
                          <text class="form-label">书籍标题 (新增)</text>
                          <input class="form-input" v-model="bookEditForm.BookTitle" placeholder="请输入书籍标题" />
                        </view>

                        <view class="form-item w-100">
                          <text class="form-label">科目 (多选)</text>
                          <view class="subject-checkbox-group">
                            <view v-for="s in subjectOptions" :key="s.id" 
                                  class="subject-checkbox-item" 
                                  :class="{ active: bookEditForm.SubjectIDs.includes(s.id) }"
                                  @click="toggleBookSubject(s.id)">
                              {{ s.name }}
                            </view>
                          </view>
                        </view>

                        <view class="form-item w-120px">
                          <text class="form-label">内容类型</text>
                          <picker @change="onBookContentTypeChange" :value="Math.max(0, contentTypeOptions.findIndex(o => o.value === bookEditForm.ContentType))" :range="contentTypeOptions" range-key="label">
                            <view class="form-picker">{{ contentTypeOptions.find(o => o.value === bookEditForm.ContentType)?.label || '请选择类型' }}</view>
                          </picker>
                        </view>

                        <view class="form-item w-120px">
                          <text class="form-label">业务分类 (CountType)</text>
                          <picker @change="onBookCountTypeChange" :value="Math.max(0, countTypeOptions.findIndex(o => o.value === bookEditForm.CountType))" :range="countTypeOptions" range-key="label">
                            <view class="form-picker">{{ countTypeOptions.find(o => o.value === bookEditForm.CountType)?.label || '无标签' }}</view>
                          </picker>
                        </view>

                        <view class="form-item w-100px">
                          <text class="form-label">排序权重</text>
                          <input class="form-input" type="number" v-model="bookEditForm.SortOrder" />
                        </view>

                        <view class="form-item w-100px">
                          <text class="form-label">设为新内容</text>
                          <view style="height: 28px; display: flex; align-items: center;">
                            <switch :checked="bookEditForm.IsNew === 1" @change="e => bookEditForm.IsNew = e.detail.value ? 1 : 0" scale="0.6" />
                          </view>
                        </view>

                        <view class="form-item w-100">
                          <text class="form-label">书籍描述</text>
                          <textarea class="form-textarea" v-model="bookEditForm.Description" auto-height maxlength="-1" placeholder="书籍简要描述" />
                        </view>
                      </view>
                      
                      <view class="inline-edit-footer">
                        <view style="flex: 1"></view>
                        <view class="btn btn-default btn-sm" @click="editingBookId = null">取消</view>
                        <view class="btn btn-primary btn-sm" @click="saveBookChanges">创建书籍</view>
                      </view>
                    </view>
                  </view>

                  <view v-else-if="books.length === 0" class="empty-text">暂无书籍数据</view>
                  <template v-for="item in books" :key="item.BookID">
                    <view class="tr" 
                          :class="{ 
                            selected: editingBookId === item.BookID, 
                            'editing-row': editingBookId === item.BookID 
                          }"
                          @click="openBookEdit(item)">
                      <view class="td col-id">{{ item.BookID }}</view>
                      <view class="td col-type">
                        <view class="tags-wrapper">
                          <text v-if="item.ContentType" class="type-tag" :class="item.ContentType">{{ getContentTypeLabel(item.ContentType) }}</text>
                          <text v-if="item.CountType" class="type-tag" :class="getCountTypeClass(item.CountType)">{{ getCountTypeLabel(item.CountType) }}</text>
                          <text v-if="!item.ContentType && !item.CountType">-</text>
                        </view>
                      </view>
                      <view class="td col-title text-ellipsis">{{ item.BookTitle || '-' }}</view>
                      <view class="td col-subject">
                        <view class="subject-tags">
                          <text v-for="sid in (item.SubjectIDs || [])" :key="sid" class="subject-tag">
                            {{ subjectOptions.find(s => s.id === sid)?.name || sid }}
                          </text>
                          <text v-if="!(item.SubjectIDs && item.SubjectIDs.length)">-</text>
                        </view>
                      </view>
                      <view class="td col-learner">{{ item.LearnerCount || 0 }}</view>
                      <view class="td col-time">{{ formatTime(item.UpdatedAt || item.CreationTimestamp) }}</view>
                    </view>
                    
                    <!-- 内联编辑区域 -->
                    <view v-if="editingBookId === item.BookID" class="inline-edit-row" @click.stop>
                      <view class="inline-edit-container">
                        <view class="form-container">
                          <view class="form-item w-100">
                            <text class="form-label">书籍标题</text>
                            <input class="form-input" v-model="bookEditForm.BookTitle" placeholder="请输入书籍标题" />
                          </view>

                          <view class="form-item w-100">
                            <text class="form-label">科目 (多选)</text>
                            <view class="subject-checkbox-group">
                              <view v-for="s in subjectOptions" :key="s.id" 
                                    class="subject-checkbox-item" 
                                    :class="{ active: bookEditForm.SubjectIDs.includes(s.id) }"
                                    @click="toggleBookSubject(s.id)">
                                {{ s.name }}
                              </view>
                            </view>
                          </view>

                          <view class="form-item w-120px">
                            <text class="form-label">内容类型</text>
                            <picker @change="onBookContentTypeChange" :value="Math.max(0, contentTypeOptions.findIndex(o => o.value === bookEditForm.ContentType))" :range="contentTypeOptions" range-key="label">
                              <view class="form-picker">{{ contentTypeOptions.find(o => o.value === bookEditForm.ContentType)?.label || '请选择类型' }}</view>
                            </picker>
                          </view>

                          <view class="form-item w-120px">
                            <text class="form-label">业务分类 (CountType)</text>
                            <picker @change="onBookCountTypeChange" :value="Math.max(0, countTypeOptions.findIndex(o => o.value === bookEditForm.CountType))" :range="countTypeOptions" range-key="label">
                              <view class="form-picker">{{ countTypeOptions.find(o => o.value === bookEditForm.CountType)?.label || '无标签' }}</view>
                            </picker>
                          </view>

                          <view class="form-item w-100px">
                            <text class="form-label">学习人数</text>
                            <input class="form-input" type="number" v-model="bookEditForm.LearnerCount" />
                          </view>

                          <view class="form-item w-100px">
                            <text class="form-label">排序权重</text>
                            <input class="form-input" type="number" v-model="bookEditForm.SortOrder" />
                          </view>

                          <view class="form-item w-100px">
                            <text class="form-label">设为新内容</text>
                            <view style="height: 28px; display: flex; align-items: center;">
                              <switch :checked="bookEditForm.IsNew === 1" @change="e => bookEditForm.IsNew = e.detail.value ? 1 : 0" scale="0.6" />
                            </view>
                          </view>

                          <view class="form-item w-100">
                            <text class="form-label">书籍描述</text>
                            <textarea class="form-textarea" v-model="bookEditForm.Description" auto-height maxlength="-1" placeholder="书籍简要描述" />
                          </view>
                        </view>
                        
                        <view class="inline-edit-footer">
                          <view class="btn btn-danger btn-sm" @click="deleteBook(item)">删除书籍</view>
                          <view style="flex: 1"></view>
                          <view class="btn btn-default btn-sm" @click="editingBookId = null">取消</view>
                          <view class="btn btn-primary btn-sm" @click="saveBookChanges">保存更改</view>
                        </view>
                      </view>
                    </view>
                  </template>
                </scroll-view>
              </view>
            </view>
            <view class="table-footer">
              <view class="pagination">
                <view class="page-info">共 {{ bookTotal }} 条</view>
                <view class="page-btns">
                  <view class="page-btn" :class="{ disabled: bookPage <= 1 }" @click="changeBookPage(-1)">
                    <text class="page-arrow">&lt;</text>
                  </view>
                  <view class="page-num">{{ bookPage }}</view>
                  <view class="page-btn" :class="{ disabled: bookPage * bookPageSize >= bookTotal }" @click="changeBookPage(1)">
                    <text class="page-arrow">&gt;</text>
                  </view>
                </view>
                <view class="page-size-container">
                  <picker @change="onBookPageSizeChange" :value="pageSizeOptions.indexOf(bookPageSize)" :range="pageSizeOptions">
                    <view class="page-size-picker">{{ bookPageSize }} 条/页</view>
                  </picker>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 录入试题 -->
        <view class="tab-content" v-show="activeTab === 'entry'">
          <view class="content-header">
            <view class="h2">试题录入</view>
            <view class="refresh-btn" @click="resetEntryForm">重置表单</view>
          </view>

          <view class="entry-layout">
            <!-- 上方：书籍选择 -->
            <view class="entry-section book-selection">
              <view class="section-title">选择书籍</view>
              <view class="book-selector">
                <picker @change="onEntryBookChange" :value="books.findIndex(b => b.BookID === entryBookId)" :range="books" range-key="BookTitle">
                  <view class="book-picker">
                    <text class="book-icon">📚</text>
                    <text class="book-name">{{ books.find(b => b.BookID === entryBookId)?.BookTitle || '请选择书籍' }}</text>
                    <text class="book-arrow">▼</text>
                  </view>
                </picker>
              </view>
              <view v-if="selectedBook" class="book-info">
                <view class="info-item">
                  <text class="info-label">书籍ID:</text>
                  <text class="info-value">{{ selectedBook.BookID }}</text>
                </view>
                <view class="info-item">
                  <text class="info-label">版本:</text>
                  <text class="info-value">{{ selectedBook.VersionInfo || '-' }}</text>
                </view>
                <view class="info-item">
                  <text class="info-label">类型:</text>
                  <text class="info-value">{{ getContentTypeLabel(selectedBook.ContentType) }}</text>
                </view>
                <view class="info-item">
                  <text class="info-label">科目:</text>
                  <text class="info-value">{{ getSubjectNames(selectedBook.SubjectIDs) }}</text>
                </view>
              </view>
            </view>

            <!-- 下方：左右两侧布局 -->
            <view class="entry-content">
              <!-- 左侧：题目编辑表单 -->
              <view class="entry-left">
                <view class="entry-form-container">
                  <view class="form-header">
                    <text class="h3">{{ isEditingEntryQuestion ? '编辑题目' : '录入新题目' }}</text>
                    <view class="close-btn" @click="clearEntryQuestion">×</view>
                  </view>

                  <view class="entry-form">
                    <view class="form-section" v-if="!entryBookId">
                      <view class="section-title">提示</view>
                      <view class="form-item">
                        <text class="form-label">请先在上方选择书籍，或直接在下方录入题目信息后再选择书籍</text>
                      </view>
                    </view>

                    <!-- 基本信息 -->
                    <view class="form-section">
                      <view class="section-title">基本信息</view>
                      <view class="form-row">
                        <view class="form-item half">
                          <text class="form-label">题型 *</text>
                          <picker @change="onEntryQuestionTypeChange" :value="questionTypeOptions.indexOf(entryForm.questionType)" :range="questionTypeOptions">
                            <view class="form-picker">{{ entryForm.questionType || '请选择题型' }}</view>
                          </picker>
                        </view>
                        <view class="form-item half">
                          <text class="form-label">难度</text>
                          <picker @change="onEntryDifficultyChange" :value="difficultyOptions.indexOf(entryForm.difficulty)" :range="difficultyOptions" range-key="label">
                            <view class="form-picker">{{ difficultyOptions.find(o => o.value === entryForm.difficulty)?.label || '请选择难度' }}</view>
                          </picker>
                        </view>
                      </view>
                    </view>

                    <!-- 题目内容 -->
                    <view class="form-section">
                      <view class="section-title">题目内容</view>
                      <view class="content-container">
                        <view class="editor-section">
                          <view class="form-item">
                            <text class="form-label">题干内容 (支持 LaTeX) *</text>
                            <textarea class="form-textarea" v-model="entryForm.questionText" auto-height maxlength="-1" placeholder="请输入题干内容" />
                          </view>
                          <view class="form-item">
                            <text class="form-label">答案内容 (支持 LaTeX)</text>
                            <textarea class="form-textarea" v-model="entryForm.answerText" auto-height maxlength="-1" placeholder="请输入答案内容" />
                          </view>
                        </view>
                        <view class="preview-section">
                          <view class="form-item">
                            <text class="form-label">题干预览</text>
                            <view class="latex-preview" v-html="renderLatex(entryForm.questionText)"></view>
                          </view>
                          <view class="form-item">
                            <text class="form-label">答案预览</text>
                            <view class="latex-preview" v-html="renderLatex(entryForm.answerText)"></view>
                          </view>
                        </view>
                      </view>
                    </view>

                    <!-- 题目详情 -->
                    <view class="form-section">
                      <view class="section-title">
                        <text>题目详情</text>
                        <view class="add-btn" @click="addEntryDetail">+ 新增详情卡片</view>
                      </view>
                      <view class="detail-list">
                        <view v-if="entryForm.details.length === 0" class="empty-text-small">暂无详情卡片</view>
                        <view v-for="(detail, index) in entryForm.details" :key="detail.ID || detail._tmpId" class="detail-card" :data-tmpid="detail._tmpId">
                          <view class="detail-card-header" @click="toggleEntryDetail(index)">
                            <text class="bus-type-tag" :class="getBusTypeClass(detail.BusType)">{{ detail.BusType }}</text>
                            <text class="detail-title-text">{{ detail.Title || '无标题' }}</text>
                            <view class="detail-actions">
                              <text class="move-icon" v-if="index > 0" @click.stop="moveEntryDetail(index, -1)">↑</text>
                              <text class="move-icon" v-if="index < entryForm.details.length - 1" @click.stop="moveEntryDetail(index, 1)">↓</text>
                              <text class="delete-link" @click.stop="removeEntryDetail(index)">删除</text>
                              <text class="expand-icon">{{ detail._expanded ? '▲' : '▼' }}</text>
                            </view>
                          </view>
                          
                          <view class="detail-card-body" v-show="detail._expanded">
                            <view class="content-container">
                              <view class="editor-section">
                                <view class="form-container">
                                  <view class="form-row">
                                    <view class="form-item third">
                                      <text class="small-label">业务类型</text>
                                      <picker @change="(e) => { detail.BusType = busTypeOptions[e.detail.value]; sortEntryDetails(); }" :value="busTypeOptions.indexOf(detail.BusType)" :range="busTypeOptions">
                                        <view class="small-picker">{{ detail.BusType }}</view>
                                      </picker>
                                    </view>
                                    <view class="form-item third">
                                      <text class="small-label">标题</text>
                                      <input class="small-input" v-model="detail.Title" placeholder="详情标题" />
                                    </view>
                                    <view class="form-item third">
                                      <text class="small-label">排序权重</text>
                                      <input class="small-input" type="number" v-model="detail.Give" @blur="sortEntryDetails" />
                                    </view>
                                  </view>
                                  <view class="form-item">
                                    <text class="small-label">关联考点ID</text>
                                    <view class="kp-input-group">
                                      <input class="small-input kp-id-input" type="number" v-model="detail.LinkedKnowledgePointID" @blur="pullKpContentForEntry(index)" placeholder="输入考点ID" />
                                      <view class="icon-btn" @click="openKpSelectorForEntry(index)" title="选择考点">🔍</view>
                                      <view class="icon-btn" v-if="detail.LinkedKnowledgePointID" @click="pullKpContentForEntry(index)" title="重新同步内容">📥</view>
                                      <view class="icon-btn" v-if="detail.LinkedKnowledgePointID" @click="editLinkedKp(detail.LinkedKnowledgePointID)" title="直接修改考点库">📝</view>
                                    </view>
                                  </view>
                                  <view class="form-item">
                                    <text class="small-label">主要内容 (Context)</text>
                                    <textarea class="form-textarea small-textarea" v-model="detail.Context" auto-height maxlength="-1" placeholder="主要内容" />
                                  </view>
                                  <view class="form-item">
                                    <text class="small-label">备注/辅助内容 (Notes)</text>
                                    <textarea class="form-textarea small-textarea" v-model="detail.Notes" auto-height maxlength="-1" placeholder="备注信息" />
                                  </view>
                                </view>
                              </view>
                              <view class="preview-section">
                                <view class="form-container">
                                  <view class="form-item">
                                    <text class="small-label">主要内容预览</text>
                                    <view class="latex-preview" v-html="renderLatex(detail.Context)"></view>
                                  </view>
                                  <view class="form-item">
                                    <text class="small-label">备注内容预览</text>
                                    <view class="latex-preview" v-html="renderLatex(detail.Notes)"></view>
                                  </view>
                                </view>
                              </view>
                            </view>
                          </view>
                        </view>
                      </view>
                    </view>

                    <!-- 可视化数学输入辅助 -->
                    <view class="form-section">
                      <view class="section-title" @click="isEntryMathAssistantExpanded = !isEntryMathAssistantExpanded">
                        <text>可视化公式助手</text>
                        <text class="expand-icon">{{ isEntryMathAssistantExpanded ? '▲ 收起' : '▼ 展开' }}</text>
                      </view>
                      <view class="math-toolbar" v-if="isEntryMathAssistantExpanded">
                        <view v-for="sym in mathSymbols" :key="sym.code" class="sym-btn" @click="insertSymbolForEntry(sym.code)" :title="sym.label">
                          <view class="sym-preview" v-html="renderLatex(sym.code)"></view>
                          <text class="sym-label">{{ sym.label }}</text>
                        </view>
                      </view>
                    </view>

                    <!-- 操作按钮 -->
                    <view class="form-actions">
                      <view class="btn btn-default" @click="clearEntryQuestion">清空</view>
                      <view class="btn btn-primary" @click="saveEntryQuestion" :class="{ disabled: saving }">
                        {{ saving ? '保存中...' : (isEditingEntryQuestion ? '更新题目' : '保存题目') }}</view>
                    </view>
                  </view>
                </view>
              </view>

              <!-- 右侧：已录入题目 -->
              <view class="entry-right">
                <view class="entry-section" v-if="entryBookId">
                  <view class="section-title">
                    <text>已录入题目</text>
                    <text class="count-badge">{{ entryQuestions.length }} 题</text>
                  </view>
                  <scroll-view scroll-y class="entry-question-list">
                    <view v-if="entryQuestions.length === 0" class="empty-text">暂无录入的题目</view>
                    <view v-for="(q, index) in entryQuestions" :key="q.QuestionID" class="entry-question-item" :class="{ active: selectedEntryQuestion?.QuestionID === q.QuestionID }" @click="selectEntryQuestion(q)">
                      <view class="eq-header">
                        <text class="eq-id">ID: {{ q.QuestionID }}</text>
                        <text class="eq-type">{{ q.QuestionType }}</text>
                        <view class="eq-actions">
                          <text class="action-btn" @click.stop="editEntryQuestion(q)">编辑</text>
                          <text class="action-btn delete" @click.stop="deleteEntryQuestion(q)">删除</text>
                        </view>
                      </view>
                      <view class="eq-content" v-html="stripHtml(q.QuestionText)"></view>
                    </view>
                  </scroll-view>
                </view>
                <view v-else class="empty-text">请先选择书籍查看已录入题目</view>
              </view>
            </view>
          </view>
        </view>

        <!-- 题目导入 -->
        <view class="tab-content" v-show="activeTab === 'import'">
          <view class="content-header">
            <view class="h2">题目批量导入</view>
            <view class="btn btn-primary btn-sm" @click="openManualAddQuestion">+ 手动添加题目</view>
          </view>
          
          <!-- 手动添加题目表单 -->
          <view v-if="showManualAddForm" class="manual-add-form">
            <view class="form-header">
              <text class="h3">手动添加题目</text>
              <view class="close-btn" @click="closeManualAddForm">×</view>
            </view>
            
            <view class="main-form">
              <view class="form-item w-120px">
                <text class="form-label">题型</text>
                <picker @change="onQuestionTypeChange" :value="questionTypeOptions.indexOf(editForm.questionType)" :range="questionTypeOptions">
                  <view class="form-picker">{{ editForm.questionType || '请选择题型' }}</view>
                </picker>
              </view>

              <view class="content-container">
                <view class="editor-section">
                  <view class="question-section">
                    <text class="form-label">题干内容 (支持 LaTeX)</text>
                    <textarea class="form-textarea" v-model="editForm.questionText" auto-height maxlength="-1" @focus="lastFocusedField = { type: 'questionText' }" />
                  </view>

                  <view class="answer-section">
                    <text class="form-label">答案内容 (支持 LaTeX)</text>
                    <textarea class="form-textarea" v-model="editForm.answerText" auto-height maxlength="-1" @focus="lastFocusedField = { type: 'answerText' }" />
                  </view>
                </view>
                
                <view class="preview-section">
                  <view class="preview-question">
                    <text class="form-label">题干预览</text>
                    <view class="latex-preview" v-html="renderLatex(editForm.questionText)"></view>
                  </view>

                  <view class="preview-answer">
                    <text class="form-label">答案预览</text>
                    <view class="latex-preview" v-html="renderLatex(editForm.answerText)"></view>
                  </view>
                </view>
              </view>

              <view class="form-item w-100">
                <text class="form-label">所属书籍</text>
                <picker @change="onManualBookChange" :value="books.findIndex(b => b.BookID === manualAddBookId)" :range="books" range-key="BookTitle">
                  <view class="form-picker">{{ books.find(b => b.BookID === manualAddBookId)?.BookTitle || '请选择书籍' }}</view>
                </picker>
              </view>

              <view class="details-container">
                <view class="details-left">
                  <view class="details-section">
                    <view class="section-title">
                      <text class="h4">题目详情内容 (编辑)</text>
                      <view class="add-btn" @click="addDetail">+ 新增详情卡片</view>
                    </view>

                    <view class="detail-list">
                      <view v-for="(detail, index) in editForm.details" :key="detail.ID || detail._tmpId" class="detail-card" :data-tmpid="detail._tmpId">
                        <view class="detail-card-header" @click="toggleDetail(index)">
                          <text class="bus-type-tag" :class="getBusTypeClass(detail.BusType)">{{ detail.BusType }}</text>
                          <text class="detail-title-text">{{ detail.Title || '无标题' }}</text>
                          <view class="detail-actions">
                            <text class="move-icon" v-if="index > 0" @click.stop="moveDetail(index, -1)">↑</text>
                            <text class="move-icon" v-if="index < editForm.details.length - 1" @click.stop="moveDetail(index, 1)">↓</text>
                            <text class="delete-link" @click.stop="removeDetail(index)">删除</text>
                            <text class="expand-icon">{{ detail._expanded ? '▲' : '▼' }}</text>
                          </view>
                        </view>
                        
                        <view class="detail-card-body" v-show="detail._expanded">
                          <view class="form-container">
                            <view class="form-item w-120px">
                              <text class="small-label">业务类型</text>
                              <picker @change="(e) => { detail.BusType = busTypeOptions[e.detail.value]; sortDetails(); }" :value="busTypeOptions.indexOf(detail.BusType)" :range="busTypeOptions">
                                <view class="small-picker">{{ detail.BusType }}</view>
                              </picker>
                            </view>
                            <view class="form-item w-200px">
                              <text class="small-label">标题</text>
                              <input class="small-input" v-model="detail.Title" />
                            </view>
                            <view class="form-item w-80px">
                              <text class="small-label">排序权重</text>
                              <input class="small-input" type="number" v-model="detail.Give" @blur="sortDetails" />
                            </view>
                            <view class="form-item w-100">
                              <text class="small-label">关联考点ID (输入ID自动拉取内容)</text>
                              <view class="kp-input-group">
                                <input class="small-input kp-id-input" type="number" v-model="detail.LinkedKnowledgePointID" @blur="pullKpContent(index)" />
                                <view class="icon-btn" @click="openKpSelector(index)" title="选择考点">🔍</view>
                                <view class="icon-btn" v-if="detail.LinkedKnowledgePointID" @click="pullKpContent(index)" title="重新同步内容">📥</view>
                                <view class="icon-btn" v-if="detail.LinkedKnowledgePointID" @click="editLinkedKp(detail.LinkedKnowledgePointID)" title="直接修改考点库">📝</view>
                              </view>
                            </view>
                            
                            <view class="form-item w-100">
                              <text class="small-label">主要内容 (Context)</text>
                              <textarea class="form-textarea small-textarea" v-model="detail.Context" auto-height maxlength="-1" @focus="lastFocusedField = { type: 'detailContext', index }" />
                            </view>
                            
                            <view class="form-item w-100">
                              <text class="small-label">备注/辅助内容 (Notes)</text>
                              <textarea class="form-textarea small-textarea" v-model="detail.Notes" auto-height maxlength="-1" @focus="lastFocusedField = { type: 'detailNotes', index }" />
                            </view>
                          </view>
                        </view>
                      </view>
                    </view>
                  </view>
                </view>
                <view class="details-right">
                  <view class="details-section">
                    <view class="section-title">
                      <text class="h4">题目详情内容 (预览)</text>
                    </view>

                    <view class="detail-list">
                      <view v-for="(detail, index) in editForm.details" :key="detail.ID || detail._tmpId" class="detail-card">
                        <view class="detail-card-header">
                          <text class="bus-type-tag" :class="getBusTypeClass(detail.BusType)">{{ detail.BusType }}</text>
                          <text class="detail-title-text">{{ detail.Title || '无标题' }}</text>
                        </view>
                        
                        <view class="detail-card-body">
                          <view class="form-container">
                            <view class="form-item w-100">
                              <text class="small-label">主要内容 (Context)</text>
                              <view class="latex-preview" v-html="renderLatex(detail.Context)"></view>
                            </view>
                            
                            <view class="form-item w-100">
                              <text class="small-label">备注/辅助内容 (Notes)</text>
                              <view class="latex-preview" v-html="renderLatex(detail.Notes)"></view>
                            </view>
                          </view>
                        </view>
                      </view>
                    </view>
                  </view>
                </view>
              </view>

              <!-- 可视化数学输入辅助 -->
              <view class="math-assistant">
                <view class="section-title" @click="isMathAssistantExpanded = !isMathAssistantExpanded">
                  <text class="h4">可视化公式助手</text>
                  <text class="expand-icon">{{ isMathAssistantExpanded ? '▲ 收起' : '▼ 展开' }}</text>
                </view>
                <view class="math-toolbar" v-if="isMathAssistantExpanded">
                  <view v-for="sym in mathSymbols" :key="sym.code" class="sym-btn" @click="insertSymbol(sym.code)" :title="sym.label">
                    <view class="sym-preview" v-html="renderLatex(sym.code)"></view>
                    <text class="sym-label">{{ sym.label }}</text>
                  </view>
                </view>
              </view>
            </view>

            <view class="form-footer">
              <view class="btn btn-default btn-sm" @click="closeManualAddForm">取消</view>
              <view class="btn btn-primary btn-sm" @click="saveManualQuestion" :class="{ disabled: saving }">
                {{ saving ? '保存中...' : '保存题目' }}
              </view>
            </view>
          </view>
          
          <view class="import-layout">
            <view class="import-left">
              <!-- 复合导入：Mapping + Details -->
              <view class="import-section">
                <view class="section-title">复合结构导入</view>
                <view class="upload-row">
                  <view class="upload-half" @click="chooseFile('mapping')">
                    <text class="upload-icon-small">🗺️</text>
                    <text class="upload-text-small">{{ mappingFileName || '选择 Mapping 文件' }}</text>
                    <text class="badge" v-if="mappingCount > 0">{{ mappingCount }} 题</text>
                  </view>
                  <view class="upload-half" @click="chooseFile('details')">
                    <text class="upload-icon-small">📝</text>
                    <text class="upload-text-small">{{ detailsFileName || '选择 Details 文件' }}</text>
                    <text class="badge" v-if="detailsData && detailsData.length">{{ detailsData.length }} 条</text>
                  </view>
                </view>

                <view class="import-config">
                  <view class="config-row">
                    <view class="config-item">
                      <text class="config-label">版本信息</text>
                      <input class="config-input" v-model="importConfig.versionInfo" placeholder="例如: 2026" />
                    </view>
                    <view class="config-item">
                      <text class="config-label">内容类型</text>
                      <picker @change="onImportContentTypeChange" :value="contentTypeOptions.findIndex(o => o.value === importConfig.contentType)" :range="contentTypeOptions" range-key="label">
                        <view class="picker-val">{{ contentTypeOptions.find(o => o.value === importConfig.contentType)?.label }}</view>
                      </picker>
                    </view>
                  </view>
                  <view class="config-row">
                    <view class="config-item">
                      <text class="config-label">所属科目</text>
                      <picker @change="onImportSubjectChange" :value="displaySubjects.findIndex(s => s.id === importConfig.subjectId)" :range="displaySubjects" range-key="name">
                        <view class="picker-val">{{ displaySubjects.find(s => s.id === importConfig.subjectId)?.name || '请选择科目' }}</view>
                      </picker>
                    </view>
                    <view class="config-item">
                      <view class="checkbox-item" @click="importConfig.isNew = !importConfig.isNew">
                        <label class="checkbox-label">
                          <checkbox :checked="importConfig.isNew" color="#1890ff" />
                          <text class="checkbox-text">设为新内容</text>
                        </label>
                      </view>
                    </view>
                  </view>
                </view>

                <view class="action-bar">
                  <view class="import-btn" @click="startComplexImport" :class="{ disabled: importing || !mappingData || !detailsData }">
                    {{ importing ? '导入中...' : '开始导入' }}
                  </view>
                  <view class="btn-outline" @click="clearComplex">清空选择</view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 考点选择器弹窗 -->
    <view class="modal-mask" v-if="kpSelectorVisible" @click="kpSelectorVisible = false">
      <view class="modal-box" @click.stop>
        <view class="modal-header">
          <text class="modal-title">选择关联考点</text>
          <text class="close-btn" @click="kpSelectorVisible = false">×</text>
        </view>
        <view class="modal-body">
          <view style="padding: 16px 20px 0;">
            <view class="search-bar" style="display: flex; gap: 8px; margin-bottom: 0;">
              <input class="form-input" v-model="kpSearchKeyword" placeholder="考点标题或代码" @confirm="handleKpSearch" style="flex: 1;" />
              <view class="btn btn-primary" @click="handleKpSearch" style="height: 30px; padding: 0 16px; font-size: 13px;">搜索</view>
            </view>
          </view>
          <scroll-view scroll-y class="modal-scroll" style="padding-top: 12px;">
            <view v-if="loadingKp" class="loading-text" style="text-align: center; padding: 20px; color: #999;">搜索中...</view>
            <view v-for="item in kpSearchResults" :key="item.KnowledgePointID" class="modal-list-item" @click="selectKp(item)" style="padding: 8px 12px; border-bottom: 1px solid #f5f5f5; cursor: pointer;">
              <view class="kp-item-info" style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <text class="kp-id" style="font-size: 11px; color: #999;">ID: {{ item.KnowledgePointID }}</text>
                <text class="kp-type" style="font-size: 11px; color: #1890ff; background: #e6f7ff; padding: 0 4px; border-radius: 2px;">{{ item.KPType }}</text>
              </view>
              <view class="kp-title" style="font-size: 14px; color: #262626; font-weight: 500;">{{ item.KPTitle }}</view>
            </view>
            <view v-if="!loadingKp && kpSearchResults.length === 0" class="empty-text" style="text-align: center; padding: 40px; color: #bfbfbf;">未找到相关考点</view>
          </scroll-view>
        </view>
        <view class="modal-footer">
          <view class="btn btn-default" @click="kpSelectorVisible = false">关闭</view>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed, watch } from 'vue';
import { transformContextString } from '@/utils/latex.js';

const instance = getCurrentInstance();
const api = instance.appContext.config.globalProperties.$api.adminApi;

// 滚动联动相关
const leftDetailList = ref(null);
const rightDetailList = ref(null);
let isScrolling = false;

// 基础选项定义
const subjectOptions = ref([]);

const fetchSubjects = async () => {
  try {
    const res = await api.getMathSubjects();
    if (res.code === 0) {
      subjectOptions.value = res.data.map(s => ({
        id: s.SubjectID,
        name: s.SubjectName
      }));
      
      // 同时更新导入用的科目列表
      importSubjects.value = res.data.map(s => ({
        id: s.SubjectID,
        name: s.SubjectName
      }));

      // 更新筛选用的科目列表
      subjectFilterOptions.value = [
        { label: '全部科目', value: '' },
        ...res.data.map(s => ({
          label: s.SubjectName,
          value: s.SubjectID
        }))
      ];
    }
  } catch (e) {
    console.error('Fetch subjects error:', e);
  }
};

const contentTypeOptions = [
  { label: '书籍', value: 'book' },
  { label: '模拟卷', value: 'mock_paper' },
  { label: '真题卷', value: 'real_paper' }
];

const busTypeOptions = ['题目详解', '考点', '疑难点', '一题多解', '答疑', '其他'];

const mathSymbols = [
  { label: '分数', code: '\\frac{ }{ }' },
  { label: '根号', code: '\\sqrt{ }' },
  { label: '乘号', code: '\\times ' },
  { label: '除号', code: '\\div ' },
  { label: '平方', code: '^{2}' },
  { label: '下标', code: '_{ }' },
  { label: '积分', code: '\\int_{ }^{ }' },
  { label: '定积分', code: '\\int_{a}^{b} ' },
  { label: '求和', code: '\\sum_{i=1}^{n} ' },
  { label: '极限', code: '\\lim_{x \\to \\infty} ' },
  { label: '向量', code: '\\vec{a}' },
  { label: '平均值', code: '\\overline{x}' },
  { label: '偏导', code: '\\partial ' },
  { label: '希腊α', code: '\\alpha ' },
  { label: '希腊β', code: '\\beta ' },
  { label: '希腊γ', code: '\\gamma ' },
  { label: '希腊δ', code: '\\delta ' },
  { label: '希腊ε', code: '\\epsilon ' },
  { label: '希腊θ', code: '\\theta ' },
  { label: '希腊λ', code: '\\lambda ' },
  { label: '希腊π', code: '\\pi ' },
  { label: '希腊σ', code: '\\sigma ' },
  { label: '希腊φ', code: '\\phi ' },
  { label: '希腊ω', code: '\\omega ' },
  { label: '希腊Δ', code: '\\Delta ' },
  { label: '无穷', code: '\\infty ' },
  { label: '大于等于', code: '\\geq ' },
  { label: '小于等于', code: '\\leq ' },
  { label: '不等于', code: '\\neq ' },
  { label: '约等于', code: '\\approx ' },
  { label: '属于', code: '\\in ' },
  { label: '不属于', code: '\\notin ' },
  { label: '子集', code: '\\subset ' },
  { label: '交集', code: '\\cap ' },
  { label: '并集', code: '\\cup ' },
  { label: '垂直', code: '\\perp ' },
  { label: '平行', code: '\\parallel ' },
  { label: '因为', code: '\\because ' },
  { label: '所以', code: '\\therefore ' }
];

const questionTypeOptions = ['单选题', '多选题', '填空题', '解答题'];
const kpTypeOptions = ['核心知识', '解题技巧', '常见陷阱', '基础概念', '拓展延伸'];
// 状态变量
const activeTab = ref('corrections'); // corrections, search, books, import

const handleExit = () => {
  uni.navigateTo({
    url: '/pages/math/math-bookshelf'
  });
};

// --- 题目导入相关变量 ---
const jsonTemplate = `{
  "subjectId": 11,
  "bookId": 1,
  "questions": [
    {
      "QuestionID": 10001,
      "QuestionText": "设 $f(x) = x^2$，求 $f'(x)$。",
      "QuestionType": "解答题",
      "OriginalAnswerText": "2x",
      "Difficulty": 0.3,
      "details": [
        {
          "BusType": "analysis",
          "Context": "根据导数定义，$f'(x) = 2x$。"
        }
      ],
      "knowledgePoints": [1, 2]
    }
  ]
}`;

const basicFileName = ref('');
const basicImportData = ref(null);
const mappingFileName = ref('');
const mappingData = ref(null);
const detailsFileName = ref('');
const detailsData = ref(null);
const importing = ref(false);
const importSubjects = ref([]);

const importConfig = reactive({
  versionInfo: '2026',
  contentType: 'book',
  subjectId: null,
  isNew: false
});

const displaySubjects = computed(() => {
  return importSubjects.value
    .filter(s => s && s.name && s.name !== '公共数学')
    .sort((a, b) => {
      const order = { '考研数学(一)': 1, '考研数学(二)': 2, '考研数学(三)': 3 };
      return (order[a.name] || 99) - (order[b.name] || 99);
    });
});

const mappingCount = computed(() => {
  if (!mappingData.value) return 0;
  if (Array.isArray(mappingData.value)) {
    return mappingData.value.reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0);
  }
  return 0;
});
// ----------------------
const statusIndex = ref(2);
const statusOptions = [
  { label: '待处理', value: '0' },
  { label: '已处理', value: '1' },
  { label: '全部反馈', value: '' }
];

const correctionTypeIndex = ref(0);
const correctionTypeOptions = [
  { label: '全部类型', value: '' },
  { label: '内容错误', value: '内容错误' },
  { label: '解析有误', value: '解析有误' },
  { label: '排版问题', value: '排版问题' },
  { label: '其他', value: '其他' }
];

const pageSizeOptions = [10, 20, 50, 100];

// 纠错列表分页
const correctionPage = ref(1);
const correctionPageSize = ref(20);
const correctionTotal = ref(0);
const correctionSortBy = ref('CreatedAt');
const correctionSortOrder = ref('DESC');
const correctionSortOptions = [
  { label: '提交时间(新→旧)', sortBy: 'CreatedAt', sortOrder: 'DESC' },
  { label: '提交时间(旧→新)', sortBy: 'CreatedAt', sortOrder: 'ASC' },
  { label: '修改时间(新→旧)', sortBy: 'UpdatedAt', sortOrder: 'DESC' },
  { label: '修改时间(旧→新)', sortBy: 'UpdatedAt', sortOrder: 'ASC' }
];

// 书籍列表分页
const bookPage = ref(1);
const bookPageSize = ref(20);
const bookTotal = ref(0);
const bookSortBy = ref('SortOrder');
const bookSortOrder = ref('ASC');
const bookSortOptions = [
  { label: '排序权重(小→大)', sortBy: 'SortOrder', sortOrder: 'ASC' },
  { label: '学习人数(多→少)', sortBy: 'LearnerCount', sortOrder: 'DESC' },
  { label: '创建时间(新→旧)', sortBy: 'CreationTimestamp', sortOrder: 'DESC' },
  { label: '书籍ID', sortBy: 'BookID', sortOrder: 'ASC' }
];

const searchKeyword = ref('');
const bookKeyword = ref('');
const bookFilterType = ref(''); // 空字符串表示全部
const bookCountType = ref(''); // CountType 过滤
const bookSubjectId = ref(''); // 科目过滤
const bookFilterOptions = [
  { label: '全部类型', value: '' },
  { label: '书籍', value: 'book' },
  { label: '模拟卷', value: 'mock_paper' },
  { label: '真题卷', value: 'real_paper' }
];
const countTypeOptions = [
  { label: '全部标签', value: '' },
  { label: '精选', value: 'curated' },
  { label: '基础', value: 'basic' },
  { label: '强化', value: 'enhanced' }
];
const subjectFilterOptions = ref([
  { label: '全部科目', value: '' }
]);
const corrections = ref([]);
const searchResults = ref([]);
const books = ref([]);
const loadingList = ref(false);
const loadingSearch = ref(false);
const loadingBooks = ref(false);
const loadingDetail = ref(false);
const saving = ref(false);
const isSidebarCollapsed = ref(false);
const isMathAssistantExpanded = ref(false);
const showManualAddForm = ref(false);
const manualAddBookId = ref(null);
const isEntryMathAssistantExpanded = ref(false);

const selectedQuestion = ref(null);
const selectedBook = ref(null);
const currentCorrection = ref(null);

const editingBookId = ref(null);
const editingQuestionId = ref(null);
const editingKpId = ref(null);

const entryBookId = ref(null);
const entryQuestions = ref([]);
const selectedEntryQuestion = ref(null);
const isEditingEntryQuestion = ref(false);

const difficultyOptions = [
  { label: '简单', value: 0.2 },
  { label: '较易', value: 0.4 },
  { label: '中等', value: 0.5 },
  { label: '较难', value: 0.7 },
  { label: '困难', value: 0.9 }
];

const entryForm = reactive({
  questionText: '',
  answerText: '',
  questionType: '',
  difficulty: 0.5,
  details: []
});

// 表单数据
const editForm = reactive({
  questionText: '',
  answerText: '',
  questionType: '',
  details: []
});

const bookEditForm = reactive({
  BookID: null,
  BookTitle: '',
  SubjectIDs: [], // 改为多选科目ID数组
  VersionInfo: '',
  LearnerCount: 0,
  StyleType: 'standard',
  IsNew: 0,
  OverlayBannerText: '',
  ThumbnailText: '',
  ContentType: 'book',
  CountType: '',
  SortOrder: 100,
  Description: '',
  BusinessLabel: '' // 新增业务标签字段
});

const lastFocusedField = ref({ type: '', index: -1 });

// 考点选择与编辑
const kpSelectorVisible = ref(false);
const kpSearchKeyword = ref('');
const kpSearchResults = ref([]);
const loadingKp = ref(false);
const loadingKpDetail = ref(false);
const currentEditingDetailIndex = ref(-1);
const kpSelectorTargetIndex = ref(-1);
const kpSelectorTargetForm = ref('edit');
const kpEditForm = reactive({
  KnowledgePointID: null,
  KPTitle: '',
  KPType: '',
  KPContent: '',
  KPNotes: ''
});

const getCountTypeLabel = (type) => {
  if (!type) return '-';
  const opt = countTypeOptions.find(o => o.value === type);
  return opt ? opt.label : type;
};

const getContentTypeLabel = (type) => {
  if (!type) return '-';
  const opt = contentTypeOptions.find(o => o.value === type);
  return opt ? opt.label : type;
};

const getCountTypeClass = (type) => {
  if (!type) return 'tag-default';
  const classMap = {
    'curated': 'tag-green',
    'basic': 'tag-blue',
    'enhanced': 'tag-purple',
    'real_paper': 'tag-cyan',
    'mock_paper': 'tag-orange'
  };
  return classMap[type] || 'tag-default';
};

const fetchCorrections = async () => {
  loadingList.value = true;
  try {
    const res = await api.getMathCorrections({
      status: statusOptions[statusIndex.value].value,
      type: correctionTypeOptions[correctionTypeIndex.value].value,
      page: correctionPage.value,
      pageSize: correctionPageSize.value,
      sortBy: correctionSortBy.value,
      sortOrder: correctionSortOrder.value
    });
    if (res.code === 0) {
      corrections.value = res.data.list;
      correctionTotal.value = res.data.total;
    }
  } catch (e) {
    uni.showToast({ title: '获取纠错列表失败', icon: 'none' });
  } finally {
    loadingList.value = false;
  }
};

const onCorrectionSortChange = (e) => {
  const opt = correctionSortOptions[e.detail.value];
  correctionSortBy.value = opt.sortBy;
  correctionSortOrder.value = opt.sortOrder;
  correctionPage.value = 1;
  fetchCorrections();
};

const onCorrectionTypeChange = (e) => {
  correctionTypeIndex.value = e.detail.value;
  correctionPage.value = 1;
  fetchCorrections();
};

const changeCorrectionPage = (delta) => {
  const newPage = correctionPage.value + delta;
  const maxPage = Math.ceil(correctionTotal.value / correctionPageSize.value);
  if (newPage < 1 || newPage > maxPage) return;
  correctionPage.value = newPage;
  fetchCorrections();
};

const onCorrectionPageSizeChange = (e) => {
  correctionPageSize.value = pageSizeOptions[e.detail.value];
  correctionPage.value = 1;
  fetchCorrections();
};

const fetchBooks = async () => {
  loadingBooks.value = true;
  try {
    const params = { 
      keyword: bookKeyword.value,
      contentType: bookFilterType.value,
      countType: bookCountType.value,
      subjectId: bookSubjectId.value,
      page: bookPage.value,
      pageSize: bookPageSize.value,
      sortBy: bookSortBy.value,
      sortOrder: bookSortOrder.value
    };
    console.log('Fetching books with params:', params);
    const res = await api.getMathBooks(params);
    console.log('Fetch books response:', res);
    if (res.code === 0) {
      books.value = res.data.list.map(book => {
        let subjectIds = [];
        if (Array.isArray(book.SubjectIDs)) {
          subjectIds = book.SubjectIDs;
        } else if (typeof book.SubjectIDs === 'string') {
          subjectIds = book.SubjectIDs.split(',').map(id => parseInt(id));
        }
        return {
          ...book,
          SubjectIDs: subjectIds
        };
      });
      bookTotal.value = res.data.total;
    }
  } catch (e) {
    console.error('Fetch books error:', e);
    uni.showToast({ title: '获取书籍失败', icon: 'none' });
  } finally {
    loadingBooks.value = false;
  }
};

const onBookSubjectFilterChange = (e) => {
  bookSubjectId.value = subjectFilterOptions[e.detail.value].value;
  bookPage.value = 1;
  fetchBooks();
};

const onBookSortChange = (e) => {
  const opt = bookSortOptions[e.detail.value];
  bookSortBy.value = opt.sortBy;
  bookSortOrder.value = opt.sortOrder;
  bookPage.value = 1;
  fetchBooks();
};

const changeBookPage = (delta) => {
  const newPage = bookPage.value + delta;
  const maxPage = Math.ceil(bookTotal.value / bookPageSize.value);
  if (newPage < 1 || newPage > maxPage) return;
  bookPage.value = newPage;
  fetchBooks();
};

const onBookPageSizeChange = (e) => {
  bookPageSize.value = pageSizeOptions[e.detail.value];
  bookPage.value = 1;
  fetchBooks();
};

const onStatusChange = (e) => {
  statusIndex.value = e.detail.value;
  correctionPage.value = 1;
  fetchCorrections();
};

const toggleBookSubject = (id) => {
  const index = bookEditForm.SubjectIDs.indexOf(id);
  if (index > -1) {
    bookEditForm.SubjectIDs.splice(index, 1);
  } else {
    bookEditForm.SubjectIDs.push(id);
  }
};

const onBookContentTypeChange = (e) => {
  bookEditForm.ContentType = contentTypeOptions[e.detail.value].value;
};

const onBookCountTypeChange = (e) => {
  bookEditForm.CountType = countTypeOptions[e.detail.value].value;
};

const openBookEdit = (book) => {
  if (editingBookId.value === book.BookID) {
    editingBookId.value = null;
    return;
  }
  editingBookId.value = book.BookID;
  Object.assign(bookEditForm, {
    ...book,
    IsNew: book.IsNew || 0,
    LearnerCount: book.LearnerCount || 0,
    SortOrder: book.SortOrder || 100
  });
};

const selectBook = (book) => {
  if (selectedBook.value?.BookID === book.BookID) {
    selectedBook.value = null;
    return;
  }
  selectedBook.value = book;
};

const addNewBook = () => {
  const newId = 'NEW_' + Date.now();
  editingBookId.value = newId;
  selectedBook.value = { BookID: newId };
  Object.assign(bookEditForm, {
    BookID: null,
    BookTitle: '',
    SubjectIDs: [1], // 默认选中数学一
    VersionInfo: '',
    LearnerCount: 0,
    StyleType: 'standard',
    IsNew: 1,
    OverlayBannerText: '',
    ThumbnailText: '',
    ContentType: 'book',
    CountType: '',
    SortOrder: 10,
    Description: '',
    BusinessLabel: ''
  });
};

const saveBookChanges = async () => {
  if (saving.value) return;
  
  // 表单验证
  if (!bookEditForm.BookTitle || bookEditForm.BookTitle.trim() === '') {
    uni.showToast({ title: '请输入书籍标题', icon: 'none' });
    return;
  }
  if (!bookEditForm.ContentType) {
    uni.showToast({ title: '请选择内容类型', icon: 'none' });
    return;
  }
  
  saving.value = true;
  uni.showLoading({ title: '保存中...' });
  try {
    let res;
    const submitData = {
      ...bookEditForm,
      SortOrder: parseInt(bookEditForm.SortOrder) || 100,
      LearnerCount: parseInt(bookEditForm.LearnerCount) || 0,
      IsNew: !!bookEditForm.IsNew ? 1 : 0
    };

    if (editingBookId.value && editingBookId.value.toString().startsWith('NEW_')) {
      res = await api.createMathBook(submitData);
    } else {
      res = await api.updateMathBook(submitData.BookID, submitData);
    }
    
    if (res.code === 0) {
      uni.showToast({ title: '保存成功', icon: 'success' });
      editingBookId.value = null;
      selectedBook.value = null; 
      fetchBooks();
    } else {
      uni.showToast({ title: res.message || '保存失败', icon: 'none' });
    }
  } catch (e) {
    console.error('保存书籍失败:', e);
    uni.showToast({ title: '保存出错', icon: 'none' });
  } finally {
    uni.hideLoading();
    saving.value = false;
  }
};

const deleteBook = async (book) => {
  const targetBook = book || selectedBook.value;
  if (!targetBook) return;
  
  uni.showModal({
    title: '确认删除',
    content: `确定要永久删除书籍/试卷 (ID: ${targetBook.BookID}) 吗？此操作将同时删除关联的题目链接和用户书架记录。`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const res = await api.deleteMathBook(targetBook.BookID);
          if (res.code === 0) {
            uni.showToast({ title: '已删除', icon: 'success' });
            editingBookId.value = null;
            selectedBook.value = null;
            fetchBooks();
          }
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};

const deleteQuestion = async (question) => {
  const targetQuestion = question || selectedQuestion.value;
  if (!targetQuestion) return;
  
  uni.showModal({
    title: '确认删除题目',
    content: `确定要永久删除题目 (ID: ${targetQuestion.QuestionID}) 吗？此操作不可撤销。`,
    success: async (res) => {
      if (res.confirm) {
        try {
          // 假设 api.deleteMathQuestion 存在，如果不存在则需要先定义
          const res = await api.deleteMathQuestion(targetQuestion.QuestionID);
          if (res.code === 0) {
            uni.showToast({ title: '已删除', icon: 'success' });
            editingQuestionId.value = null;
            selectedQuestion.value = null;
            if (activeTab.value === 'search') {
              handleSearch();
            } else {
              fetchCorrections();
            }
          } else {
            uni.showToast({ title: res.message || '删除失败', icon: 'none' });
          }
        } catch (e) {
          console.error('删除题目失败:', e);
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};

const handleSearch = async () => {
  if (!searchKeyword.value) return;
  loadingSearch.value = true;
  try {
    const res = await api.searchMathQuestions({ keyword: searchKeyword.value });
    if (res.code === 0) {
      searchResults.value = res.data;
    }
  } catch (e) {
    uni.showToast({ title: '搜索失败', icon: 'none' });
  } finally {
    loadingSearch.value = false;
  }
};

const selectCorrection = async (correction) => {
  if (editingQuestionId.value === correction.QuestionID && currentCorrection.value?.id === correction.id) {
    // 再次点击已选中的行，收起编辑区
    editingQuestionId.value = null;
    currentCorrection.value = null;
    selectedQuestion.value = null;
    return;
  }
  currentCorrection.value = correction;
  editingQuestionId.value = correction.QuestionID;
  await loadQuestionDetail(correction.QuestionID);
};

const selectFromSearch = async (record) => {
  if (editingQuestionId.value === record.QuestionID && !currentCorrection.value) {
    // 再次点击已选中的行，收起编辑区
    editingQuestionId.value = null;
    selectedQuestion.value = null;
    return;
  }
  currentCorrection.value = null;
  editingQuestionId.value = record.QuestionID;
  await loadQuestionDetail(record.QuestionID);
};

const loadQuestionDetail = async (questionId) => {
  uni.showLoading({ title: '加载中...' });
  loadingDetail.value = true;
  try {
    const res = await api.getMathQuestionDetail(questionId);
    if (res.code === 0) {
      selectedQuestion.value = res.data.question;
      editForm.questionText = res.data.question.QuestionText;
      editForm.answerText = res.data.question.AnswerText || '';
      editForm.questionType = res.data.question.QuestionType || '';
      editForm.details = (res.data.details || []).map(d => ({ ...d, _expanded: false }));
    }
  } catch (e) {
    uni.showToast({ title: '加载详情失败', icon: 'none' });
  } finally {
    uni.hideLoading();
    loadingDetail.value = false;
  }
};

const renderLatex = (text) => {
  return transformContextString(text);
};

const stripHtml = (html) => {
  if (!html) return '';
  // 移除HTML标签，但保留一些空格和换行
  let text = html.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<p>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');
  // 压缩空白
  text = text.replace(/\s+/g, ' ').trim();
  return text;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  const date = new Date(timeStr);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const h = date.getHours().toString().padStart(2, '0');
  const i = date.getMinutes().toString().padStart(2, '0');
  return `${m}-${d} ${h}:${i}`;
};

const getBusTypeClass = (type) => {
  const map = {
    '题目详解': 'blue',
    '考点': 'orange',
    '疑难点': 'red',
    '一题多解': 'green'
  };
  return map[type] || 'default';
};

const toggleDetail = (index) => {
  // 切换当前卡片的展开/关闭状态
  editForm.details[index]._expanded = !editForm.details[index]._expanded;
};

const addDetail = () => {
  uni.showActionSheet({
    itemList: busTypeOptions,
    success: (res) => {
      const selectedType = busTypeOptions[res.tapIndex];
      const tmpId = Date.now() + Math.random();
      const newDetail = {
        _tmpId: tmpId,
        BusType: selectedType,
        Title: selectedType === '考点' ? '' : selectedType,
        Context: '',
        Notes: '',
        Give: 0, 
        LinkedKnowledgePointID: null,
        _expanded: true // 新增的卡片默认展开以便编辑，但如果用户坚持默认关闭，我可以改为false
      };
      editForm.details.push(newDetail);
      sortDetails();
      
      // 自动跳转到新加的卡片
      setTimeout(() => {
        const query = uni.createSelectorQuery().in(instance);
        query.select(`.detail-card[data-tmpid="${tmpId}"]`).boundingClientRect(data => {
          if (data) {
            const container = uni.createSelectorQuery().in(instance).select('.content');
            container.fields({ scrollOffset: true, rect: true }, (containerData) => {
              if (containerData) {
                // 计算在 .content 容器内的滚动位置
                const targetScrollTop = containerData.scrollTop + data.top - containerData.top - 100;
                // 由于 .content 是通过 CSS overflow-y: auto 实现滚动的，我们直接设置 scrollTop
                // 在 Vue 中可以通过 ref 获取元素并设置 scrollTop
                const contentEl = document.querySelector('.content');
                if (contentEl) {
                  contentEl.scrollTo({
                    top: targetScrollTop,
                    behavior: 'smooth'
                  });
                }
              }
            }).exec();
          }
        }).exec();
      }, 100);
    }
  });
};

const sortDetails = () => {
  const typeOrder = {
    '题目详解': 0,
    '一题多解': 1,
    '其他': 2,
    '答疑': 3,
    '考点': 4
  };
  
  editForm.details.sort((a, b) => {
    const orderA = typeOrder[a.BusType] ?? 99;
    const orderB = typeOrder[b.BusType] ?? 99;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    // 类型相同时按 Give 权重排序
    return (a.Give || 0) - (b.Give || 0);
  });

  // 排序后重新分配 Give，保证数据库保存后的顺序与当前一致
  editForm.details.forEach((d, i) => {
    d.Give = i * 10;
  });
};

const moveDetail = (index, delta) => {
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= editForm.details.length) return;
  
  // 交换位置
  const temp = editForm.details[index];
  editForm.details[index] = editForm.details[newIndex];
  editForm.details[newIndex] = temp;
  
  // 重新分配 Give 权重 (确保保存后顺序正确)
  editForm.details.forEach((d, i) => {
    d.Give = i * 10;
  });
};

const removeDetail = (index) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条详情卡片吗？',
    success: (res) => {
      if (res.confirm) {
        editForm.details.splice(index, 1);
      }
    }
  });
};

const insertSymbol = (code) => {
  const { type, index } = lastFocusedField.value;
  if (type === 'questionText') {
    editForm.questionText += code;
  } else if (type === 'answerText') {
    editForm.answerText += code;
  } else if (type === 'detailContext' && index !== -1) {
    editForm.details[index].Context += code;
  } else if (type === 'detailNotes' && index !== -1) {
    editForm.details[index].Notes += code;
  } else if (type === 'kpContent') {
    kpEditForm.KPContent += code;
  } else if (type === 'kpNotes') {
    kpEditForm.KPNotes += code;
  } else {
    // 默认插入到题干
    editForm.questionText += code;
  }
};

const saveChanges = async () => {
  if (saving.value) return;
  saving.value = true;
  uni.showLoading({ title: '保存中...' });
  try {
    const data = {
      questionText: editForm.questionText,
      answerText: editForm.answerText,
      questionType: editForm.questionType,
      details: editForm.details.map(d => {
        const { _expanded, _tmpId, ...rest } = d;
        return rest;
      }),
      correctionId: currentCorrection.value ? currentCorrection.value.id : null,
      updaterName: '管理员'
    };
    const res = await api.updateMathQuestion(selectedQuestion.value.QuestionID, data);
    if (res.code === 0) {
      uni.showToast({ title: '保存成功', icon: 'success' });
      // 重新加载当前题目详情以同步最新数据（如自增ID）
      await loadQuestionDetail(selectedQuestion.value.QuestionID);
      if (currentCorrection.value) {
        fetchCorrections();
      }
    } else {
      uni.showToast({ title: res.message || '保存失败', icon: 'none' });
    }
  } catch (e) {
    uni.showToast({ title: '保存出错', icon: 'none' });
  } finally {
    uni.hideLoading();
    saving.value = false;
  }
};

const openManualAddQuestion = () => {
  showManualAddForm.value = true;
  editForm.questionText = '';
  editForm.answerText = '';
  editForm.questionType = '';
  editForm.details = [];
  manualAddBookId.value = null;
  if (books.value.length > 0) {
    manualAddBookId.value = books.value[0].BookID;
  }
};

const closeManualAddForm = () => {
  showManualAddForm.value = false;
  editForm.questionText = '';
  editForm.answerText = '';
  editForm.questionType = '';
  editForm.details = [];
  manualAddBookId.value = null;
};

const onManualBookChange = (e) => {
  manualAddBookId.value = books.value[e.detail.value].BookID;
};

const saveManualQuestion = async () => {
  if (saving.value) return;
  
  if (!editForm.questionText || editForm.questionText.trim() === '') {
    uni.showToast({ title: '请输入题干内容', icon: 'none' });
    return;
  }
  if (!manualAddBookId.value) {
    uni.showToast({ title: '请选择所属书籍', icon: 'none' });
    return;
  }
  
  saving.value = true;
  uni.showLoading({ title: '保存中...' });
  try {
    const data = {
      questionText: editForm.questionText,
      answerText: editForm.answerText,
      questionType: editForm.questionType,
      details: editForm.details.map(d => {
        const { _expanded, _tmpId, ...rest } = d;
        return rest;
      }),
      bookId: manualAddBookId.value
    };
    const res = await api.createMathQuestion(data);
    if (res.code === 0) {
      uni.showToast({ title: '保存成功', icon: 'success' });
      closeManualAddForm();
    } else {
      uni.showToast({ title: res.message || '保存失败', icon: 'none' });
    }
  } catch (e) {
    console.error('保存题目失败:', e);
    uni.showToast({ title: '保存出错', icon: 'none' });
  } finally {
    uni.hideLoading();
    saving.value = false;
  }
};

const getSubjectNames = (subjectIds) => {
  if (!subjectIds || subjectIds.length === 0) return '-';
  const names = subjectIds.map(id => {
    const subject = subjectOptions.value.find(s => s.id === id);
    return subject ? subject.name : id;
  });
  return names.join(', ');
};

const onEntryBookChange = (e) => {
  entryBookId.value = books.value[e.detail.value].BookID;
  selectedBook.value = books.value[e.detail.value];
  loadEntryQuestions();
  clearEntryQuestion();
};

const loadEntryQuestions = async () => {
  if (!entryBookId.value) return;
  try {
    const res = await api.getBookQuestions(entryBookId.value);
    if (res.code === 0) {
      entryQuestions.value = res.data || [];
    }
  } catch (e) {
    console.error('加载已录入题目失败:', e);
  }
};

const selectEntryQuestion = (question) => {
  selectedEntryQuestion.value = question;
  isEditingEntryQuestion.value = true;
  entryForm.questionText = question.QuestionText || '';
  entryForm.answerText = question.OriginalAnswerText || '';
  entryForm.questionType = question.QuestionType || '';
  entryForm.difficulty = question.Difficulty || 0.5;
  entryForm.details = question.details || [];
};

const editEntryQuestion = (question) => {
  selectEntryQuestion(question);
};

const deleteEntryQuestion = async (question) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这道题目吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const deleteRes = await api.deleteMathQuestion(question.QuestionID);
          if (deleteRes.code === 0) {
            uni.showToast({ title: '删除成功', icon: 'success' });
            loadEntryQuestions();
            if (selectedEntryQuestion.value?.QuestionID === question.QuestionID) {
              clearEntryQuestion();
            }
          } else {
            uni.showToast({ title: deleteRes.message || '删除失败', icon: 'none' });
          }
        } catch (e) {
          console.error('删除题目失败:', e);
          uni.showToast({ title: '删除出错', icon: 'none' });
        }
      }
    }
  });
};

const clearEntryQuestion = () => {
  selectedEntryQuestion.value = null;
  isEditingEntryQuestion.value = false;
  entryForm.questionText = '';
  entryForm.answerText = '';
  entryForm.questionType = '';
  entryForm.difficulty = 0.5;
  entryForm.details = [];
};

const resetEntryForm = () => {
  entryBookId.value = null;
  selectedBook.value = null;
  entryQuestions.value = [];
  clearEntryQuestion();
};

const onEntryQuestionTypeChange = (e) => {
  entryForm.questionType = questionTypeOptions[e.detail.value];
};

const onEntryDifficultyChange = (e) => {
  entryForm.difficulty = difficultyOptions[e.detail.value].value;
};

const addEntryDetail = () => {
  entryForm.details.push({
    BusType: '题目详解',
    Title: '',
    Context: '',
    Notes: '',
    JsonData: null,
    LinkedKnowledgePointID: null,
    Give: 0,
    _expanded: true,
    _tmpId: Date.now() + Math.random()
  });
};

const toggleEntryDetail = (index) => {
  entryForm.details[index]._expanded = !entryForm.details[index]._expanded;
};

const moveEntryDetail = (index, direction) => {
  const newIndex = index + direction;
  if (newIndex >= 0 && newIndex < entryForm.details.length) {
    const temp = entryForm.details[index];
    entryForm.details[index] = entryForm.details[newIndex];
    entryForm.details[newIndex] = temp;
  }
};

const removeEntryDetail = (index) => {
  entryForm.details.splice(index, 1);
};

const sortEntryDetails = () => {
  entryForm.details.sort((a, b) => (a.Give || 0) - (b.Give || 0));
};

const pullKpContentForEntry = async (index) => {
  const detail = entryForm.details[index];
  if (!detail.LinkedKnowledgePointID) return;
  
  try {
    const res = await api.getMathKnowledgePoint(detail.LinkedKnowledgePointID);
    if (res.code === 0 && res.data) {
      detail.Context = res.data.KPContent || detail.Context;
      detail.Notes = res.data.KPNotes || detail.Notes;
      detail.Title = res.data.KPTitle || detail.Title;
    }
  } catch (e) {
    console.error('拉取考点内容失败:', e);
  }
};

const openKpSelectorForEntry = (index) => {
  kpSelectorVisible.value = true;
  kpSelectorTargetIndex.value = index;
  kpSelectorTargetForm.value = 'entry';
};

const insertSymbolForEntry = (code) => {
  if (!lastFocusedField.value) return;
  
  if (lastFocusedField.value.type === 'questionText') {
    entryForm.questionText += code;
  } else if (lastFocusedField.value.type === 'answerText') {
    entryForm.answerText += code;
  } else if (lastFocusedField.value.type === 'detailContext') {
    entryForm.details[lastFocusedField.value.index].Context += code;
  } else if (lastFocusedField.value.type === 'detailNotes') {
    entryForm.details[lastFocusedField.value.index].Notes += code;
  }
};

const saveEntryQuestion = async () => {
  if (saving.value) return;
  
  if (!entryForm.questionText || entryForm.questionText.trim() === '') {
    uni.showToast({ title: '请输入题干内容', icon: 'none' });
    return;
  }
  if (!entryBookId.value) {
    uni.showToast({ title: '请选择书籍', icon: 'none' });
    return;
  }
  
  saving.value = true;
  uni.showLoading({ title: '保存中...' });
  try {
    const data = {
      questionText: entryForm.questionText,
      answerText: entryForm.answerText,
      questionType: entryForm.questionType,
      difficulty: entryForm.difficulty,
      details: entryForm.details.map(d => {
        const { _expanded, _tmpId, ...rest } = d;
        return rest;
      }),
      bookId: entryBookId.value
    };
    
    let res;
    if (isEditingEntryQuestion.value && selectedEntryQuestion.value) {
      res = await api.updateMathQuestion(selectedEntryQuestion.value.QuestionID, data);
    } else {
      res = await api.createMathQuestion(data);
    }
    
    if (res.code === 0) {
      uni.showToast({ title: isEditingEntryQuestion.value ? '更新成功' : '保存成功', icon: 'success' });
      clearEntryQuestion();
      loadEntryQuestions();
    } else {
      uni.showToast({ title: res.message || '保存失败', icon: 'none' });
    }
  } catch (e) {
    console.error('保存题目失败:', e);
    uni.showToast({ title: '保存出错', icon: 'none' });
  } finally {
    uni.hideLoading();
    saving.value = false;
  }
};

const ignoreCurrent = async () => {
  if (!currentCorrection.value) return;
  uni.showModal({
    title: '确认忽略',
    content: '确定要忽略这条反馈吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const ignoreRes = await api.ignoreMathCorrection(currentCorrection.value.id);
          if (ignoreRes.code === 0) {
            uni.showToast({ title: '已忽略', icon: 'success' });
            fetchCorrections();
            selectedQuestion.value = null;
            currentCorrection.value = null;
          }
        } catch (e) {
          uni.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    }
  });
};

const openKpSelector = (index) => {
  currentEditingDetailIndex.value = index;
  kpSelectorVisible.value = true;
};

const handleKpSearch = async () => {
  if (!kpSearchKeyword.value) return;
  loadingKp.value = true;
  try {
    const res = await api.searchKnowledgePoints({ keyword: kpSearchKeyword.value });
    if (res.code === 0) {
      kpSearchResults.value = res.data;
    }
  } catch (e) {
    uni.showToast({ title: '搜索考点失败', icon: 'none' });
  } finally {
    loadingKp.value = false;
  }
};

const selectKp = (record) => {
  if (kpSelectorTargetForm.value === 'entry') {
    entryForm.details[kpSelectorTargetIndex.value].LinkedKnowledgePointID = record.KnowledgePointID;
  } else {
    editForm.details[currentEditingDetailIndex.value].LinkedKnowledgePointID = record.KnowledgePointID;
  }
  kpSelectorVisible.value = false;
};

const pullKpContent = async (index) => {
  const kpId = editForm.details[index].LinkedKnowledgePointID;
  if (!kpId) return;
  try {
    const res = await api.getKnowledgePointDetail(kpId);
    if (res.code === 0) {
      editForm.details[index].Context = res.data.KPContent;
      editForm.details[index].Title = res.data.KPTitle;
      uni.showToast({ title: '内容已同步', icon: 'success' });
    }
  } catch (e) {
    uni.showToast({ title: '拉取失败', icon: 'none' });
  }
};

const editLinkedKp = async (kpId) => {
  loadingKpDetail.value = true;
  try {
    const res = await api.getKnowledgePointDetail(kpId);
    if (res.code === 0) {
      Object.assign(kpEditForm, res.data);
    }
  } catch (e) {
    uni.showToast({ title: '加载考点详情失败', icon: 'none' });
  } finally {
    loadingKpDetail.value = false;
  }
};

const saveKpChanges = async () => {
  try {
    const res = await api.updateKnowledgePoint(kpEditForm.KnowledgePointID, kpEditForm);
    if (res.code === 0) {
      uni.showToast({ title: '考点修改成功', icon: 'success' });
      // 同步更新当前正在编辑的题目详情卡片中的内容
      editForm.details.forEach(detail => {
        if (detail.LinkedKnowledgePointID === kpEditForm.KnowledgePointID) {
          detail.Context = kpEditForm.KPContent;
          detail.Title = kpEditForm.KPTitle;
        }
      });
    }
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' });
  }
};

const onImportContentTypeChange = (e) => {
  importConfig.contentType = contentTypeOptions[e.detail.value].value;
};

const onImportSubjectChange = (e) => {
  importConfig.subjectId = displaySubjects.value[e.detail.value].id;
};

const chooseFile = (type) => {
  // #ifdef H5
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (type === 'basic') {
            basicFileName.value = file.name;
            basicImportData.value = data;
          } else if (type === 'mapping') {
            mappingFileName.value = file.name;
            mappingData.value = data;
          } else if (type === 'details') {
            detailsFileName.value = file.name;
            detailsData.value = data;
          }
        } catch (error) {
          uni.showModal({ title: '解析失败', content: error.message, showCancel: false });
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
  // #endif
};

const copyTemplate = () => {
  uni.setClipboardData({
    data: jsonTemplate,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
    }
  });
};

const clearComplex = () => {
  mappingFileName.value = '';
  mappingData.value = null;
  detailsFileName.value = '';
  detailsData.value = null;
};

const startBasicImport = async () => {
  if (!basicImportData.value) return;
  importing.value = true;
  try {
    const res = await api.importMathQuestions(basicImportData.value);
    uni.showModal({
      title: '导入结果',
      content: `成功导入 ${res.data.successCount} 题，失败 ${res.data.failCount} 题`,
      showCancel: false
    });
  } catch (error) {
    uni.showToast({ title: '导入失败', icon: 'none' });
  } finally {
    importing.value = false;
  }
};

const startMappingImport = async () => {
  if (!mappingData.value) return;
  importing.value = true;
  try {
    const res = await api.importMathComplexQuestions({
      mapping: mappingData.value,
      config: importConfig
    });
    uni.showToast({ title: `映射导入成功: ${res.data.mappingCount} 条` });
  } catch (error) {
    uni.showToast({ title: '映射导入失败', icon: 'none' });
  } finally {
    importing.value = false;
  }
};

const startDetailsImport = async () => {
  if (!detailsData.value) return;
  importing.value = true;
  try {
    const res = await api.importMathComplexQuestions({
      details: detailsData.value,
      config: importConfig
    });
    uni.showToast({ title: `详情导入成功: ${res.data.detailsCount} 条` });
  } catch (error) {
    uni.showToast({ title: '详情导入失败', icon: 'none' });
  } finally {
    importing.value = false;
  }
};

const startComplexImport = async () => {
  if (!mappingData.value || !detailsData.value) return;
  importing.value = true;
  try {
    const res = await api.importMathComplexQuestions({
      mapping: mappingData.value,
      details: detailsData.value,
      config: importConfig
    });
    uni.showModal({
      title: '复合导入结果',
      content: `映射: ${res.data.mappingCount}, 详情: ${res.data.detailsCount}`,
      showCancel: false
    });
  } catch (error) {
    uni.showToast({ title: '复合导入失败', icon: 'none' });
  } finally {
    importing.value = false;
  }
};

onMounted(() => {
  fetchSubjects();
  fetchBooks();
  fetchCorrections();
  
  // 添加滚动联动事件监听器
  setTimeout(() => {
    // 获取详情列表元素
    const leftElement = document.querySelector('.details-left .detail-list');
    const rightElement = document.querySelector('.details-right .detail-list');
    
    if (leftElement && rightElement) {
      // 左侧滚动时同步右侧
      leftElement.addEventListener('scroll', (e) => {
        if (!isScrolling) {
          isScrolling = true;
          rightElement.scrollTop = e.target.scrollTop;
          setTimeout(() => {
            isScrolling = false;
          }, 50);
        }
      });
      
      // 右侧滚动时同步左侧
      rightElement.addEventListener('scroll', (e) => {
        if (!isScrolling) {
          isScrolling = true;
          leftElement.scrollTop = e.target.scrollTop;
          setTimeout(() => {
            isScrolling = false;
          }, 50);
        }
      });
    }
  }, 500);
});
</script>

<style scoped>
/* 基础容器 */
.admin-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  color: #262626;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 不同内容区域的样式区分 */
.form-card {
  border-radius: 8px;
  padding: 8px 5px;
  margin-bottom: 8px;
}

.question-section {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.answer-section {
  background-color: #f0f8ff;
  border: 1px solid #b8daff;
}

.preview-question {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.preview-answer {
  background-color: #f0f8ff;
  border: 1px solid #b8daff;
}

.details-section {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 5px 5px;
  margin-bottom: 5px;
}

.detail-card {
  border-radius: 6px;
  margin-bottom: 5px;
  padding: 0 5px;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 不同类型卡片的背景色 */
.detail-card[data-type="题目详解"] {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
}

.detail-card[data-type="考点"] {
  background-color: #fff7e6;
  border: 1px solid #ffd591;
}

.detail-card[data-type="疑难点"] {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
}

.detail-card[data-type="一题多解"] {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
}

.detail-card[data-type="答疑"] {
  background-color: #f9f0ff;
  border: 1px solid #d3adf7;
}

.detail-card[data-type="其他"] {
  background-color: #ffffff;
  border: 1px solid #dee2e6;
}

.detail-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.detail-card-header {
  padding: 5px 5px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 不同类型卡片的头部背景色 */
.detail-card[data-type="题目详解"] .detail-card-header {
  background-color: #bae7ff;
}

.detail-card[data-type="考点"] .detail-card-header {
  background-color: #ffd691;
}

.detail-card[data-type="疑难点"] .detail-card-header {
  background-color: #ffccc7;
}

.detail-card[data-type="一题多解"] .detail-card-header {
  background-color: #b7eb8f;
}

.detail-card[data-type="答疑"] .detail-card-header {
  background-color: #d3adf7;
}

.detail-card[data-type="其他"] .detail-card-header {
  background-color: #f8f9fa;
}

.math-assistant {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px;
  margin-top: 16px;
}

.section-title {
  background-color: #e9ecef;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 12px;
  font-weight: 600;
}

/* 响应式布局 */
.content-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 5px;
  padding: 5px 5px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-width: 100%;
  box-sizing: border-box;
}

/* 当屏幕宽度大于高度时，使用左右布局 */
@media (min-aspect-ratio: 1/1) {
  .content-container {
    flex-direction: row;
    gap: 5px;
  }
  
  .editor-section,
  .preview-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }
  
  /* 确保题干和答案部分一一对应高度 */
  .question-section,
  .preview-question {
    min-height: 180px;
  }
  
  .answer-section,
  .preview-answer {
    min-height: 140px;
  }
}

/* 编辑区域样式 */
.editor-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* 预览区域样式 */
.preview-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* 确保编辑区和预览区的表单元素高度一致 */
.question-section,
.preview-question,
.answer-section,
.preview-answer {
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: 100%;
}

/* 确保textarea和预览框高度一致 */
.form-textarea {
  min-height: 100px;
  padding: 5px 5px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  background-color: #ffffff;
  box-sizing: border-box;
}

.form-textarea:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.latex-preview {
  min-height: 100px;
  padding: 5px 5px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background-color: #fafafa;
  font-size: 14px;
  line-height: 1.6;
  overflow-y: auto;
  box-sizing: border-box;
}

/* 题目详情部分的布局 */
.details-container {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 5px;
  padding: 5px 5px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-width: 100%;
  box-sizing: border-box;
}

@media (min-aspect-ratio: 1/1) {
  .details-container {
    flex-direction: row;
    gap: 5px;
  }
  
  .details-left,
  .details-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    height: 100%;
  }
  
  .details-section {
    flex: 1;
    min-height: 400px;
    margin-bottom: 0;
    display: flex;
    flex-direction: column;
    padding: 5px 5px;
  }
  
  .detail-list {
    flex: 1;
    overflow-y: auto;
    min-height: 300px;
  }
}

/* 预览区域的样式已在form-card中定义 */

/* 背景色样式已在form-card中定义 */

/* LaTeX预览区域样式已在上文中定义 */

/* 表单项目样式 */
.form-item {
  margin-bottom: 5px;
  padding: 0 5px;
}

.form-item.w-120px {
  width: 120px;
}

.form-item.w-200px {
  width: 200px;
}

.form-item.w-80px {
  width: 80px;
}

.form-item.w-100 {
  width: 100%;
}

/* 表单标签样式 */
.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 6px;
  display: block;
  padding: 0 5px;
}

.small-label {
  font-size: 12px;
  font-weight: 500;
  color: #595959;
  margin-bottom: 3px;
  display: block;
  padding: 0 5px;
}

/* 顶部导航栏 */
.admin-header {
  height: 40px;
  background: #001529;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sider-toggle {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.sider-toggle:hover {
  background: rgba(255,255,255,0.2);
}

.toggle-icon {
  color: #fff;
  font-size: 16px;
}

.admin-logo {
  font-size: 20px;
  font-weight: bold;
  color: #1890ff;
  letter-spacing: 1px;
}

.admin-title {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  opacity: 0.9;
}

.admin-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name {
  color: rgba(255,255,255,0.85);
  font-size: 14px;
}

.logout-btn {
  color: rgba(255,255,255,0.45);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.3s;
}

.logout-btn:hover {
  color: #ff4d4f;
}

/* 布局外层 */
.layout-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
}

/* 左侧导航菜单 */
.sider {
  width: 200px;
  background: #001529;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.sider.collapsed {
  width: 64px;
}

.sider.collapsed .nav-item {
  padding: 0;
  justify-content: center;
  gap: 0;
}

.sider.collapsed .nav-icon {
  font-size: 18px;
}

.nav-menu {
  padding: 16px 0;
  flex: 1;
}

.nav-item {
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: rgba(255,255,255,0.65);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  gap: 12px;
}

.nav-item:hover {
  color: #fff;
}

.nav-item.active {
  color: #fff;
  background-color: #1890ff;
}

.nav-icon {
  font-size: 16px;
}

.nav-text {
  font-size: 14px;
}

.nav-badge {
  position: absolute;
  right: 16px;
  background: #ff4d4f;
  color: #fff;
  font-size: 11px;
  padding: 0 6px;
  border-radius: 10px;
  height: 18px;
  line-height: 18px;
  min-width: 18px;
  text-align: center;
}

.sider-footer {
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-label {
  color: rgba(255,255,255,0.45);
  font-size: 12px;
}

.stats-value {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

/* 中间列表区域 */
.main-list {
  flex: 1;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.h2 {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 筛选卡片美化 */
.filter-card {
  padding: 6px 10px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}

.filter-row {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-row .search-input {
  flex: 0 0 220px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.filter-label-inline {
  font-size: 13px;
  color: #595959;
  font-weight: 500;
  white-space: nowrap;
}

.picker-val {
  height: 28px;
  line-height: 26px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 0 24px 0 10px;
  font-size: 12px;
  white-space: nowrap;
  position: relative;
  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  cursor: pointer;
  min-width: 80px;
  color: #262626;
}

.picker-val:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.picker-val:active {
  background: #f5f5f5;
}

.picker-val::after {
  content: '';
  position: absolute;
  right: 10px;
  top: 50%;
  margin-top: -2px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid #bfbfbf;
  transition: all 0.2s;
}

.search-input {
  height: 28px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 0 10px;
  font-size: 13px;
  width: 100%;
  transition: all 0.2s;
}

.search-input:hover {
  border-color: #40a9ff;
}

.search-input:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.search-btn, .refresh-btn, .add-btn-main {
  height: 26px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  border: 1px solid transparent;
}

.search-btn, .refresh-btn {
  background: #fff;
  border: 1px solid #d9d9d9;
  color: #595959;
}

.search-btn:hover, .refresh-btn:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.search-btn:active, .refresh-btn:active {
  background: #f5f5f5;
}

.add-btn-main {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.add-btn-main:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.add-btn-main:active {
  background: #096dd9;
  border-color: #096dd9;
}

.add-btn-main:hover {
  background: #40a9ff;
}

/* 表格样式优化 */
.table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
  margin: 0 12px 12px;
}

.table-scroll-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-x: hidden;
}

.table-header, .tr {
  width: 100%;
}

.table-body-wrapper {
  flex: 1;
  height: 0;
}

.table-footer {
  padding: 6px 16px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 26px;
}

.page-info {
  font-size: 12px;
  color: #595959;
  margin-right: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.page-btns {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-btn {
  height: 26px;
  width: 26px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  color: rgba(0, 0, 0, 0.65);
  user-select: none;
}

.page-arrow {
  font-size: 12px;
  line-height: 1;
}

.page-btn:hover:not(.disabled) {
  color: #1890ff;
  border-color: #1890ff;
}

.page-btn.disabled {
  color: rgba(0, 0, 0, 0.25);
  background: #f5f5f5;
  border-color: #d9d9d9;
  cursor: not-allowed;
}

.page-num {
  height: 26px;
  min-width: 26px;
  padding: 0 4px;
  font-size: 12px;
  font-weight: 500;
  color: #1890ff;
  border: 1px solid #1890ff;
  background: #fff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-size-container {
  margin-left: 4px;
}

.page-size-picker {
  height: 26px;
  line-height: 24px;
  padding: 0 20px 0 8px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
  min-width: 60px;
}

.page-size-picker:hover {
  border-color: #40a9ff;
}

.page-size-picker::after {
  content: '';
  position: absolute;
  right: 8px;
  top: 50%;
  margin-top: -1px;
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
  border-top: 4px solid rgba(0, 0, 0, 0.25);
}

.table-header {
  display: flex;
  background: #fbfbfb;
  border-bottom: 1px solid #eeeeee;
  height: 28px;
  flex-wrap: nowrap;
}

.table-body {
  flex: 1;
  height: 0;
  overflow: hidden;
}

.list-scroll {
  height: 100%;
}

.th {
  font-weight: 400;
}

.tr {
  display: flex;
  border-bottom: 1px solid #f5f5f5;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  height: 30px;
  min-width: 0;
  width: 100%;
  flex-wrap: nowrap;
}

.tr:hover {
  background-color: #f9f9f9;
  transform: translateZ(0);
}

.tr.selected {
  background-color: #f0f7ff !important;
  border-left: 2px solid #1890ff;
}

.th, .td {
  padding: 0 8px;
  font-size: 12px;
  color: #262626;
  display: flex;
  align-items: center;
  overflow: hidden;
  height: 100%;
  box-sizing: border-box;
  white-space: nowrap;
  flex-shrink: 0;
}

.editing-row {
  background-color: #f0f5ff;
  border-left: 3px solid #1890ff;
}

/* 题目导入样式 */
.subject-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.subject-tag {
  background: #f0f7ff;
  color: #1890ff;
  font-size: 10px;
  padding: 0 4px;
  border-radius: 2px;
  border: 1px solid #bae7ff;
  white-space: nowrap;
}

.subject-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0;
}

.subject-checkbox-item {
  padding: 4px 12px;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.subject-checkbox-item.active {
  background: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
}

.import-layout {
  height: calc(100vh - 120px);
  padding: 12px;
  display: flex;
  justify-content: center;
}

.import-left {
  width: 100%;
  max-width: 800px;
  overflow-y: auto;
}

.import-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #f0f0f0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #262626;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background: #1890ff;
  border-radius: 2px;
}

.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #1890ff;
  background: #f0f7ff;
}

.upload-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: #262626;
  text-align: center;
}

.upload-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.upload-half {
  flex: 1;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  background: #fafafa;
  transition: all 0.3s;
}

.upload-half:hover {
  border-color: #1890ff;
  background: #f0f7ff;
}

.upload-icon-small {
  font-size: 28px;
  margin-bottom: 8px;
}

.upload-text-small {
  font-size: 12px;
  color: #595959;
  text-align: center;
  word-break: break-all;
}

.import-config {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #f0f0f0;
}

.config-row {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.config-row:last-child {
  margin-bottom: 0;
}

.config-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-label {
  font-size: 13px;
  color: #595959;
  white-space: nowrap;
  width: 70px;
}

.config-input {
  flex: 1;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 0 12px;
  font-size: 13px;
  background: #fff;
}

.picker-val {
  flex: 1;
  height: 32px;
  line-height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 0 12px;
  font-size: 13px;
  background: #fff;
  min-width: 120px;
}

.checkbox-item {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-text {
  font-size: 13px;
  color: #262626;
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.import-btn {
  flex: 1;
  height: 40px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.import-btn.complex {
  background: #52c41a;
}

.mini-import-btn {
  margin-top: 12px;
  height: 24px;
  line-height: 24px;
  padding: 0 12px;
  background: #1890ff;
  color: #fff;
  font-size: 12px;
  border-radius: 4px;
  border: none;
}

.clear-btn {
  width: 80px;
  height: 40px;
  background: #fff;
  color: #595959;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.template-box {
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.template-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  font-size: 12px;
  color: #8c8c8c;
}

.copy-btn {
  color: #1890ff;
  cursor: pointer;
}

.template-scroll {
  max-height: 300px;
}

.template-content {
  padding: 12px;
  margin: 0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 12px;
  color: #595959;
}

.preview-section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-scroll {
  flex: 1;
  padding: 16px;
}

.preview-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bfbfbf;
  font-size: 14px;
}

.preview-item {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fff;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #f0f0f0;
}

.q-index {
  font-size: 13px;
  font-weight: 600;
  color: #1890ff;
}

.q-type {
  font-size: 12px;
  color: #8c8c8c;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 2px;
}

.q-text {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
  color: #262626;
}

.q-answer {
  font-size: 13px;
  color: #52c41a;
  background: #f6ffed;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #b7eb8f;
}

.import-hint {
  margin-top: 12px;
  font-size: 12px;
  color: #ff4d4f;
  background: #fff2f0;
  padding: 8px 12px;
  border-radius: 4px;
}

.inline-edit-row {
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}

.inline-edit-container {
  padding: 10px 16px;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}

.tr-pending {
  background-color: #fffaf0;
}

.tr-success {
  background-color: #f6ffed;
}

/* 列宽与对齐优化 */
.col-id { width: 60px; flex-shrink: 0; }
.col-type { width: 120px; flex-shrink: 0; }
.col-title { flex: 1; min-width: 150px; }
.col-subject { width: 80px; flex-shrink: 0; }
.col-learner { width: 60px; flex-shrink: 0; }
.col-time { width: 140px; flex-shrink: 0; color: #8c8c8c; font-size: 11px; }
.col-status { width: 80px; flex-shrink: 0; }
.col-content { flex: 1; min-width: 200px; }
.col-user { width: 80px; flex-shrink: 0; }
.col-text { flex: 1; min-width: 300px; }

/* 宽度辅助类已在全局定义 */

.action-link {
  font-size: 12px;
  color: #1890ff;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #1890ff;
  transition: all 0.2s;
  background: #fff;
  white-space: nowrap;
}

.action-link:hover {
  background: #1890ff;
  color: #fff;
}

.action-link.delete {
  color: #ff4d4f;
  border-color: #ff4d4f;
}

.action-link.delete:hover {
  background: #ff4d4f;
  color: #fff;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-dot.pending { background: #ff4d4f; }
.status-dot.success { background: #52c41a; }

.text-danger { color: #ff4d4f; font-weight: 500; }
.text-success { color: #52c41a; font-weight: 500; }

/* 标签样式 */
.tags-wrapper {
  display: flex;
  gap: 4px;
  overflow: hidden;
}

.type-tag {
  font-size: 11px;
  padding: 0 6px;
  height: 20px;
  line-height: 18px;
  border-radius: 2px;
  border: 1px solid transparent;
}

.type-tag.book { background: #e6f7ff; border-color: #91d5ff; color: #1890ff; }
.type-tag.mock_paper { background: #fff7e6; border-color: #ffd591; color: #fa8c16; }
.type-tag.real_paper { background: #f9f0ff; border-color: #d3adf7; color: #722ed1; }

.tag-green { background: #f6ffed; border-color: #b7eb8f; color: #52c41a; }
.tag-blue { background: #e6f7ff; border-color: #91d5ff; color: #1890ff; }
.tag-purple { background: #f9f0ff; border-color: #d3adf7; color: #722ed1; }
.tag-cyan { background: #e6fffb; border-color: #87e8de; color: #13c2c2; }
.tag-orange { background: #fff7e6; border-color: #ffd591; color: #fa8c16; }
.tag-default { background: #f5f5f5; border-color: #d9d9d9; color: #595959; }

.inline-edit-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #f0f0f0;
}

.btn-sm {
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 纠错反馈卡片优化 - 单行紧凑版 */
.correction-alert {
  background: #fff1f0;
  border: 1px solid #ffa39e;
  border-radius: 4px;
  padding: 4px 12px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
}

.correction-alert.alert-success {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.alert-title {
  font-weight: bold;
  font-size: 12px;
  color: #cf1322;
  white-space: nowrap;
}

.alert-success .alert-title {
  color: #389e0d;
}

.alert-content {
  font-size: 12px;
  color: #262626;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-time {
  font-size: 11px;
  color: #8c8c8c;
  white-space: nowrap;
}

.modifier-row-inline, .pending-status-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #595959;
  border-left: 1px solid rgba(0,0,0,0.06);
  padding-left: 12px;
}

.modifier-label {
  color: #8c8c8c;
}

.form-view-value {
  color: #262626;
}

.pending-tag {
  color: #cf1322;
  font-size: 11px;
  font-weight: bold;
  background: #fff1f0;
  border: 1px solid #ffa39e;
  padding: 0 4px;
  border-radius: 2px;
}

/* 详情卡片 */
.details-section {
  margin-top: 8px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.h4 {
  font-size: 15px;
  font-weight: 600;
}

.add-btn {
  color: #1890ff;
  cursor: pointer;
  font-size: 13px;
}

.detail-card {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  margin-bottom: 8px;
}

.detail-card-header {
  padding: 6px 10px;
  background: #fafafa;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.detail-title-text {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
}

.detail-card-body {
  padding: 8px;
  border-top: 1px solid #f0f0f0;
}

/* 底部操作栏 */
.sticky-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
  z-index: 10;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 4px;
  font-size: 13px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #1890ff;
  color: #fff;
}

.btn-danger {
  background: #fff;
  border: 1px solid #ff4d4f;
  color: #ff4d4f;
}

.btn-default {
  background: #fff;
  border: 1px solid #d9d9d9;
  color: #595959;
}

/* 弹窗通用样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
}

.modal-box {
  width: 500px;
  max-height: 90vh;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 9px 28px 8px rgba(0,0,0,0.05), 0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12);
  overflow: hidden;
  position: relative;
}

.modal-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  flex-shrink: 0;
}

/* 加载与空状态 */
.loading-text, .empty-text {
  padding: 40px;
  text-align: center;
  color: #bfbfbf;
  font-size: 14px;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.close-btn {
  font-size: 20px;
  color: #8c8c8c;
  cursor: pointer;
  transition: color 0.2s;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #595959;
}

.modal-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
  position: relative;
  min-height: 0; /* 关键：允许 flex 子项收缩 */
}

.modal-scroll {
  flex: 1;
  width: 100%;
  height: 100%; /* 确保 scroll-view 撑满 body */
}

.form-container {
  padding: 5px 5px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px 5px;
  align-items: flex-start;
}

.form-item {
  margin-bottom: 3px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-shrink: 0;
}

.form-label {
  font-size: 12px; /* 减小标签字号 */
  font-weight: 500;
  color: #8c8c8c; /* 标签颜色调淡 */
  display: flex;
  align-items: center;
  height: 18px;
}

.w-100 { width: 100% !important; }
.w-80px { width: 80px !important; }
.w-100px { width: 100px !important; }
.w-120px { width: 120px !important; }
.w-150px { width: 150px !important; }
.w-200px { width: 200px !important; }
.w-50 { width: calc(50% - 6px) !important; } /* 支持半宽 */
.w-33 { width: calc(33.33% - 8px) !important; } /* 支持三等分 */

.modal-footer {
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #fafafa;
  flex-shrink: 0;
}

/* 按钮样式补全 */
.btn-primary {
  background: #1890ff;
  border: 1px solid #1890ff;
  color: #fff;
}

.btn-primary:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.btn-danger {
  background: #ff4d4f;
  border: 1px solid #ff4d4f;
  color: #fff;
}

.btn-danger:hover {
  background: #ff7875;
  border-color: #ff7875;
}

.btn-default {
  background: #fff;
  border: 1px solid #d9d9d9;
  color: #595959;
}

.btn-default:hover {
  color: #40a9ff;
  border-color: #40a9ff;
}

/* 宽度控制类 */
.w-20 { width: 20% !important; }
.w-30 { width: 30% !important; }
.w-40 { width: 40% !important; }
.w-50 { width: 50% !important; }
.w-60 { width: 60% !important; }
.w-80 { width: 80% !important; }
.w-80px { width: 80px !important; }
.w-100px { width: 100px !important; }
.w-120px { width: 120px !important; }
.w-150px { width: 150px !important; }
.w-200px { width: 200px !important; }

/* 表单样式紧凑化 */
.form-item {
  margin-bottom: 3px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.form-label {
  font-size: 12px;
  font-weight: 500;
  color: #595959;
  display: flex;
  align-items: center;
  height: 18px;
}

.form-input, .form-picker {
  height: 26px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 0 10px;
  font-size: 12px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  cursor: pointer; /* 确保所有输入/选择框看起来都可点击 */
}

.form-input:hover, .form-picker:hover {
  border-color: #40a9ff;
  background: #fafafa;
}

.form-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24,144,255,0.1);
  outline: none;
}

.form-textarea {
  width: 100%;
  min-height: 40px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 4px 5px;
  font-size: 13px;
  line-height: 1.5;
  box-sizing: border-box;
  transition: all 0.2s;
}

.form-textarea:hover {
  border-color: #40a9ff;
}

.form-textarea:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24,144,255,0.1);
}

.form-picker {
  position: relative;
  padding-right: 28px;
  z-index: 1;
}

/* 确保 picker 组件本身能够穿透点击 */
picker {
  width: 100%;
  display: block;
}

.form-picker::after {
  content: '';
  position: absolute;
  right: 10px;
  top: 50%;
  margin-top: -2px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid #bfbfbf;
}

.small-textarea {
  min-height: 40px;
}

.small-label {
  font-size: 11px;
  color: #8c8c8c;
  margin-bottom: 3px;
  display: block;
}

.small-input, .small-picker {
  height: 28px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 0 5px;
  font-size: 12px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  position: relative;
}

.small-picker::after {
  content: '';
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
  border-top: 4px solid #bfbfbf;
  pointer-events: none;
}

.small-picker {
  cursor: pointer;
  color: #262626;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kp-input-group {
  display: flex;
  gap: 2px;
  align-items: center;
}

.kp-id-input {
  flex: 1;
}

.icon-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
  font-size: 14px;
  flex-shrink: 0;
}

.icon-btn:hover {
  background: #e6f7ff;
  border-color: #1890ff;
}

/* 公式预览 */
.latex-preview {
  margin-top: 4px;
  padding: 8px 5px;
  background: #fbfbfb;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  min-height: 20px;
  font-size: 13px;
}

/* 数学公式助手 */
.math-assistant {
  margin-top: 8px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.math-assistant .section-title {
  padding: 4px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
}

.math-assistant .section-title:hover {
  background: #f0f0f0;
}

.expand-icon {
  font-size: 11px;
  color: #8c8c8c;
}

.math-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
}

.sym-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 48px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 2px;
}

.sym-btn:hover {
  border-color: #1890ff;
  background: #f0f7ff;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
}

.sym-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: 16px;
  color: #262626;
  pointer-events: none;
}

.sym-label {
  font-size: 10px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
}

.sym-btn:hover .sym-label {
  color: #1890ff;
}

.manual-add-form {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  border-radius: 8px 8px 0 0;
}

.form-header .h3 {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.form-header .close-btn {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.form-header .close-btn:hover {
  color: #262626;
  background: #f5f5f5;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  border-radius: 0 0 8px 8px;
}

.manual-add-form .main-form {
  padding: 20px;
}

.manual-add-form .form-item {
  margin-bottom: 16px;
}

.manual-add-form .form-label {
  display: block;
  font-size: 13px;
  color: #595959;
  margin-bottom: 6px;
  font-weight: 500;
}

.manual-add-form .form-picker,
.manual-add-form .form-textarea,
.manual-add-form .form-input {
  width: 100%;
  padding: 8px 5px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  color: #262626;
  transition: all 0.2s;
  background: #fff;
}

.manual-add-form .form-picker:hover,
.manual-add-form .form-textarea:hover,
.manual-add-form .form-input:hover {
  border-color: #40a9ff;
}

.manual-add-form .form-picker:focus,
.manual-add-form .form-textarea:focus,
.manual-add-form .form-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  outline: none;
}

.manual-add-form .latex-preview {
  min-height: 40px;
  padding: 8px 5px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  margin-top: 8px;
  font-size: 14px;
  color: #262626;
  width: 100%;
  box-sizing: border-box;
}

.entry-layout {
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: calc(100vh - 140px);
}

.entry-content {
  flex: 1;
  display: flex;
  gap: 5px;
  min-height: 0;
}

.book-selection {
  padding: 8px 5px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.entry-left {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.entry-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.entry-section {
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border-radius: 10px;
  border: 1px solid #e8e8e8;
  padding: 8px 5px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.entry-section:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-color: #d9d9d9;
}

.entry-section .section-title {
  font-size: 16px;
  font-weight: 700;
  color: #262626;
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 5px;
  border-bottom: 2px solid #f0f0f0;
}

.book-selector {
  margin-bottom: 5px;
}

.book-picker {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 5px;
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.book-picker:hover {
  border-color: #40a9ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
  transform: translateY(-1px);
}

.book-icon {
  font-size: 20px;
}

.book-name {
  flex: 1;
  font-size: 14px;
  color: #262626;
}

.book-arrow {
  font-size: 12px;
  color: #999;
}

.book-info {
  background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%);
  border-radius: 8px;
  padding: 8px 5px;
  border: 1px solid #e8e8e8;
}

.book-info .info-item {
  display: flex;
  margin-bottom: 3px;
  font-size: 13px;
  padding: 3px 0;
  border-bottom: 1px dashed #e8e8e8;
}

.book-info .info-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.book-info .info-label {
  color: #8c8c8c;
  width: 60px;
  flex-shrink: 0;
  font-weight: 500;
}

.book-info .info-value {
  color: #262626;
  flex: 1;
}

.count-badge {
  background: #1890ff;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.entry-question-list {
  flex: 1;
  min-height: 300px;
  max-height: calc(100vh - 400px);
}

.entry-question-item {
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.entry-question-item:hover {
  border-color: #40a9ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
  transform: translateX(4px);
}

.entry-question-item.active {
  border-color: #1890ff;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

.eq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.eq-id {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
}

.eq-type {
  font-size: 12px;
  color: #1890ff;
  background: #e6f7ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.eq-actions {
  display: flex;
  gap: 8px;
}

.eq-actions .action-btn {
  font-size: 12px;
  color: #1890ff;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.eq-actions .action-btn:hover {
  background: #e6f7ff;
}

.eq-actions .action-btn.delete {
  color: #ff4d4f;
}

.eq-actions .action-btn.delete:hover {
  background: #fff1f0;
}

.eq-content {
  font-size: 13px;
  color: #595959;
  line-height: 1.6;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.entry-form-container {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.entry-form-container .form-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  flex-shrink: 0;
}

.entry-form {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.entry-form .form-section {
  margin-bottom: 24px;
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #f0f0f0;
}

.entry-form .form-section:nth-child(1) {
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
  border-color: #bae7ff;
}

.entry-form .form-section:nth-child(2) {
  background: linear-gradient(135deg, #f6ffed 0%, #f9fff0 100%);
  border-color: #b7eb8f;
}

.entry-form .form-section:nth-child(3) {
  background: linear-gradient(135deg, #fff7e6 0%, #fffbf0 100%);
  border-color: #ffd591;
}

.entry-form .form-section:nth-child(4) {
  background: linear-gradient(135deg, #f9f0ff 0%, #fcf5ff 100%);
  border-color: #d3adf7;
}

.entry-form .form-section .section-title {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.06);
}

.entry-form .form-section:nth-child(1) .section-title {
  color: #096dd9;
  border-bottom-color: #69c0ff;
}

.entry-form .form-section:nth-child(2) .section-title {
  color: #389e0d;
  border-bottom-color: #95de64;
}

.entry-form .form-section:nth-child(3) .section-title {
  color: #d46b08;
  border-bottom-color: #ffa940;
}

.entry-form .form-section:nth-child(4) .section-title {
  color: #722ed1;
  border-bottom-color: #b37feb;
}

.entry-form .form-section .section-title .expand-icon {
  font-size: 12px;
  color: #8c8c8c;
}

.entry-form .form-section .section-title .add-btn {
  font-size: 13px;
  color: #1890ff;
  cursor: pointer;
  padding: 6px 14px;
  border: 1px dashed #1890ff;
  border-radius: 6px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
  font-weight: 500;
}

.entry-form .form-section .section-title .add-btn:hover {
  background: linear-gradient(135deg, #bae7ff 0%, #91d5ff 100%);
  border-color: #096dd9;
  color: #096dd9;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
  transform: translateY(-1px);
}

.entry-form .form-row {
  display: flex;
  gap: 5px;
  margin-bottom: 3px;
}

.entry-form .form-item {
  flex: 1;
}

.entry-form .form-item.half {
  flex: 0 0 calc(50% - 2.5px);
}

.entry-form .form-item.third {
  flex: 0 0 calc(33.33% - 3.33px);
}

.entry-form .form-item.w-120px {
  flex: 0 0 120px;
}

.entry-form .form-label {
  display: block;
  font-size: 13px;
  color: #595959;
  margin-bottom: 3px;
  font-weight: 600;
}

.entry-form .form-picker,
.entry-form .form-textarea,
.entry-form .form-input {
  width: 100%;
  padding: 8px 5px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  color: #262626;
  transition: all 0.2s;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.entry-form .form-picker:hover,
.entry-form .form-textarea:hover,
.entry-form .form-input:hover {
  border-color: #40a9ff;
}

.entry-form .form-picker:focus,
.entry-form .form-textarea:focus,
.entry-form .form-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  outline: none;
}

.entry-form .form-textarea {
  min-height: 80px;
  resize: vertical;
}

.entry-form .small-input,
.entry-form .small-picker,
.entry-form .small-textarea {
  width: 100%;
  padding: 6px 5px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  color: #262626;
  transition: all 0.2s;
  background: #fff;
}

.entry-form .small-input:focus,
.entry-form .small-picker:focus,
.entry-form .small-textarea:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  outline: none;
}

.entry-form .small-label {
  display: block;
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.entry-form .small-textarea {
  width: 100%;
  min-height: 60px;
  resize: vertical;
  box-sizing: border-box;
}

.entry-form .latex-preview {
  width: 100%;
  min-height: 50px;
  padding: 12px 5px;
  background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%);
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  margin-top: 10px;
  font-size: 14px;
  color: #262626;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.entry-form .kp-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.entry-form .kp-id-input {
  flex: 1;
}

.entry-form .icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.entry-form .icon-btn:hover {
  background: #f0f0f0;
  border-color: #40a9ff;
}

.entry-form .detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entry-form .detail-card {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}

.entry-form .detail-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.entry-form .detail-card-header:hover {
  background: #f5f5f5;
}

.entry-form .bus-type-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #e6f7ff;
  color: #1890ff;
  font-weight: 500;
  flex-shrink: 0;
}

.entry-form .bus-type-tag.analysis {
  background: #e6f7ff;
  color: #1890ff;
}

.entry-form .bus-type-tag.solution {
  background: #f6ffed;
  color: #52c41a;
}

.entry-form .bus-type-tag.knowledge {
  background: #fff7e6;
  color: #fa8c16;
}

.entry-form .bus-type-tag.note {
  background: #f9f0ff;
  color: #722ed1;
}

.entry-form .detail-title-text {
  flex: 1;
  font-size: 13px;
  color: #262626;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-form .detail-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.entry-form .move-icon {
  font-size: 12px;
  color: #8c8c8c;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.entry-form .move-icon:hover {
  background: #e6f7ff;
  color: #1890ff;
}

.entry-form .delete-link {
  font-size: 12px;
  color: #ff4d4f;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.entry-form .delete-link:hover {
  background: #fff1f0;
}

.entry-form .expand-icon {
  font-size: 12px;
  color: #8c8c8c;
}

.entry-form .detail-card-body {
  border-top: 1px solid #f0f0f0;
  padding: 12px;
}

.entry-form .detail-card-body .form-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entry-form .detail-card-body .form-item {
  width: 100%;
}

.entry-form .detail-card-body .form-item input,
.entry-form .detail-card-body .form-item textarea {
  width: 100%;
  box-sizing: border-box;
}

.entry-form .empty-text-small {
  text-align: center;
  color: #8c8c8c;
  font-size: 13px;
  padding: 20px;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
}

.entry-form .form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 20px;
  margin-top: 24px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.manual-add-form .form-textarea {
  min-height: 80px;
  resize: vertical;
}

.manual-add-form .latex-preview {
  margin-top: 8px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
  min-height: 40px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
}

.manual-add-form .details-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.manual-add-form .detail-list {
  margin-top: 12px;
}

.manual-add-form .detail-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  margin-bottom: 12px;
  overflow: hidden;
}

.manual-add-form .detail-card-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  gap: 8px;
}

.manual-add-form .detail-card-header:hover {
  background: #f5f5f5;
}

.manual-add-form .bus-type-tag {
  padding: 2px 8px;
  border-radius: 2px;
  font-size: 12px;
  background: #e6f7ff;
  color: #1890ff;
  flex-shrink: 0;
}

.manual-add-form .detail-title-text {
  flex: 1;
  font-size: 14px;
  color: #262626;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manual-add-form .detail-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.manual-add-form .move-icon,
.manual-add-form .delete-link,
.manual-add-form .expand-icon {
  font-size: 12px;
  color: #8c8c8c;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
  transition: all 0.2s;
}

.manual-add-form .move-icon:hover,
.manual-add-form .delete-link:hover,
.manual-add-form .expand-icon:hover {
  color: #1890ff;
  background: #e6f7ff;
}

.manual-add-form .delete-link:hover {
  color: #ff4d4f;
  background: #fff1f0;
}

.manual-add-form .detail-card-body {
  padding: 12px;
}

.manual-add-form .form-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.manual-add-form .detail-card-body .form-item {
  width: 100%;
}

.manual-add-form .detail-card-body .form-item input,
.manual-add-form .detail-card-body .form-item textarea {
  width: 100%;
  box-sizing: border-box;
}

.manual-add-form .small-label {
  display: block;
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.manual-add-form .small-picker,
.manual-add-form .small-input,
.manual-add-form .small-textarea {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  color: #262626;
  transition: all 0.2s;
  background: #fff;
}

.manual-add-form .small-picker:hover,
.manual-add-form .small-input:hover,
.manual-add-form .small-textarea:hover {
  border-color: #40a9ff;
}

.manual-add-form .small-picker:focus,
.manual-add-form .small-input:focus,
.manual-add-form .small-textarea:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  outline: none;
}

.manual-add-form .small-textarea {
  min-height: 60px;
  resize: vertical;
}

.manual-add-form .kp-input-group {
  display: flex;
  gap: 4px;
}

.manual-add-form .kp-id-input {
  flex: 1;
}

.manual-add-form .icon-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.manual-add-form .icon-btn:hover {
  background: #f0f7ff;
  border-color: #1890ff;
}

.manual-add-form .math-assistant {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.manual-add-form .math-toolbar {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.manual-add-form .sym-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 60px;
}

.manual-add-form .sym-btn:hover {
  border-color: #1890ff;
  background: #f0f7ff;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
}

.manual-add-form .sym-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: 16px;
  color: #262626;
  pointer-events: none;
}

.manual-add-form .sym-label {
  font-size: 10px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
  margin-top: 4px;
}

.manual-add-form .sym-btn:hover .sym-label {
  color: #1890ff;
}
</style>
