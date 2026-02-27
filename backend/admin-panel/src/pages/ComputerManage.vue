<template>
  <div class="computer-manage">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 纠错反馈 -->
      <el-tab-pane label="纠错反馈" name="corrections">
        <div class="filter-bar mb-20">
          <el-radio-group v-model="correctionFilter.status" @change="fetchCorrections">
            <el-radio-button :label="1">待处理</el-radio-button>
            <el-radio-button :label="2">已处理</el-radio-button>
            <el-radio-button label="">全部</el-radio-button>
          </el-radio-group>
          <el-button class="ml-10" @click="fetchCorrections">刷新</el-button>
        </div>

        <el-table :data="corrections" v-loading="loadingCorrections" border stripe>
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="Type" label="类型" width="100" align="center" />
          <el-table-column prop="Content" label="反馈内容" min-width="200" show-overflow-tooltip />
          <el-table-column prop="QuestionID" label="题目ID" width="120" align="center" />
          <el-table-column prop="Status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.Status === 2 ? 'success' : 'danger'">
                {{ row.Status === 2 ? '已处理' : '待处理' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="CreatedAt" label="提交时间" width="160" align="center">
            <template #default="{ row }">
              {{ formatDate(row.CreatedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="handleCorrection(row)">处理</el-button>
              <el-button size="small" @click="openEditModal(row.QuestionID)">编辑题目</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 题目管理 -->
      <el-tab-pane label="题目管理" name="questions">
        <div class="filter-card mb-20">
          <el-row :gutter="20" align="middle">
            <el-col :span="6">
              <el-input
                v-model="questionFilter.keyword"
                placeholder="搜索题目内容或ID..."
                clearable
                @keyup.enter="searchQuestions"
              >
                <template #append>
                  <el-button @click="searchQuestions">
                    <el-icon><Search /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-col>
            <el-col :span="4">
              <el-select v-model="questionFilter.major_id" placeholder="所属科目" clearable @change="searchQuestions" style="width: 100%">
                <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="String(s.id)" />
              </el-select>
            </el-col>
            <el-col :span="3">
              <el-select v-model="questionFilter.type" placeholder="题型" clearable @change="searchQuestions" style="width: 100%">
                <el-option label="单选题" value="单选题" />
                <el-option label="多选题" value="多选题" />
                <el-option label="填空题" value="填空题" />
                <el-option label="解答题" value="解答题" />
                <el-option label="判断题" value="判断题" />
              </el-select>
            </el-col>
            <el-col :span="2">
              <el-checkbox v-model="questionFilter.noTags" @change="searchQuestions">无考点</el-checkbox>
            </el-col>
            <el-col :span="2">
              <el-checkbox v-model="questionFilter.noMajor" @change="searchQuestions">无科目</el-checkbox>
            </el-col>
            <el-col :span="7" style="text-align: right;">
              <el-button-group>
                <el-button type="primary" @click="openCreateQuestionModal">
                  <el-icon><Plus /></el-icon>创建
                </el-button>
                <el-button type="success" @click="openExportModal">
                  <el-icon><Download /></el-icon>导出
                </el-button>
                <el-button type="warning" @click="openBatchAddTagsModal">
                  <el-icon><CirclePlus /></el-icon>加考点
                </el-button>
              </el-button-group>
            </el-col>
          </el-row>
        </div>

        <el-table :data="questions" v-loading="loadingQuestions" border stripe>
          <el-table-column prop="question_id" label="ID" width="150" align="center" />
          <el-table-column prop="exercise_type_name" label="题型" width="100" align="center" />
          <el-table-column prop="stem" label="题干摘要" min-width="300" show-overflow-tooltip>
            <template #default="{ row }">
              <div v-html="stripHtml(row.stem)"></div>
            </template>
          </el-table-column>
          <el-table-column prop="major_name" label="所属科目" width="120" align="center" />
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openEditModal(row.question_id)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteQuestion(row.question_id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container mt-20">
          <el-pagination
            v-model:current-page="questionFilter.page"
            v-model:page-size="questionFilter.pageSize"
            :total="questionTotal"
            layout="total, prev, pager, next"
            @current-change="searchQuestions"
          />
        </div>
      </el-tab-pane>

    <!-- 选择考点弹窗 -->
    <el-dialog
      v-model="selectTagModalVisible"
      title="选择考点"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="选择科目">
          <el-select 
            v-model="selectTagForm.major_id" 
            placeholder="请选择科目" 
            clearable 
            style="width: 100%"
            @change="onSelectTagMajorChange"
          >
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="String(s.id)" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="选择章节">
          <el-select 
            v-model="selectTagForm.chapter_id" 
            placeholder="请选择章节" 
            clearable 
            style="width: 100%"
            @change="onSelectTagChapterChange"
            :disabled="!selectTagForm.major_id"
          >
            <el-option v-for="c in selectTagChapters" :key="c.id" :label="c.name" :value="String(c.id)" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="选择考点">
          <el-select 
            v-model="selectTagForm.tag_id" 
            placeholder="请选择考点" 
            clearable 
            style="width: 100%"
            :disabled="!selectTagForm.chapter_id"
            filterable
          >
            <el-option 
              v-for="t in selectTagList" 
              :key="t.tag_id" 
              :label="t.tag_name || t.tag_id || '未命名考点'" 
              :value="String(t.tag_id)"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="selectTagModalVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSelectTag" :disabled="!selectTagForm.tag_id">确定</el-button>
      </template>
    </el-dialog>

    <!-- 导出无考点题目弹窗 -->
    <el-dialog
      v-model="exportModalVisible"
      title="导出无考点题目"
      width="550px"
      :close-on-click-modal="false"
    >
      <el-form :model="exportForm" label-width="120px">
        <el-form-item label="选择科目">
          <el-select 
            v-model="exportForm.major_ids" 
            placeholder="请选择科目（可多选，不选则导出所有）" 
            clearable 
            multiple
            collapse-tags
            collapse-tags-tooltip
            style="width: 100%"
          >
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="String(s.id)" />
          </el-select>
          <div class="form-tip">请选择要导出无考点题目的科目，不选则导出所有科目</div>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="exportForm.noMajorOnly">仅导出没有科目的题目</el-checkbox>
        </el-form-item>
        
        <el-form-item label="包含题目类型">
          <el-checkbox v-model="exportForm.includeOptions">包含选择题选项</el-checkbox>
          <el-checkbox v-model="exportForm.includeSubs">包含解答题小题</el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="exportModalVisible = false">取消</el-button>
        <el-button type="primary" @click="submitExport" :loading="exportLoading">确认导出</el-button>
      </template>
    </el-dialog>

    <!-- 批量添加考点弹窗 -->
    <el-dialog
      v-model="batchAddTagsVisible"
      title="批量为无考点题目添加考点"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="batchAddTagsForm" label-width="120px">
        <el-form-item label="选择科目">
          <el-select v-model="batchAddTagsForm.major_id" placeholder="请选择科目" clearable style="width: 100%">
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="String(s.id)" />
          </el-select>
          <div class="form-tip">选择科目后，将只处理该科目下没有考点的题目</div>
        </el-form-item>
        
        <el-form-item label="JSON数据">
          <el-input
            v-model="batchAddTagsForm.jsonData"
            type="textarea"
            :rows="15"
            placeholder="请粘贴JSON数据，格式如下：
[
  {
    'question_id': '题目ID',
    'knowledgeTags': ['考点ID1', '考点ID2']
  }
]"
          />
          <div class="form-tip">
            <p>JSON格式说明：</p>
            <p>1. question_id: 题目的唯一标识ID</p>
            <p>2. knowledgeTags: 要添加的考点ID数组</p>
            <p>3. 可以通过"导出无考点题目"功能获取题目ID</p>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="batchAddTagsVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchAddTags" :loading="batchAddTagsLoading">确认添加</el-button>
      </template>
    </el-dialog>

      <!-- 导入试题 -->
      <el-tab-pane label="导入试题" name="import">
        <div class="import-container">
          <el-tabs v-model="importActiveTab" type="border-card">
            <!-- 试卷导入 -->
            <el-tab-pane label="试卷导入" name="paper-import">
              <el-alert
                title="试卷导入说明"
                type="info"
                :closable="false"
                class="mb-20"
              >
                <template #default>
                  <div style="line-height: 1.8;">
                    <p>1. 支持同时上传多个 JSON 试卷文件</p>
                    <p>2. 每个 JSON 文件应包含一个题目数组</p>
                    <p>3. 系统会自动根据学校、年份、试卷代码分组识别不同的试卷</p>
                    <p>4. 如果题目不存在会自动导入，已存在的题目会直接关联</p>
                  </div>
                </template>
              </el-alert>

              <el-upload
                class="upload-demo"
                drag
                action="#"
                :auto-upload="false"
                :on-change="handlePaperFileChange"
                :file-list="paperFileList"
                accept=".json"
                multiple
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                  将试卷 JSON 文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持同时上传多个 JSON 试卷文件，所有文件中的题目将合并处理
                  </div>
                </template>
              </el-upload>

              <div v-if="paperFileList.length > 0" class="mt-20">
                <el-alert :title="`已加载 ${paperFileList.length} 个文件，共 ${totalPaperQuestionCount} 道题目，检测到 ${detectedPapers.length} 张试卷`" type="info" :closable="false" show-icon />
                
                <!-- 试卷类型选择 -->
                <div class="mt-20">
                  <el-form :inline="true">
                    <el-form-item label="试卷类型">
                      <el-radio-group v-model="paperImportType">
                        <el-radio-button :label="1">真题卷</el-radio-button>
                        <el-radio-button :label="2">模拟卷</el-radio-button>
                      </el-radio-group>
                    </el-form-item>
                    <el-form-item label="知识点解析模式">
                      <el-radio-group v-model="tagParseMode">
                        <el-radio-button :label="1">标准模式</el-radio-button>
                        <el-radio-button :label="2">考点模式</el-radio-button>
                      </el-radio-group>
                      <el-tooltip placement="top">
                        <template #content>
                          <div style="max-width: 300px;">
                            <p><b>标准模式</b>：knowledgeTags[0]=科目ID, [1]=章节ID, [3]=考点组ID</p>
                            <p style="margin-top: 5px;"><b>考点模式</b>：knowledgeTags全部是考点组ID，系统自动反查科目和章节</p>
                          </div>
                        </template>
                        <el-icon class="ml-5" style="cursor: pointer;"><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </el-form-item>
                  </el-form>
                </div>
                
                <div class="mt-20">
                  <el-table :data="paperFileList" border size="small">
                    <el-table-column prop="name" label="文件名" min-width="200" />
                    <el-table-column label="题目数量" width="120" align="center">
                      <template #default="{ row }">
                        {{ row.data?.length || 0 }}
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="100" align="center">
                      <template #default="{ $index }">
                        <el-button size="small" type="danger" link @click="removePaperFile($index)">删除</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                
                <div class="mt-20">
                  <el-button type="primary" :loading="importing" @click="startPaperImport">开始导入试卷</el-button>
                  <el-button @click="clearPaperData">清空所有</el-button>
                </div>

                <div v-if="detectedPapers.length > 0" class="mt-20">
                  <h4>检测到的试卷：</h4>
                  <el-table :data="detectedPapers" border size="small">
                    <el-table-column prop="title" label="试卷名称" min-width="200" />
                    <el-table-column prop="school" label="来源学校" width="150" />
                    <el-table-column prop="year" label="年份" width="100" />
                    <el-table-column label="题目数量" width="100" align="center">
                      <template #default="{ row }">
                        {{ row.questions.length }}
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </el-tab-pane>

            <!-- 批量导入试题 -->
            <el-tab-pane label="批量导入试题" name="question-import">
              <el-alert
                title="批量导入说明"
                type="info"
                :closable="false"
                class="mb-20"
              >
                <template #default>
                  <div style="line-height: 1.8;">
                    <p>1. 支持同时上传多个 JSON 文件</p>
                    <p>2. 每个 JSON 文件应包含一个题目数组</p>
                    <p>3. 题型支持：单选题、多选题、填空题、解答题、判断题</p>
                    <p>4. 可以先下载模板查看数据格式</p>
                  </div>
                </template>
              </el-alert>

              <div class="mb-20">
                <el-button type="primary" link @click="downloadQuestionTemplate">
                  <el-icon><Download /></el-icon>
                  下载导入模板
                </el-button>
              </div>

              <el-upload
                class="upload-demo"
                drag
                action="#"
                :auto-upload="false"
                :on-change="handleQuestionFileChange"
                :file-list="questionFileList"
                accept=".json"
                multiple
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                  将试题 JSON 文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持同时上传多个 JSON 文件，所有文件中的题目将合并导入
                  </div>
                </template>
              </el-upload>

              <div v-if="questionFileList.length > 0" class="mt-20">
                <el-alert :title="`已加载 ${questionFileList.length} 个文件，共 ${totalQuestionCount} 道试题`" type="success" :closable="false" show-icon />
                
                <div class="mt-20">
                  <el-table :data="questionFileList" border size="small">
                    <el-table-column prop="name" label="文件名" min-width="200" />
                    <el-table-column label="题目数量" width="120" align="center">
                      <template #default="{ row }">
                        {{ row.data?.length || 0 }}
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="100" align="center">
                      <template #default="{ $index }">
                        <el-button size="small" type="danger" link @click="removeQuestionFile($index)">删除</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                
                <div class="mt-20">
                  <el-button type="primary" :loading="importingQuestions" @click="startQuestionImport">开始导入试题</el-button>
                  <el-button @click="clearQuestionImportData">清空所有</el-button>
                </div>

                <div v-if="totalQuestionCount > 0" class="mt-20">
                  <h4>试题预览（前5道）：</h4>
                  <el-table :data="allQuestionsPreview" border size="small">
                    <el-table-column prop="exerciseType" label="题型" width="100" />
                    <el-table-column prop="stem" label="题干" show-overflow-tooltip>
                      <template #default="{ row }">
                        {{ stripHtml(row.stem || row.exerciseStem || '') }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="answer" label="答案" width="150" show-overflow-tooltip />
                  </el-table>
                  <p v-if="totalQuestionCount > 5" class="text-center mt-10" style="color: #909399;">
                    还有 {{ totalQuestionCount - 5 }} 道试题...
                  </p>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-tab-pane>

      <!-- 错题统计 -->
      <el-tab-pane label="错题统计" name="wrong-stats">
        <div class="filter-bar mb-20">
          <el-button type="primary" @click="fetchWrongStats" :loading="loadingStats">刷新统计数据</el-button>
        </div>
        
        <el-table :data="wrongStats" v-loading="loadingStats" border stripe>
          <el-table-column prop="QuestionID" label="题目ID" width="180" align="center" />
          <el-table-column prop="exercise_type_name" label="题型" width="100" align="center" />
          <el-table-column prop="stem" label="题干内容" min-width="300" show-overflow-tooltip>
            <template #default="{ row }">
              <div v-html="stripHtml(row.stem)"></div>
            </template>
          </el-table-column>
          <el-table-column prop="error_count" label="错误人数" width="100" align="center" sortable />
          <el-table-column prop="total_attempts" label="总练习次数" width="120" align="center" sortable />
          <el-table-column prop="master_count" label="已掌握人数" width="120" align="center" sortable>
             <template #default="{ row }">
              <el-tag type="success">{{ row.master_count }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="错误率" width="120" align="center">
            <template #default="{ row }">
              <el-progress 
                :percentage="calculateErrorRate(row)" 
                :status="calculateErrorRate(row) > 50 ? 'exception' : 'warning'"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button size="small" @click="openEditModal(row.QuestionID)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 科目章节管理 -->
      <el-tab-pane label="科目章节管理" name="subjects-chapters">
        <div class="subjects-chapters-layout">
          <!-- 左侧科目列表 -->
          <div class="subjects-sidebar">
            <div class="sidebar-header">
              <span class="header-title">科目列表</span>
              <el-button type="primary" size="small" @click="openSubjectModal()">+ 新建</el-button>
            </div>
            <div class="subjects-list" v-loading="loadingSubjects">
              <div
                v-for="s in subjects"
                :key="s.id"
                class="subject-item"
                :class="{ active: selectedSubject?.id === s.id }"
                @click="selectSubject(s)"
              >
                <div class="subject-main">
                  <div class="subject-name">{{ s.name }}</div>
                  <el-tag :type="s.is_on_shelf === 1 ? 'success' : 'info'" size="small" effect="plain">
                    {{ s.is_on_shelf === 1 ? '已上架' : '已下架' }}
                  </el-tag>
                </div>
                <div class="subject-actions" @click.stop>
                  <el-button link type="primary" size="small" @click="openSubjectModal(s)">编辑</el-button>
                  <el-button 
                    link 
                    :type="s.is_on_shelf === 1 ? 'warning' : 'success'" 
                    size="small" 
                    @click="toggleSubjectShelf(s)"
                  >
                    {{ s.is_on_shelf === 1 ? '下架' : '上架' }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧章节列表 -->
          <div class="chapters-content">
            <div class="content-header">
              <div class="header-left">
                <span class="header-title">{{ selectedSubject ? selectedSubject.name : '请选择科目' }}</span>
                <el-tag v-if="selectedSubject" size="small" type="info">{{ chapters.length }} 个章节</el-tag>
              </div>
              <el-button 
                type="primary" 
                @click="openChapterModal()" 
                :disabled="!selectedSubject"
              >
                <el-icon><Plus /></el-icon> 新建章节
              </el-button>
            </div>
            <el-table 
              :data="displayedChapters" 
              v-loading="loadingChapters" 
              border 
              stripe
              :empty-text="selectedSubject ? '暂无章节' : '请先选择左侧科目'"
              style="width: 100%;"
            >
              <el-table-column prop="name" label="章节名称" align="left" show-overflow-tooltip>
                <template #default="{ row }">
                  <div 
                    class="chapter-name-cell" 
                    :class="{ 'has-children': row.hasChildren, 'is-expanded': row.isExpanded, 'is-section': row.isSection }"
                    @click="row.isChapter ? toggleChapterExpand(row) : null"
                  >
                    <template v-if="row.isChapter">
                      <div class="expand-click-area">
                        <el-icon v-if="row.hasChildren" class="expand-icon">
                          <ArrowRight v-if="!row.isExpanded" />
                          <ArrowDown v-else />
                        </el-icon>
                        <span v-else class="expand-placeholder"></span>
                      </div>
                    </template>
                    <span v-else class="section-dot"></span>
                    <span class="chapter-name" :style="{ paddingLeft: row.level > 0 ? '20px' : '0' }">
                      {{ row.name }}
                    </span>
                    <el-tag v-if="row.isChapter && row.hasLoaded" size="small" type="info" class="section-count-tag">
                      {{ row.sectionCount }}个考点
                    </el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="totalQuestions" label="题目数量" width="100" align="center" />
              <el-table-column label="操作" width="360" align="center" fixed="right">
                <template #default="{ row }">
                  <template v-if="row.isChapter">
                    <el-button size="small" type="info" @click.stop="openCreateTagModalFromChapter(row)">+ 创建考点</el-button>
                    <el-button size="small" type="primary" @click.stop="openCreateQuestionFromChapter(row)">+ 创建题目</el-button>
                    <el-button size="small" type="success" @click.stop="openAddQuestionsToChapter(row)">添加题目</el-button>
                    <el-button size="small" @click.stop="openChapterModal(row)">编辑</el-button>
                    <el-button size="small" type="danger" @click.stop="deleteSubjectChapter(row.id)">删除</el-button>
                  </template>
                  <template v-else>
                    <el-button size="small" type="primary" @click.stop="openCreateQuestionFromSection(row)">+ 创建题目</el-button>
                    <el-button size="small" type="success" @click.stop="openAddQuestionsToSection(row)">添加题目</el-button>
                    <el-button size="small" @click.stop="openEditSectionModal(row)">编辑</el-button>
                    <el-button size="small" type="danger" @click.stop="deleteSection(row)">删除</el-button>
                  </template>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <!-- 考点管理 -->
      <el-tab-pane label="考点管理" name="tags">
        <div class="filter-card mb-20">
          <el-row :gutter="20" align="middle">
            <el-col :span="6">
              <el-select v-model="tagFilter.chapterId" placeholder="选择章节筛选" clearable @change="fetchTags" style="width: 100%">
                <el-option v-for="c in allChapters" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-input
                v-model="tagFilter.keyword"
                placeholder="搜索考点名称或ID..."
                clearable
                @keyup.enter="fetchTags"
              >
                <template #append>
                  <el-button @click="fetchTags">
                    <el-icon><Search /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-col>
            <el-col :span="12" style="text-align: right;">
              <el-button type="warning" @click="showUncategorizedTags">查看待分类</el-button>
              <el-button type="primary" @click="openCreateTagModal">+ 创建考点</el-button>
              <el-button type="success" @click="proofreadTags">校对考点名称</el-button>
              <el-button v-if="selectedTags.length > 0" type="success" @click="openBatchMoveModal">
                批量移动({{ selectedTags.length }})
              </el-button>
            </el-col>
          </el-row>
        </div>

        <el-table :data="tags" v-loading="loadingTags" border stripe @selection-change="handleTagSelectionChange" @expand-change="handleExpandChange" row-key="tag_id">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column type="expand" width="50">
            <template #default="{ row }">
              <div class="tag-questions-expand">
                <div class="expand-header">
                  <span class="expand-title">该考点下的题目（共 {{ (tagQuestions[row.tag_id] || []).length }} 题）</span>
                  <el-button size="small" type="primary" @click="loadTagQuestions(row)">刷新</el-button>
                </div>
                <div v-if="loadingTagQuestions[row.tag_id]" class="loading-questions" v-loading="loadingTagQuestions[row.tag_id]">加载中...</div>
                <div v-else-if="!tagQuestions[row.tag_id]" class="empty-questions">
                  点击"刷新"加载题目
                </div>
                <div v-else-if="(tagQuestions[row.tag_id] || []).length === 0" class="empty-questions">
                  该考点下暂无题目
                </div>
                <div v-else class="questions-list">
                  <div v-for="(q, idx) in tagQuestions[row.tag_id]" :key="q.question_id" class="question-item">
                    <div class="question-header">
                      <span class="question-index">题目 {{ idx + 1 }}</span>
                      <span class="question-type">{{ q.exercise_type_name }}</span>
                      <span class="question-id">ID: {{ q.question_id }}</span>
                    </div>
                    <div class="question-meta">
                      <div class="meta-item" v-if="q.exam_full_name">
                        <span class="meta-label">来源：</span>
                        <span class="meta-value">{{ q.exam_full_name }}</span>
                      </div>
                      <div class="meta-item" v-if="q.exam_time">
                        <span class="meta-label">年份：</span>
                        <span class="meta-value">{{ q.exam_time }}</span>
                      </div>
                      <div class="meta-item" v-if="q.chapter_name">
                        <span class="meta-label">章节：</span>
                        <span class="meta-value">{{ q.chapter_name }}</span>
                      </div>
                      <div class="meta-item" v-if="q.all_tags && q.all_tags.length > 0">
                        <span class="meta-label">考点：</span>
                        <span class="meta-value tags-list">
                          <el-tag v-for="tag in q.all_tags" :key="tag.tag_id" size="small" class="tag-item">
                            {{ tag.tag_name }}
                          </el-tag>
                        </span>
                      </div>
                    </div>
                    <div class="question-content">
                      <div class="question-stem" v-html="q.stem"></div>
                      <div v-if="q.options && q.options.length > 0" class="question-options">
                        <div v-for="opt in q.options" :key="opt.option_key" class="option-line">
                          <span class="option-key">{{ opt.option_key }}.</span>
                          <span class="option-value" v-html="opt.option_value"></span>
                        </div>
                      </div>
                      <div v-if="q.answer" class="question-answer">
                        <strong>答案：</strong><span v-html="q.answer"></span>
                      </div>
                      <div v-if="q.analysis" class="question-analysis">
                        <strong>解析：</strong><span v-html="q.analysis"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="tag_id" label="ID" width="180" align="center" />
          <el-table-column prop="tag_name" label="名称" min-width="200">
            <template #default="{ row }">
              <el-input 
                v-if="editingTagId === row.tag_id" 
                v-model="editingTagName" 
                size="small"
                @blur="saveTagName(row)"
                @keyup.enter="saveTagName(row)"
                ref="tagNameInput"
              />
              <span v-else :class="{ 'unnamed-tag': !row.tag_name || /^\d+$/.test(row.tag_name) }" @dblclick="startEditTag(row)">
                {{ row.tag_name || '(未命名)' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="chapter_name" label="所属章节" width="200" />
          <el-table-column prop="question_count" label="题目数" width="100" align="center" />
          <el-table-column label="操作" width="250" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="startEditTag(row)">编辑名称</el-button>
              <el-button size="small" @click="openMoveTagModal(row)">移动章节</el-button>
              <el-button size="small" type="danger" @click="deleteTag(row.tag_id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container mt-20">
          <el-pagination
            v-model:current-page="tagFilter.page"
            v-model:page-size="tagFilter.pageSize"
            :total="tagTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchTags"
            @current-change="fetchTags"
          />
        </div>
      </el-tab-pane>


    </el-tabs>

    <!-- 移动考点对话框 -->
    <el-dialog v-model="moveTagModalVisible" title="移动考点到其他章节" width="500px">
      <el-form label-width="100px">
        <el-form-item label="目标章节">
          <el-select v-model="targetChapterId" placeholder="选择目标章节" style="width: 100%">
            <el-option v-for="c in allChapters" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moveTagModalVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMoveTag">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量移动考点对话框 -->
    <el-dialog v-model="batchMoveModalVisible" title="批量移动考点" width="500px">
      <p style="margin-bottom: 15px;">已选择 {{ selectedTags.length }} 个考点</p>
      <el-form label-width="100px">
        <el-form-item label="目标章节">
          <el-select v-model="batchTargetChapterId" placeholder="选择目标章节" style="width: 100%">
            <el-option v-for="c in allChapters" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchMoveModalVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchMove">确定移动</el-button>
      </template>
    </el-dialog>

    <!-- 创建考点对话框 -->
    <el-dialog v-model="createTagModalVisible" title="创建新考点" width="500px">
      <el-form label-width="100px">
        <el-form-item label="考点名称">
          <el-input v-model="newTagForm.name" placeholder="请输入考点名称" />
        </el-form-item>
        <el-form-item label="所属章节">
          <el-select 
            v-model="newTagForm.chapterId" 
            placeholder="选择所属章节" 
            style="width: 100%"
            :disabled="!!currentChapterForCreateTag"
          >
            <el-option v-for="c in allChapters" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createTagModalVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateTag">确定</el-button>
      </template>
    </el-dialog>

    <!-- 题目编辑对话框 -->
    <el-dialog
      v-model="editModalVisible"
      title="编辑题目"
      width="1000px"
      top="3vh"
      destroy-on-close
      class="question-edit-dialog"
    >
      <el-form :model="editingForm" label-width="100px" class="question-edit-form" v-if="editingForm">
        <!-- 基础信息行 -->
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="题型">
              <el-select v-model="editingForm.exercise_type" style="width: 100%;" @change="handleExerciseTypeChange">
                <el-option label="单选题" :value="1" />
                <el-option label="多选题" :value="2" />
                <el-option label="填空题" :value="3" />
                <el-option label="解答题" :value="4" />
                <el-option label="判断题" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度">
              <el-rate v-model="editingForm.level" :max="5" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分值">
              <el-input-number v-model="editingForm.total_score" :min="0" :max="100" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 科目章节行 -->
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="所属科目">
              <el-select 
                v-model="editingForm.major_id" 
                style="width: 100%;" 
                placeholder="请选择科目" 
                @change="handleSubjectChange"
              >
                <el-option 
                  v-for="s in subjects" 
                  :key="s.id" 
                  :label="s.name" 
                  :value="String(s.id)" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属章节">
              <div style="display: flex; gap: 8px;">
                <el-select 
                  v-model="editingForm.chapter_id" 
                  style="flex: 1; min-width: 200px;" 
                  placeholder="请选择章节"
                >
                  <el-option 
                    v-for="c in chapters" 
                    :key="c.id" 
                    :label="c.name" 
                    :value="String(c.id)" 
                  />
                </el-select>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="题号">
              <el-input-number v-model="editingForm.exercise_number" :min="1" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 考试信息行 -->
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="考试年份">
              <el-input v-model="editingForm.exam_time" placeholder="如：2025年" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="学校/来源">
              <el-input v-model="editingForm.from_school" placeholder="如：全国统考" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="科目代码">
              <el-input v-model="editingForm.exam_code" placeholder="如：408" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 知识点标签 -->
        <el-form-item label="知识点标签">
          <div class="tags-list">
            <el-tag
              v-for="(tag, idx) in (editingForm.tags || [])"
              :key="idx"
              closable
              @close="removeTag(idx)"
              class="tag-item"
            >
              {{ tag.tag_name || tag }}
            </el-tag>
            <el-button-group>
              <el-button type="primary" link size="small" @click="openSelectTagModal">
                <el-icon><Search /></el-icon> 从考点选择
              </el-button>
              <el-button type="success" link size="small" @click="addTagByInput">
                <el-icon><Plus /></el-icon> 输入添加
              </el-button>
            </el-button-group>
          </div>
        </el-form-item>
        
        <el-form-item label="题干" class="form-item-stem">
          <div class="editor-wrapper">
            <RichEditor v-model="editingForm.stem" placeholder="请输入题干" :height="120" />
          </div>
        </el-form-item>
        
        <el-form-item label="选项" v-if="editingForm.exercise_type === 1 || editingForm.exercise_type === 2 || editingForm.exercise_type === 5" class="form-item-options">
          <div class="options-list">
            <div v-for="(opt, idx) in editingForm.options" :key="idx" class="option-edit-row">
              <el-input v-model="opt.option_key" style="width: 50px;" placeholder="选项" size="small" />
              <div class="option-editor-wrapper">
                <RichEditor v-model="opt.option_value" placeholder="选项内容" :height="80" />
              </div>
              <el-button type="danger" size="small" @click="removeOption(idx)">删除</el-button>
            </div>
          </div>
          <el-button type="primary" size="small" @click="addOption" class="add-option-btn">
            <el-icon><Plus /></el-icon> 添加选项
          </el-button>
        </el-form-item>
        
        <!-- 解答题小题部分 -->
        <el-form-item label="小题列表" v-if="editingForm.exercise_type === 4">
          <div class="subs-list">
            <div v-for="(sub, idx) in (editingForm.subs || [])" :key="idx" class="sub-item-editor">
              <div class="sub-header">
                <span class="sub-index">小题 {{ idx + 1 }}</span>
                <el-input v-model="sub.score" placeholder="分值" style="width: 80px" size="small">
                  <template #append>分</template>
                </el-input>
                <el-button type="danger" size="small" @click="removeSub(idx)">删除</el-button>
              </div>
              <div class="sub-content">
                <el-form-item label="小题题干">
                  <RichEditor v-model="sub.stem" placeholder="请输入小题题干" :height="80" />
                </el-form-item>
                <el-form-item label="小题答案">
                  <RichEditor v-model="sub.answer" placeholder="请输入小题答案" :height="80" />
                </el-form-item>
                <el-form-item label="小题解析">
                  <RichEditor v-model="sub.analysis" placeholder="请输入小题解析" :height="80" />
                </el-form-item>
              </div>
            </div>
          </div>
          <el-button type="primary" size="small" @click="addSub" class="mt-10">
            <el-icon><Plus /></el-icon> 添加小题
          </el-button>
        </el-form-item>
        
        <el-form-item label="答案" class="form-item-answer">
          <div class="editor-wrapper">
            <RichEditor v-model="editingForm.answer" placeholder="请输入答案" :height="100" />
          </div>
        </el-form-item>
        
        <el-form-item label="解析" class="form-item-analysis">
          <div class="editor-wrapper">
            <RichEditor v-model="editingForm.analysis" placeholder="请输入解析" :height="120" />
          </div>
        </el-form-item>
        
        <el-form-item label="试卷分值" class="form-item-score">
          <el-input-number v-model="editingForm.paper_score" :min="0" :max="100" />
        </el-form-item>
        
        <el-form-item label="考试全称">
          <el-input v-model="editingForm.exam_full_name" placeholder="如：计算机学科基础综合" />
        </el-form-item>
        
        <el-form-item label="视频URL">
          <el-input v-model="editingForm.video_url" placeholder="请输入视频链接（如有）" />
        </el-form-item>

        <!-- 纠错备注 -->
        <div v-if="currentCorrection" class="correction-remark mt-20">
          <el-divider content-position="left">纠错处理</el-divider>
          <el-form-item label="管理员备注">
            <el-input v-model="adminRemark" type="textarea" placeholder="输入处理情况备注..." />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="editModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveQuestion" :loading="savingQuestion">保存修改</el-button>
      </template>
    </el-dialog>

    <!-- 科目编辑对话框 -->
    <el-dialog
      v-model="subjectModalVisible"
      :title="editingSubject?.id ? '编辑科目' : '创建科目'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="editingSubject" label-width="100px" v-if="editingSubject">
        <el-form-item label="科目名称" required>
          <el-input v-model="editingSubject.subject_name" placeholder="请输入科目名称" />
        </el-form-item>
        <el-form-item label="科目代码">
          <el-input v-model="editingSubject.subject_code" placeholder="请输入科目代码" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="editingSubject.sort" :min="0" />
        </el-form-item>
        <el-form-item label="分类名称">
          <el-input v-model="editingSubject.category_name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="是否上架">
          <el-switch
            v-model="editingSubject.is_on_shelf"
            :active-value="1"
            :inactive-value="0"
            active-text="上架"
            inactive-text="下架"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="subjectModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSubject">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 章节编辑对话框 -->
    <el-dialog
      v-model="chapterModalVisible"
      :title="editingChapter?.id ? '编辑章节' : '创建章节'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="editingChapter" label-width="100px" v-if="editingChapter">
        <el-form-item label="所属科目" required>
          <el-select v-model="editingChapter.major_id" style="width: 100%" disabled>
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="String(s.id)" />
          </el-select>
        </el-form-item>
        <el-form-item label="章节名称" required>
          <el-input v-model="editingChapter.chapter_name" placeholder="请输入章节名称" />
        </el-form-item>
        <el-form-item label="章节代码">
          <el-input v-model="editingChapter.chapter_code" placeholder="请输入章节代码" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="editingChapter.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="chapterModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveChapter">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 创建题目对话框 -->
    <el-dialog
      v-model="createQuestionModalVisible"
      title="创建题目"
      width="80%"
      top="5vh"
      destroy-on-close
      @close="onCreateQuestionModalClose"
    >
      <!-- JSON导入区域 -->
      <el-collapse v-model="jsonImportActive" class="mb-20">
        <el-collapse-item title="📋 JSON格式导入（快速创建）" name="json">
          <el-alert
            title="支持从JSON快速导入题目数据"
            description="粘贴JSON数据后点击解析，将自动填充表单。支持批量导入多个题目。"
            type="info"
            :closable="false"
            class="mb-10"
          />
          <el-input
            v-model="jsonImportText"
            type="textarea"
            :rows="6"
            placeholder="请粘贴JSON格式的题目数据...
示例格式:
{
  &quot;exercise_type_name&quot;: &quot;单选题&quot;,
  &quot;stem&quot;: &quot;题目内容&quot;,
  &quot;options&quot;: [{&quot;option_key&quot;: &quot;A&quot;, &quot;option_value&quot;: &quot;选项A&quot;}],
  &quot;answer&quot;: &quot;A&quot;,
  &quot;analysis&quot;: &quot;解析内容&quot;,
  &quot;knowledgeTags&quot;: [&quot;考点1&quot;]
}"
          />
          <div class="mt-10">
            <el-button type="primary" @click="parseJsonImport">解析JSON</el-button>
            <el-button @click="clearJsonImport">清空</el-button>
            <el-button type="success" link @click="showJsonExample = true">查看格式示例</el-button>
          </div>
          
          <!-- 批量导入操作区 -->
          <div v-if="isBatchImportMode && batchImportQuestions.length > 0" class="batch-import-actions mt-15">
            <el-alert
              :title="`已解析 ${batchImportQuestions.length} 道题目`"
              type="success"
              :closable="false"
              show-icon
              class="mb-10"
            />
            <el-row :gutter="10">
              <el-col :span="12">
                <el-button 
                  type="warning" 
                  size="large" 
                  style="width: 100%;"
                  :loading="isBatchImporting"
                  @click="importAllQuestions"
                >
                  <el-icon><Upload /></el-icon>
                  一键导入全部题目 ({{ batchImportQuestions.length }}道)
                </el-button>
              </el-col>
              <el-col :span="12">
                <el-button 
                  type="info" 
                  size="large" 
                  style="width: 100%;"
                  @click="previewBatchQuestions"
                >
                  <el-icon><View /></el-icon>
                  预览题目列表
                </el-button>
              </el-col>
            </el-row>
            <el-text type="info" size="small" class="mt-5" style="display: block;">
              提示：一键导入将自动为所有题目设置相同的科目和章节
            </el-text>
          </div>
        </el-collapse-item>
      </el-collapse>

      <el-form :model="newQuestionForm" label-position="top" v-if="newQuestionForm">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="题型" required>
              <el-select v-model="newQuestionForm.exercise_type_name" style="width: 100%">
                <el-option label="单选题" value="单选题" />
                <el-option label="多选题" value="多选题" />
                <el-option label="填空题" value="填空题" />
                <el-option label="解答题" value="解答题" />
                <el-option label="判断题" value="判断题" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="所属科目" required>
              <el-select v-model="newQuestionForm.major_id" style="width: 100%" @change="onCreateQuestionSubjectChange">
                <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="String(s.id)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="所属章节">
              <el-select v-model="newQuestionForm.chapter_id" style="width: 100%">
                <el-option v-for="c in createQuestionChapters" :key="c.id" :label="c.name" :value="String(c.id)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="难度">
              <el-rate v-model="newQuestionForm.level" :max="5" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 题干部分 -->
        <el-form-item label="纯文本题干" required>
          <el-input v-model="newQuestionForm.stem" type="textarea" :rows="3" placeholder="请输入题干" />
        </el-form-item>
        
        <el-form-item label="题干(富文本)">
          <div class="richtext-expand-section">
            <el-button type="primary" link @click="showNewQuestionStemRichText = !showNewQuestionStemRichText">
              {{ showNewQuestionStemRichText ? '收起富文本编辑器' : '展开富文本编辑器' }}
            </el-button>
            <div v-if="showNewQuestionStemRichText" class="richtext-editor-wrapper">
              <RichEditor v-model="newQuestionForm.stem_richtext" :height="200" placeholder="请输入富文本题干..." />
            </div>
          </div>
        </el-form-item>

        <!-- 选项部分 -->
        <div v-if="['单选题', '多选题'].includes(newQuestionForm.exercise_type_name)">
          <el-form-item label="选项">
            <div class="options-list">
              <div v-for="(opt, idx) in newQuestionForm.options" :key="idx" class="option-item">
                <div class="option-row">
                  <span class="option-label">{{ String.fromCharCode(65 + idx) }}</span>
                  <el-input 
                    v-model="opt.option_value" 
                    type="textarea" 
                    :rows="2"
                    placeholder="选项内容" 
                    class="option-input"
                  />
                  <el-button link type="danger" @click="removeNewQuestionOption(idx)">删除</el-button>
                </div>
              </div>
            </div>
            <el-button type="primary" link @click="addNewQuestionOption" class="mt-10">+ 添加选项</el-button>
          </el-form-item>
        </div>

        <!-- 解答题小题部分 -->
        <div v-if="newQuestionForm.exercise_type_name === '解答题'">
          <el-form-item label="小题列表">
            <div class="sub-questions-list">
              <div v-for="(sub, idx) in newQuestionForm.subQuestions" :key="idx" class="sub-question-item">
                <el-card class="sub-question-card" :header="`小题 ${idx + 1}`">
                  <el-form-item label="小题题干">
                    <el-input v-model="sub.sub_stem" type="textarea" :rows="2" placeholder="请输入小题题干" />
                  </el-form-item>
                  <el-form-item label="小题答案">
                    <el-input v-model="sub.sub_answer" type="textarea" :rows="2" placeholder="请输入小题答案" />
                  </el-form-item>
                  <el-form-item label="小题解析">
                    <el-input v-model="sub.sub_analysis" type="textarea" :rows="2" placeholder="请输入小题解析" />
                  </el-form-item>
                  <el-form-item label="小题分值">
                    <el-input-number v-model="sub.sub_score" :min="0" :max="100" />
                  </el-form-item>
                  <div class="sub-question-actions">
                    <el-button link type="danger" @click="removeNewQuestionSubQuestion(idx)">删除小题</el-button>
                  </div>
                </el-card>
              </div>
            </div>
            <el-button type="primary" link @click="addNewQuestionSubQuestion" class="mt-10">+ 添加小题</el-button>
          </el-form-item>
        </div>

        <!-- 答案部分 -->
        <el-form-item label="纯文本答案">
          <el-input v-model="newQuestionForm.answer" type="textarea" :rows="3" placeholder="请输入答案" />
        </el-form-item>
        
        <el-form-item label="答案(富文本)">
          <div class="richtext-expand-section">
            <el-button type="primary" link @click="showNewQuestionAnswerRichText = !showNewQuestionAnswerRichText">
              {{ showNewQuestionAnswerRichText ? '收起富文本编辑器' : '展开富文本编辑器' }}
            </el-button>
            <div v-if="showNewQuestionAnswerRichText" class="richtext-editor-wrapper">
              <RichEditor v-model="newQuestionForm.answer_richtext" :height="200" placeholder="请输入富文本答案..." />
            </div>
          </div>
        </el-form-item>

        <!-- 解析部分 -->
        <el-form-item label="解析(富文本)">
          <div class="richtext-expand-section">
            <el-button type="primary" link @click="showNewQuestionAnalysisRichText = !showNewQuestionAnalysisRichText">
              {{ showNewQuestionAnalysisRichText ? '收起富文本编辑器' : '展开富文本编辑器' }}
            </el-button>
            <div v-if="showNewQuestionAnalysisRichText" class="richtext-editor-wrapper">
              <RichEditor v-model="newQuestionForm.analysis_richtext" :height="200" placeholder="请输入解析..." />
            </div>
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="总分">
              <el-input-number v-model="newQuestionForm.total_score" :min="0" :max="100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="试卷名称">
              <el-input v-model="newQuestionForm.exam_full_name" placeholder="试卷名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="年份">
              <el-input v-model="newQuestionForm.exam_time" placeholder="年份" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 知识点标签 -->
        <el-form-item label="知识点标签">
          <div class="tags-section">
            <div v-for="(tag, idx) in newQuestionForm.knowledgeTags" :key="idx" class="tag-item">
              <el-input v-model="newQuestionForm.knowledgeTags[idx]" placeholder="标签名称" style="width: 200px" />
              <el-button link type="danger" @click="removeNewQuestionTag(idx)">删除</el-button>
            </div>
            <el-button type="primary" link @click="addNewQuestionTag" class="mt-10">+ 添加标签</el-button>
          </div>
        </el-form-item>
        </el-form>
        
        <!-- 批量导入导航 -->
      <div v-if="isBatchImportMode && batchImportQuestions.length > 1" class="batch-import-nav">
        <el-divider />
        <el-row align="middle" justify="center">
          <el-col :span="8" style="text-align: center;">
            <el-button 
              type="primary" 
              :disabled="currentBatchIndex === 0"
              @click="loadPrevBatchQuestion"
            >
              <el-icon><ArrowLeft /></el-icon> 上一题
            </el-button>
          </el-col>
          <el-col :span="8" style="text-align: center;">
            <el-tag type="info" size="large">
              第 {{ currentBatchIndex + 1 }} / {{ batchImportQuestions.length }} 题
            </el-tag>
          </el-col>
          <el-col :span="8" style="text-align: center;">
            <el-button 
              type="primary" 
              :disabled="currentBatchIndex === batchImportQuestions.length - 1"
              @click="loadNextBatchQuestion"
            >
              下一题 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </el-col>
        </el-row>
        <el-row style="margin-top: 10px;">
          <el-col :span="24" style="text-align: center;">
            <el-text type="info">点击"创建"保存当前题目，然后继续下一题</el-text>
          </el-col>
        </el-row>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createQuestionModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveNewQuestion" :loading="creatingQuestion">
            {{ isBatchImportMode ? `创建 (第 ${currentBatchIndex + 1}/${batchImportQuestions.length} 题)` : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量导入预览对话框 -->
    <el-dialog
      v-model="showBatchPreview"
      title="批量导入题目预览"
      width="80%"
      top="5vh"
    >
      <div v-if="isBatchImporting" class="batch-progress">
        <el-progress 
          :percentage="Math.round((batchImportProgress.current / batchImportProgress.total) * 100)" 
          :format="() => `${batchImportProgress.current}/${batchImportProgress.total}`"
          :stroke-width="20"
          status="success"
        />
        <el-row class="mt-10" justify="center">
          <el-col :span="8" style="text-align: center;">
            <el-statistic title="成功" :value="batchImportProgress.success" value-style="color: #67C23A" />
          </el-col>
          <el-col :span="8" style="text-align: center;">
            <el-statistic title="失败" :value="batchImportProgress.failed" value-style="color: #F56C6C" />
          </el-col>
          <el-col :span="8" style="text-align: center;">
            <el-statistic title="总计" :value="batchImportProgress.total" />
          </el-col>
        </el-row>
      </div>
      
      <el-table :data="batchImportQuestions" height="500" v-loading="isBatchImporting">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="题型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.exercise_type_name || row.type || '单选题' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="题干" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-html="row.stem || row.title || row.question || '无题干'"></span>
          </template>
        </el-table-column>
        <el-table-column label="选项/小题数" width="120">
          <template #default="{ row }">
            <span v-if="row.options && row.options.length > 0">
              {{ row.options.length }} 个选项
            </span>
            <span v-else-if="row.subQuestions && row.subQuestions.length > 0">
              {{ row.subQuestions.length }} 个小题
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.exam_full_name || row.source || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="年份" width="80">
          <template #default="{ row }">
            {{ row.exam_time || row.year || '-' }}
          </template>
        </el-table-column>
      </el-table>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showBatchPreview = false">关闭</el-button>
          <el-button 
            type="warning" 
            :loading="isBatchImporting"
            @click="importAllQuestions"
            v-if="!isBatchImporting"
          >
            一键导入全部 ({{ batchImportQuestions.length }}道)
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- JSON格式示例对话框 -->
    <el-dialog
      v-model="showJsonExample"
      title="JSON格式示例"
      width="70%"
      top="5vh"
    >
      <el-tabs type="border-card">
        <el-tab-pane label="单选题示例">
          <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto;">{{ jsonExampleSingle }}</pre>
          <el-button type="primary" @click="copyJsonExample(jsonExampleSingle)">复制示例</el-button>
        </el-tab-pane>
        <el-tab-pane label="多选题示例">
          <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto;">{{ jsonExampleMultiple }}</pre>
          <el-button type="primary" @click="copyJsonExample(jsonExampleMultiple)">复制示例</el-button>
        </el-tab-pane>
        <el-tab-pane label="填空题示例">
          <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto;">{{ jsonExampleFill }}</pre>
          <el-button type="primary" @click="copyJsonExample(jsonExampleFill)">复制示例</el-button>
        </el-tab-pane>
        <el-tab-pane label="解答题示例">
          <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto;">{{ jsonExampleEssay }}</pre>
          <el-button type="primary" @click="copyJsonExample(jsonExampleEssay)">复制示例</el-button>
        </el-tab-pane>
        <el-tab-pane label="解答题(带小题)示例">
          <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto;">{{ jsonExampleEssayWithSubs }}</pre>
          <el-button type="primary" @click="copyJsonExample(jsonExampleEssayWithSubs)">复制示例</el-button>
        </el-tab-pane>
        <el-tab-pane label="批量导入示例">
          <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto;">{{ jsonExampleBatch }}</pre>
          <el-button type="primary" @click="copyJsonExample(jsonExampleBatch)">复制示例</el-button>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 添加题目到章节对话框 -->
    <el-dialog
      v-model="addQuestionsModalVisible"
      title="添加题目到章节"
      width="90%"
      top="5vh"
      destroy-on-close
    >
      <div v-if="currentChapterForAddQuestions">
        <el-alert :title="`正在为章节 [${currentChapterForAddQuestions.name}] 添加题目`" type="info" :closable="false" class="mb-20" />
        
        <!-- 题目来源选择 -->
        <el-tabs v-model="questionSourceTab" type="border-card" class="mb-20" @tab-change="onQuestionSourceTabChange">
          <el-tab-pane label="从错题统计选择" name="wrong-stats">
            <div class="filter-bar mb-10">
              <el-button type="success" @click="addSelectedWrongQuestions" :disabled="selectedWrongQuestions.length === 0" :loading="addingWrongQuestions">
                添加选中的 {{ selectedWrongQuestions.length }} 道题目
              </el-button>
            </div>
            
            <el-table 
              :data="wrongStatsForSelection" 
              v-loading="loadingWrongStatsForSelection" 
              border 
              stripe
              @selection-change="handleWrongQuestionSelectionChange"
              height="400"
            >
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column prop="QuestionID" label="题目ID" width="150" align="center" show-overflow-tooltip />
              <el-table-column prop="exercise_type_name" label="题型" width="80" align="center" />
              <el-table-column prop="stem" label="题干内容" min-width="250" show-overflow-tooltip>
                <template #default="{ row }">
                  <div v-html="stripHtml(row.stem)"></div>
                </template>
              </el-table-column>
              <el-table-column prop="error_count" label="错误人数" width="90" align="center" sortable />
              <el-table-column prop="total_attempts" label="总练习次数" width="100" align="center" sortable />
              <el-table-column label="错误率" width="100" align="center">
                <template #default="{ row }">
                  <el-progress :percentage="calculateErrorRate(row)" :status="calculateErrorRate(row) > 50 ? 'exception' : 'warning'" />
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          
          <el-tab-pane label="从题库搜索选择" name="search">
            <div class="filter-bar mb-10">
              <el-row :gutter="10">
                <el-col :span="8">
                  <el-input 
                    v-model="searchForAddQuestions.keyword" 
                    placeholder="搜索题目内容或ID..." 
                    clearable
                    @input="debounceSearchQuestions"
                  />
                </el-col>
                <el-col :span="5">
                  <el-select 
                    v-model="searchForAddQuestions.type" 
                    placeholder="题型" 
                    clearable 
                    style="width: 100%"
                    @change="searchQuestionsForSelection"
                  >
                    <el-option label="单选题" value="单选题" />
                    <el-option label="多选题" value="多选题" />
                    <el-option label="填空题" value="填空题" />
                    <el-option label="解答题" value="解答题" />
                    <el-option label="判断题" value="判断题" />
                  </el-select>
                </el-col>
                <el-col :span="11">
                  <el-button type="success" @click="addSelectedSearchQuestions" :disabled="selectedSearchQuestions.length === 0">
                    添加选中的 {{ selectedSearchQuestions.length }} 道题目
                  </el-button>
                </el-col>
              </el-row>
            </div>
            
            <el-table 
              :data="questionsForSelection" 
              v-loading="loadingQuestionsForSelection" 
              border 
              stripe
              @selection-change="handleSearchQuestionSelectionChange"
              height="400"
            >
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column prop="question_id" label="题目ID" width="150" align="center" show-overflow-tooltip />
              <el-table-column prop="exercise_type_name" label="题型" width="80" align="center" />
              <el-table-column prop="stem" label="题干内容" min-width="300" show-overflow-tooltip>
                <template #default="{ row }">
                  <div v-html="stripHtml(row.stem)"></div>
                </template>
              </el-table-column>
              <el-table-column prop="major_name" label="所属科目" width="120" align="center" />
            </el-table>
            
            <div class="pagination-container mt-10">
              <el-pagination
                v-model:current-page="searchForAddQuestions.page"
                v-model:page-size="searchForAddQuestions.pageSize"
                :total="questionsForSelectionTotal"
                layout="total, prev, pager, next"
                @current-change="searchQuestionsForSelection"
              />
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="从试卷选择" name="from-paper">
            <div class="filter-bar mb-10">
              <el-row :gutter="10">
                <el-col :span="6">
                  <el-select 
                    v-model="paperFilter.type" 
                    placeholder="试卷类型" 
                    clearable 
                    style="width: 100%"
                    @change="onPaperTypeChange"
                  >
                    <el-option label="真题卷" value="1" />
                    <el-option label="模拟卷" value="2" />
                  </el-select>
                </el-col>
                <el-col :span="10">
                  <el-select 
                    v-model="paperFilter.selectedPaper" 
                    placeholder="选择试卷" 
                    filterable
                    style="width: 100%"
                    @change="onPaperSelectChange"
                    :loading="loadingPapers"
                  >
                    <el-option 
                      v-for="p in paperList" 
                      :key="p.id" 
                      :label="`${p.title} (${p.year || '无年份'} ${p.school || ''})`" 
                      :value="p.id" 
                    />
                  </el-select>
                </el-col>
                <el-col :span="8">
                  <el-button type="success" @click="addSelectedPaperQuestions" :disabled="selectedPaperQuestions.length === 0">
                    添加选中的 {{ selectedPaperQuestions.length }} 道题目
                  </el-button>
                </el-col>
              </el-row>
            </div>
            
            <div class="filter-bar mb-10" v-if="paperQuestions.length > 0">
              <el-row :gutter="10">
                <el-col :span="8">
                  <el-input 
                    v-model="paperQuestionFilter.keyword" 
                    placeholder="筛选题目内容..." 
                    clearable
                    @input="filterPaperQuestions"
                  />
                </el-col>
                <el-col :span="6">
                  <el-select 
                    v-model="paperQuestionFilter.type" 
                    placeholder="题型筛选" 
                    clearable 
                    style="width: 100%"
                    @change="filterPaperQuestions"
                  >
                    <el-option label="单选题" value="单选题" />
                    <el-option label="多选题" value="多选题" />
                    <el-option label="填空题" value="填空题" />
                    <el-option label="解答题" value="解答题" />
                    <el-option label="判断题" value="判断题" />
                  </el-select>
                </el-col>
                <el-col :span="10">
                  <span class="text-muted">共 {{ filteredPaperQuestions.length }} / {{ paperQuestions.length }} 道题目</span>
                </el-col>
              </el-row>
            </div>
            
            <el-table 
              :data="filteredPaperQuestions" 
              v-loading="loadingPaperQuestions" 
              border 
              stripe
              @selection-change="handlePaperQuestionSelectionChange"
              height="400"
            >
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column prop="exercise_number" label="题号" width="70" align="center" />
              <el-table-column prop="exercise_type_name" label="题型" width="90" align="center" />
              <el-table-column prop="stem" label="题干内容" min-width="300" show-overflow-tooltip>
                <template #default="{ row }">
                  <div v-html="stripHtml(row.stem)"></div>
                </template>
              </el-table-column>
              <el-table-column prop="score" label="分值" width="70" align="center" />
            </el-table>
          </el-tab-pane>
          
          <el-tab-pane label="当前章节题集" name="current-set">
            <div class="filter-bar mb-10">
              <el-button @click="fetchChapterQuestionSet" :loading="loadingChapterQuestionSet">刷新</el-button>
              <span class="ml-10">共 {{ chapterQuestionSet.length }} 道题目</span>
            </div>
            
            <el-table :data="chapterQuestionSet" v-loading="loadingChapterQuestionSet" border stripe height="400">
              <el-table-column prop="question_id" label="题目ID" width="150" align="center" show-overflow-tooltip />
              <el-table-column prop="exercise_type_name" label="题型" width="80" align="center" />
              <el-table-column prop="stem" label="题干内容" min-width="300" show-overflow-tooltip>
                <template #default="{ row }">
                  <div v-html="stripHtml(row.stem)"></div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template #default="{ row }">
                  <el-button size="small" type="danger" @click="removeQuestionFromChapterSet(row.question_id)">移除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addQuestionsModalVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick, computed } from 'vue'
import { adminApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete, UploadFilled, Download, QuestionFilled, Plus, ArrowRight, ArrowDown, CirclePlus, Check, Folder, Document, Refresh, Upload, Rank } from '@element-plus/icons-vue'
import { transformContextString } from '@/utils/latex'
import RichEditor from '@/components/RichEditor.vue'
import draggable from 'vuedraggable'

const activeTab = ref('corrections')
const loadingCorrections = ref(false)
const loadingQuestions = ref(false)
const loadingStats = ref(false)
const importing = ref(false)

// 导入试题标签页
const importActiveTab = ref('paper-import')



// 错题统计相关
const wrongStats = ref([])

// 纠错相关
const corrections = ref([])
const correctionFilter = reactive({
  status: 1, // 1: 待处理
  page: 1,
  pageSize: 20
})
const currentCorrection = ref(null)
const adminRemark = ref('')

// 题目相关
const questions = ref([])
const questionTotal = ref(0)
const questionFilter = reactive({
  keyword: '',
  major_id: '',
  type: '',
  noValidTags: false,
  noChapter: false,
  noTags: false,
  noMajor: false,
  page: 1,
  pageSize: 20
})

// 批量添加考点相关
const batchAddTagsVisible = ref(false)
const batchAddTagsLoading = ref(false)
const batchAddTagsForm = reactive({
  major_id: '',
  jsonData: ''
})

// 导出相关
const exportModalVisible = ref(false)
const exportLoading = ref(false)
const exportForm = reactive({
  major_ids: [],
  noMajorOnly: false,
  includeOptions: true,
  includeSubs: true
})

// 选择考点弹窗相关
const selectTagModalVisible = ref(false)
const selectTagForm = reactive({
  major_id: '',
  chapter_id: '',
  tag_id: ''
})
const selectTagChapters = ref([])
const selectTagList = ref([])

const subjects = ref([])
const chapters = ref([])
const expandedChapters = ref([]) // 展开的章节ID列表
const sections = ref([]) // 小节列表（考点）
const selectedSectionTagId = ref('') // 选中的小节（考点ID）
const tagChapterInfoMap = ref({}) // 缓存考点的章节信息

const editModalVisible = ref(false)
const editingForm = ref(null)
const savingQuestion = ref(false)

// 科目管理
const loadingSubjects = ref(false)
const subjectModalVisible = ref(false)
const editingSubject = ref(null)

// 章节管理
const loadingChapters = ref(false)
const chapterFilter = reactive({
  major_id: ''
})
const selectedSubject = ref(null)
const chapterModalVisible = ref(false)
const editingChapter = ref(null)

// 考点管理
const loadingTags = ref(false)
const tags = ref([])
const tagTotal = ref(0)
const allChapters = ref([])
const tagFilter = reactive({
  chapterId: '',
  keyword: '',
  showUnnamed: false,
  showInvalid: false,
  page: 1,
  pageSize: 20
})
const editingTagId = ref(null)
const editingTagName = ref('')
const tagNameInput = ref(null)
const moveTagModalVisible = ref(false)
const movingTag = ref(null)
const targetChapterId = ref('')
const createTagModalVisible = ref(false)
const newTagForm = reactive({
  name: '',
  chapterId: ''
})

// 批量选择相关
const selectedTags = ref([])
const batchMoveModalVisible = ref(false)

// 考点题目展开相关
const tagQuestions = ref({})
const loadingTagQuestions = ref({})

// 创建题目
const createQuestionModalVisible = ref(false)
const creatingQuestion = ref(false)
const newQuestionForm = ref(null)
const createQuestionChapters = ref([])
const showNewQuestionStemRichText = ref(false)
const showNewQuestionAnswerRichText = ref(false)
const showNewQuestionAnalysisRichText = ref(false)

// 从章节创建考点相关
const currentChapterForCreateTag = ref(null)

// JSON导入相关
const jsonImportActive = ref([]) // 控制JSON导入区域展开/折叠
const jsonImportText = ref('') // JSON导入文本
const showJsonExample = ref(false) // 显示JSON示例对话框

// JSON示例数据
const jsonExampleSingle = JSON.stringify({
  "exercise_type_name": "单选题",
  "stem": "下列关于数据结构的叙述中，正确的是？",
  "options": [
    { "option_key": "A", "option_value": "数据结构是计算机存储、组织数据的方式" },
    { "option_key": "B", "option_value": "数据结构只包括逻辑结构" },
    { "option_key": "C", "option_value": "数据结构只包括物理结构" },
    { "option_key": "D", "option_value": "数据结构不包括算法" }
  ],
  "answer": "A",
  "analysis": "数据结构是计算机中存储、组织数据的方式，包括逻辑结构和物理结构两个方面。",
  "level": 3,
  "knowledgeTags": ["数据结构基本概念"],
  "exam_full_name": "2024年数据结构期末考试",
  "exam_time": "2024"
}, null, 2)

const jsonExampleMultiple = JSON.stringify({
  "exercise_type_name": "多选题",
  "stem": "下列哪些是线性数据结构？",
  "options": [
    { "option_key": "A", "option_value": "数组" },
    { "option_key": "B", "option_value": "链表" },
    { "option_key": "C", "option_value": "栈" },
    { "option_key": "D", "option_value": "队列" },
    { "option_key": "E", "option_value": "树" }
  ],
  "answer": "ABCD",
  "analysis": "数组、链表、栈、队列都是线性数据结构，树是非线性数据结构。",
  "level": 2,
  "knowledgeTags": ["线性表", "数据结构分类"],
  "exam_full_name": "2024年数据结构期中考试",
  "exam_time": "2024"
}, null, 2)

const jsonExampleFill = JSON.stringify({
  "exercise_type_name": "填空题",
  "stem": "栈的特点是______，队列的特点是______。",
  "answer": "先进后出（FILO），先进先出（FIFO）",
  "analysis": "栈是一种后进先出（LIFO）或先进后出（FILO）的线性表，队列是一种先进先出（FIFO）的线性表。",
  "level": 2,
  "knowledgeTags": ["栈", "队列"],
  "exam_full_name": "2024年数据结构单元测试",
  "exam_time": "2024"
}, null, 2)

const jsonExampleEssay = JSON.stringify({
  "exercise_type_name": "解答题",
  "stem": "请简述二叉树的前序、中序、后序遍历算法，并给出时间复杂度分析。",
  "answer": "前序遍历：根-左-右；中序遍历：左-根-右；后序遍历：左-右-根。三种遍历算法的时间复杂度均为O(n)，其中n为二叉树的节点数。",
  "analysis": "二叉树的三种遍历方式都是递归算法，每个节点只访问一次，因此时间复杂度为O(n)。",
  "level": 4,
  "knowledgeTags": ["树与二叉树", "二叉树遍历"],
  "exam_full_name": "2024年数据结构期末考试",
  "exam_time": "2024",
  "total_score": 10
}, null, 2)

const jsonExampleEssayWithSubs = JSON.stringify({
  "exercise_type_name": "解答题",
  "stem": "名词解释：",
  "options": [
    {
      "questionOrder": 1,
      "questionStem": "顺序存储与链式存储；",
      "questionAnswer": "顺序存储方式就是在一块连续的存储区域一个接着一个的存放数据...",
      "questionAnalysis": "顺序存储方式也称为顺序存储结构，一般采用数组或者结构数组来描述...",
      "questionScore": 5
    },
    {
      "questionOrder": 2,
      "questionStem": "广义表；",
      "questionAnswer": "广义表是n（n≥0）个数据元素的有序序列...",
      "questionAnalysis": "广义表可以是递归的表，即广义表也可以是其自身的子表。",
      "questionScore": 5
    }
  ],
  "level": 2,
  "knowledgeTags": ["数据结构基本概念"],
  "exam_full_name": "2024年数据结构期末考试",
  "exam_time": "2024",
  "total_score": 10
}, null, 2)

const jsonExampleBatch = JSON.stringify([
  {
    "exercise_type_name": "单选题",
    "stem": "第一题题目内容",
    "options": [
      { "option_key": "A", "option_value": "选项A" },
      { "option_key": "B", "option_value": "选项B" }
    ],
    "answer": "A",
    "analysis": "第一题解析"
  },
  {
    "exercise_type_name": "单选题",
    "stem": "第二题题目内容",
    "options": [
      { "option_key": "A", "option_value": "选项A" },
      { "option_key": "B", "option_value": "选项B" }
    ],
    "answer": "B",
    "analysis": "第二题解析"
  }
], null, 2)

// 复制JSON示例到剪贴板
const copyJsonExample = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
}

// 添加题目到章节
const addQuestionsModalVisible = ref(false)
const currentChapterForAddQuestions = ref(null)
const questionSourceTab = ref('wrong-stats')
// 错题统计选择
const wrongStatsForSelection = ref([])
const loadingWrongStatsForSelection = ref(false)
const selectedWrongQuestions = ref([])
// 题库搜索选择
const searchForAddQuestions = reactive({
  keyword: '',
  type: '',
  page: 1,
  pageSize: 20
})
const questionsForSelection = ref([])
const questionsForSelectionTotal = ref(0)
const loadingQuestionsForSelection = ref(false)
const selectedSearchQuestions = ref([])
// 当前章节题集
const chapterQuestionSet = ref([])
const loadingChapterQuestionSet = ref(false)

// 从试卷选择题目
const paperFilter = reactive({
  type: '', // 1-真题卷, 2-模拟卷
  selectedPaper: ''
})
const paperList = ref([])
const loadingPapers = ref(false)
const paperQuestions = ref([])
const filteredPaperQuestions = ref([])
const loadingPaperQuestions = ref(false)
const selectedPaperQuestions = ref([])
const paperQuestionFilter = reactive({
  keyword: '',
  type: ''
})

// 试卷导入
const paperFileList = ref([])
const detectedPapers = ref([])
const paperImportType = ref(1) // 1-真题卷, 2-模拟卷
const tagParseMode = ref(1) // 1-标准模式, 2-考点模式

// 计算试卷导入的总题目数量
const totalPaperQuestionCount = computed(() => {
  return paperFileList.value.reduce((sum, file) => sum + (file.data?.length || 0), 0)
})

// 批量导入试题
const questionFileList = ref([])
const importingQuestions = ref(false)

// 计算总题目数量
const totalQuestionCount = computed(() => {
  return questionFileList.value.reduce((sum, file) => sum + (file.data?.length || 0), 0)
})

// 所有题目的预览（前5道）
const allQuestionsPreview = computed(() => {
  const all = questionFileList.value.flatMap(file => file.data || [])
  return all.slice(0, 5)
})

// 富文本编辑器显示控制
const showStemRichText = ref(false)
const showAnswerRichText = ref(false)
const showAnalysisRichText = ref(false)

// 检查富文本是否有有效内容
const hasValidRichText = (content) => {
  if (!content) return false
  const text = content.replace(/<[^>]+>/g, '').trim()
  return text.length > 0 && content !== '<p><br></p>'
}

// 格式化时间
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString()
}

// 渲染 LaTeX/Math
const renderMath = (text) => {
  return transformContextString(text || '')
}

// 去除 HTML 标签用于摘要
const stripHtml = (html) => {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, '')
}

// 获取科目列表
const fetchSubjects = async () => {
  loadingSubjects.value = true
  try {
    const res = await adminApi.getComputerSubjects({ admin: 1 })
    console.log('获取科目列表:', res.data)
    subjects.value = res.data || []
    // 获取科目后，默认选中第一个
    nextTick(() => {
      selectFirstSubject()
    })
  } catch (error) {
    console.error('获取科目失败:', error)
    ElMessage.error('获取科目列表失败')
  } finally {
    loadingSubjects.value = false
  }
}

// 打开科目编辑弹窗
const openSubjectModal = (subject = null) => {
  if (subject) {
    editingSubject.value = {
      id: subject.id,
      subject_name: subject.name,
      subject_code: subject.code,
      sort: 0,
      is_on_shelf: subject.is_on_shelf ?? 1,
      category_name: ''
    }
  } else {
    editingSubject.value = {
      subject_name: '',
      subject_code: '',
      sort: 0,
      is_on_shelf: 1,
      category_name: ''
    }
  }
  subjectModalVisible.value = true
}

// 保存科目
const saveSubject = async () => {
  if (!editingSubject.value.subject_name) {
    ElMessage.warning('请输入科目名称')
    return
  }
  try {
    if (editingSubject.value.id) {
      await adminApi.updateComputerSubject(editingSubject.value.id, editingSubject.value)
      ElMessage.success('科目更新成功')
    } else {
      await adminApi.createComputerSubject(editingSubject.value)
      ElMessage.success('科目创建成功')
    }
    subjectModalVisible.value = false
    fetchSubjects()
  } catch (error) {
    console.error('保存科目失败:', error)
    ElMessage.error('保存失败')
  }
}

// 删除科目
const deleteSubject = (id) => {
  ElMessageBox.confirm('确定要删除这个科目吗？删除后将同时删除该科目下的所有章节和题目！', '警告', { type: 'warning' }).then(async () => {
    try {
      await adminApi.deleteComputerSubject(id)
      ElMessage.success('删除成功')
      fetchSubjects()
    } catch (error) {
      console.error('删除科目失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 切换科目上下架状态
const toggleSubjectShelf = async (subject) => {
  try {
    const newStatus = subject.is_on_shelf === 1 ? 0 : 1
    await adminApi.updateComputerSubject(subject.id, { is_on_shelf: newStatus })
    ElMessage.success(newStatus === 1 ? '科目已上架' : '科目已下架')
    fetchSubjects()
  } catch (error) {
    console.error('切换科目状态失败:', error)
    ElMessage.error('操作失败')
  }
}

// 获取章节列表
// 章节下的考点（小节）数据
const chapterSections = ref({}) // { chapterId: [sections] }
const loadingSections = ref({}) // { chapterId: boolean }

// 将章节列表转换为带层级的显示列表（包含考点小节）
const displayedChapters = computed(() => {
  const result = []
  const expandedIds = new Set(expandedChapters.value.map(id => String(id)))

  chapters.value.forEach(chapter => {
    const chapterId = String(chapter.id)
    // 添加章节
    const sections = chapterSections.value[chapterId] || []
    const isExpanded = expandedIds.has(chapterId)
    // 如果有考点数据，使用实际数量；否则默认显示为可展开（点击后加载）
    const hasSections = sections.length > 0 || !chapterSections.value.hasOwnProperty(chapterId)
    const sectionCount = sections.length

    result.push({
      ...chapter,
      id: chapterId,
      level: 0,
      isChapter: true,
      hasChildren: hasSections,
      isExpanded,
      sectionCount: sectionCount,
      hasLoaded: chapterSections.value.hasOwnProperty(chapterId)
    })

    // 如果展开且有考点，添加考点作为子项
    if (isExpanded && sections.length > 0) {
      sections.forEach((section, index) => {
        console.log('处理考点:', section)
        result.push({
          ...section,
          id: `section-${chapterId}-${section.tag_id || section.id || index}`,
          originalId: section.tag_id || section.id,
          name: section.tag_name || section.name || section.TagName || `考点${index + 1}`,
          level: 1,
          isSection: true,
          parentChapterId: chapterId,
          totalQuestions: section.question_count || section.totalQuestions || 0
        })
      })
    }
  })

  return result
})

// 获取章节下的考点（小节）
const fetchChapterSections = async (chapterId) => {
  const id = String(chapterId)
  if (loadingSections.value[id]) return

  loadingSections.value[id] = true
  try {
    console.log('获取章节考点:', id)
    const res = await adminApi.getComputerTags({ chapterId: id, pageSize: 1000 })
    console.log('获取到考点数据:', res.data)
    if (res.data) {
      // 如果是分页数据，取 list 数组
      const sections = res.data.list || res.data
      console.log('解析后的考点列表:', sections)
      // 打印第一个考点的字段，用于调试
      if (sections.length > 0) {
        console.log('第一个考点字段:', sections[0])
      }
      chapterSections.value[id] = sections
    }
  } catch (error) {
    console.error('获取考点失败:', error)
    chapterSections.value[id] = []
  } finally {
    loadingSections.value[id] = false
  }
}

// 切换章节展开/收起
const toggleChapterExpand = async (row) => {
  if (!row.isChapter) return

  const chapterId = String(row.id)
  const index = expandedChapters.value.findIndex(id => String(id) === chapterId)
  if (index > -1) {
    // 收起
    expandedChapters.value.splice(index, 1)
  } else {
    // 展开，先获取考点数据
    expandedChapters.value.push(chapterId)
    if (!chapterSections.value[chapterId]) {
      await fetchChapterSections(chapterId)
    }
  }
}

const fetchChapters = async (majorId) => {
  if (!majorId) {
    chapters.value = []
    return
  }
  loadingChapters.value = true
  try {
    const res = await adminApi.getComputerChapters({ majorId })
    // 适配新的数据结构 { chapters: [...], subjectTotal: ... }
    if (res.data && res.data.chapters) {
      chapters.value = res.data.chapters
    } else {
      // 兼容旧数据结构
      chapters.value = res.data || []
    }
  } catch (error) {
    console.error('获取章节失败:', error)
  } finally {
    loadingChapters.value = false
  }
}

// 章节筛选科目变化
const onChapterFilterSubjectChange = (val) => {
  if (val) {
    fetchChapters(val)
  } else {
    chapters.value = []
  }
}

// 选择科目
const selectSubject = (subject) => {
  selectedSubject.value = subject
  chapterFilter.major_id = subject.id
  fetchChapters(subject.id)
  // 清空展开状态
  expandedChapters.value = []
}

// 默认选中第一个科目
const selectFirstSubject = () => {
  if (subjects.value.length > 0 && !selectedSubject.value) {
    selectSubject(subjects.value[0])
  }
}

// 打开章节编辑弹窗
const openChapterModal = (chapter = null) => {
  if (chapter) {
    editingChapter.value = {
      id: chapter.id,
      major_id: chapterFilter.major_id,
      chapter_name: chapter.name,
      chapter_code: chapter.code,
      sort: 0
    }
  } else {
    editingChapter.value = {
      major_id: chapterFilter.major_id,
      chapter_name: '',
      chapter_code: '',
      sort: 0
    }
  }
  chapterModalVisible.value = true
}

// 保存章节
const saveChapter = async () => {
  if (!editingChapter.value.chapter_name) {
    ElMessage.warning('请输入章节名称')
    return
  }
  try {
    if (editingChapter.value.id) {
      await adminApi.updateComputerChapter(editingChapter.value.id, editingChapter.value)
      ElMessage.success('章节更新成功')
    } else {
      await adminApi.createComputerChapter(editingChapter.value)
      ElMessage.success('章节创建成功')
    }
    chapterModalVisible.value = false
    fetchChapters(chapterFilter.major_id)
  } catch (error) {
    console.error('保存章节失败:', error)
    ElMessage.error('保存失败')
  }
}

// 删除章节（科目章节管理）
const deleteSubjectChapter = (id) => {
  ElMessageBox.confirm('确定要删除这个章节吗？删除后将同时删除该章节下的所有题目！', '警告', { type: 'warning' }).then(async () => {
    try {
      await adminApi.deleteComputerChapter(id)
      ElMessage.success('删除成功')
      fetchChapters(chapterFilter.major_id)
    } catch (error) {
      console.error('删除章节失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 获取所有章节（用于考点管理）
const fetchAllChapters = async () => {
  try {
    const res = await adminApi.getComputerChapters({ pageSize: 1000 })
    // 映射章节数据，统一字段名
    allChapters.value = (res.data || []).map(c => ({
      id: c.chapter_id || c.id,
      name: c.chapter_name || c.name
    }))
  } catch (error) {
    console.error('获取章节列表失败:', error)
  }
}

// 考点管理方法
const fetchTags = async () => {
  loadingTags.value = true
  try {
    const params = {
      page: tagFilter.page,
      pageSize: tagFilter.pageSize,
      chapterId: tagFilter.chapterId,
      keyword: tagFilter.keyword,
      showUnnamed: tagFilter.showUnnamed,
      showInvalid: tagFilter.showInvalid
    }
    const res = await adminApi.getComputerTags(params)
    tags.value = res.data.list || []
    tagTotal.value = res.data.total || 0
  } catch (error) {
    console.error('获取考点列表失败:', error)
    ElMessage.error('获取考点列表失败')
  } finally {
    loadingTags.value = false
  }
}

const startEditTag = (row) => {
  editingTagId.value = row.tag_id
  editingTagName.value = row.tag_name || ''
  nextTick(() => {
    tagNameInput.value?.focus()
  })
}

const saveTagName = async (row) => {
  if (!editingTagName.value.trim()) {
    ElMessage.warning('考点名称不能为空')
    return
  }
  try {
    await adminApi.updateComputerTag(row.tag_id, { tag_name: editingTagName.value.trim() })
    ElMessage.success('保存成功')
    row.tag_name = editingTagName.value.trim()
    editingTagId.value = null
  } catch (error) {
    console.error('保存考点名称失败:', error)
    ElMessage.error('保存失败')
  }
}

const openMoveTagModal = (row) => {
  movingTag.value = row
  targetChapterId.value = row.chapter_id
  moveTagModalVisible.value = true
}

const confirmMoveTag = async () => {
  if (!targetChapterId.value) {
    ElMessage.warning('请选择目标章节')
    return
  }
  try {
    await adminApi.moveComputerTag(movingTag.value.tag_id, { chapter_id: targetChapterId.value })
    ElMessage.success('移动成功')
    moveTagModalVisible.value = false
    fetchTags()
  } catch (error) {
    console.error('移动考点失败:', error)
    ElMessage.error('移动失败')
  }
}

const deleteTag = (id) => {
  if (!id) {
    ElMessage.error('考点ID不能为空')
    console.error('deleteTag called with invalid id:', id)
    return
  }
  ElMessageBox.confirm('确定要删除这个考点吗？', '警告', { type: 'warning' }).then(async () => {
    try {
      await adminApi.deleteComputerTag(id)
      ElMessage.success('删除成功')
      fetchTags()
    } catch (error) {
      console.error('删除考点失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

const batchDeleteUnnamedTags = () => {
  ElMessageBox.confirm('确定要批量删除所有未命名的考点吗？此操作不可恢复！', '警告', { type: 'warning' }).then(async () => {
    try {
      await adminApi.batchDeleteUnnamedComputerTags()
      ElMessage.success('批量删除成功')
      fetchTags()
    } catch (error) {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  })
}

// 清理无效考点（tag_name为纯数字且查不到对应记录的考点）
const cleanInvalidTags = () => {
  ElMessageBox.confirm(
    '确定要清理无效考点吗？这将删除所有tag_name为纯数字ID且无法解析的考点，同时删除相关的题目关联关系。此操作不可恢复！',
    '警告',
    { type: 'warning' }
  ).then(async () => {
    try {
      const res = await adminApi.cleanInvalidComputerTags()
      ElMessage.success(`清理成功！共删除 ${res.data?.deletedCount || 0} 个无效考点`)
      fetchTags()
    } catch (error) {
      console.error('清理无效考点失败:', error)
      ElMessage.error('清理失败: ' + (error.message || '未知错误'))
    }
  })
}

// 校对考点名称（将纯数字tag_name替换为对应的chapter_name）
const proofreadTags = () => {
  ElMessageBox.confirm(
    '确定要校对考点名称吗？这将把所有tag_name为纯数字且能在章节表中找到对应记录的考点名称替换为对应的章节名称。',
    '确认校对',
    { type: 'info' }
  ).then(async () => {
    try {
      const res = await adminApi.proofreadComputerTags()
      ElMessage.success(`校对成功！共更新 ${res.data?.updatedCount || 0} 个考点名称`)
      fetchTags()
    } catch (error) {
      console.error('校对考点名称失败:', error)
      ElMessage.error('校对失败: ' + (error.message || '未知错误'))
    }
  })
}

// 查看待分类考点（默认章节或绪论章节下的考点）
const showUncategorizedTags = async () => {
  // 先获取第一个章节（通常是绪论）的ID
  if (allChapters.value.length > 0) {
    const firstChapter = allChapters.value[0]
    tagFilter.chapterId = firstChapter.id
    tagFilter.keyword = ''
    tagFilter.showUnnamed = false
    tagFilter.showInvalid = false
    tagFilter.page = 1
    await fetchTags()
    ElMessage.info(`已筛选出"${firstChapter.name}"下的考点，请检查是否有需要移动到其他章节的考点`)
  }
}

const openCreateTagModal = () => {
  newTagForm.name = ''
  newTagForm.chapterId = ''
  currentChapterForCreateTag.value = null
  createTagModalVisible.value = true
}

// 批量选择变化
const handleTagSelectionChange = (selection) => {
  selectedTags.value = selection
}

// 处理行展开事件
const handleExpandChange = (row, expanded) => {
  // 如果当前行被展开且还没有加载过题目，则自动加载
  if (expanded && !tagQuestions.value[row.tag_id]) {
    loadTagQuestions(row)
  }
}

// 打开批量移动对话框
const openBatchMoveModal = () => {
  batchTargetChapterId.value = ''
  batchMoveModalVisible.value = true
}

// 确认批量移动
const confirmBatchMove = async () => {
  if (!batchTargetChapterId.value) {
    ElMessage.warning('请选择目标章节')
    return
  }

  try {
    const tagIds = selectedTags.value.map(t => t.tag_id)
    await adminApi.batchMoveComputerTags({
      tagIds,
      chapter_id: batchTargetChapterId.value
    })
    ElMessage.success(`成功移动 ${tagIds.length} 个考点`)
    batchMoveModalVisible.value = false
    selectedTags.value = []
    fetchTags()
  } catch (error) {
    console.error('批量移动失败:', error)
    ElMessage.error('批量移动失败')
  }
}

// 加载考点下的题目
const loadTagQuestions = async (tag) => {
  if (!tag || !tag.tag_id) {
    console.error('loadTagQuestions called with invalid tag:', tag)
    ElMessage.error('考点数据无效')
    return
  }
  loadingTagQuestions.value[tag.tag_id] = true
  try {
    const res = await adminApi.getTagQuestions(tag.tag_id)
    tagQuestions.value[tag.tag_id] = res.data || []
  } catch (error) {
    console.error('加载考点题目失败:', error)
    ElMessage.error('加载题目失败')
  } finally {
    loadingTagQuestions.value[tag.tag_id] = false
  }
}

// 查看题目详情
const viewQuestionDetail = (question) => {
  // 可以打开一个对话框显示题目完整信息
  ElMessage.info(`题目ID: ${question.question_id}`)
  // 这里可以扩展为打开一个详情对话框
}

const confirmCreateTag = async () => {
  if (!newTagForm.name.trim()) {
    ElMessage.warning('请输入考点名称')
    return
  }
  if (!newTagForm.chapterId) {
    ElMessage.warning('请选择所属章节')
    return
  }
  try {
    await adminApi.createComputerTag({
      tag_name: newTagForm.name.trim(),
      chapter_id: newTagForm.chapterId
    })
    ElMessage.success('创建成功')
    createTagModalVisible.value = false
    
    // 如果从章节页面创建，刷新该章节下的考点列表
    if (currentChapterForCreateTag.value) {
      await fetchChapterSections(newTagForm.chapterId)
      // 展开该章节
      const chapterId = String(newTagForm.chapterId)
      if (!expandedChapters.value.find(id => String(id) === chapterId)) {
        expandedChapters.value.push(chapterId)
      }
      currentChapterForCreateTag.value = null
    }
    
    fetchTags()
  } catch (error) {
    console.error('创建考点失败:', error)
    ElMessage.error('创建失败')
  }
}

// 打开创建题目弹窗
const openCreateQuestionModal = () => {
  newQuestionForm.value = {
    exercise_type_name: '单选题',
    major_id: '',
    chapter_id: '',
    stem: '',
    stem_richtext: '',
    answer: '',
    answer_richtext: '',
    analysis: '',
    analysis_richtext: '',
    level: 3,
    total_score: 0,
    exam_full_name: '',
    exam_time: '',
    options: [
      { option_key: 'A', option_value: '' },
      { option_key: 'B', option_value: '' },
      { option_key: 'C', option_value: '' },
      { option_key: 'D', option_value: '' }
    ],
    subQuestions: [], // 解答题小题
    knowledgeTags: []
  }
  createQuestionChapters.value = []
  showNewQuestionStemRichText.value = false
  showNewQuestionAnswerRichText.value = false
  showNewQuestionAnalysisRichText.value = false
  // 重置批量导入状态
  batchImportQuestions.value = []
  currentBatchIndex.value = 0
  isBatchImportMode.value = false
  jsonImportText.value = ''
  createQuestionModalVisible.value = true
}

// 创建题目对话框关闭时的处理
const onCreateQuestionModalClose = () => {
  // 重置批量导入状态
  batchImportQuestions.value = []
  currentBatchIndex.value = 0
  isBatchImportMode.value = false
  jsonImportText.value = ''
}

// 创建题目时科目变化
const onCreateQuestionSubjectChange = async (val) => {
  if (val) {
    try {
      const res = await adminApi.getComputerChapters({ majorId: val })
      // 适配新的数据结构 { chapters: [...], subjectTotal: ... }
      if (res.data && res.data.chapters) {
        createQuestionChapters.value = res.data.chapters
      } else {
        // 兼容旧数据结构
        createQuestionChapters.value = res.data || []
      }
    } catch (error) {
      console.error('获取章节失败:', error)
      createQuestionChapters.value = []
    }
  } else {
    createQuestionChapters.value = []
  }
  newQuestionForm.value.chapter_id = ''
}

// 存储批量导入的题目列表
const batchImportQuestions = ref([])
const currentBatchIndex = ref(0)
const isBatchImportMode = ref(false)
const isBatchImporting = ref(false)
const batchImportProgress = ref({ current: 0, total: 0, success: 0, failed: 0 })
const showBatchPreview = ref(false)

// 解析JSON导入
const parseJsonImport = () => {
  if (!jsonImportText.value.trim()) {
    ElMessage.warning('请输入JSON数据')
    return
  }
  
  try {
    const data = JSON.parse(jsonImportText.value.trim())
    
    // 支持单个题目或题目数组
    const questions = Array.isArray(data) ? data : [data]
    
    if (questions.length === 0) {
      ElMessage.warning('JSON数据为空')
      return
    }
    
    // 存储所有题目到批量导入列表
    batchImportQuestions.value = questions
    currentBatchIndex.value = 0
    isBatchImportMode.value = questions.length > 1
    
    // 加载第一道题到表单
    loadQuestionToForm(questions[0])
    
    if (questions.length > 1) {
      ElMessage.success(`成功解析 ${questions.length} 道题目，当前显示第 1 道`)
    } else {
      ElMessage.success('成功解析 1 道题目')
    }
  } catch (error) {
    console.error('JSON解析失败:', error)
    ElMessage.error('JSON格式错误：' + error.message)
  }
}

// 将题目数据加载到表单
const loadQuestionToForm = (question) => {
  // 映射字段
  newQuestionForm.value.exercise_type_name = question.exercise_type_name || question.type || '单选题'
  newQuestionForm.value.stem = question.stem || question.title || question.question || ''
  newQuestionForm.value.stem_richtext = question.stem_richtext || question.stem || ''
  newQuestionForm.value.answer = question.answer || ''
  newQuestionForm.value.answer_richtext = question.answer_richtext || question.answer || ''
  newQuestionForm.value.analysis = question.analysis || question.parse || ''
  newQuestionForm.value.analysis_richtext = question.analysis_richtext || question.analysis || ''
  newQuestionForm.value.level = question.level || question.difficulty || 3
  newQuestionForm.value.total_score = question.total_score || question.score || 0
  newQuestionForm.value.exam_full_name = question.exam_full_name || question.source || ''
  newQuestionForm.value.exam_time = question.exam_time || question.year || ''
  
  // 处理选项或小题
  if (question.options && Array.isArray(question.options)) {
    // 检查是否是解答题的小题格式（包含 questionStem 字段）
    const isSubQuestions = question.options.length > 0 && question.options[0].questionStem !== undefined
    
    if (isSubQuestions) {
      // 解答题小题格式
      newQuestionForm.value.subQuestions = question.options.map((opt, idx) => ({
        sub_stem: opt.questionStem || opt.sub_stem || '',
        sub_answer: opt.questionAnswer || opt.sub_answer || '',
        sub_analysis: opt.questionAnalysis || opt.sub_analysis || '',
        sub_score: opt.questionScore || opt.sub_score || 0,
        order_num: opt.questionOrder || opt.order_num || (idx + 1)
      }))
      // 清空普通选项
      newQuestionForm.value.options = []
    } else {
      // 普通选项格式（单选/多选）
      newQuestionForm.value.options = question.options.map((opt, idx) => ({
        option_key: opt.option_key || opt.key || String.fromCharCode(65 + idx),
        option_value: opt.option_value || opt.value || opt.content || opt.text || ''
      }))
      // 清空小题
      newQuestionForm.value.subQuestions = []
    }
  } else if (question.option && typeof question.option === 'object') {
    // 处理 {A: 'xxx', B: 'xxx'} 格式
    newQuestionForm.value.options = Object.entries(question.option).map(([key, value]) => ({
      option_key: key,
      option_value: value
    }))
    newQuestionForm.value.subQuestions = []
  } else if (question.subQuestions && Array.isArray(question.subQuestions)) {
    // 直接提供 subQuestions 字段
    newQuestionForm.value.subQuestions = question.subQuestions.map((opt, idx) => ({
      sub_stem: opt.sub_stem || opt.stem || '',
      sub_answer: opt.sub_answer || opt.answer || '',
      sub_analysis: opt.sub_analysis || opt.analysis || '',
      sub_score: opt.sub_score || opt.score || 0,
      order_num: opt.order_num || (idx + 1)
    }))
    newQuestionForm.value.options = []
  }
  
  // 处理考点标签
  if (question.knowledgeTags && Array.isArray(question.knowledgeTags)) {
    newQuestionForm.value.knowledgeTags = question.knowledgeTags
  } else if (question.tags && Array.isArray(question.tags)) {
    newQuestionForm.value.knowledgeTags = question.tags
  } else if (question.tag) {
    newQuestionForm.value.knowledgeTags = [question.tag]
  }
}

// 加载下一道批量导入的题目
const loadNextBatchQuestion = () => {
  if (currentBatchIndex.value < batchImportQuestions.value.length - 1) {
    currentBatchIndex.value++
    loadQuestionToForm(batchImportQuestions.value[currentBatchIndex.value])
    ElMessage.success(`已加载第 ${currentBatchIndex.value + 1} / ${batchImportQuestions.value.length} 道题目`)
  }
}

// 加载上一道批量导入的题目
const loadPrevBatchQuestion = () => {
  if (currentBatchIndex.value > 0) {
    currentBatchIndex.value--
    loadQuestionToForm(batchImportQuestions.value[currentBatchIndex.value])
    ElMessage.success(`已加载第 ${currentBatchIndex.value + 1} / ${batchImportQuestions.value.length} 道题目`)
  }
}

// 一键导入全部题目
const importAllQuestions = async () => {
  if (batchImportQuestions.value.length === 0) {
    ElMessage.warning('没有可导入的题目')
    return
  }
  
  // 检查是否选择了科目和章节
  if (!newQuestionForm.value.major_id) {
    ElMessage.warning('请先选择所属科目')
    return
  }
  
  // 确认导入
  const confirmResult = await ElMessageBox.confirm(
    `确定要导入全部 ${batchImportQuestions.value.length} 道题目吗？\n所有题目将使用当前选择的科目和章节。`,
    '确认批量导入',
    {
      confirmButtonText: '确定导入',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).catch(() => false)
  
  if (!confirmResult) return
  
  isBatchImporting.value = true
  batchImportProgress.value = {
    current: 0,
    total: batchImportQuestions.value.length,
    success: 0,
    failed: 0
  }
  
  const typeMap = {
    '单选题': 1,
    '多选题': 2,
    '填空题': 3,
    '解答题': 4,
    '判断题': 5
  }
  
  const failedQuestions = []
  
  for (let i = 0; i < batchImportQuestions.value.length; i++) {
    const question = batchImportQuestions.value[i]
    batchImportProgress.value.current = i + 1
    
    try {
      // 构造题目数据
      const stem = question.stem || question.title || question.question || ''
      const answer = question.answer || ''
      const analysis = question.analysis || question.parse || ''
      
      const data = {
        stem,
        answer,
        analysis,
        level: question.level || question.difficulty || 3,
        total_score: question.total_score || question.score || 0,
        exam_full_name: question.exam_full_name || question.source || '',
        exam_time: question.exam_time || question.year || '',
        exercise_type_name: question.exercise_type_name || question.type || '单选题',
        exercise_type: typeMap[question.exercise_type_name || question.type] || 1,
        major_id: newQuestionForm.value.major_id,
        chapter_id: newQuestionForm.value.chapter_id || null,
        options: [],
        subs: [],
        knowledgeTags: []
      }
      
      // 处理选项或小题
      if (question.options && Array.isArray(question.options)) {
        const isSubQuestions = question.options.length > 0 && question.options[0].questionStem !== undefined
        
        if (isSubQuestions) {
          data.subs = question.options.map((opt, idx) => ({
            sub_stem: opt.questionStem || opt.sub_stem || '',
            sub_answer: opt.questionAnswer || opt.sub_answer || '',
            sub_analysis: opt.questionAnalysis || opt.sub_analysis || '',
            sub_score: opt.questionScore || opt.sub_score || 0,
            order_num: opt.questionOrder || opt.order_num || (idx + 1)
          }))
        } else {
          data.options = question.options.map((opt, idx) => ({
            option_key: opt.option_key || opt.key || String.fromCharCode(65 + idx),
            option_value: opt.option_value || opt.value || opt.content || opt.text || ''
          }))
        }
      } else if (question.option && typeof question.option === 'object') {
        data.options = Object.entries(question.option).map(([key, value]) => ({
          option_key: key,
          option_value: value
        }))
      } else if (question.subQuestions && Array.isArray(question.subQuestions)) {
        data.subs = question.subQuestions.map((opt, idx) => ({
          sub_stem: opt.sub_stem || opt.stem || '',
          sub_answer: opt.sub_answer || opt.answer || '',
          sub_analysis: opt.sub_analysis || opt.analysis || '',
          sub_score: opt.sub_score || opt.score || 0,
          order_num: opt.order_num || (idx + 1)
        }))
      }
      
      // 处理考点标签
      if (question.knowledgeTags && Array.isArray(question.knowledgeTags)) {
        data.knowledgeTags = question.knowledgeTags
      } else if (question.tags && Array.isArray(question.tags)) {
        data.knowledgeTags = question.tags
      } else if (question.tag) {
        data.knowledgeTags = [question.tag]
      }
      
      await adminApi.createComputerQuestion(data)
      batchImportProgress.value.success++
    } catch (error) {
      console.error(`导入第 ${i + 1} 题失败:`, error)
      batchImportProgress.value.failed++
      failedQuestions.push({
        index: i + 1,
        stem: question.stem || question.title || '无标题',
        error: error.message
      })
    }
  }
  
  isBatchImporting.value = false
  
  // 显示导入结果
  if (batchImportProgress.value.failed === 0) {
    ElMessage.success(`🎉 全部 ${batchImportProgress.value.total} 道题目导入成功！`)
    createQuestionModalVisible.value = false
    searchQuestions()
    if (chapterFilter.major_id) {
      fetchChapters(chapterFilter.major_id)
    }
  } else {
    ElMessage.warning(
      `导入完成：成功 ${batchImportProgress.value.success} 道，失败 ${batchImportProgress.value.failed} 道`
    )
    if (failedQuestions.length > 0) {
      console.error('导入失败的题目：', failedQuestions)
    }
  }
}

// 预览批量导入的题目列表
const previewBatchQuestions = () => {
  showBatchPreview.value = true
}

// 清空JSON导入
const clearJsonImport = () => {
  jsonImportText.value = ''
  batchImportQuestions.value = []
  currentBatchIndex.value = 0
  isBatchImportMode.value = false
  ElMessage.success('已清空')
}

// 添加新题目选项
const addNewQuestionOption = () => {
  const key = String.fromCharCode(65 + newQuestionForm.value.options.length)
  newQuestionForm.value.options.push({ option_key: key, option_value: '' })
}

// 删除新题目选项
const removeNewQuestionOption = (index) => {
  newQuestionForm.value.options.splice(index, 1)
  // 重新排序选项键
  newQuestionForm.value.options.forEach((opt, idx) => {
    opt.option_key = String.fromCharCode(65 + idx)
  })
}

// 添加解答题小题
const addNewQuestionSubQuestion = () => {
  const orderNum = newQuestionForm.value.subQuestions.length + 1
  newQuestionForm.value.subQuestions.push({
    sub_stem: '',
    sub_answer: '',
    sub_analysis: '',
    sub_score: 0,
    order_num: orderNum
  })
}

// 删除解答题小题
const removeNewQuestionSubQuestion = (index) => {
  newQuestionForm.value.subQuestions.splice(index, 1)
  // 重新排序
  newQuestionForm.value.subQuestions.forEach((sub, idx) => {
    sub.order_num = idx + 1
  })
}

// 添加新题目标签
const addNewQuestionTag = () => {
  newQuestionForm.value.knowledgeTags.push('')
}

// 删除新题目标签
const removeNewQuestionTag = (index) => {
  newQuestionForm.value.knowledgeTags.splice(index, 1)
}

// HTML转普通文本的辅助函数
const htmlToText = (html) => {
  if (!html) return ''
  const temp = document.createElement('div')
  temp.innerHTML = html
  return temp.textContent || temp.innerText || ''
}

// 保存新题目
const saveNewQuestion = async () => {
  if (!newQuestionForm.value.stem) {
    ElMessage.warning('请输入题干')
    return
  }
  if (!newQuestionForm.value.major_id) {
    ElMessage.warning('请选择所属科目')
    return
  }
  
  creatingQuestion.value = true
  try {
    // 根据题型设置 exercise_type
    const typeMap = {
      '单选题': 1,
      '多选题': 2,
      '填空题': 3,
      '解答题': 4,
      '判断题': 5
    }
    
    // 将富文本转换为普通文本
    const stem = newQuestionForm.value.stem_richtext 
      ? htmlToText(newQuestionForm.value.stem_richtext)
      : newQuestionForm.value.stem
    const answer = newQuestionForm.value.answer_richtext
      ? htmlToText(newQuestionForm.value.answer_richtext)
      : newQuestionForm.value.answer
    const analysis = newQuestionForm.value.analysis_richtext
      ? htmlToText(newQuestionForm.value.analysis_richtext)
      : newQuestionForm.value.analysis
    
    const data = {
      ...newQuestionForm.value,
      stem,
      answer,
      analysis,
      exercise_type: typeMap[newQuestionForm.value.exercise_type_name] || 1,
      options: ['单选题', '多选题'].includes(newQuestionForm.value.exercise_type_name) 
        ? newQuestionForm.value.options 
        : [],
      subs: newQuestionForm.value.exercise_type_name === '解答题' 
        ? newQuestionForm.value.subQuestions 
        : [],
      knowledgeTags: newQuestionForm.value.knowledgeTags.filter(t => t.trim())
    }
    
    await adminApi.createComputerQuestion(data)
    ElMessage.success('题目创建成功')
    
    // 如果是批量导入模式，自动加载下一题
    if (isBatchImportMode.value && currentBatchIndex.value < batchImportQuestions.value.length - 1) {
      currentBatchIndex.value++
      loadQuestionToForm(batchImportQuestions.value[currentBatchIndex.value])
      ElMessage.success(`已自动加载第 ${currentBatchIndex.value + 1} / ${batchImportQuestions.value.length} 道题目，请检查并继续创建`)
    } else {
      // 不是批量模式或已是最后一题，关闭对话框
      createQuestionModalVisible.value = false
      // 重置批量导入状态
      batchImportQuestions.value = []
      currentBatchIndex.value = 0
      isBatchImportMode.value = false
    }
    
    searchQuestions()
    // 刷新章节列表以更新题目数量
    if (chapterFilter.major_id) {
      fetchChapters(chapterFilter.major_id)
    }
  } catch (error) {
    console.error('创建题目失败:', error)
    ElMessage.error('创建题目失败')
  } finally {
    creatingQuestion.value = false
  }
}

// 从章节创建题目
const openCreateQuestionFromChapter = async (chapter) => {
  // 先加载该科目下的所有章节
  try {
    const res = await adminApi.getComputerChapters({ majorId: chapterFilter.major_id })
    // 适配新的数据结构 { chapters: [...], subjectTotal: ... }
    if (res.data && res.data.chapters) {
      createQuestionChapters.value = res.data.chapters
    } else {
      // 兼容旧数据结构
      createQuestionChapters.value = res.data || []
    }
  } catch (error) {
    console.error('获取章节失败:', error)
    createQuestionChapters.value = []
  }

  newQuestionForm.value = {
    exercise_type_name: '单选题',
    major_id: chapterFilter.major_id,
    chapter_id: chapter.id,
    stem: '',
    stem_richtext: '',
    answer: '',
    answer_richtext: '',
    analysis: '',
    analysis_richtext: '',
    level: 3,
    total_score: 0,
    exam_full_name: '',
    exam_time: '',
    options: [
      { option_key: 'A', option_value: '' },
      { option_key: 'B', option_value: '' },
      { option_key: 'C', option_value: '' },
      { option_key: 'D', option_value: '' }
    ],
    knowledgeTags: []
  }
  showNewQuestionStemRichText.value = false
  showNewQuestionAnswerRichText.value = false
  showNewQuestionAnalysisRichText.value = false
  createQuestionModalVisible.value = true
}

// 打开添加题目到章节对话框
// 从考点（小节）创建题目
const openCreateQuestionFromSection = (section) => {
  // TODO: 实现从考点创建题目的功能
  ElMessage.info(`从考点 "${section.name}" 创建题目功能开发中`)
}

// 添加题目到考点（小节）
const openAddQuestionsToSection = (section) => {
  // TODO: 实现添加题目到考点的功能
  ElMessage.info(`添加题目到考点 "${section.name}" 功能开发中`)
}

// 编辑考点（小节）
const openEditSectionModal = (section) => {
  // TODO: 实现编辑考点的功能
  ElMessage.info(`编辑考点 "${section.name}" 功能开发中`)
}

// 打开创建考点对话框（在章节下创建）- 重命名避免冲突
const openCreateTagModalFromChapter = (chapter) => {
  currentChapterForCreateTag.value = chapter
  newTagForm.name = ''
  newTagForm.chapterId = chapter.id
  createTagModalVisible.value = true
}

// 删除考点（小节）
const deleteSection = (section) => {
  ElMessageBox.confirm(`确定要删除考点 "${section.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await adminApi.deleteComputerTag(section.originalId)
      ElMessage.success('删除成功')
      // 刷新该章节下的考点列表
      await fetchChapterSections(section.parentChapterId)
    } catch (error) {
      console.error('删除考点失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const openAddQuestionsToChapter = (chapter) => {
  currentChapterForAddQuestions.value = chapter
  questionSourceTab.value = 'wrong-stats'
  // 重置数据
  wrongStatsForSelection.value = []
  selectedWrongQuestions.value = []
  questionsForSelection.value = []
  selectedSearchQuestions.value = []
  chapterQuestionSet.value = []
  searchForAddQuestions.keyword = ''
  searchForAddQuestions.type = ''
  searchForAddQuestions.page = 1
  // 重置试卷选择数据
  paperFilter.type = ''
  paperFilter.selectedPaper = ''
  paperList.value = []
  paperQuestions.value = []
  filteredPaperQuestions.value = []
  selectedPaperQuestions.value = []
  paperQuestionFilter.keyword = ''
  paperQuestionFilter.type = ''
  addQuestionsModalVisible.value = true
  // 自动加载当前章节的题集
  fetchChapterQuestionSet()
}

// 加载错题统计用于选择
const fetchWrongStatsForSelection = async () => {
  loadingWrongStatsForSelection.value = true
  try {
    const res = await adminApi.getComputerWrongBookStats()
    wrongStatsForSelection.value = res.data || []
  } catch (error) {
    console.error('获取错题统计失败:', error)
    ElMessage.error('获取错题统计失败')
  } finally {
    loadingWrongStatsForSelection.value = false
  }
}

// 处理错题选择变化
const handleWrongQuestionSelectionChange = (selection) => {
  selectedWrongQuestions.value = selection
}

// 添加选中的错题到章节
const addingWrongQuestions = ref(false)
const addSelectedWrongQuestions = async () => {
  if (selectedWrongQuestions.value.length === 0) {
    ElMessage.warning('请选择要添加的题目')
    return
  }
  if (addingWrongQuestions.value) return // 防止重复点击
  
  addingWrongQuestions.value = true
  try {
    const questionIds = selectedWrongQuestions.value.map(q => q.QuestionID)
    await adminApi.addQuestionsToChapterSet(currentChapterForAddQuestions.value.id, {
      questionIds,
      remark: '从错题统计添加'
    })
    ElMessage.success(`成功添加 ${questionIds.length} 道题目`)
    selectedWrongQuestions.value = []
    fetchChapterQuestionSet()
    // 刷新章节列表以更新题目数量
    if (chapterFilter.major_id) {
      fetchChapters(chapterFilter.major_id)
    }
  } catch (error) {
    console.error('添加题目失败:', error)
    ElMessage.error('添加题目失败')
  } finally {
    addingWrongQuestions.value = false
  }
}

// 防抖搜索定时器
let searchDebounceTimer = null

// 防抖搜索
const debounceSearchQuestions = () => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    searchForAddQuestions.page = 1
    searchQuestionsForSelection()
  }, 500) // 500ms防抖
}

// 搜索题目用于选择
const searchQuestionsForSelection = async () => {
  loadingQuestionsForSelection.value = true
  try {
    const params = {
      ...searchForAddQuestions,
      size: searchForAddQuestions.pageSize
    }
    const res = await adminApi.searchComputerQuestions(params)
    questionsForSelection.value = res.data.questions || res.data.list || []
    questionsForSelectionTotal.value = res.data.total || 0
  } catch (error) {
    console.error('搜索题目失败:', error)
  } finally {
    loadingQuestionsForSelection.value = false
  }
}

// 处理搜索题目选择变化
const handleSearchQuestionSelectionChange = (selection) => {
  selectedSearchQuestions.value = selection
}

// 添加选中的搜索题目到章节
const addSelectedSearchQuestions = async () => {
  if (selectedSearchQuestions.value.length === 0) {
    ElMessage.warning('请选择要添加的题目')
    return
  }
  try {
    const questionIds = selectedSearchQuestions.value.map(q => q.question_id)
    await adminApi.addQuestionsToChapterSet(currentChapterForAddQuestions.value.id, {
      questionIds,
      remark: '从题库搜索添加'
    })
    ElMessage.success(`成功添加 ${questionIds.length} 道题目`)
    selectedSearchQuestions.value = []
    fetchChapterQuestionSet()
    // 刷新章节列表以更新题目数量
    if (chapterFilter.major_id) {
      fetchChapters(chapterFilter.major_id)
    }
  } catch (error) {
    console.error('添加题目失败:', error)
    ElMessage.error('添加题目失败')
  }
}

// 获取当前章节的题集
const fetchChapterQuestionSet = async () => {
  if (!currentChapterForAddQuestions.value) return
  loadingChapterQuestionSet.value = true
  try {
    const res = await adminApi.getChapterQuestionSet(currentChapterForAddQuestions.value.id)
    chapterQuestionSet.value = res.data || []
  } catch (error) {
    console.error('获取章节题集失败:', error)
  } finally {
    loadingChapterQuestionSet.value = false
  }
}

// 从章节题集中移除题目
const removeQuestionFromChapterSet = async (questionId) => {
  try {
    await ElMessageBox.confirm('确定要从题集中移除这道题目吗？', '确认', { type: 'warning' })
    await adminApi.removeQuestionFromChapterSet(currentChapterForAddQuestions.value.id, questionId)
    ElMessage.success('移除成功')
    fetchChapterQuestionSet()
    // 刷新章节列表以更新题目数量
    if (chapterFilter.major_id) {
      fetchChapters(chapterFilter.major_id)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除题目失败:', error)
      ElMessage.error('移除失败')
    }
  }
}

// 标签页切换处理
const onQuestionSourceTabChange = (tabName) => {
  // 切换到从错题统计选择时，自动加载错题统计
  if (tabName === 'wrong-stats' && wrongStatsForSelection.value.length === 0) {
    fetchWrongStatsForSelection()
  }
  // 切换到从题库搜索选择时，自动加载题目
  if (tabName === 'search' && questionsForSelection.value.length === 0) {
    searchQuestionsForSelection()
  }
  // 切换到从试卷选择标签页时，自动加载真题卷和模拟卷
  if (tabName === 'from-paper' && paperList.value.length === 0 && !paperFilter.type) {
    // 默认加载所有类型的试卷
    loadAllPapers()
  }
}

// 加载所有试卷（真题卷+模拟卷）
const loadAllPapers = async () => {
  loadingPapers.value = true
  try {
    // 同时加载真题卷和模拟卷
    const [realRes, mockRes] = await Promise.all([
      adminApi.getPaperList({ paperType: 1, pageSize: 1000 }),
      adminApi.getPaperList({ paperType: 2, pageSize: 1000 })
    ])
    const realPapers = (realRes.data?.list || []).map(p => ({ ...p, paperType: '真题卷' }))
    const mockPapers = (mockRes.data?.list || []).map(p => ({ ...p, paperType: '模拟卷' }))
    paperList.value = [...realPapers, ...mockPapers]
  } catch (error) {
    console.error('获取试卷列表失败:', error)
    ElMessage.error('获取试卷列表失败')
  } finally {
    loadingPapers.value = false
  }
}

// 从试卷选择题目相关方法
// 试卷类型变化时自动加载试卷列表
const onPaperTypeChange = async (type) => {
  paperFilter.selectedPaper = ''
  paperQuestions.value = []
  filteredPaperQuestions.value = []
  selectedPaperQuestions.value = []
  paperQuestionFilter.keyword = ''
  paperQuestionFilter.type = ''
  
  if (!type) {
    paperList.value = []
    return
  }
  
  loadingPapers.value = true
  try {
    const res = await adminApi.getPaperList({ paperType: type, pageSize: 1000 })
    paperList.value = res.data?.list || []
  } catch (error) {
    console.error('获取试卷列表失败:', error)
    ElMessage.error('获取试卷列表失败')
    paperList.value = []
  } finally {
    loadingPapers.value = false
  }
}

// 选择试卷后自动加载题目
const onPaperSelectChange = async (paperId) => {
  paperQuestions.value = []
  filteredPaperQuestions.value = []
  selectedPaperQuestions.value = []
  paperQuestionFilter.keyword = ''
  paperQuestionFilter.type = ''
  
  if (!paperId) return
  
  loadingPaperQuestions.value = true
  try {
    const res = await adminApi.getPaperDetail(paperId)
    // 处理试卷题目数据
    const questions = []
    if (res.data?.questions) {
      res.data.questions.forEach((q, index) => {
        questions.push({
          ...q,
          exercise_number: q.exercise_number || (index + 1),
          question_id: q.question_id || q.id
        })
      })
    }
    paperQuestions.value = questions
    filteredPaperQuestions.value = questions
  } catch (error) {
    console.error('获取试卷题目失败:', error)
    ElMessage.error('获取试卷题目失败')
  } finally {
    loadingPaperQuestions.value = false
  }
}

// 筛选试卷题目（自动筛选，无需点击按钮）
const filterPaperQuestions = () => {
  let result = paperQuestions.value
  
  // 按关键词筛选
  if (paperQuestionFilter.keyword) {
    const keyword = paperQuestionFilter.keyword.toLowerCase()
    result = result.filter(q => {
      const stem = q.stem || ''
      return stem.toLowerCase().includes(keyword)
    })
  }
  
  // 按题型筛选
  if (paperQuestionFilter.type) {
    result = result.filter(q => q.exercise_type_name === paperQuestionFilter.type)
  }
  
  filteredPaperQuestions.value = result
}

// 处理试卷题目选择变化
const handlePaperQuestionSelectionChange = (selection) => {
  selectedPaperQuestions.value = selection
}

// 添加选中的试卷题目到章节
const addSelectedPaperQuestions = async () => {
  if (selectedPaperQuestions.value.length === 0) {
    ElMessage.warning('请选择要添加的题目')
    return
  }
  
  try {
    const questionIds = selectedPaperQuestions.value.map(q => q.question_id || q.id).filter(Boolean)
    await adminApi.addQuestionsToChapterSet(currentChapterForAddQuestions.value.id, {
      questionIds,
      remark: `从试卷《${paperList.value.find(p => p.id === paperFilter.selectedPaper)?.title || '未知试卷'}》添加`
    })
    ElMessage.success(`成功添加 ${questionIds.length} 道题目`)
    selectedPaperQuestions.value = []
    fetchChapterQuestionSet()
    // 刷新章节列表以更新题目数量
    if (chapterFilter.major_id) {
      fetchChapters(chapterFilter.major_id)
    }
  } catch (error) {
    console.error('添加题目失败:', error)
    ElMessage.error('添加题目失败')
  }
}

// 监听编辑表单中的科目变化以更新章节
watch(() => editingForm.value?.major_id, (newVal) => {
  if (newVal) {
    fetchChapters(newVal)
    sections.value = [] // 清空小节
    if (editingForm.value) editingForm.value.section_id = ''
  }
})

// 章节变化时加载小节（考点）
const onChapterChange = async (chapterId) => {
  if (!chapterId) {
    sections.value = []
    selectedSectionTagId.value = ''
    return
  }
  // 加载该章节下的考点作为小节选项
  try {
    const res = await adminApi.getComputerTags({ chapterId, pageSize: 1000 })
    const tags = res.data?.list || []
    // 过滤掉纯数字ID的未命名考点，只显示有名称的考点
    sections.value = tags.filter(t => t.tag_name && !/^\d+$/.test(t.tag_name))
  } catch (error) {
    console.error('加载考点失败:', error)
    sections.value = []
  }
  // 如果当前选中的小节不在新的小节列表中，清空它
  if (selectedSectionTagId.value) {
    const exists = sections.value.some(s => String(s.tag_id) === String(selectedSectionTagId.value))
    if (!exists) selectedSectionTagId.value = ''
  }
}

// 小节（考点）变化处理
const onSectionChange = (tagId) => {
  // 将选中的考点添加到题目的 tags 列表中（如果不存在）
  if (!tagId) return
  
  const existingTag = editingForm.value?.tags?.find(t => String(t.tag_id) === String(tagId))
  if (!existingTag && editingForm.value) {
    const section = sections.value.find(s => String(s.tag_id) === String(tagId))
    if (section) {
      if (!editingForm.value.tags) editingForm.value.tags = []
      editingForm.value.tags.push({
        tag_id: section.tag_id,
        tag_name: section.tag_name
      })
    }
  }
}

// 获取考点的章节信息（带缓存）
const getTagChapterInfo = async (tagId) => {
  // 如果已缓存，直接返回
  if (tagChapterInfoMap.value[tagId]) {
    return tagChapterInfoMap.value[tagId]
  }
  
  try {
    const res = await adminApi.getComputerTags({ keyword: tagId, pageSize: 1 })
    const tags = res.data?.list || []
    if (tags.length > 0) {
      const tag = tags[0]
      const parts = []
      if (tag.major_name) parts.push(tag.major_name)
      if (tag.parent_chapter_name) parts.push(tag.parent_chapter_name)
      if (tag.chapter_name) parts.push(tag.chapter_name)
      
      const info = parts.length > 0 ? parts.join(' > ') : '未分配章节'
      tagChapterInfoMap.value[tagId] = info
      return info
    }
  } catch (error) {
    console.error('获取考点章节信息失败:', error)
  }
  return '未知章节'
}

// 获取纠错反馈
const fetchCorrections = async () => {
  loadingCorrections.value = true
  try {
    const res = await adminApi.getComputerFeedbacks(correctionFilter)
    corrections.value = res.data.list || []
  } catch (error) {
    console.error('获取纠错失败:', error)
  } finally {
    loadingCorrections.value = false
  }
}

// 获取错题统计
const fetchWrongStats = async () => {
  loadingStats.value = true
  try {
    const res = await adminApi.getComputerWrongBookStats()
    wrongStats.value = res.data || []
  } catch (error) {
    console.error('获取错题统计失败:', error)
  } finally {
    loadingStats.value = false
  }
}

// 计算错误率
const calculateErrorRate = (row) => {
  if (!row.total_attempts) return 0
  const rate = ((row.total_attempts - row.master_count) / row.total_attempts) * 100
  return Math.round(rate * 10) / 10
}

// 处理纠错
const handleCorrection = (row) => {
  currentCorrection.value = row
  adminRemark.value = ''
  openEditModal(row.QuestionID)
}

// 搜索题目
const searchQuestions = async () => {
  loadingQuestions.value = true
  try {
    const params = {
      ...questionFilter,
      size: questionFilter.pageSize
    }
    const res = await adminApi.searchComputerQuestions(params)
    questions.value = res.data.questions || res.data.list || []
    questionTotal.value = res.data.total || 0
  } catch (error) {
    console.error('搜索题目失败:', error)
  } finally {
    loadingQuestions.value = false
  }
}

// 导出无考点题目
// 打开导出弹窗
const openExportModal = () => {
  exportForm.major_ids = questionFilter.major_id ? [questionFilter.major_id] : []
  exportForm.noMajorOnly = false
  exportForm.includeOptions = true
  exportForm.includeSubs = true
  exportModalVisible.value = true
}

// 提交导出
const submitExport = async () => {
  // 如果没有选择科目且没有选择"仅导出没有科目的题目"，则提示
  if (exportForm.major_ids.length === 0 && !exportForm.noMajorOnly) {
    ElMessage.warning('请选择科目或勾选"仅导出没有科目的题目"')
    return
  }
  
  exportLoading.value = true
  try {
    let allQuestions = []
    
    // 如果选择导出没有科目的题目
    if (exportForm.noMajorOnly) {
      const params = {
        noTags: 'true',
        noMajor: 'true',
        size: 10000
      }
      const res = await adminApi.searchComputerQuestions(params)
      const questions = res.data.questions || res.data.list || []
      allQuestions = allQuestions.concat(questions)
    }
    
    // 如果选择了科目
    if (exportForm.major_ids.length > 0) {
      for (const majorId of exportForm.major_ids) {
        const params = {
          noTags: 'true',
          major_id: majorId,
          size: 10000
        }
        const res = await adminApi.searchComputerQuestions(params)
        const questions = res.data.questions || res.data.list || []
        allQuestions = allQuestions.concat(questions)
      }
    }
    
    // 去重（根据question_id）
    const questionMap = new Map()
    allQuestions.forEach(q => {
      questionMap.set(q.question_id, q)
    })
    allQuestions = Array.from(questionMap.values())
    
    if (allQuestions.length === 0) {
      ElMessage.warning('没有找到符合条件的无考点题目')
      exportLoading.value = false
      return
    }
    
    // 格式化数据
    const exportData = allQuestions.map(q => {
      const data = {
        question_id: q.question_id,
        stem: q.stem,
        exercise_type_name: q.exercise_type_name,
        answer: q.answer,
        analysis: q.analysis,
        major_name: q.major_name,
        chapter_name: q.chapter_name,
        year: q.year,
        knowledgeTags: [] // 用于填写要添加的考点ID
      }
      
      // 添加选择题选项
      if (exportForm.includeOptions && q.options && q.options.length > 0) {
        data.options = q.options.map(opt => ({
          key: opt.option_key,
          value: opt.option_value
        }))
      }
      
      // 添加解答题小题
      if (exportForm.includeSubs && q.subs && q.subs.length > 0) {
        data.sub_questions = q.subs.map(sub => ({
          order: sub.question_order,
          stem: sub.sub_stem,
          answer: sub.sub_answer,
          analysis: sub.sub_analysis
        }))
      }
      
      return data
    })
    
    // 创建并下载JSON文件
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 生成文件名
    let fileName = '无考点题目'
    if (exportForm.noMajorOnly) {
      fileName += '_无科目'
    }
    if (exportForm.major_ids.length > 0) {
      if (exportForm.major_ids.length === 1) {
        const subject = subjects.value.find(s => String(s.id) === String(exportForm.major_ids[0]))
        fileName += `_${subject ? subject.name : exportForm.major_ids[0]}`
      } else {
        fileName += `_等${exportForm.major_ids.length}个科目`
      }
    }
    fileName += `_${new Date().toISOString().split('T')[0]}.json`
    
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage.success(`成功导出 ${exportData.length} 道无考点题目`)
    exportModalVisible.value = false
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + (error.message || '未知错误'))
  } finally {
    exportLoading.value = false
  }
}

// 打开批量添加考点弹窗
const openBatchAddTagsModal = () => {
  batchAddTagsForm.major_id = questionFilter.major_id || ''
  batchAddTagsForm.jsonData = ''
  batchAddTagsVisible.value = true
}

// 提交批量添加考点
const submitBatchAddTags = async () => {
  if (!batchAddTagsForm.jsonData.trim()) {
    ElMessage.warning('请输入JSON数据')
    return
  }
  
  let data
  try {
    data = JSON.parse(batchAddTagsForm.jsonData)
    if (!Array.isArray(data)) {
      throw new Error('JSON数据必须是数组格式')
    }
  } catch (e) {
    ElMessage.error('JSON格式错误: ' + e.message)
    return
  }
  
  batchAddTagsLoading.value = true
  try {
    const res = await adminApi.batchAddTagsToQuestions({
      major_id: batchAddTagsForm.major_id,
      data: data
    })
    
    if (res.code === 0) {
      ElMessage.success(`成功为 ${res.data?.successCount || 0} 道题目添加考点`)
      batchAddTagsVisible.value = false
      // 刷新题目列表
      searchQuestions()
    } else {
      ElMessage.error(res.message || '添加失败')
    }
  } catch (error) {
    console.error('批量添加考点失败:', error)
    ElMessage.error('批量添加考点失败: ' + (error.message || '未知错误'))
  } finally {
    batchAddTagsLoading.value = false
  }
}

// 打开编辑弹窗
const openEditModal = async (questionId) => {
  try {
    // 先加载科目列表
    await fetchSubjects()
    
    const res = await adminApi.getComputerQuestionDetail(questionId)
    editingForm.value = res.data
    
    console.log('题目详情:', editingForm.value)
    console.log('科目ID:', editingForm.value.major_id)
    console.log('科目列表:', subjects.value)
    
    // 确保 options 是数组
    if (typeof editingForm.value.options === 'string') {
      try {
        editingForm.value.options = JSON.parse(editingForm.value.options)
      } catch (e) {
        editingForm.value.options = []
      }
    }
    
    // 加载章节列表
    if (editingForm.value.major_id) {
      await fetchChapters(editingForm.value.major_id)
      console.log('章节列表:', chapters.value)
      
      // 如果有章节ID，加载该章节下的考点作为小节
      if (editingForm.value.chapter_id) {
        try {
          const res = await adminApi.getComputerTags({ chapterId: editingForm.value.chapter_id, pageSize: 1000 })
          const tags = res.data?.list || []
          sections.value = tags.filter(t => t.tag_name && !/^\d+$/.test(t.tag_name))
          console.log('考点列表（作为小节）:', sections.value)
          
          // 检查题目的tags中是否有当前章节的考点，有则设为选中
          const questionTags = editingForm.value.tags || []
          const sectionTag = questionTags.find(t => 
            sections.value.some(s => String(s.tag_id) === String(t.tag_id))
          )
          if (sectionTag) {
            selectedSectionTagId.value = String(sectionTag.tag_id)
          } else {
            selectedSectionTagId.value = ''
          }
        } catch (e) {
          console.error('加载考点失败:', e)
          sections.value = []
          selectedSectionTagId.value = ''
        }
      }
    }
    
    // 预加载所有考点的章节信息
    if (editingForm.value.tags && editingForm.value.tags.length > 0) {
      const tagIds = editingForm.value.tags
        .filter(t => t.tag_id && !tagChapterInfoMap.value[t.tag_id])
        .map(t => t.tag_id)
      
      if (tagIds.length > 0) {
        try {
          // 批量获取考点信息
          const res = await adminApi.getComputerTags({ keyword: tagIds.join(','), pageSize: tagIds.length })
          const tags = res.data?.list || []
          tags.forEach(tag => {
            const parts = []
            if (tag.major_name) parts.push(tag.major_name)
            if (tag.parent_chapter_name) parts.push(tag.parent_chapter_name)
            if (tag.chapter_name) parts.push(tag.chapter_name)
            
            if (parts.length > 0) {
              tagChapterInfoMap.value[tag.tag_id] = parts.join(' > ')
            } else {
              tagChapterInfoMap.value[tag.tag_id] = '未分配章节'
            }
          })
        } catch (e) {
          console.error('批量加载考点章节信息失败:', e)
        }
      }
    }
    
    // 初始化富文本编辑器显示状态
    showStemRichText.value = hasValidRichText(editingForm.value.stem_richtext)
    showAnswerRichText.value = hasValidRichText(editingForm.value.answer_richtext)
    showAnalysisRichText.value = hasValidRichText(editingForm.value.analysis)
    
    // 确保数据加载完成后再显示弹窗
    await nextTick()
    editModalVisible.value = true
  } catch (error) {
    console.error('获取题目详情失败:', error)
    ElMessage.error('获取题目详情失败')
  }
}

// 题型变化处理
const handleExerciseTypeChange = (val) => {
  const typeMap = {
    1: '单选题',
    2: '多选题',
    3: '填空题',
    4: '解答题',
    5: '判断题'
  }
  if (editingForm.value) {
    editingForm.value.exercise_type_name = typeMap[val] || ''
  }
}

// 科目变化处理
const handleSubjectChange = (val) => {
  // 清空章节选择
  if (editingForm.value) {
    editingForm.value.chapter_id = ''
  }
  // 重新加载章节列表
  fetchChapters(val)
}

// 保存修改
const saveQuestion = async () => {
  if (!editingForm.value) return
  
  savingQuestion.value = true
  try {
    // 构建保存数据，将 tags 转换为 knowledgeTags
    const saveData = {
      ...editingForm.value,
      knowledgeTags: (editingForm.value.tags || []).map(t => t.tag_name).filter(Boolean)
    }
    
    await adminApi.updateComputerQuestion(editingForm.value.question_id, saveData)
    
    // 如果是从纠错进来的，更新纠错状态
    if (currentCorrection.value) {
      await adminApi.updateComputerFeedbackStatus(currentCorrection.value.id, {
        status: 2,
        admin_remark: adminRemark.value
      })
      currentCorrection.value = null
      fetchCorrections()
    }
    
    ElMessage.success('保存成功')
    editModalVisible.value = false
    searchQuestions()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    savingQuestion.value = false
  }
}

// 删除题目
const deleteQuestion = (id) => {
  ElMessageBox.confirm('确定要删除这道题吗？', '警告', { type: 'error' }).then(async () => {
    try {
      await adminApi.deleteComputerQuestion(id)
      ElMessage.success('删除成功')
      searchQuestions()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

// 选项操作
const addOption = () => {
  if (!editingForm.value.options) editingForm.value.options = []
  const nextKey = String.fromCharCode(65 + editingForm.value.options.length)
  editingForm.value.options.push({ option_key: nextKey, option_value: '' })
}

const removeOption = (index) => {
  if (!editingForm.value.options) return
  editingForm.value.options.splice(index, 1)
  // 重新排序选项键
  editingForm.value.options.forEach((opt, idx) => {
    opt.option_key = String.fromCharCode(65 + idx)
  })
}

// 标签操作
// 检查并处理科目章节不一致的情况
const checkAndUpdateSubjectChapter = async (tagInfo, tagName) => {
  if (!tagInfo || !tagInfo.chapter_id) return false
  
  const chapterRes = await adminApi.getChapterById(tagInfo.chapter_id)
  const chapter = chapterRes.data
  
  if (!chapter) return false
  
  const currentMajorId = editingForm.value.major_id
  const currentChapterId = editingForm.value.chapter_id
  const newMajorId = String(chapter.major_id)
  const newChapterId = String(chapter.chapter_id)
  
  // 如果当前没有科目和章节，直接填充
  if (!currentMajorId && !currentChapterId) {
    editingForm.value.major_id = newMajorId
    await fetchChapters(newMajorId)
    editingForm.value.chapter_id = newChapterId
    ElMessage.success(`已自动关联科目和章节：${chapter.chapter_name}`)
    return true
  }
  
  // 如果科目或章节不一致，提示用户
  if (currentMajorId !== newMajorId || currentChapterId !== newChapterId) {
    const currentMajorName = subjects.value.find(s => String(s.id) === String(currentMajorId))?.name || currentMajorId || '无'
    const currentChapterName = chapters.value.find(c => String(c.chapter_id) === String(currentChapterId))?.chapter_name || currentChapterId || '无'
    
    try {
      await ElMessageBox.confirm(
        `考点的所属信息与您当前设置不一致：\n\n` +
        `当前：${currentMajorName} / ${currentChapterName}\n` +
        `考点：${chapter.subject_name || newMajorId} / ${chapter.chapter_name}\n\n` +
        `是否更新为考点的所属科目和章节？`,
        '科目章节不一致',
        {
          confirmButtonText: '更新',
          cancelButtonText: '保持当前',
          type: 'warning',
          dangerouslyUseHTMLString: false
        }
      )
      // 用户选择更新
      editingForm.value.major_id = newMajorId
      await fetchChapters(newMajorId)
      editingForm.value.chapter_id = newChapterId
      ElMessage.success(`已更新为：${chapter.chapter_name}`)
    } catch {
      // 用户选择保持当前，不做任何操作
      ElMessage.info('保持当前科目章节设置')
    }
  }
  
  return true
}

// 打开选择考点弹窗
const openSelectTagModal = () => {
  selectTagForm.major_id = editingForm.value.major_id || ''
  selectTagForm.chapter_id = editingForm.value.chapter_id || ''
  selectTagForm.tag_id = ''
  selectTagChapters.value = []
  selectTagList.value = []
  
  // 如果当前有科目，加载章节列表
  if (selectTagForm.major_id) {
    fetchChaptersForSelectTag(selectTagForm.major_id)
  }
  
  // 如果当前有章节，加载考点列表
  if (selectTagForm.chapter_id) {
    fetchTagsForSelectTag(selectTagForm.chapter_id)
  }
  
  selectTagModalVisible.value = true
}

// 选择考点弹窗 - 科目变化
const onSelectTagMajorChange = async (majorId) => {
  selectTagForm.chapter_id = ''
  selectTagForm.tag_id = ''
  selectTagChapters.value = []
  selectTagList.value = []
  
  if (majorId) {
    await fetchChaptersForSelectTag(majorId)
  }
}

// 选择考点弹窗 - 章节变化
const onSelectTagChapterChange = async (chapterId) => {
  selectTagForm.tag_id = ''
  selectTagList.value = []
  
  if (chapterId) {
    await fetchTagsForSelectTag(chapterId)
  }
}

// 获取章节列表（用于选择考点弹窗）
const fetchChaptersForSelectTag = async (majorId) => {
  try {
    const res = await adminApi.getComputerChapters({ majorId })
    console.log('获取章节列表完整响应:', res)
    // 处理数据结构：res.data = { code: 0, message: 'success', data: [...] }
    const responseData = res.data?.data || res.data || []
    const chapters = Array.isArray(responseData) ? responseData : (responseData.chapters || [])
    console.log('解析后的章节列表:', chapters)
    selectTagChapters.value = chapters.map(c => ({
      id: c.id || c.chapter_id,
      name: c.name || c.chapter_name || '未命名章节'
    }))
  } catch (error) {
    console.error('获取章节列表失败:', error)
    selectTagChapters.value = []
  }
}

// 获取考点列表（用于选择考点弹窗）
const fetchTagsForSelectTag = async (chapterId) => {
  try {
    const res = await adminApi.getComputerTags({ chapterId, pageSize: 1000 })
    console.log('获取考点列表完整响应:', res)
    // 处理数据结构：res.data = { code: 0, message: 'success', data: { list: [...], total: ... } }
    const responseData = res.data?.data || res.data || {}
    const tags = responseData.list || responseData || []
    console.log('解析后的考点列表:', tags)
    selectTagList.value = tags.map(t => ({
      tag_id: t.tag_id || t.id,
      tag_name: t.tag_name || t.name || '未命名考点'
    }))
  } catch (error) {
    console.error('获取考点列表失败:', error)
    selectTagList.value = []
  }
}

// 确认选择考点
const confirmSelectTag = async () => {
  const tagId = selectTagForm.tag_id
  if (!tagId) return
  
  const tag = selectTagList.value.find(t => String(t.tag_id) === String(tagId))
  if (!tag) {
    ElMessage.error('未找到选择的考点')
    return
  }
  
  // 检查是否已存在
  if (!editingForm.value.tags) {
    editingForm.value.tags = []
  }
  
  const exists = editingForm.value.tags.some(
    t => String(t.tag_id) === String(tagId)
  )
  
  if (exists) {
    ElMessage.warning('该考点已存在')
    return
  }
  
  // 检查并处理科目章节不一致
  await checkAndUpdateSubjectChapter(tag, tag.tag_name)
  
  // 添加标签
  editingForm.value.tags.push({
    tag_id: tag.tag_id,
    tag_name: tag.tag_name
  })
  
  ElMessage.success('添加成功')
  selectTagModalVisible.value = false
}

// 通过输入添加标签
const addTagByInput = async () => {
  ElMessageBox.prompt('请输入知识点标签名称或ID', '添加标签', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValidator: (value) => {
      if (!value || value.trim() === '') {
        return '标签名称或ID不能为空'
      }
      return true
    }
  }).then(async ({ value }) => {
    const input = value.trim()
    
    try {
      // 尝试获取标签信息（可能是ID或名称）
      let tagInfo = null
      
      // 先尝试作为ID查询
      if (/^\d+$/.test(input)) {
        try {
          const res = await adminApi.getKnowledgeTagById(input)
          if (res.data) {
            tagInfo = res.data
          }
        } catch (e) {
          // ID查询失败，继续尝试名称查询
        }
      }
      
      // 如果ID查询失败，尝试作为名称查询
      if (!tagInfo) {
        const res = await adminApi.getKnowledgeTagByName(input)
        if (res.data) {
          tagInfo = res.data
        }
      }
      
      // 如果找到了标签信息，检查并处理科目章节不一致
      if (tagInfo) {
        await checkAndUpdateSubjectChapter(tagInfo, tagInfo.tag_name || input)
      }
      
      // 添加标签到列表
      if (!editingForm.value.tags) {
        editingForm.value.tags = []
      }
      
      // 检查是否已存在
      const exists = editingForm.value.tags.some(
        t => (typeof t === 'string' ? t : t.tag_name) === (tagInfo?.tag_name || input)
      )
      
      if (exists) {
        ElMessage.warning('该标签已存在')
        return
      }
      
      editingForm.value.tags.push({
        tag_id: tagInfo?.tag_id,
        tag_name: tagInfo?.tag_name || input
      })
      
      ElMessage.success('添加成功')
    } catch (error) {
      console.error('添加标签失败:', error)
      // 即使查询失败，也允许添加标签
      if (!editingForm.value.tags) {
        editingForm.value.tags = []
      }
      editingForm.value.tags.push({
        tag_name: input
      })
      ElMessage.success('添加成功（未找到对应考点信息）')
    }
  }).catch(() => {})
}

const removeTag = (index) => {
  if (!editingForm.value.tags) return
  editingForm.value.tags.splice(index, 1)
}

// 小题操作
const addSub = () => {
  if (!editingForm.value.subs) editingForm.value.subs = []
  editingForm.value.subs.push({
    stem: '',
    answer: '',
    analysis: '',
    score: ''
  })
}

const removeSub = (index) => {
  if (!editingForm.value.subs) return
  editingForm.value.subs.splice(index, 1)
}

// 试卷导入相关
const handlePaperFileChange = (file) => {
  // 检查是否已存在同名文件
  if (paperFileList.value.some(f => f.name === file.name)) {
    ElMessage.warning(`文件 ${file.name} 已存在`)
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (Array.isArray(data)) {
        // 添加到文件列表
        paperFileList.value.push({
          name: file.name,
          data: data,
          raw: file.raw
        })
        ElMessage.success(`成功加载 ${file.name}，包含 ${data.length} 道题目`)
        // 重新检测所有试卷
        detectAllPapers()
      } else {
        ElMessage.error(`文件 ${file.name} 格式错误，期望数组`)
      }
    } catch (err) {
      console.error('解析 JSON 失败:', err)
      ElMessage.error(`解析 ${file.name} 失败: ${err.message}`)
    }
  }
  reader.readAsText(file.raw)
}

const detectAllPapers = () => {
  // 合并所有文件的题目
  const allQuestions = paperFileList.value.flatMap(file => file.data || [])
  
  const groups = new Map()
  allQuestions.forEach(q => {
    const key = `${q.fromSchool}-${q.examTime}-${q.examCode}-${q.examFullName}`
    if (!groups.has(key)) {
      groups.set(key, {
        title: q.examFullName || '未命名试卷',
        school: q.fromSchool || '未知',
        year: q.examTime || '未知',
        questions: []
      });
    }
    groups.get(key).questions.push(q)
  });
  detectedPapers.value = Array.from(groups.values())
}

const removePaperFile = (index) => {
  paperFileList.value.splice(index, 1)
  detectAllPapers()
  if (paperFileList.value.length === 0) {
    detectedPapers.value = []
  }
}

const clearPaperData = () => {
  paperFileList.value = []
  detectedPapers.value = []
  paperImportType.value = 1 // 重置为真题卷
  tagParseMode.value = 1 // 重置为标准模式
}

const startPaperImport = async () => {
  if (paperFileList.value.length === 0) {
    ElMessage.warning('请先上传试卷文件')
    return
  }
  
  // 合并所有文件的题目
  const allQuestions = paperFileList.value.flatMap(file => file.data || [])
  
  if (allQuestions.length === 0) {
    ElMessage.warning('没有要导入的题目')
    return
  }
  
  importing.value = true
  try {
    const res = await adminApi.importComputerPaper({
      questions: allQuestions,
      paperInfo: {
        paperType: paperImportType.value,
        tagParseMode: tagParseMode.value
      }
    })
    ElMessage.success(res.data?.message || `成功导入 ${allQuestions.length} 道题目`)
    clearPaperData()
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败: ' + (error.response?.data?.message || error.message))
  } finally {
    importing.value = false
  }
}

// 批量导入试题相关
const downloadQuestionTemplate = () => {
  const template = [
    {
      exerciseId: '示例ID-001',
      exerciseType: '单选题',
      stem: '这是单选题的题干',
      answer: 'A',
      analysis: '这是解析内容',
      options: {
        'A': '选项A内容',
        'B': '选项B内容',
        'C': '选项C内容',
        'D': '选项D内容'
      },
      majorId: '',
      chapterId: '',
      level: 3,
      totalScore: 5,
      knowledgeTags: ['标签1', '标签2'],
      fromSchool: '示例学校',
      examTime: '2024',
      examFullName: '示例试卷'
    },
    {
      exerciseId: '示例ID-002',
      exerciseType: '多选题',
      stem: '这是多选题的题干',
      answer: 'AB',
      analysis: '这是解析内容',
      options: {
        'A': '选项A内容',
        'B': '选项B内容',
        'C': '选项C内容',
        'D': '选项D内容'
      },
      majorId: '',
      chapterId: '',
      level: 3,
      totalScore: 5,
      knowledgeTags: ['标签1'],
      fromSchool: '示例学校',
      examTime: '2024',
      examFullName: '示例试卷'
    },
    {
      exerciseId: '示例ID-003',
      exerciseType: '填空题',
      stem: '这是填空题题干，有____个空',
      answer: '["答案1", "答案2"]',
      analysis: '这是解析内容',
      options: [
        { content: '答案1' },
        { content: '答案2' }
      ],
      majorId: '',
      chapterId: '',
      level: 3,
      totalScore: 10,
      knowledgeTags: ['标签1'],
      fromSchool: '示例学校',
      examTime: '2024',
      examFullName: '示例试卷'
    },
    {
      exerciseId: '示例ID-004',
      exerciseType: '解答题',
      stem: '这是解答题题干',
      answer: '解答题答案',
      analysis: '这是解析内容',
      options: [
        {
          questionStem: '小题1',
          questionAnswer: '小题1答案',
          questionAnalysis: '小题1解析',
          questionOrder: 1,
          questionScore: 5
        }
      ],
      majorId: '',
      chapterId: '',
      level: 4,
      totalScore: 15,
      knowledgeTags: ['标签1'],
      fromSchool: '示例学校',
      examTime: '2024',
      examFullName: '示例试卷'
    },
    {
      exerciseId: '示例ID-005',
      exerciseType: '判断题',
      stem: '这是判断题题干',
      answer: '正确',
      analysis: '这是解析内容',
      options: {
        'A': '正确',
        'B': '错误'
      },
      majorId: '',
      chapterId: '',
      level: 2,
      totalScore: 2,
      knowledgeTags: ['标签1'],
      fromSchool: '示例学校',
      examTime: '2024',
      examFullName: '示例试卷'
    }
  ]

  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '计算机试题导入模板.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('模板下载成功')
}

const handleQuestionFileChange = (file) => {
  // 检查是否已存在同名文件
  if (questionFileList.value.some(f => f.name === file.name)) {
    ElMessage.warning(`文件 ${file.name} 已存在`)
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (Array.isArray(data)) {
        // 验证数据格式
        const validTypes = ['单选题', '多选题', '填空题', '解答题', '判断题']
        const invalidItems = data.filter((q, index) => {
          if (!q.exerciseType || !validTypes.includes(q.exerciseType)) {
            console.warn(`第 ${index + 1} 道题题型无效:`, q.exerciseType)
            return true
          }
          if (!q.stem && !q.exerciseStem) {
            console.warn(`第 ${index + 1} 道题缺少题干`)
            return true
          }
          return false
        })

        if (invalidItems.length > 0) {
          ElMessage.warning(`文件 ${file.name} 中有 ${invalidItems.length} 道题目格式不正确`)
        }

        // 添加到文件列表
        questionFileList.value.push({
          name: file.name,
          data: data,
          raw: file.raw
        })
        ElMessage.success(`成功加载 ${file.name}，包含 ${data.length} 道试题`)
      } else {
        ElMessage.error(`文件 ${file.name} 格式错误，期望数组`)
      }
    } catch (err) {
      console.error('解析 JSON 失败:', err)
      ElMessage.error(`解析 ${file.name} 失败: ${err.message}`)
    }
  }
  reader.readAsText(file.raw)
}

const removeQuestionFile = (index) => {
  questionFileList.value.splice(index, 1)
  ElMessage.success('文件已移除')
}

const clearQuestionImportData = () => {
  questionFileList.value = []
  ElMessage.success('已清空所有文件')
}

const startQuestionImport = async () => {
  if (questionFileList.value.length === 0) {
    ElMessage.warning('没有要导入的试题文件')
    return
  }

  const allQuestions = questionFileList.value.flatMap(file => file.data || [])
  if (allQuestions.length === 0) {
    ElMessage.warning('没有要导入的试题')
    return
  }

  importingQuestions.value = true
  try {
    const res = await adminApi.importComputerQuestions(allQuestions)
    ElMessage.success(res.data?.message || `成功导入 ${res.data?.data?.successCount || allQuestions.length} 道试题`)
    clearQuestionImportData()
    // 刷新题目列表
    if (activeTab.value === 'questions') {
      searchQuestions()
    }
  } catch (error) {
    console.error('导入试题失败:', error)
    ElMessage.error('导入失败: ' + (error.response?.data?.message || error.message))
  } finally {
    importingQuestions.value = false
  }
}

// 监听标签切换
watch(activeTab, (val) => {
  if (val === 'corrections') fetchCorrections()
  if (val === 'questions') searchQuestions()
  if (val === 'wrong-stats') fetchWrongStats()
  if (val === 'subjects-chapters') {
    fetchSubjects()
    // 如果有选中的科目，重新加载该科目的章节
    if (selectedSubject.value) {
      fetchChapters(selectedSubject.value.id)
    }
  }
  if (val === 'tags') {
    fetchAllChapters()
    fetchTags()
  }
})

onMounted(() => {
  fetchCorrections()
  fetchSubjects()
  searchQuestions()
  fetchAllChapters()
})
</script>

<style scoped>
.computer-manage {
  padding: 20px;
}
.mb-10 { margin-bottom: 10px; }
.mb-20 { margin-bottom: 20px; }
.mb-30 { margin-bottom: 30px; }
.mt-5 { margin-top: 5px; }
.mt-10 { margin-top: 10px; }
.mt-20 { margin-top: 20px; }
.ml-10 { margin-left: 10px; }

/* 科目章节管理样式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 科目章节管理左右布局 */
.subjects-chapters-layout {
  display: flex;
  height: calc(100vh - 180px);
  gap: 16px;
}

.subjects-sidebar {
  width: 260px;
  flex-shrink: 0;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafbfc;
  border-radius: 8px 8px 0 0;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.subjects-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.subject-item {
  border: 1px solid transparent;
  border-radius: 6px;
  margin-bottom: 6px;
  transition: all 0.2s;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
}

.subject-item:hover {
  border-color: #d9ecff;
  background: #f5f9ff;
}

.subject-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.subject-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
}

.subject-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.subject-actions {
  display: flex;
  gap: 4px;
  padding: 6px 12px;
  border-top: 1px dashed #e4e7ed;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0.7;
  transition: opacity 0.2s;
  cursor: default;
}

.subject-item:hover .subject-actions {
  opacity: 1;
}

.chapters-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafbfc;
  border-radius: 8px 8px 0 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chapters-content .el-table {
  flex: 1;
}

.chapters-content :deep(.el-table__body-wrapper) {
  overflow-x: auto;
}

.chapters-content :deep(.el-table__fixed-right) {
  background: #fff;
}

.chapters-content :deep(.el-button--small) {
  padding: 5px 8px;
  font-size: 12px;
}

/* 章节展开/收起样式 */
.chapter-name-cell {
  display: flex;
  align-items: center;
  user-select: none;
}

.chapter-name-cell.has-children {
  font-weight: 500;
}

.chapter-name-cell.is-section {
  cursor: default;
}

.expand-click-area {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px;
  margin-right: 2px;
  border-radius: 4px;
  transition: background 0.2s;
}

.expand-click-area:hover {
  background: #e4e7ed;
}

.expand-icon {
  font-size: 14px;
  color: #909399;
  transition: transform 0.2s;
}

.expand-placeholder {
  display: inline-block;
  width: 20px;
}

.section-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #909399;
  margin-right: 10px;
  margin-left: 7px;
}

.chapter-name {
  flex: 1;
}

.section-count-tag {
  margin-left: 8px;
}

/* 知识点标签样式 */
.tag-item-with-info {
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.tag-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
}

.tag-input-row .el-input {
  flex-shrink: 0;
}

.chapter-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tag-input-row .el-button {
  flex-shrink: 0;
}

/* 解答题小题编辑样式 */
.subs-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sub-item-editor {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
}

.sub-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e9ecef;
}

.sub-index {
  font-weight: bold;
  color: #409eff;
  font-size: 16px;
}

.sub-content .el-form-item {
  margin-bottom: 10px;
}

.sub-content .el-form-item:last-child {
  margin-bottom: 0;
}

.preview-box {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 10px;
  min-height: 40px;
  font-size: 14px;
}
.preview-box.small {
  padding: 5px 8px;
  font-size: 12px;
}

.unnamed-tag {
  color: #f56c6c;
  font-style: italic;
}

/* 考点题目展开样式 */
.tag-questions-expand {
  padding: 20px;
  background: #f8f9fa;
  max-height: 600px;
  overflow-y: auto;
}

.expand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e4e7ed;
}

.expand-title {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-item {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.question-header {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.question-index {
  font-weight: bold;
  color: #409eff;
  font-size: 15px;
}

.question-type {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 13px;
}

.question-id {
  color: #999;
  font-size: 12px;
}

.question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin: 10px 0 15px;
  padding: 10px 15px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 13px;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-label {
  color: #666;
  font-weight: 500;
}

.meta-value {
  color: #333;
  margin-left: 5px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag-item {
  margin-right: 5px;
}

.question-content {
  line-height: 1.8;
}

.question-stem {
  font-size: 15px;
  margin-bottom: 15px;
  color: #333;
}

.question-options {
  margin: 15px 0;
  padding: 15px;
  background: #fafafa;
  border-radius: 6px;
}

.option-line {
  margin: 8px 0;
  display: flex;
  gap: 8px;
}

.option-key {
  font-weight: bold;
  color: #666;
  min-width: 25px;
}

.option-value {
  color: #333;
}

.question-answer {
  margin-top: 15px;
  padding: 12px 15px;
  background: #f0f9ff;
  border-left: 4px solid #409eff;
  border-radius: 4px;
}

.question-analysis {
  margin-top: 15px;
  padding: 12px 15px;
  background: #f6ffed;
  border-left: 4px solid #52c41a;
  border-radius: 4px;
}

.loading-questions {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-questions {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

.filter-card {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
}

.option-item {
  border: 1px solid #f0f0f0;
  padding: 10px;
  border-radius: 4px;
  background: #fff;
  margin-bottom: 10px;
}

.options-list {
  width: 100%;
}

.option-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.option-label {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 4px;
  font-weight: bold;
  flex-shrink: 0;
}

.option-input {
  flex: 1;
}

.richtext-expand-section {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  background: #fafafa;
}

.richtext-editor-wrapper {
  margin-top: 10px;
}

.richtext-preview {
  margin-top: 10px;
  padding: 10px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.tags-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.correction-remark {
  background: #fffbe6;
  padding: 15px;
  border: 1px solid #ffe58f;
  border-radius: 4px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
}

.import-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

/* 题目拖拽排序样式 */
.question-toolbar {
  margin-bottom: 10px;
  padding: 0 5px;
}

.question-drag-list {
  min-height: 50px;
}

.drag-handle {
  cursor: move;
  color: #909399;
  margin-right: 8px;
  font-size: 16px;
}

.drag-handle:hover {
  color: #409eff;
}

.question-item.sortable-ghost {
  opacity: 0.5;
  background: #ecf5ff;
  border-color: #409eff;
}

.question-item.sortable-drag {
  opacity: 0.9;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
</style>
