<template>
  <div class="math-manage">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 纠错反馈 -->
      <el-tab-pane label="纠错反馈" name="corrections">
        <div class="filter-bar mb-20">
          <el-radio-group v-model="correctionFilter.status" @change="fetchCorrections">
            <el-radio-button :label="0">待处理</el-radio-button>
            <el-radio-button :label="1">已处理</el-radio-button>
            <el-radio-button label="">全部</el-radio-button>
          </el-radio-group>
          <el-button class="ml-10" @click="fetchCorrections">刷新</el-button>
        </div>

        <el-table :data="corrections" v-loading="loadingCorrections" border stripe>
          <el-table-column prop="ID" label="ID" width="80" align="center" />
          <el-table-column prop="Type" label="类型" width="100" align="center" />
          <el-table-column prop="Content" label="反馈内容" min-width="200" show-overflow-tooltip />
          <el-table-column prop="QuestionID" label="题目ID" width="100" align="center" />
          <el-table-column prop="Status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.Status === 1 ? 'success' : 'danger'">
                {{ row.Status === 1 ? '已处理' : '待处理' }}
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

        <div class="pagination-container mt-20">
          <el-pagination
            v-model:current-page="correctionFilter.page"
            v-model:page-size="correctionFilter.pageSize"
            :total="correctionTotal"
            layout="total, prev, pager, next"
            @current-change="fetchCorrections"
          />
        </div>
      </el-tab-pane>

      <!-- 题目管理 -->
      <el-tab-pane label="题目管理" name="questions">
        <div class="filter-card mb-20">
          <el-row :gutter="20" align="middle">
            <el-col :span="4">
              <el-button type="primary" @click="openCreateQuestionModal">+ 创建题目</el-button>
            </el-col>
            <el-col :span="8">
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
            <el-col :span="6">
              <el-select v-model="questionFilter.subjectId" placeholder="所属科目" clearable @change="searchQuestions" style="width: 100%">
                <el-option v-for="s in subjects" :key="s.SubjectID" :label="s.SubjectName" :value="s.SubjectID" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-select v-model="questionFilter.questionType" placeholder="题型" clearable @change="searchQuestions" style="width: 100%">
                <el-option label="单选题" value="单选题" />
                <el-option label="多选题" value="多选题" />
                <el-option label="填空题" value="填空题" />
                <el-option label="解答题" value="解答题" />
                <el-option label="判断题" value="判断题" />
              </el-select>
            </el-col>
          </el-row>
        </div>

        <el-table :data="questions" v-loading="loadingQuestions" border stripe>
          <el-table-column prop="QuestionID" label="题目ID" width="100" align="center" />
          <el-table-column prop="QuestionType" label="题型" width="100" align="center" />
          <el-table-column prop="QuestionText" label="题干摘要" min-width="300" show-overflow-tooltip>
            <template #default="{ row }">
              <div v-html="stripHtml(row.QuestionText)"></div>
            </template>
          </el-table-column>
          <el-table-column prop="Difficulty" label="难度" width="100" align="center">
            <template #default="{ row }">
              <el-rate v-model="row.Difficulty" :max="5" disabled show-score />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openEditModal(row.QuestionID)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteQuestion(row.QuestionID)">删除</el-button>
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

      <!-- 科目管理 -->
      <el-tab-pane label="科目管理" name="subjects">
        <div class="filter-card mb-20">
          <el-button type="primary" @click="openSubjectModal">+ 创建科目</el-button>
        </div>

        <el-table :data="subjects" v-loading="loadingSubjects" border stripe>
          <el-table-column prop="SubjectID" label="ID" width="80" align="center" />
          <el-table-column prop="SubjectName" label="科目名称" min-width="200" />
          <el-table-column prop="description" label="描述" min-width="300" show-overflow-tooltip />
          <el-table-column label="操作" width="180" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openSubjectModal(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteSubject(row.SubjectID)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 书籍管理 -->
      <el-tab-pane label="书籍管理" name="books">
        <div class="filter-card mb-20">
          <el-row :gutter="20" align="middle">
            <el-col :span="3">
              <el-button type="primary" @click="openBookModal">+ 创建书籍</el-button>
            </el-col>
            <el-col :span="6">
              <el-input
                v-model="bookFilter.keyword"
                placeholder="搜索书籍名称..."
                clearable
                @keyup.enter="fetchBooks"
              >
                <template #append>
                  <el-button @click="fetchBooks">
                    <el-icon><Search /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-col>
            <el-col :span="5">
              <el-select v-model="bookFilter.subjectId" placeholder="所属科目" clearable @change="fetchBooks" style="width: 100%">
                <el-option v-for="s in subjects" :key="s.SubjectID" :label="s.SubjectName" :value="s.SubjectID" />
              </el-select>
            </el-col>
            <el-col :span="5">
              <el-select v-model="bookFilter.contentType" placeholder="内容类型" clearable @change="fetchBooks" style="width: 100%">
                <el-option label="书籍" value="book" />
                <el-option label="真题卷" value="real_paper" />
                <el-option label="模拟卷" value="mock_paper" />
              </el-select>
            </el-col>
            <el-col :span="5">
              <el-select v-model="bookFilter.countType" placeholder="计数类型" clearable @change="fetchBooks" style="width: 100%">
                <el-option label="题数" value="question" />
                <el-option label="套数" value="set" />
              </el-select>
            </el-col>
          </el-row>
        </div>

        <el-table :data="books" v-loading="loadingBooks" border stripe>
          <el-table-column prop="BookID" label="ID" width="80" align="center" />
          <el-table-column prop="BookTitle" label="书籍名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="ContentType" label="类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getContentTypeType(row.ContentType)">
                {{ getContentTypeLabel(row.ContentType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="100" align="center">
            <template #default="{ row }">
              {{ row.QuestionCount || 0 }} {{ row.CountType === 'set' ? '套' : '题' }}
            </template>
          </el-table-column>
          <el-table-column prop="LearnerCount" label="学习人数" width="100" align="center" />
          <el-table-column prop="SortOrder" label="排序" width="80" align="center" />
          <el-table-column label="操作" width="300" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="info" @click="openBookDetailModal(row)">详情</el-button>
              <el-button size="small" type="primary" @click="openAddQuestionsToBook(row)">添加题目</el-button>
              <el-button size="small" @click="openBookModal(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteBook(row.BookID)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container mt-20">
          <el-pagination
            v-model:current-page="bookFilter.page"
            v-model:page-size="bookFilter.pageSize"
            :total="bookTotal"
            layout="total, prev, pager, next"
            @current-change="fetchBooks"
          />
        </div>
      </el-tab-pane>

      <!-- 录入试题 -->
      <el-tab-pane label="录入试题" name="entry">
        <div class="entry-container">
          <!-- 顶部选择区域 -->
          <div class="entry-header mb-20">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="select-label">选择书籍</div>
                <el-select v-model="entryBookId" placeholder="请选择书籍" style="width: 100%" @change="onEntryBookChange">
                  <el-option v-for="book in books" :key="book.BookID" :label="book.BookTitle" :value="book.BookID" />
                </el-select>
              </el-col>
              <el-col :span="8">
                <div class="select-label">选择章节</div>
                <el-select v-model="entryChapterName" placeholder="请选择章节" style="width: 100%" :disabled="!entryBookId || entryChapters.length === 0">
                  <el-option v-for="chapter in entryChapters" :key="chapter.name" :label="chapter.name" :value="chapter.name">
                    <span>{{ chapter.name }}</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">{{ chapter.questionCount }}题</span>
                  </el-option>
                </el-select>
              </el-col>
              <el-col :span="8">
                <div class="select-label">操作</div>
                <el-button type="primary" @click="openAddChapterForEntry" :disabled="!entryBookId">+ 添加章节</el-button>
                <el-button @click="resetEntryForm">重置</el-button>
              </el-col>
            </el-row>
            
            <!-- 编辑模式切换 -->
            <el-row class="mt-20">
              <el-col :span="24">
                <el-radio-group v-model="entryMode" size="small">
                  <el-radio-button label="form">表单模式</el-radio-button>
                  <el-radio-button label="source">源代码模式</el-radio-button>
                </el-radio-group>
              </el-col>
            </el-row>
          </div>

          <!-- 题目编辑区域 -->
          <div class="entry-form-wrapper" v-if="entryBookId">
            <!-- 表单模式 -->
            <template v-if="entryMode === 'form'">
              <el-row :gutter="20">
                <!-- 左侧编辑区 -->
                <el-col :span="12">
                  <div class="edit-section">
                    <h4>题目信息</h4>
                    
                    <el-form label-width="80px">
                      <el-form-item label="题型">
                        <el-select v-model="entryForm.questionType" placeholder="请选择题型" style="width: 100%">
                          <el-option v-for="type in questionTypeOptions" :key="type" :label="type" :value="type" />
                        </el-select>
                      </el-form-item>
                      
                      <el-form-item label="难度">
                        <el-slider v-model="entryForm.difficulty" :min="0" :max="1" :step="0.1" show-stops />
                      </el-form-item>
                      
                      <el-form-item label="排序号">
                        <el-input v-model="entryForm.questionSort" placeholder="请输入排序号（留空则自动计算）" />
                      </el-form-item>
                      
                      <el-form-item label="题干">
                        <el-input v-model="entryForm.questionText" type="textarea" :rows="4" placeholder="请输入题干内容（支持LaTeX）" />
                      </el-form-item>
                      
                      <el-form-item label="答案">
                        <el-input v-model="entryForm.answerText" type="textarea" :rows="4" placeholder="请输入答案内容（支持LaTeX）" />
                      </el-form-item>
                    </el-form>

                    <!-- 详情卡片 -->
                    <div class="details-section mt-20">
                      <div class="details-header">
                        <h4>题目详情</h4>
                        <el-button size="small" type="primary" @click="addEntryDetail">+ 添加详情</el-button>
                      </div>
                      
                      <div v-for="(detail, index) in entryForm.details" :key="index" class="detail-card">
                        <div class="detail-card-header">
                          <el-select v-model="detail.BusType" size="small" style="width: 120px">
                            <el-option v-for="type in busTypeOptions" :key="type" :label="type" :value="type" />
                          </el-select>
                          <el-input v-model="detail.Title" size="small" placeholder="标题" style="width: 150px; margin-left: 10px" />
                          <div class="detail-actions">
                            <el-button size="small" link @click="moveEntryDetail(index, -1)" :disabled="index === 0">↑</el-button>
                            <el-button size="small" link @click="moveEntryDetail(index, 1)" :disabled="index === entryForm.details.length - 1">↓</el-button>
                            <el-button size="small" link type="danger" @click="removeEntryDetail(index)">删除</el-button>
                          </div>
                        </div>
                        <el-input v-model="detail.Context" type="textarea" :rows="3" placeholder="内容" class="mt-10" />
                      </div>
                    </div>
                  </div>
                </el-col>

                <!-- 右侧预览区 -->
                <el-col :span="12">
                  <div class="preview-section">
                    <h4>实时预览</h4>
                    
                    <div class="preview-block">
                      <div class="preview-label">题型</div>
                      <div class="preview-content">{{ entryForm.questionType || '未选择' }}</div>
                    </div>
                    
                    <div class="preview-block">
                      <div class="preview-label">难度</div>
                      <div class="preview-content">{{ entryForm.difficulty }}</div>
                    </div>
                    
                    <div class="preview-block">
                      <div class="preview-label">排序号</div>
                      <div class="preview-content">{{ entryForm.questionSort || '自动计算' }}</div>
                    </div>
                    
                    <div class="preview-block">
                      <div class="preview-label">题干</div>
                      <div class="preview-content" v-html="renderLatex(entryForm.questionText)"></div>
                    </div>
                    
                    <div class="preview-block">
                      <div class="preview-label">答案</div>
                      <div class="preview-content" v-html="renderLatex(entryForm.answerText)"></div>
                    </div>
                    
                    <div v-for="(detail, index) in entryForm.details" :key="index" class="preview-block">
                      <div class="preview-label">{{ detail.BusType }} {{ detail.Title ? '- ' + detail.Title : '' }}</div>
                      <div class="preview-content" v-html="renderLatex(detail.Context)"></div>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </template>
            
            <!-- 源代码模式 -->
            <template v-else>
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="source-edit-section">
                    <h4>源代码编辑（JSON格式）</h4>
                    <el-input
                      v-model="entrySourceCode"
                      type="textarea"
                      :rows="25"
                      placeholder="请输入JSON格式的题目数据"
                      class="source-code-input"
                      @change="onEntrySourceChange"
                    />
                    <div class="source-actions mt-10">
                      <el-button size="small" @click="formatEntrySourceCode">格式化JSON</el-button>
                      <el-button size="small" type="primary" @click="applyEntrySourceCode">应用到表单</el-button>
                    </div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="source-preview-section">
                    <h4>预览</h4>
                    <div v-if="entrySourcePreview" class="source-preview-content">
                      <div class="preview-block">
                        <div class="preview-label">题型</div>
                        <div class="preview-content">{{ entrySourcePreview.QuestionType || entrySourcePreview.questionType }}</div>
                      </div>
                      <div class="preview-block">
                        <div class="preview-label">难度</div>
                        <div class="preview-content">{{ entrySourcePreview.Difficulty || entrySourcePreview.difficulty }}</div>
                      </div>
                      <div class="preview-block">
                        <div class="preview-label">题干</div>
                        <div class="preview-content" v-html="renderLatex(entrySourcePreview.QuestionText || entrySourcePreview.questionText)"></div>
                      </div>
                      <div class="preview-block">
                        <div class="preview-label">答案</div>
                        <div class="preview-content" v-html="renderLatex(entrySourcePreview.OriginalAnswerText || entrySourcePreview.answerText)"></div>
                      </div>
                      <div v-for="(detail, index) in (entrySourcePreview.details || entrySourcePreview.Details)" :key="index" class="preview-block">
                        <div class="preview-label">{{ detail.BusType }} {{ detail.Title ? '- ' + detail.Title : '' }}</div>
                        <div class="preview-content" v-html="renderLatex(detail.Context)"></div>
                      </div>
                    </div>
                    <el-empty v-else description="请输入有效的JSON数据" />
                  </div>
                </el-col>
              </el-row>
            </template>

            <!-- 底部操作按钮 -->
            <div class="entry-actions mt-20">
              <el-button type="primary" size="large" @click="saveEntryQuestion" :loading="saving">保存题目</el-button>
              <el-button size="large" @click="clearEntryQuestion">清空</el-button>
            </div>
          </div>

          <div v-else class="empty-tip">
            <el-empty description="请先选择书籍和章节" />
          </div>
        </div>
      </el-tab-pane>

      <!-- 试题导入 -->
      <el-tab-pane label="试题导入" name="fileImport">
        <div class="file-import-container">
          <!-- 基础信息配置 -->
          <el-card class="mb-20" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>基础信息配置</span>
              </div>
            </template>
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="select-label">选择科目</div>
                <el-select v-model="fileImportForm.subjectId" placeholder="请选择科目" style="width: 100%">
                  <el-option v-for="s in subjects" :key="s.SubjectID" :label="s.SubjectName" :value="s.SubjectID" />
                </el-select>
              </el-col>
              <el-col :span="8">
                <div class="select-label">内容类型</div>
                <el-select v-model="fileImportForm.contentType" placeholder="请选择内容类型" style="width: 100%">
                  <el-option label="书籍" value="book" />
                  <el-option label="真题卷" value="real_paper" />
                  <el-option label="模拟卷" value="mock_paper" />
                </el-select>
              </el-col>
            </el-row>
          </el-card>

          <!-- 文件上传区域 -->
          <el-card class="mb-20" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>试题文件上传</span>
              </div>
            </template>
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="upload-card">
                  <div class="upload-header">
                    <span class="upload-title">结构文件</span>
                    <el-tag v-if="fileImportForm.structFile" type="success" size="small">已选择</el-tag>
                  </div>
                  <div class="upload-desc">包含书籍章节、题目顺序等信息</div>
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    :on-change="(file) => handleFileImportChange(file, 'struct')"
                    accept=".json"
                    :limit="1"
                    :file-list="structFileList"
                  >
                    <el-button type="primary" size="small">选择文件</el-button>
                  </el-upload>
                  <div v-if="fileImportForm.structData" class="file-info">
                    <el-icon><Document /></el-icon>
                    <span>{{ fileImportForm.structData.length }} 条结构数据</span>
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="upload-card">
                  <div class="upload-header">
                    <span class="upload-title">题目文件</span>
                    <el-tag v-if="fileImportForm.questionsFile" type="success" size="small">已选择</el-tag>
                  </div>
                  <div class="upload-desc">包含题目内容、答案等信息</div>
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    :on-change="(file) => handleFileImportChange(file, 'questions')"
                    accept=".json"
                    :limit="1"
                    :file-list="questionsFileList"
                  >
                    <el-button type="primary" size="small">选择文件</el-button>
                  </el-upload>
                  <div v-if="fileImportForm.questionsData" class="file-info">
                    <el-icon><Document /></el-icon>
                    <span>{{ fileImportForm.questionsData.length }} 道题目</span>
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="upload-card">
                  <div class="upload-header">
                    <span class="upload-title">详情文件</span>
                    <el-tag v-if="fileImportForm.detailsFile" type="success" size="small">已选择</el-tag>
                  </div>
                  <div class="upload-desc">包含题目详解、考点等信息</div>
                  <el-upload
                    action="#"
                    :auto-upload="false"
                    :on-change="(file) => handleFileImportChange(file, 'details')"
                    accept=".json"
                    :limit="1"
                    :file-list="detailsFileList"
                  >
                    <el-button type="primary" size="small">选择文件</el-button>
                  </el-upload>
                  <div v-if="fileImportForm.detailsData" class="file-info">
                    <el-icon><Document /></el-icon>
                    <span>{{ Object.keys(fileImportForm.detailsData).length }} 条详情</span>
                  </div>
                </div>
              </el-col>
            </el-row>
          </el-card>

          <!-- 相关题导入 -->
          <el-card class="mb-20" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>相关题导入</span>
                <el-tag v-if="relatedQuestionsData" type="success" size="small" class="ml-10">已加载</el-tag>
              </div>
            </template>
            <el-row :gutter="20" align="middle">
              <el-col :span="12">
                <el-upload
                  action="#"
                  :auto-upload="false"
                  :on-change="handleRelatedQuestionsFileChange"
                  accept=".json"
                  :limit="1"
                  :file-list="relatedQuestionsFileList"
                >
                  <el-button type="warning" size="small">
                    <el-icon><Connection /></el-icon> 选择相关题文件
                  </el-button>
                </el-upload>
                <div class="upload-desc mt-10">JSON格式：{"题目ID": ["相关题ID1", "相关题ID2", ...]}</div>
              </el-col>
              <el-col :span="12">
                <div v-if="relatedQuestionsData" class="file-info">
                  <el-icon><Document /></el-icon>
                  <span>{{ Object.keys(relatedQuestionsData).length }} 道题有相关题关联</span>
                </div>
              </el-col>
            </el-row>
          </el-card>

          <!-- 导入预览 -->
          <el-card class="mb-20" shadow="hover" v-if="importSummary.total > 0 || relatedQuestionsData">
            <template #header>
              <div class="card-header">
                <span>导入预览</span>
              </div>
            </template>
            <el-descriptions :column="5" border>
              <el-descriptions-item label="结构数据">{{ importSummary.structCount }} 条</el-descriptions-item>
              <el-descriptions-item label="题目数据">{{ importSummary.questionsCount }} 道</el-descriptions-item>
              <el-descriptions-item label="详情数据">{{ importSummary.detailsCount }} 条</el-descriptions-item>
              <el-descriptions-item label="相关题关联">{{ relatedQuestionsCount }} 条</el-descriptions-item>
              <el-descriptions-item label="预计导入">{{ importSummary.total + relatedQuestionsCount }} 条</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 操作按钮 -->
          <div class="import-actions">
            <el-button type="primary" size="large" @click="confirmFileImport" :loading="fileImporting" :disabled="!canImport && !relatedQuestionsData">
              开始导入
            </el-button>
            <el-button size="large" @click="clearFileImport">清空</el-button>
          </div>

          <!-- 导入结果 -->
          <div v-if="fileImportResult" class="import-result mt-20">
            <el-alert
              :title="fileImportResult.success ? '导入成功' : '导入失败'"
              :type="fileImportResult.success ? 'success' : 'error'"
              show-icon
            >
              <template #default>
                <div v-if="fileImportResult.success">
                  <p>创建书籍: {{ fileImportResult.data.totalBooks }} 本</p>
                  <p>创建题目: {{ fileImportResult.data.questionsCreated }} 道</p>
                  <p>更新题目: {{ fileImportResult.data.questionsUpdated }} 道</p>
                  <p>创建详情: {{ fileImportResult.data.detailsCreated }} 条</p>
                  <p>创建关联: {{ fileImportResult.data.linksCreated }} 条</p>
                  <p v-if="fileImportResult.data.relatedQuestionsImported">相关题关联: {{ fileImportResult.data.relatedQuestionsImported }} 条</p>
                </div>
                <div v-else>
                  {{ fileImportResult.message }}
                </div>
              </template>
            </el-alert>
          </div>
        </div>
      </el-tab-pane>

      <!-- 题目导入（旧版） -->
      <el-tab-pane label="题目导入" name="import">
        <div class="import-container">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="select-label">选择书籍</div>
              <el-select v-model="importBookId" placeholder="请选择书籍" style="width: 100%">
                <el-option v-for="book in books" :key="book.BookID" :label="book.BookTitle" :value="book.BookID" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <div class="select-label">选择章节（可选）</div>
              <el-select v-model="importChapterName" placeholder="不选择则按JSON中的章节导入" style="width: 100%" :disabled="!importBookId || importChapters.length === 0" clearable>
                <el-option v-for="chapter in importChapters" :key="chapter.name" :label="chapter.name" :value="chapter.name" />
              </el-select>
            </el-col>
          </el-row>

          <el-row class="mt-20">
            <el-col :span="24">
              <el-radio-group v-model="importMode" size="small">
                <el-radio-button label="file">文件上传</el-radio-button>
                <el-radio-button label="source">源代码编辑</el-radio-button>
              </el-radio-group>
            </el-col>
          </el-row>

          <template v-if="importMode === 'file'">
            <div class="import-upload mt-20">
              <el-upload
                drag
                action="#"
                :auto-upload="false"
                :on-change="handleImportFileChange"
                accept=".json"
                :limit="1"
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                  拖拽文件到此处或 <em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    请上传JSON格式的题目文件，<el-link type="primary" @click.prevent="showImportTemplate">查看模板</el-link>
                  </div>
                </template>
              </el-upload>
            </div>
          </template>

          <template v-else>
            <div class="import-source-section mt-20">
              <el-row :gutter="20">
                <el-col :span="12">
                  <div class="source-edit-area">
                    <h4>源代码编辑（JSON格式）</h4>
                    <el-input
                      v-model="importSourceCode"
                      type="textarea"
                      :rows="20"
                      placeholder="请输入JSON格式的题目数据数组，如：[{&quot;QuestionText&quot;: &quot;...&quot;, ...}]"
                      class="source-code-input"
                    />
                    <div class="source-actions mt-10">
                      <el-button size="small" @click="formatImportSourceCode">格式化JSON</el-button>
                      <el-button size="small" type="primary" @click="parseImportSourceCode">解析数据</el-button>
                      <el-button size="small" @click="showImportTemplate">查看模板</el-button>
                    </div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="source-preview-area">
                    <h4>数据预览</h4>
                    <div v-if="importPreviewData.length > 0" class="import-preview-content">
                      <p class="preview-count">共 {{ importPreviewData.length }} 道题目</p>
                      <el-scrollbar height="400px">
                        <div v-for="(q, idx) in importPreviewData.slice(0, 10)" :key="idx" class="preview-item">
                          <div class="preview-item-header">
                            <span class="item-index">#{{ idx + 1 }}</span>
                            <el-tag size="small">{{ q.QuestionType || q.questionType || '未知题型' }}</el-tag>
                            <span v-if="q.BookChapter || q.bookChapter" class="chapter-tag">{{ q.BookChapter || q.bookChapter }}</span>
                          </div>
                          <div class="preview-item-content" v-html="renderLatex((q.QuestionText || q.questionText || '').substring(0, 100)) + '...'"></div>
                        </div>
                        <div v-if="importPreviewData.length > 10" class="more-items-tip">
                          还有 {{ importPreviewData.length - 10 }} 道题...
                        </div>
                      </el-scrollbar>
                    </div>
                    <el-empty v-else description="请输入JSON数据并点击解析" />
                  </div>
                </el-col>
              </el-row>
            </div>
          </template>

          <div v-if="importPreviewData.length > 0 && importMode === 'file'" class="import-preview mt-20">
            <h4>导入预览（共 {{ importPreviewData.length }} 道题）</h4>
            <el-table :data="importPreviewData.slice(0, 5)" border stripe size="small">
              <el-table-column prop="QuestionID" label="ID" width="80" align="center" />
              <el-table-column prop="QuestionType" label="题型" width="100" align="center" />
              <el-table-column prop="QuestionText" label="题干" show-overflow-tooltip />
              <el-table-column prop="BookChapter" label="章节" width="150" />
            </el-table>
            <div v-if="importPreviewData.length > 5" class="more-tip">还有 {{ importPreviewData.length - 5 }} 道题...</div>
          </div>

          <div class="import-actions mt-20">
            <el-button type="primary" size="large" @click="confirmImport" :loading="importing" :disabled="importPreviewData.length === 0 || !importBookId">开始导入</el-button>
            <el-button size="large" @click="clearImport">清空</el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- 考点分类管理 -->
      <el-tab-pane label="考点分类" name="knowledgeCategories">
        <div class="knowledge-categories-container">
          <div class="filter-bar mb-20">
            <el-button type="primary" @click="openCreateSubjectModal">+ 添加科目</el-button>
            <el-button @click="fetchKnowledgeCategories">刷新</el-button>
          </div>

          <el-tree
            :data="knowledgeCategoryTree"
            :props="treeProps"
            node-key="id"
            default-expand-all
            highlight-current
          >
            <template #default="{ node, data }">
              <div class="custom-tree-node">
                <span class="node-name">
                  <el-tag v-if="getCategoryLevel(data) === 1" size="small" type="danger">科目</el-tag>
                  <el-tag v-else-if="getCategoryLevel(data) === 2" size="small" type="warning">章节</el-tag>
                  <el-tag v-else size="small" type="success">考点</el-tag>
                  {{ node.label }}
                </span>
                <span class="node-info">
                  <el-tag size="small" type="info">{{ data.CategoryCode }}</el-tag>
                  <el-tag v-if="data.QuestionCount" size="small">{{ data.QuestionCount }}题</el-tag>
                  <el-tag :type="data.IsActive === 1 ? 'success' : 'danger'" size="small">
                    {{ data.IsActive === 1 ? '启用' : '禁用' }}
                  </el-tag>
                </span>
                <span class="node-actions">
                  <el-button size="small" @click="openEditKnowledgeCategoryModal(data)">编辑</el-button>
                  <el-button v-if="getCategoryLevel(data) !== 3" size="small" type="primary" @click="openAddChildCategoryModal(data)">
                    {{ getCategoryLevel(data) === 1 ? '添加章节' : '添加考点' }}
                  </el-button>
                  <el-button v-if="getCategoryLevel(data) === 3" size="small" type="warning" @click="openMovePointModal(data)">移动</el-button>
                  <el-button size="small" type="danger" @click="deleteKnowledgeCategory(data.id)">删除</el-button>
                </span>
              </div>
            </template>
          </el-tree>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 题目编辑对话框 - 完整版 -->
    <el-dialog
      v-model="editModalVisible"
      title="编辑题目"
      width="95%"
      top="2vh"
      destroy-on-close
      :close-on-click-modal="false"
      class="edit-question-dialog"
    >
      <div v-if="selectedQuestion" class="edit-form-container">
        <!-- 左侧导航栏 -->
        <div class="edit-sidebar">
          <div class="sidebar-header">内容导航</div>
          <div class="sidebar-menu">
            <div 
              class="sidebar-item" 
              :class="{ active: activeSection === 'basic' }"
              @click="scrollToSection('basic')"
            >
              <el-icon><InfoFilled /></el-icon>
              <span>基本信息</span>
            </div>
            <div 
              class="sidebar-item" 
              :class="{ active: activeSection === 'question' }"
              @click="scrollToSection('question')"
            >
              <el-icon><Document /></el-icon>
              <span>题干内容</span>
            </div>
            <div 
              class="sidebar-item" 
              :class="{ active: activeSection === 'answer' }"
              @click="scrollToSection('answer')"
            >
              <el-icon><CircleCheck /></el-icon>
              <span>答案内容</span>
            </div>
            <div class="sidebar-divider">详情卡片</div>
            <div 
              v-for="(detail, index) in editForm.details" 
              :key="detail.ID || detail._tmpId"
              class="sidebar-item"
              :class="{ active: activeSection === 'detail-' + index }"
              @click="scrollToSection('detail-' + index)"
            >
              <el-tag :type="getBusTypeType(detail.BusType)" size="small">{{ detail.BusType }}</el-tag>
              <span class="sidebar-item-title">{{ detail.Title || detail.BusType }}</span>
            </div>
            <div class="sidebar-item add-item" @click="addDetailAndScroll">
              <el-icon><Plus /></el-icon>
              <span>新增卡片</span>
            </div>
          </div>
        </div>

        <!-- 右侧编辑区域 -->
        <div class="edit-main-content">
          <!-- 基本信息 -->
          <div id="section-basic" class="content-section">
            <div class="section-title">基本信息</div>
            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item label="题型">
                  <el-select v-model="editForm.questionType" style="width: 100%">
                    <el-option label="单选题" value="单选题" />
                    <el-option label="多选题" value="多选题" />
                    <el-option label="填空题" value="填空题" />
                    <el-option label="解答题" value="解答题" />
                    <el-option label="判断题" value="判断题" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="难度">
                  <el-rate v-model="editForm.difficulty" :max="5" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="题目ID">
                  <el-input v-model="selectedQuestion.QuestionID" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="所属书籍">
                  <el-select 
                    v-model="editForm.bookId" 
                    placeholder="请选择书籍" 
                    style="width: 100%"
                    clearable
                    @change="onEditBookChange"
                  >
                    <el-option 
                      v-for="book in books" 
                      :key="book.BookID" 
                      :label="book.BookTitle" 
                      :value="book.BookID" 
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item label="所属章节">
                  <el-select 
                    v-model="editForm.bookChapter" 
                    placeholder="请选择章节" 
                    style="width: 100%"
                    clearable
                    :disabled="!editForm.bookId"
                  >
                    <el-option 
                      v-for="chapter in editBookChapters" 
                      :key="chapter.name" 
                      :label="chapter.name" 
                      :value="chapter.name" 
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="页码">
                  <el-input-number v-model="editForm.questionPage" :min="1" :max="9999" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="排序">
                  <el-input-number v-model="editForm.questionSort" :min="1" :max="9999" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="章节排序">
                  <el-input-number v-model="editForm.chapterSort" :min="1" :max="9999" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 题干编辑 -->
          <div id="section-question" class="content-section">
            <div class="section-title">题干内容</div>
            <el-row :gutter="20" class="edit-preview-row">
              <el-col :span="12" class="edit-area">
                <el-form-item label="编辑">
                  <el-input 
                    v-model="editForm.questionText" 
                    type="textarea" 
                    :autosize="{ minRows: 10 }"
                    placeholder="请输入题干内容，支持LaTeX公式"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12" class="preview-area">
                <div class="preview-label">预览</div>
                <div class="latex-preview-box auto-height" v-html="renderLatex(editForm.questionText)"></div>
              </el-col>
            </el-row>
          </div>

          <!-- 答案编辑 -->
          <div id="section-answer" class="content-section">
            <div class="section-title">答案内容</div>
            <el-row :gutter="20" class="edit-preview-row">
              <el-col :span="12" class="edit-area">
                <el-form-item label="编辑">
                  <el-input 
                    v-model="editForm.answerText" 
                    type="textarea" 
                    :autosize="{ minRows: 10 }"
                    placeholder="请输入答案内容，支持LaTeX公式"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12" class="preview-area">
                <div class="preview-label">预览</div>
                <div class="latex-preview-box auto-height" v-html="renderLatex(editForm.answerText)"></div>
              </el-col>
            </el-row>
          </div>

          <!-- 题目详情列表 -->
          <div class="content-section">
            <div class="section-title">题目详情 (解析/考点等)</div>
            <div class="details-list">
              <el-card 
                v-for="(detail, index) in editForm.details" 
                :key="detail.ID || detail._tmpId" 
                :id="'section-detail-' + index"
                class="detail-card mb-10"
                :class="{ 'is-expanded': detail._expanded, 'kp-card': detail.LinkedKnowledgePointID }"
              >
                <template #header>
                  <div class="detail-card-header">
                    <div class="header-left">
                      <el-tag :type="getBusTypeType(detail.BusType)" size="small">{{ detail.BusType }}</el-tag>
                      <el-input v-model="detail.Title" placeholder="详情标题" size="small" class="detail-title-input" />
                      <span v-if="detail.LinkedKnowledgePointID && getLinkedKP(detail.LinkedKnowledgePointID)" class="kp-tag">
                        <el-icon><Link /></el-icon>
                        {{ getLinkedKP(detail.LinkedKnowledgePointID).KPTitle }}
                      </span>
                    </div>
                    <div class="header-actions">
                      <el-button 
                        v-if="index > 0" 
                        link 
                        size="small" 
                        @click="moveDetail(index, -1)"
                      >
                        <el-icon><ArrowUp /></el-icon>
                      </el-button>
                      <el-button 
                        v-if="index < editForm.details.length - 1" 
                        link 
                        size="small" 
                        @click="moveDetail(index, 1)"
                      >
                        <el-icon><ArrowDown /></el-icon>
                      </el-button>
                      <el-button link type="danger" size="small" @click="removeDetail(index)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </template>

                <div class="detail-card-body">
                  <el-row :gutter="20" class="mb-10">
                    <el-col :span="6">
                      <el-form-item label="业务类型">
                        <el-select v-model="detail.BusType" style="width: 100%" @change="sortDetails" size="small">
                          <el-option label="analysis" value="analysis" />
                          <el-option label="answer" value="answer" />
                          <el-option label="commentary" value="commentary" />
                          <el-option label="keypoint" value="keypoint" />
                          <el-option label="solution" value="solution" />
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="排序">
                        <el-input-number v-model="detail.Give" :min="0" @change="sortDetails" style="width: 100%" size="small" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="6">
                      <el-form-item label="关联考点ID">
                        <el-input v-model="detail.LinkedKnowledgePointID" placeholder="考点ID" size="small" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="8" v-if="detail.LinkedKnowledgePointID && getLinkedKP(detail.LinkedKnowledgePointID)">
                      <el-form-item label="考点名称">
                        <div class="kp-info">
                          <el-icon><Link /></el-icon>
                          <span>{{ getLinkedKP(detail.LinkedKnowledgePointID).KPTitle }}</span>
                        </div>
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <!-- 内容编辑区域 - 左右布局 -->
                  <el-row :gutter="20" class="edit-preview-row">
                    <el-col :span="12" class="edit-area">
                      <el-form-item :label="detail.LinkedKnowledgePointID ? '考点内容' : '主要内容'">
                        <el-input
                          v-model="detail.Context"
                          type="textarea"
                          :autosize="{ minRows: 8 }"
                          :placeholder="detail.LinkedKnowledgePointID ? '编辑考点内容，支持LaTeX公式和图片' : '支持LaTeX公式'"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12" class="preview-area">
                      <div class="preview-label">预览</div>
                      <div class="latex-preview-box auto-height" v-html="renderLatex(detail.Context)"></div>
                    </el-col>
                  </el-row>
                </div>
              </el-card>
            </div>
          </div>

          <!-- LaTeX公式助手 -->
          <div class="content-section latex-helper-section">
            <div class="section-title">LaTeX公式助手</div>
            <div class="latex-categories">
              <div v-for="cat in mathSymbolCategories" :key="cat.name" class="latex-category">
                <div class="category-name">{{ cat.name }}</div>
                <div class="latex-symbols-content">
                  <div
                    v-for="sym in cat.symbols"
                    :key="sym.code"
                    class="latex-symbol-btn"
                    @click="insertSymbol(sym.code)"
                    :title="sym.label + ': ' + sym.code"
                  >
                    <span class="symbol-visual" v-html="renderSymbol(sym.display)"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveQuestion" :loading="saving">保存</el-button>
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
    >
      <el-form :model="newQuestionForm" label-position="top" v-if="newQuestionForm">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="题型" required>
              <el-select v-model="newQuestionForm.QuestionType" style="width: 100%">
                <el-option label="单选题" value="单选题" />
                <el-option label="多选题" value="多选题" />
                <el-option label="填空题" value="填空题" />
                <el-option label="解答题" value="解答题" />
                <el-option label="判断题" value="判断题" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度">
              <el-rate v-model="newQuestionForm.Difficulty" :max="5" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="题干" required>
          <el-input v-model="newQuestionForm.QuestionText" type="textarea" :rows="4" placeholder="请输入题干，支持LaTeX公式" />
        </el-form-item>

        <el-form-item label="答案">
          <el-input v-model="newQuestionForm.OriginalAnswerText" type="textarea" :rows="3" placeholder="请输入答案" />
        </el-form-item>

        <el-form-item label="关联书籍">
          <el-select v-model="newQuestionForm.bookIds" multiple placeholder="选择关联书籍" style="width: 100%">
            <el-option v-for="b in books" :key="b.BookID" :label="b.BookName" :value="b.BookID" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createQuestionModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveNewQuestion" :loading="creatingQuestion">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 科目编辑对话框 -->
    <el-dialog
      v-model="subjectModalVisible"
      :title="editingSubject?.SubjectID ? '编辑科目' : '创建科目'"
      width="500px"
      destroy-on-close
    >
      <el-form :model="editingSubject" label-width="100px" v-if="editingSubject">
        <el-form-item label="科目名称" required>
          <el-input v-model="editingSubject.SubjectName" placeholder="请输入科目名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editingSubject.description" type="textarea" :rows="3" placeholder="请输入科目描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="subjectModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSubject">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 书籍编辑对话框 -->
    <el-dialog
      v-model="bookModalVisible"
      :title="editingBook?.BookID ? '编辑书籍' : '创建书籍'"
      width="600px"
      destroy-on-close
    >
      <el-form :model="editingBook" label-width="100px" v-if="editingBook">
        <el-form-item label="书籍名称" required>
          <el-input v-model="editingBook.BookTitle" placeholder="请输入书籍名称" />
        </el-form-item>
        <el-form-item label="内容类型" required>
          <el-select v-model="editingBook.ContentType" style="width: 100%">
            <el-option label="书籍" value="book" />
            <el-option label="真题卷" value="real_paper" />
            <el-option label="模拟卷" value="mock_paper" />
          </el-select>
        </el-form-item>
        <el-form-item label="计数类型" required>
          <el-select v-model="editingBook.CountType" style="width: 100%">
            <el-option label="题数" value="question" />
            <el-option label="套数" value="set" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属科目" required>
          <el-select v-model="editingBook.SubjectIDs" multiple style="width: 100%">
            <el-option v-for="s in subjects" :key="s.SubjectID" :label="s.SubjectName" :value="s.SubjectID" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本信息">
          <el-input v-model="editingBook.VersionInfo" placeholder="如：2024版" />
        </el-form-item>
        <el-form-item label="学习人数">
          <el-input-number v-model="editingBook.LearnerCount" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="editingBook.SortOrder" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editingBook.Description" type="textarea" rows="3" placeholder="书籍描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bookModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveBook">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加题目到书籍对话框 -->
    <el-dialog
      v-model="addQuestionsModalVisible"
      :title="isAddingToChapter ? `添加题目到章节: ${targetChapterName}` : '添加题目到书籍'"
      width="80%"
      destroy-on-close
    >
      <div class="mb-20">
        <el-input
          v-model="searchForAddQuestions.keyword"
          placeholder="搜索题目..."
          clearable
          @keyup.enter="searchQuestionsForSelection"
        >
          <template #append>
            <el-button @click="searchQuestionsForSelection">搜索</el-button>
          </template>
        </el-input>
      </div>

      <el-table
        :key="questionsForSelection.length"
        :data="questionsForSelection"
        v-loading="loadingQuestionsForSelection"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="QuestionID" label="题目ID" width="100" align="center" />
        <el-table-column prop="QuestionText" label="题干" min-width="300" show-overflow-tooltip />
        <el-table-column prop="QuestionType" label="题型" width="100" align="center" />
      </el-table>

      <div class="pagination-container mt-20">
        <el-pagination
          v-model:current-page="searchForAddQuestions.page"
          v-model:page-size="searchForAddQuestions.pageSize"
          :total="questionsForSelectionTotal"
          layout="total, prev, pager, next"
          @current-change="searchQuestionsForSelection"
        />
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addQuestionsModalVisible = false">取消</el-button>
          <el-button type="primary" @click="addSelectedQuestions" :disabled="selectedQuestions.length === 0">
            添加选中题目 ({{ selectedQuestions.length }})
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 书籍详情对话框 -->
    <el-dialog
      v-model="bookDetailModalVisible"
      :title="currentBookDetail?.BookTitle + ' - 书籍详情'"
      width="90%"
      top="2vh"
      destroy-on-close
      class="book-detail-dialog"
    >
      <div v-if="currentBookDetail" class="book-detail-container">
        <!-- 左侧章节列表 -->
        <div class="book-detail-sidebar">
          <div class="sidebar-header">
            <span>章节列表</span>
            <el-button size="small" type="primary" @click="openAddChapterModal">+ 添加章节</el-button>
          </div>
          <div class="chapter-list">
            <div
              v-for="chapter in bookChapters"
              :key="chapter.name"
              class="chapter-item"
              :class="{ active: selectedChapter?.name === chapter.name }"
              @click="selectChapter(chapter)"
            >
              <div class="chapter-info">
                <span class="chapter-name">{{ chapter.name || '未分类' }}</span>
                <span class="chapter-count">({{ chapter.questionCount }}题)</span>
              </div>
              <div class="chapter-actions">
                <el-button size="small" link @click.stop="editChapter(chapter)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button size="small" link type="danger" @click.stop="deleteChapter(chapter)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧题目列表 -->
        <div class="book-detail-main">
          <div class="detail-header">
            <h3>{{ selectedChapter?.name || '全部题目' }}</h3>
            <div class="header-actions">
              <el-button size="small" type="primary" @click="openAddQuestionsToChapter" v-if="selectedChapter">添加题目</el-button>
              <el-button size="small" type="danger" @click="batchDeleteQuestions" :disabled="selectedChapterQuestions.length === 0">批量删除</el-button>
            </div>
          </div>
          
          <el-table
            :data="chapterQuestions"
            v-loading="loadingChapterQuestions"
            border
            stripe
            @selection-change="handleChapterQuestionSelectionChange"
          >
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column prop="QuestionID" label="题目ID" width="100" align="center" />
            <el-table-column prop="BookChapter" label="所属章节" width="150" align="center" show-overflow-tooltip />
            <el-table-column prop="QuestionPage" label="页码" width="80" align="center" />
            <el-table-column prop="QuestionSort" label="排序" width="80" align="center" />
            <el-table-column prop="QuestionText" label="题干" min-width="300" show-overflow-tooltip>
              <template #default="{ row }">
                <div v-html="renderLatex(row.QuestionText?.substring(0, 100) + '...')"></div>
              </template>
            </el-table-column>
            <el-table-column prop="QuestionType" label="题型" width="100" align="center" />
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="editBookQuestion(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteBookQuestion(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 考点分类编辑对话框 -->
    <el-dialog
      v-model="knowledgeCategoryModalVisible"
      :title="isEditingKnowledgeCategory ? '编辑' : (addingSubject ? '添加科目' : (addingChild ? (getCategoryLevel({ CategoryCode: selectedParentCategory }) === 1 ? '添加章节' : '添加考点') : ''))"
      width="600px"
    >
      <el-form :model="knowledgeCategoryForm" label-width="100px">
        <el-form-item label="分类编码">
          <el-input v-model="knowledgeCategoryForm.CategoryCode" placeholder="自动生成" disabled />
        </el-form-item>
        <el-form-item label="分类名称">
          <el-input v-model="knowledgeCategoryForm.CategoryName" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="knowledgeCategoryForm.Description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="knowledgeCategoryForm.SortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="knowledgeCategoryForm.IsActive" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="knowledgeCategoryModalVisible = false">取消</el-button>
        <el-button type="primary" @click="saveKnowledgeCategory" :loading="savingKnowledgeCategory">保存</el-button>
      </template>
    </el-dialog>

    <!-- 移动考点对话框 -->
    <el-dialog
      v-model="movePointModalVisible"
      title="移动考点"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="当前考点">
          <el-tag>{{ movingPoint?.CategoryName }}</el-tag>
        </el-form-item>
        <el-form-item label="目标科目">
          <el-select v-model="moveTargetSubject" placeholder="请选择目标科目" style="width: 100%" @change="onSubjectChange">
            <el-option 
              v-for="level1 in knowledgeCategoryTree" 
              :key="level1.id" 
              :label="level1.CategoryName" 
              :value="level1"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标章节" v-if="moveTargetSubject">
          <el-select v-model="moveTargetChapter" placeholder="请选择目标章节" style="width: 100%">
            <el-option 
              v-for="level2 in moveTargetSubject.children" 
              :key="level2.id" 
              :label="level2.CategoryName" 
              :value="level2"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="movePointModalVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMovePoint" :loading="movingPointLoading">确定移动</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, ArrowUp, ArrowDown, Delete, Document, Memo, Link, Edit, InfoFilled, CircleCheck, Plus, UploadFilled, Connection } from '@element-plus/icons-vue'
import { adminApi } from '../api'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const activeTab = ref('corrections')

// 编辑题目导航
const activeSection = ref('basic')

// 滚动到指定部分
const scrollToSection = (section) => {
  activeSection.value = section
  const element = document.getElementById('section-' + section)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 添加详情卡片并滚动
const addDetailAndScroll = () => {
  addDetail()
  nextTick(() => {
    const newIndex = editForm.details.length - 1
    scrollToSection('detail-' + newIndex)
  })
}

// 监听滚动更新当前激活的部分
const setupScrollListener = () => {
  const container = document.querySelector('.edit-main-content')
  if (!container) return

  const sections = ['basic', 'question', 'answer', ...editForm.details.map((_, i) => 'detail-' + i)]

  container.addEventListener('scroll', () => {
    const scrollTop = container.scrollTop
    for (const section of sections) {
      const element = document.getElementById('section-' + section)
      if (element) {
        const offsetTop = element.offsetTop
        if (scrollTop >= offsetTop - 100) {
          activeSection.value = section
        }
      }
    }
  })
}

// 纠错反馈
const corrections = ref([])
const loadingCorrections = ref(false)
const correctionTotal = ref(0)
const correctionFilter = reactive({
  status: 0,
  page: 1,
  pageSize: 20
})

// 题目管理
const questions = ref([])
const loadingQuestions = ref(false)
const questionTotal = ref(0)
const questionFilter = reactive({
  keyword: '',
  subjectId: '',
  questionType: '',
  page: 1,
  pageSize: 20
})

// 科目管理
const subjects = ref([])
const loadingSubjects = ref(false)

// 书籍管理
const books = ref([])
const loadingBooks = ref(false)
const bookTotal = ref(0)
const bookFilter = reactive({
  keyword: '',
  subjectId: '',
  contentType: '',
  countType: '',
  page: 1,
  pageSize: 20
})

// 编辑相关
const editModalVisible = ref(false)
const selectedQuestion = ref(null)
const saving = ref(false)
const linkedKnowledgePoints = ref([])
const expandedKPs = ref([]) // 展开的考点
const editBookChapters = ref([]) // 编辑弹窗中的章节列表
const editForm = reactive({
  questionText: '',
  answerText: '',
  questionType: '',
  difficulty: 3,
  bookId: '',
  bookChapter: '',
  questionPage: '',
  questionSort: '',
  chapterSort: '',
  details: []
})

const createQuestionModalVisible = ref(false)
const creatingQuestion = ref(false)
const newQuestionForm = ref(null)
const subjectModalVisible = ref(false)
const editingSubject = ref(null)
const bookModalVisible = ref(false)
const editingBook = ref(null)

// 书籍详情
const bookDetailModalVisible = ref(false)
const currentBookDetail = ref(null)
const bookChapters = ref([])
const selectedChapter = ref(null)
const chapterQuestions = ref([])
const loadingChapterQuestions = ref(false)
const selectedChapterQuestions = ref([])

// 添加题目到书籍
const addQuestionsModalVisible = ref(false)
const currentBook = ref(null)
const questionsForSelection = ref([])
const loadingQuestionsForSelection = ref(false)
const questionsForSelectionTotal = ref(0)
const selectedQuestions = ref([])
const searchForAddQuestions = reactive({
  keyword: '',
  page: 1,
  pageSize: 20
})
const isAddingToChapter = ref(false)
const targetChapterName = ref('')

// 录入试题
const entryBookId = ref(null)
const entryChapterName = ref('')
const entryChapters = ref([])
const entryForm = reactive({
  questionText: '',
  answerText: '',
  questionType: '',
  difficulty: 0.5,
  questionSort: '',
  details: []
})
const entryMode = ref('form') // 'form' | 'source'
const entrySourceCode = ref('')
const entrySourcePreview = ref(null)

// 试题导入（新版三文件导入）
const fileImportForm = reactive({
  subjectId: null,
  contentType: 'book',
  structFile: null,
  questionsFile: null,
  detailsFile: null,
  structData: null,
  questionsData: null,
  detailsData: null
})
const structFileList = ref([])
const questionsFileList = ref([])
const detailsFileList = ref([])
const fileImporting = ref(false)
const fileImportResult = ref(null)

// 相关题导入相关
const relatedQuestionsFileList = ref([])
const relatedQuestionsData = ref(null)

const importSummary = computed(() => {
  const structCount = fileImportForm.structData ? fileImportForm.structData.length : 0
  const questionsCount = fileImportForm.questionsData ? fileImportForm.questionsData.length : 0
  const detailsCount = fileImportForm.detailsData ? Object.keys(fileImportForm.detailsData).length : 0
  return {
    structCount,
    questionsCount,
    detailsCount,
    total: Math.max(structCount, questionsCount, detailsCount)
  }
})

// 相关题数量统计
const relatedQuestionsCount = computed(() => {
  if (!relatedQuestionsData.value) return 0
  let count = 0
  for (const [questionId, relatedIds] of Object.entries(relatedQuestionsData.value)) {
    count += relatedIds.length
  }
  return count
})

const canImport = computed(() => {
  return fileImportForm.subjectId && 
         fileImportForm.contentType && 
         (fileImportForm.structData || fileImportForm.questionsData)
})

const handleFileImportChange = (file, type) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (type === 'struct') {
        fileImportForm.structFile = file.name
        fileImportForm.structData = Array.isArray(data) ? data : (data.struct || data.data || [])
        structFileList.value = [file]
      } else if (type === 'questions') {
        fileImportForm.questionsFile = file.name
        fileImportForm.questionsData = Array.isArray(data) ? data : (data.questions || data.data || [])
        questionsFileList.value = [file]
      } else if (type === 'details') {
        fileImportForm.detailsFile = file.name
        fileImportForm.detailsData = typeof data === 'object' && !Array.isArray(data) ? data : {}
        detailsFileList.value = [file]
      }
      ElMessage.success(`文件 ${file.name} 解析成功`)
    } catch (err) {
      ElMessage.error(`文件 ${file.name} 解析失败: ${err.message}`)
    }
  }
  reader.readAsText(file.raw)
}

const confirmFileImport = async () => {
  // 检查是否有试题数据或相关题数据
  if (!canImport.value && !relatedQuestionsData.value) {
    ElMessage.warning('请选择科目和内容类型并上传文件，或上传相关题文件')
    return
  }

  fileImporting.value = true
  fileImportResult.value = null
  
  try {
    let result = {
      totalBooks: 0,
      questionsCreated: 0,
      questionsUpdated: 0,
      detailsCreated: 0,
      linksCreated: 0,
      relatedQuestionsImported: 0
    }
    
    // 如果有试题数据，先导入试题
    if (canImport.value) {
      const res = await adminApi.importMathFromFiles({
        subjectId: fileImportForm.subjectId,
        contentType: fileImportForm.contentType,
        structData: fileImportForm.structData,
        questionsData: fileImportForm.questionsData,
        detailsData: fileImportForm.detailsData
      })
      result = { ...result, ...res.data }
    }
    
    // 如果有相关题数据，导入相关题
    if (relatedQuestionsData.value) {
      const relatedCount = await importRelatedQuestions()
      result.relatedQuestionsImported = relatedCount
    }
    
    fileImportResult.value = {
      success: true,
      data: result
    }
    ElMessage.success('导入成功')
    fetchBooks()
    fetchSubjects()
  } catch (error) {
    console.error('导入失败:', error)
    fileImportResult.value = {
      success: false,
      message: error.message || '导入失败'
    }
    ElMessage.error('导入失败')
  } finally {
    fileImporting.value = false
  }
}

const clearFileImport = () => {
  fileImportForm.subjectId = null
  fileImportForm.contentType = 'book'
  fileImportForm.structFile = null
  fileImportForm.questionsFile = null
  fileImportForm.detailsFile = null
  fileImportForm.structData = null
  fileImportForm.questionsData = null
  fileImportForm.detailsData = null
  structFileList.value = []
  questionsFileList.value = []
  detailsFileList.value = []
  fileImportResult.value = null
  // 清空相关题数据
  relatedQuestionsData.value = null
  relatedQuestionsFileList.value = []
}

// 处理相关题文件上传
const handleRelatedQuestionsFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      // 验证数据格式
      if (typeof data !== 'object' || Array.isArray(data)) {
        ElMessage.error('相关题文件格式错误，应为对象格式：{"题目ID": ["相关题ID1", ...]}')
        return
      }
      relatedQuestionsData.value = data
      relatedQuestionsFileList.value = [file]
      const questionCount = Object.keys(data).length
      const relationCount = Object.values(data).flat().length
      ElMessage.success(`相关题文件解析成功：${questionCount} 道题，${relationCount} 条关联`)
    } catch (err) {
      ElMessage.error(`相关题文件解析失败: ${err.message}`)
    }
  }
  reader.readAsText(file.raw)
}

// 导入相关题到数据库
const importRelatedQuestions = async () => {
  if (!relatedQuestionsData.value) return 0
  
  let importedCount = 0
  const entries = Object.entries(relatedQuestionsData.value)
  
  for (const [questionId, relatedIds] of entries) {
    try {
      // 过滤掉无效的ID
      const validRelatedIds = relatedIds.filter(id => id && String(id).trim() !== '')
      if (validRelatedIds.length === 0) continue
      
      // 调用API保存相关题关系
      await adminApi.saveRelatedQuestions({
        questionId: String(questionId),
        relatedIds: validRelatedIds.map(id => String(id))
      })
      importedCount += validRelatedIds.length
    } catch (error) {
      console.error(`保存题目 ${questionId} 的相关题失败:`, error)
    }
  }
  
  return importedCount
}

// 题目导入（旧版）
const importBookId = ref(null)
const importChapterName = ref('')
const importChapters = ref([])
const importPreviewData = ref([])
const importing = ref(false)
const importMode = ref('file')
const importSourceCode = ref('')

// 题型选项（与math-management.vue一致）
const questionTypeOptions = ['单选题', '多选题', '填空题', '解答题']

// 题目详情BusType选项（与math-management.vue一致）
const busTypeOptions = ['题目详解', '考点', '疑难点', '一题多解', '答疑', '其他']

// 数学符号
// LaTeX符号分类
const mathSymbolCategories = [
  {
    name: '基础运算',
    symbols: [
      { code: '\\frac{a}{b}', label: '分数', display: '\\frac{a}{b}' },
      { code: '\\sqrt{x}', label: '平方根', display: '\\sqrt{x}' },
      { code: '\\sqrt[n]{x}', label: 'n次根', display: '\\sqrt[n]{x}' },
      { code: 'x^{n}', label: '上标', display: 'x^{n}' },
      { code: 'x_{n}', label: '下标', display: 'x_{n}' },
      { code: '\\pm', label: '正负', display: '\\pm' },
      { code: '\\times', label: '乘号', display: '\\times' },
      { code: '\\div', label: '除号', display: '\\div' }
    ]
  },
  {
    name: '关系符号',
    symbols: [
      { code: '\\leq', label: '小于等于', display: '\\leq' },
      { code: '\\geq', label: '大于等于', display: '\\geq' },
      { code: '\\neq', label: '不等于', display: '\\neq' },
      { code: '\\approx', label: '约等于', display: '\\approx' },
      { code: '\\equiv', label: '恒等于', display: '\\equiv' },
      { code: '\\in', label: '属于', display: '\\in' },
      { code: '\\subset', label: '子集', display: '\\subset' },
      { code: '\\subseteq', label: '子集或等于', display: '\\subseteq' }
    ]
  },
  {
    name: '集合运算',
    symbols: [
      { code: '\\cup', label: '并集', display: '\\cup' },
      { code: '\\cap', label: '交集', display: '\\cap' },
      { code: '\\emptyset', label: '空集', display: '\\emptyset' },
      { code: '\\forall', label: '任意', display: '\\forall' },
      { code: '\\exists', label: '存在', display: '\\exists' },
      { code: '\\Rightarrow', label: '推出', display: '\\Rightarrow' },
      { code: '\\Leftrightarrow', label: '等价', display: '\\Leftrightarrow' }
    ]
  },
  {
    name: '希腊字母',
    symbols: [
      { code: '\\alpha', label: 'alpha', display: '\\alpha' },
      { code: '\\beta', label: 'beta', display: '\\beta' },
      { code: '\\gamma', label: 'gamma', display: '\\gamma' },
      { code: '\\theta', label: 'theta', display: '\\theta' },
      { code: '\\lambda', label: 'lambda', display: '\\lambda' },
      { code: '\\mu', label: 'mu', display: '\\mu' },
      { code: '\\pi', label: 'pi', display: '\\pi' },
      { code: '\\Delta', label: 'Delta', display: '\\Delta' }
    ]
  },
  {
    name: '求和与极限',
    symbols: [
      { code: '\\sum', label: '求和', display: '\\sum' },
      { code: '\\sum_{i=1}^{n}', label: '求和(完整)', display: '\\sum_{i=1}^{n}' },
      { code: '\\prod', label: '求积', display: '\\prod' },
      { code: '\\prod_{i=1}^{n}', label: '求积(完整)', display: '\\prod_{i=1}^{n}' },
      { code: '\\lim', label: '极限', display: '\\lim' },
      { code: '\\lim_{x \\to \\infty}', label: '极限(完整)', display: '\\lim_{x \\to \\infty}' },
      { code: '\\infty', label: '无穷', display: '\\infty' }
    ]
  },
  {
    name: '积分',
    symbols: [
      { code: '\\int', label: '积分', display: '\\int' },
      { code: '\\int_{a}^{b}', label: '定积分', display: '\\int_{a}^{b}' },
      { code: '\\iint', label: '二重积分', display: '\\iint' },
      { code: '\\iiint', label: '三重积分', display: '\\iiint' },
      { code: '\\oint', label: '环路积分', display: '\\oint' }
    ]
  },
  {
    name: '函数',
    symbols: [
      { code: '\\sin', label: 'sin', display: '\\sin' },
      { code: '\\cos', label: 'cos', display: '\\cos' },
      { code: '\\tan', label: 'tan', display: '\\tan' },
      { code: '\\log', label: 'log', display: '\\log' },
      { code: '\\ln', label: 'ln', display: '\\ln' },
      { code: '\\exp', label: 'exp', display: '\\exp' }
    ]
  },
  {
    name: '几何',
    symbols: [
      { code: '\\vec{a}', label: '向量', display: '\\vec{a}' },
      { code: '\\overline{AB}', label: '线段', display: '\\overline{AB}' },
      { code: '\\angle', label: '角', display: '\\angle' },
      { code: '\\perp', label: '垂直', display: '\\perp' },
      { code: '\\parallel', label: '平行', display: '\\parallel' },
      { code: '\\triangle', label: '三角形', display: '\\triangle' },
      { code: '\\odot', label: '圆', display: '\\odot' }
    ]
  },
  {
    name: '其他',
    symbols: [
      { code: '\\binom{n}{k}', label: '组合', display: '\\binom{n}{k}' },
      { code: '\\partial', label: '偏导', display: '\\partial' },
      { code: '\\nabla', label: '梯度', display: '\\nabla' },
      { code: '\\degree', label: '度', display: '\\degree' }
    ]
  }
]

// 兼容旧代码，展开所有符号
const mathSymbols = mathSymbolCategories.flatMap(cat => cat.symbols)

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// 去除HTML标签
const stripHtml = (html) => {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, '').substring(0, 100) + '...'
}

// 渲染LaTeX符号（用于公式助手按钮，只渲染公式，不处理其他内容）
// 对于求和、求积、极限、积分等符号，使用 displayMode: true 实现上下结构
const renderSymbol = (code) => {
  if (!code) return ''
  try {
    // 对于需要上下结构的符号（求和、求积、极限、积分），使用 displayMode: true
    const needDisplayMode = /\\?(sum|prod|lim|int|iint|iiint|oint)/.test(code)
    return katex.renderToString(code, { 
      displayMode: needDisplayMode, 
      throwOnError: false 
    })
  } catch (e) {
    return code
  }
}

// 渲染LaTeX（支持图片、Markdown和自定义样式）
// 参考 transformContextString 的实现方式
const renderLatex = (text) => {
  if (!text) return ''

  const placeholders = []
  const createPlaceholder = (content, type = 'html') => {
    const p = `__LATEX_JS_${type.toUpperCase()}_PH_${placeholders.length}__`
    placeholders.push({ p, content, type })
    return p
  }

  let currentText = text.trim().replace(/\t/g, ' ').replace(/ {2,}/g, ' ')
  
  // 0. 预处理：将公式内的换行符替换为空格，避免破坏 KaTeX 渲染
  // 先保护公式，处理后再恢复
  const formulaPlaceholders = []
  let formulaRegex
  try {
    formulaRegex = /(\$\$[\s\S]*?\$\$)|((?<!\\)\$([\s\S]+?)(?<!\\)\$)|(\\\[[\s\S]*?\\\])|(\\\([\s\S]*?\\\))/g
  } catch (e) {
    formulaRegex = /(\$\$[\s\S]*?\$\$)|(\$([\s\S]+?)\$)|(\\\[[\s\S]*?\\\])|(\\\([\s\S]*?\\\))/g
  }
  
  currentText = currentText.replace(formulaRegex, (match) => {
    // 将公式内的换行符替换为空格
    const cleanedFormula = match.replace(/\n/g, ' ')
    const p = `__FORMULA_TEMP_${formulaPlaceholders.length}__`
    formulaPlaceholders.push({ p, original: match, cleaned: cleanedFormula })
    return p
  })
  
  // 恢复公式（使用清理后的版本，内部换行符已替换为空格）
  formulaPlaceholders.forEach(({ p, cleaned }) => {
    currentText = currentText.replace(p, cleaned)
  })
  
  // 1. 提取并保护所有数学公式 (在反转义 HTML 之前，避免公式内的符号被破坏)
  let mathRegex
  try {
    mathRegex = /(\$\$[\s\S]*?\$\$)|((?<!\\)\$([\s\S]+?)(?<!\\)\$)|(\\\[[\s\S]*?\\\])|(\\\([\s\S]*?\\\))/g
  } catch (e) {
    mathRegex = /(\$\$[\s\S]*?\$\$)|(\$([\s\S]+?)\$)|(\\\[[\s\S]*?\\\])|(\\\([\s\S]*?\\\))/g
  }
  
  currentText = currentText.replace(mathRegex, (match, p1, p2, p3, p4, p5) => {
    let expression = ''
    let displayMode = false
    
    if (p1) { // $$...$$
      expression = p1.slice(2, -2)
      displayMode = true
    } else if (p2) { // $...$
      expression = p3
      displayMode = false
    } else if (p4) { // \[...\]
      expression = p4.slice(2, -2)
      displayMode = true
    } else if (p5) { // \(...\)
      expression = p5.slice(2, -2)
      displayMode = false
    }
    
    if (!expression.trim()) return match
    
    try {
      const rendered = katex.renderToString(expression, {
        throwOnError: false,
        displayMode: displayMode,
        strict: false
      })
      return createPlaceholder(rendered, 'math')
    } catch (e) {
      console.warn('KaTeX render error:', e)
      return match
    }
  })

  // 2. 反转义 HTML 实体
  currentText = currentText
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")

  // 3. 处理 《答案》等自定义标签
  currentText = currentText
    .replace(/《答案》/g, '<span class="custom-tag answer">【答案】</span>')
    .replace(/《\/答案》/g, '')
    .replace(/《分析》/g, '<span class="custom-tag analysis">【思路分析】</span>')
    .replace(/《\/分析》/g, '')
    .replace(/《点评》/g, '<span class="custom-tag commentary">【点评】</span>')
    .replace(/《\/点评》/g, '')
    .replace(/《注释》/g, '<span class="custom-tag note">')
    .replace(/《\/注释》/g, '</span>')
    .replace(/《步骤》/g, '<span class="custom-tag step">【步骤】</span>')
    .replace(/《\/步骤》/g, '')

  // 4. 处理 \color 和 \bold 命令
  currentText = currentText
    .replace(/\\color\{#([0-9A-Fa-f]{6})\}\{([^}]+)\}/g, '<span style="color:#$1;">$2</span>')
    .replace(/\\bold\{([^}]+)\}/g, '<b>$1</b>')
    .replace(/\\mathbf\{([^}]+)\}/g, '<b>$1</b>')

  // 5. 处理 Markdown 格式图片 ![alt](url) - 转换为 HTML img 标签
  // 先去除 _yjs 等后缀
  currentText = currentText.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, url) => {
      // 解码 URL（处理被编码的字符）
      let decodedUrl = url
      try {
        decodedUrl = decodeURIComponent(url)
      } catch (e) {
        // 解码失败则使用原 URL
      }
      // 去除 _yjs 等后缀
      const cleanUrl = decodedUrl.replace(/(_yjs|_thumb|_small|_medium|_large)(\?.*)?$/i, '$2')
      return `<img src="${cleanUrl}" alt="${alt}" style="max-width:100%;height:auto;display:block;margin:10px 0;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" onerror="this.style.display='none'" />`
    }
  )

  // 5.1 处理 ! `url` 格式（带反引号的图片标记）
  currentText = currentText.replace(
    /!\s*`\s*(https?:\/\/[^\s`]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp)(?:_yjs|_thumb|_small|_medium|_large)?)\s*`/gi,
    (match, url) => {
      // 解码 URL（处理被编码的字符）
      let decodedUrl = url
      try {
        decodedUrl = decodeURIComponent(url)
      } catch (e) {
        // 解码失败则使用原 URL
      }
      // 去除 _yjs 等后缀
      const cleanUrl = decodedUrl.replace(/(_yjs|_thumb|_small|_medium|_large)(\?.*)?$/i, '$2')
      return `<img src="${cleanUrl}" alt="" style="max-width:100%;height:auto;display:block;margin:10px 0;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" onerror="this.style.display='none'" />`
    }
  )

  // 6. 处理图片URL（如 http://ysj-question.oss-cn-hangzhou.aliyuncs.com/...）
  // 使用否定前瞻避免匹配已经包含在 <img src="..."> 中的URL
  currentText = currentText.replace(
    /(https?:\/\/[^\s<>"]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp))(?:_yjs|_thumb|_small|_medium|_large)?(?!["'])/gi,
    (match, url) => {
      // 去除 _yjs 等后缀
      const cleanUrl = url.replace(/(_yjs|_thumb|_small|_medium|_large)$/i, '')
      return `<img src="${cleanUrl}" style="max-width:100%;height:auto;display:block;margin:10px 0;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" onerror="this.style.display='none'" />`
    }
  )

  // 7. 还原占位符
  placeholders.forEach(({ p, content }) => {
    currentText = currentText.replace(p, content)
  })

  // 8. 将换行符转换为 <br>
  currentText = currentText.replace(/\n/g, '<br>')

  return currentText
}

// 合并相同考点的内容
const groupedKnowledgePoints = computed(() => {
  const groups = {}
  linkedKnowledgePoints.value.forEach(kp => {
    const key = kp.KnowledgePointID
    if (!groups[key]) {
      groups[key] = {
        ...kp,
        contents: [],
        notes: []
      }
    }
    if (kp.KPContent && !groups[key].contents.includes(kp.KPContent)) {
      groups[key].contents.push(kp.KPContent)
    }
    if (kp.KPNotes && !groups[key].notes.includes(kp.KPNotes)) {
      groups[key].notes.push(kp.KPNotes)
    }
  })
  return Object.values(groups)
})

// 获取纠错反馈
const fetchCorrections = async () => {
  loadingCorrections.value = true
  try {
    const res = await adminApi.getMathCorrections({
      status: correctionFilter.status,
      page: correctionFilter.page,
      pageSize: correctionFilter.pageSize
    })
    corrections.value = res.data.list || []
    correctionTotal.value = res.data.total || 0
  } catch (error) {
    console.error('获取纠错反馈失败:', error)
    ElMessage.error('获取纠错反馈失败')
  } finally {
    loadingCorrections.value = false
  }
}

// 搜索题目
const searchQuestions = async () => {
  loadingQuestions.value = true
  try {
    const res = await adminApi.searchMathQuestions({
      keyword: questionFilter.keyword,
      subjectId: questionFilter.subjectId,
      questionType: questionFilter.questionType,
      page: questionFilter.page,
      pageSize: questionFilter.pageSize
    })
    questions.value = res.data.list || []
    questionTotal.value = res.data.total || 0
  } catch (error) {
    console.error('搜索题目失败:', error)
    ElMessage.error('搜索题目失败')
  } finally {
    loadingQuestions.value = false
  }
}

// 获取科目列表
const fetchSubjects = async () => {
  loadingSubjects.value = true
  try {
    const res = await adminApi.getMathSubjects()
    subjects.value = res.data || []
  } catch (error) {
    console.error('获取科目失败:', error)
    ElMessage.error('获取科目列表失败')
  } finally {
    loadingSubjects.value = false
  }
}

// 获取书籍列表
const fetchBooks = async () => {
  loadingBooks.value = true
  try {
    const res = await adminApi.getMathBooks({
      keyword: bookFilter.keyword,
      subjectId: bookFilter.subjectId,
      contentType: bookFilter.contentType,
      countType: bookFilter.countType,
      page: bookFilter.page,
      pageSize: bookFilter.pageSize
    })
    books.value = res.data.list || []
    bookTotal.value = res.data.total || 0
  } catch (error) {
    console.error('获取书籍失败:', error)
    ElMessage.error('获取书籍列表失败')
  } finally {
    loadingBooks.value = false
  }
}

// 打开编辑弹窗
const openEditModal = async (questionId) => {
  try {
    const res = await adminApi.getMathQuestionDetail(questionId)
    if (res.code === 0) {
      selectedQuestion.value = res.data.question

      // 初始化编辑表单
      editForm.questionText = res.data.question.QuestionText || ''
      editForm.answerText = res.data.question.OriginalAnswerText || ''
      editForm.questionType = res.data.question.QuestionType || ''
      editForm.difficulty = res.data.question.Difficulty || 3
      
      // 初始化书籍章节相关信息
      editForm.bookId = res.data.question.LegacyOriginalBookID || ''
      editForm.bookChapter = res.data.question.BookChapter || ''
      editForm.questionPage = res.data.question.QuestionPage || ''
      editForm.questionSort = res.data.question.QuestionSort || ''
      editForm.chapterSort = res.data.question.ChapterSort || ''
      
      // 如果有关联书籍，加载章节列表
      if (editForm.bookId) {
        try {
          const chaptersRes = await adminApi.getMathBookChapters(editForm.bookId)
          editBookChapters.value = chaptersRes.data || []
        } catch (err) {
          console.error('加载章节列表失败:', err)
          editBookChapters.value = []
        }
      } else {
        editBookChapters.value = []
      }

      // 设置关联考点
      linkedKnowledgePoints.value = res.data.knowledgePoints || []

      // 处理详情列表 - 如果有关联考点且Context为空，填充考点内容
      editForm.details = (res.data.details || []).map(d => {
        const detail = {
          ...d,
          _expanded: false,
          _tmpId: d.ID || Date.now() + Math.random()
        }
        // 如果有关联考点ID且Context为空，自动填充考点内容
        if (detail.LinkedKnowledgePointID && (!detail.Context || detail.Context.trim() === '')) {
          const kp = linkedKnowledgePoints.value.find(kp => 
            String(kp.KnowledgePointID) === String(detail.LinkedKnowledgePointID)
          )
          if (kp && kp.KPContent) {
            detail.Context = kp.KPContent
          }
        }
        return detail
      })

      editModalVisible.value = true

      // 设置滚动监听
      nextTick(() => {
        setupScrollListener()
      })
    } else {
      ElMessage.error('获取题目详情失败')
    }
  } catch (error) {
    console.error('获取题目详情失败:', error)
    ElMessage.error('获取题目详情失败')
  }
}

// 编辑弹窗中书籍改变时加载章节
const onEditBookChange = async (bookId) => {
  editForm.bookChapter = '' // 清空章节选择
  if (bookId) {
    try {
      const res = await adminApi.getMathBookChapters(bookId)
      editBookChapters.value = res.data || []
    } catch (error) {
      console.error('加载章节列表失败:', error)
      editBookChapters.value = []
    }
  } else {
    editBookChapters.value = []
  }
}

// 切换详情展开/收起
const toggleDetail = (index) => {
  editForm.details[index]._expanded = !editForm.details[index]._expanded
}

// 展开所有详情
const expandAllDetails = () => {
  editForm.details.forEach(d => d._expanded = true)
}

// 收起所有详情
const collapseAllDetails = () => {
  editForm.details.forEach(d => d._expanded = false)
}

// 获取业务类型标签样式
const getBusTypeType = (busType) => {
  const typeMap = {
    'analysis': 'info',
    'answer': 'success',
    'commentary': 'warning',
    'keypoint': 'danger',
    'solution': 'primary'
  }
  return typeMap[busType] || 'info'
}

// 获取内容类型标签
const getContentTypeLabel = (contentType) => {
  const labelMap = {
    'book': '书籍',
    'real_paper': '真题卷',
    'mock_paper': '模拟卷'
  }
  return labelMap[contentType] || contentType || '未知'
}

// 获取内容类型标签样式
const getContentTypeType = (contentType) => {
  const typeMap = {
    'book': 'primary',
    'real_paper': 'success',
    'mock_paper': 'warning'
  }
  return typeMap[contentType] || 'info'
}

// 获取关联考点信息
const getLinkedKP = (kpId) => {
  if (!kpId) return null
  return linkedKnowledgePoints.value.find(kp => String(kp.KnowledgePointID) === String(kpId))
}

// 添加详情卡片
const addDetail = () => {
  const newDetail = {
    ID: null,
    _tmpId: Date.now(),
    BusType: 'analysis',
    Title: '',
    Context: '',
    Notes: '',
    Give: editForm.details.length,
    LinkedKnowledgePointID: null,
    _expanded: true
  }
  editForm.details.push(newDetail)
}

// 删除详情卡片
const removeDetail = (index) => {
  ElMessageBox.confirm('确定要删除这个详情卡片吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    editForm.details.splice(index, 1)
    ElMessage.success('已删除')
  })
}

// 移动详情卡片
const moveDetail = (index, direction) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= editForm.details.length) return
  
  const temp = editForm.details[index]
  editForm.details[index] = editForm.details[newIndex]
  editForm.details[newIndex] = temp
  
  // 更新排序权重
  editForm.details.forEach((d, i) => {
    d.Give = i
  })
}

// 排序详情
const sortDetails = () => {
  editForm.details.sort((a, b) => (a.Give || 0) - (b.Give || 0))
}

// 插入数学符号
const insertSymbol = (code) => {
  // 这里可以实现插入符号到当前焦点的功能
  // 简化版本：复制到剪贴板
  navigator.clipboard.writeText(code).then(() => {
    ElMessage.success(`已复制: ${code}`)
  })
}

// 保存题目
const saveQuestion = async () => {
  if (!editForm.questionText) {
    ElMessage.warning('请输入题干')
    return
  }
  
  saving.value = true
  try {
    const data = {
      questionText: editForm.questionText,
      answerText: editForm.answerText,
      questionType: editForm.questionType,
      difficulty: editForm.difficulty,
      bookId: editForm.bookId,
      bookChapter: editForm.bookChapter,
      questionPage: editForm.questionPage,
      questionSort: editForm.questionSort,
      chapterSort: editForm.chapterSort,
      details: editForm.details.map(d => ({
        ID: d.ID,
        BusType: d.BusType,
        Title: d.Title,
        Context: d.Context,
        Notes: d.Notes,
        Give: d.Give,
        LinkedKnowledgePointID: d.LinkedKnowledgePointID ? Number(d.LinkedKnowledgePointID) : null
      }))
    }
    
    await adminApi.updateMathQuestion(selectedQuestion.value.QuestionID, data)
    ElMessage.success('保存成功')
    editModalVisible.value = false
    searchQuestions()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 删除题目
const deleteQuestion = (id) => {
  ElMessageBox.confirm('确定要删除这道题吗？', '警告', { type: 'error' }).then(async () => {
    try {
      await adminApi.deleteMathQuestion(id)
      ElMessage.success('删除成功')
      searchQuestions()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 打开创建题目弹窗
const openCreateQuestionModal = () => {
  newQuestionForm.value = {
    QuestionType: '单选题',
    QuestionText: '',
    OriginalAnswerText: '',
    Difficulty: 3,
    bookIds: []
  }
  createQuestionModalVisible.value = true
}

// 保存新题目
const saveNewQuestion = async () => {
  if (!newQuestionForm.value.QuestionText) {
    ElMessage.warning('请输入题干')
    return
  }
  creatingQuestion.value = true
  try {
    await adminApi.createMathQuestion(newQuestionForm.value)
    ElMessage.success('题目创建成功')
    createQuestionModalVisible.value = false
    searchQuestions()
  } catch (error) {
    console.error('创建题目失败:', error)
    ElMessage.error('创建题目失败')
  } finally {
    creatingQuestion.value = false
  }
}

// 打开科目编辑弹窗
const openSubjectModal = (subject = null) => {
  if (subject) {
    editingSubject.value = { ...subject }
  } else {
    editingSubject.value = {
      SubjectName: '',
      description: ''
    }
  }
  subjectModalVisible.value = true
}

// 保存科目
const saveSubject = async () => {
  if (!editingSubject.value.SubjectName) {
    ElMessage.warning('请输入科目名称')
    return
  }
  try {
    if (editingSubject.value.SubjectID) {
      await adminApi.updateMathSubject(editingSubject.value.SubjectID, editingSubject.value)
      ElMessage.success('科目更新成功')
    } else {
      await adminApi.createMathSubject(editingSubject.value)
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
  ElMessageBox.confirm('确定要删除这个科目吗？', '警告', { type: 'warning' }).then(async () => {
    try {
      await adminApi.deleteMathSubject(id)
      ElMessage.success('删除成功')
      fetchSubjects()
    } catch (error) {
      console.error('删除科目失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 打开书籍编辑弹窗
const openBookModal = (book = null) => {
  if (book) {
    editingBook.value = { 
      ...book,
      SubjectIDs: book.SubjectIDs || []
    }
  } else {
    editingBook.value = {
      BookTitle: '',
      ContentType: 'book',
      CountType: 'question',
      SubjectIDs: [],
      VersionInfo: '',
      LearnerCount: 0,
      SortOrder: 0,
      Description: ''
    }
  }
  bookModalVisible.value = true
}

// 保存书籍
const saveBook = async () => {
  if (!editingBook.value.BookTitle) {
    ElMessage.warning('请输入书籍名称')
    return
  }
  if (!editingBook.value.ContentType) {
    ElMessage.warning('请选择内容类型')
    return
  }
  if (!editingBook.value.SubjectIDs || editingBook.value.SubjectIDs.length === 0) {
    ElMessage.warning('请选择所属科目')
    return
  }
  try {
    const bookData = {
      BookTitle: editingBook.value.BookTitle,
      ContentType: editingBook.value.ContentType,
      CountType: editingBook.value.CountType,
      SubjectIDs: editingBook.value.SubjectIDs,
      VersionInfo: editingBook.value.VersionInfo,
      LearnerCount: editingBook.value.LearnerCount || 0,
      SortOrder: editingBook.value.SortOrder || 0,
      Description: editingBook.value.Description
    }
    if (editingBook.value.BookID) {
      await adminApi.updateMathBook(editingBook.value.BookID, bookData)
      ElMessage.success('书籍更新成功')
    } else {
      await adminApi.createMathBook(bookData)
      ElMessage.success('书籍创建成功')
    }
    bookModalVisible.value = false
    fetchBooks()
  } catch (error) {
    console.error('保存书籍失败:', error)
    ElMessage.error('保存失败')
  }
}

// 删除书籍
const deleteBook = (id) => {
  ElMessageBox.confirm('确定要删除这本书籍吗？删除书籍将同时删除所有关联的题目！', '警告', { type: 'warning' }).then(async () => {
    try {
      await adminApi.deleteMathBook(id)
      ElMessage.success('删除成功')
      fetchBooks()
    } catch (error) {
      console.error('删除书籍失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 打开书籍详情弹窗
const openBookDetailModal = async (book) => {
  currentBookDetail.value = book
  bookDetailModalVisible.value = true
  selectedChapter.value = null // 重置章节选择
  await fetchBookChapters(book.BookID)
  // 默认加载所有题目
  await fetchBookAllQuestions(book.BookID)
}

// 获取书籍章节列表
const fetchBookChapters = async (bookId) => {
  try {
    const res = await adminApi.getMathBookChapters(bookId)
    bookChapters.value = res.data || []
  } catch (error) {
    console.error('获取章节列表失败:', error)
    ElMessage.error('获取章节列表失败')
  }
}

// 获取书籍所有题目
const fetchBookAllQuestions = async (bookId) => {
  loadingChapterQuestions.value = true
  try {
    const res = await adminApi.getMathBookAllQuestions(bookId)
    chapterQuestions.value = res.data || []
  } catch (error) {
    console.error('获取书籍题目失败:', error)
    ElMessage.error('获取书籍题目失败')
  } finally {
    loadingChapterQuestions.value = false
  }
}

// 选择章节
const selectChapter = async (chapter) => {
  selectedChapter.value = chapter
  await fetchChapterQuestions(chapter.name)
}

// 获取章节题目列表
const fetchChapterQuestions = async (chapterName) => {
  loadingChapterQuestions.value = true
  try {
    const res = await adminApi.getMathBookChapterQuestions(currentBookDetail.value.BookID, chapterName)
    chapterQuestions.value = res.data || []
  } catch (error) {
    console.error('获取章节题目失败:', error)
    ElMessage.error('获取章节题目失败')
  } finally {
    loadingChapterQuestions.value = false
  }
}

// 编辑章节
const editChapter = (chapter) => {
  ElMessageBox.prompt('请输入新的章节名称', '编辑章节', {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputValue: chapter.name
  }).then(async ({ value }) => {
    if (!value || value === chapter.name) return
    try {
      await adminApi.updateMathBookChapter(currentBookDetail.value.BookID, chapter.name, { newName: value })
      ElMessage.success('章节名称修改成功')
      fetchBookChapters(currentBookDetail.value.BookID)
    } catch (error) {
      console.error('修改章节名称失败:', error)
      ElMessage.error('修改失败')
    }
  })
}

// 删除章节
const deleteChapter = (chapter) => {
  ElMessageBox.confirm(`确定要删除章节 "${chapter.name}" 吗？该章节下的所有题目将被移出本书籍！`, '警告', { type: 'warning' }).then(async () => {
    try {
      await adminApi.deleteMathBookChapter(currentBookDetail.value.BookID, chapter.name)
      ElMessage.success('章节删除成功')
      fetchBookChapters(currentBookDetail.value.BookID)
      selectedChapter.value = null
      chapterQuestions.value = []
    } catch (error) {
      console.error('删除章节失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 编辑书籍题目 - 使用完整的编辑弹窗
const editBookQuestion = (question) => {
  // 使用与题目管理相同的编辑弹窗
  openEditModal(question.QuestionID)
}

// 删除书籍题目
const deleteBookQuestion = (question) => {
  ElMessageBox.confirm('确定要将该题目从本书籍中移除吗？', '提示').then(async () => {
    try {
      await adminApi.deleteMathBookQuestion(currentBookDetail.value.BookID, question.QuestionID)
      ElMessage.success('删除成功')
      // 刷新当前章节
      if (selectedChapter.value) {
        await fetchChapterQuestions(selectedChapter.value.name)
      }
      // 刷新章节列表
      await fetchBookChapters(currentBookDetail.value.BookID)
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

// 章节题目选择变化
const handleChapterQuestionSelectionChange = (selection) => {
  selectedChapterQuestions.value = selection
}

// 批量删除题目
const batchDeleteQuestions = () => {
  if (selectedChapterQuestions.value.length === 0) {
    ElMessage.warning('请先选择要删除的题目')
    return
  }
  ElMessageBox.confirm(`确定要删除选中的 ${selectedChapterQuestions.value.length} 道题目吗？`, '警告', { type: 'warning' }).then(async () => {
    try {
      const questionIds = selectedChapterQuestions.value.map(q => q.QuestionID)
      await adminApi.batchDeleteMathBookQuestions(currentBookDetail.value.BookID, questionIds)
      ElMessage.success('批量删除成功')
      // 刷新当前章节
      if (selectedChapter.value) {
        await fetchChapterQuestions(selectedChapter.value.name)
      }
      // 刷新章节列表
      await fetchBookChapters(currentBookDetail.value.BookID)
      selectedChapterQuestions.value = []
    } catch (error) {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  })
}

// 打开添加章节弹窗
const openAddChapterModal = () => {
  ElMessageBox.prompt('请输入章节名称', '添加章节', {
    confirmButtonText: '添加',
    cancelButtonText: '取消',
    inputPlaceholder: '如：第一章 函数与极限'
  }).then(async ({ value }) => {
    if (!value) return
    try {
      await adminApi.addMathBookChapter(currentBookDetail.value.BookID, { chapterName: value })
      ElMessage.success('章节添加成功')
      // 直接在前端添加新章节到列表（空章节，题目数为0）
      bookChapters.value.push({
        name: value,
        questionCount: 0
      })
      // 按名称排序
      bookChapters.value.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    } catch (error) {
      console.error('添加章节失败:', error)
      ElMessage.error('添加失败')
    }
  })
}

// 打开添加题目到章节弹窗
const openAddQuestionsToChapter = () => {
  if (!selectedChapter.value) {
    ElMessage.warning('请先选择一个章节')
    return
  }
  currentBook.value = currentBookDetail.value
  questionsForSelection.value = []
  selectedQuestions.value = []
  searchForAddQuestions.keyword = ''
  searchForAddQuestions.page = 1
  addQuestionsModalVisible.value = true
  isAddingToChapter.value = true
  targetChapterName.value = selectedChapter.value.name
  searchQuestionsForSelection()
}

// 打开添加题目到书籍弹窗
const openAddQuestionsToBook = (book) => {
  currentBook.value = book
  questionsForSelection.value = []
  selectedQuestions.value = []
  searchForAddQuestions.keyword = ''
  searchForAddQuestions.page = 1
  addQuestionsModalVisible.value = true
  isAddingToChapter.value = false
  targetChapterName.value = ''
  searchQuestionsForSelection()
}

// 搜索题目用于选择
const searchQuestionsForSelection = async () => {
  loadingQuestionsForSelection.value = true
  try {
    const res = await adminApi.searchMathQuestions({
      keyword: searchForAddQuestions.keyword,
      page: searchForAddQuestions.page,
      pageSize: searchForAddQuestions.pageSize
    })
    questionsForSelection.value = res.data.list || []
    questionsForSelectionTotal.value = res.data.total || 0
  } catch (error) {
    console.error('搜索题目失败:', error)
  } finally {
    loadingQuestionsForSelection.value = false
  }
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedQuestions.value = selection
}

// 添加选中的题目
const addSelectedQuestions = async () => {
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning('请选择要添加的题目')
    return
  }
  try {
    const questionIds = selectedQuestions.value.map(q => q.QuestionID)
    const data = { questionIds }
    // 如果是添加到指定章节，传递章节名称
    if (isAddingToChapter.value && targetChapterName.value) {
      data.chapterName = targetChapterName.value
    }
    await adminApi.addQuestionsToMathBook(currentBook.value.BookID, data)
    ElMessage.success(`成功添加 ${questionIds.length} 道题目`)
    addQuestionsModalVisible.value = false
    // 如果是添加到章节，刷新章节列表和题目列表
    if (isAddingToChapter.value && currentBookDetail.value) {
      await fetchBookChapters(currentBookDetail.value.BookID)
      if (selectedChapter.value) {
        await fetchChapterQuestions(selectedChapter.value.name)
      }
    }
    fetchBooks()
  } catch (error) {
    console.error('添加题目失败:', error)
    ElMessage.error('添加题目失败')
  }
}

// 处理纠错
const handleCorrection = async (correction) => {
  try {
    await adminApi.updateMathCorrectionStatus(correction.ID, { status: 1 })
    ElMessage.success('已标记为处理')
    fetchCorrections()
  } catch (error) {
    console.error('处理纠错失败:', error)
    ElMessage.error('处理失败')
  }
}

// --- 录入试题相关方法 ---
const onEntryBookChange = async (bookId) => {
  entryBookId.value = bookId
  entryChapterName.value = ''
  if (bookId) {
    try {
      const res = await adminApi.getMathBookChapters(bookId)
      entryChapters.value = res.data || []
    } catch (error) {
      console.error('获取章节列表失败:', error)
      entryChapters.value = []
    }
  } else {
    entryChapters.value = []
  }
}

const openAddChapterForEntry = () => {
  ElMessageBox.prompt('请输入章节名称', '添加章节', {
    confirmButtonText: '添加',
    cancelButtonText: '取消',
    inputPlaceholder: '如：第一章 函数与极限'
  }).then(async ({ value }) => {
    if (!value) return
    
    try {
      // 调用API保存章节到数据库
      await adminApi.addMathBookChapter(entryBookId.value, {
        chapterName: value
      })
      
      // 重新获取章节列表
      const res = await adminApi.getMathBookChapters(entryBookId.value)
      entryChapters.value = res.data || []
      
      // 选中新添加的章节
      entryChapterName.value = value
      ElMessage.success('章节添加成功')
    } catch (error) {
      console.error('添加章节失败:', error)
      ElMessage.error('添加章节失败')
    }
  })
}

const addEntryDetail = () => {
  entryForm.details.push({
    BusType: '题目详解',
    Title: '',
    Context: ''
  })
}

const moveEntryDetail = (index, direction) => {
  const newIndex = index + direction
  if (newIndex >= 0 && newIndex < entryForm.details.length) {
    const temp = entryForm.details[index]
    entryForm.details[index] = entryForm.details[newIndex]
    entryForm.details[newIndex] = temp
  }
}

const removeEntryDetail = (index) => {
  entryForm.details.splice(index, 1)
}

const clearEntryQuestion = () => {
  entryForm.questionText = ''
  entryForm.answerText = ''
  entryForm.questionType = ''
  entryForm.difficulty = 0.5
  entryForm.questionSort = ''
  entryForm.details = []
  entrySourceCode.value = ''
  entrySourcePreview.value = null
}

const resetEntryForm = () => {
  entryBookId.value = null
  entryChapterName.value = ''
  entryChapters.value = []
  entryMode.value = 'form'
  clearEntryQuestion()
}

// 源代码编辑相关方法
const onEntrySourceChange = () => {
  try {
    if (entrySourceCode.value.trim()) {
      const data = JSON.parse(entrySourceCode.value)
      entrySourcePreview.value = data
    } else {
      entrySourcePreview.value = null
    }
  } catch (e) {
    // JSON解析失败，不更新预览
  }
}

const formatEntrySourceCode = () => {
  try {
    if (entrySourceCode.value.trim()) {
      const data = JSON.parse(entrySourceCode.value)
      entrySourceCode.value = JSON.stringify(data, null, 2)
      ElMessage.success('格式化成功')
    }
  } catch (e) {
    ElMessage.error('JSON格式错误，无法格式化')
  }
}

const applyEntrySourceCode = () => {
  try {
    if (!entrySourceCode.value.trim()) {
      ElMessage.warning('请输入JSON数据')
      return
    }

    // 移除注释后解析JSON
    let jsonStr = entrySourceCode.value
    // 移除单行注释
    jsonStr = jsonStr.replace(/\/\/.*$/gm, '')
    // 移除多行注释
    jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '')

    const data = JSON.parse(jsonStr)

    // 应用到表单
    entryForm.questionText = data.QuestionText || ''
    entryForm.questionType = data.QuestionType || ''
    entryForm.answerText = data.OriginalAnswerText || ''
    entryForm.difficulty = data.Difficulty || 0.5

    // 处理details
    const details = data.details || []
    entryForm.details = details.map(d => ({
      BusType: d.BusType || '题目详解',
      Title: d.Title || '',
      Context: d.Context || ''
    }))

    // 如果有QuestionSort或Sort字段，可以在保存时使用
    // 这里存储在entryForm中供保存时使用
    entryForm.questionSort = data.QuestionSort || data.Sort || ''

    ElMessage.success('已应用到表单')
    entryMode.value = 'form'
  } catch (e) {
    ElMessage.error('JSON解析失败：' + e.message)
  }
}

// 生成当前表单的JSON（与math-management.vue格式一致）
const generateEntrySourceCode = () => {
  // 如果有实际数据，使用实际数据；否则使用示例数据
  const hasData = entryForm.questionText || entryForm.details.length > 0
  
  // 计算排序号
  const currentChapter = entryChapters.value.find(c => c.name === entryChapterName.value)
  const questionSort = currentChapter ? (currentChapter.questionCount || 0) + 1 : 1
  
  const data = hasData ? {
    QuestionText: entryForm.questionText,
    QuestionType: entryForm.questionType,
    OriginalAnswerText: entryForm.answerText,
    Difficulty: entryForm.difficulty,
    QuestionSort: questionSort.toString(),
    Sort: questionSort,
    details: entryForm.details.map(d => ({
      BusType: d.BusType || '题目详解',
      Context: d.Context || ''
    }))
  } : {
    QuestionText: "设 $f(x) = x^2$，求 $f'(x)$。",
    QuestionType: "解答题",
    OriginalAnswerText: "$f'(x) = 2x$",
    Difficulty: 0.3,
    QuestionSort: "1",
    Sort: 1,
    details: [
      {
        BusType: "题目详解",
        Context: "根据导数定义，$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h)-f(x)}{h} = 2x$。"
      }
    ]
  }

  const jsonStr = JSON.stringify(data, null, 2)
  const comment = `// 手动录入试题JSON格式
// 注意：手动录入的试题ID从 1000000000 开始自动递增
// 
// 字段说明：
// - QuestionText: 题干内容，支持LaTeX公式
// - QuestionType: 题型（单选题/多选题/填空题/解答题）
// - OriginalAnswerText: 答案内容，支持LaTeX公式
// - Difficulty: 难度系数（0-1之间的小数）
// - QuestionSort: 题目排序号（字符串格式，如 "1", "2"）
// - Sort: 题目排序号（数字格式，如 1, 2）
// - details: 题目详情列表
//   - BusType: 业务类型（题目详解/考点/疑难点/一题多解/答疑/其他）
//   - Context: 详情内容，支持LaTeX公式

`
  return comment + jsonStr
}

// 监听模式切换，同步数据
watch(entryMode, (newMode) => {
  if (newMode === 'source') {
    // 切换到源代码模式时，生成JSON
    entrySourceCode.value = generateEntrySourceCode()
    onEntrySourceChange()
  }
})

const saveEntryQuestion = async () => {
  if (!entryForm.questionText || entryForm.questionText.trim() === '') {
    ElMessage.warning('请输入题干内容')
    return
  }
  if (!entryBookId.value) {
    ElMessage.warning('请选择书籍')
    return
  }
  if (!entryChapterName.value) {
    ElMessage.warning('请选择章节')
    return
  }

  saving.value = true
  try {
    // 获取当前章节的题目数量作为排序号（如果JSON中没有指定）
    let questionSort = entryForm.questionSort
    if (!questionSort) {
      const currentChapter = entryChapters.value.find(c => c.name === entryChapterName.value)
      questionSort = currentChapter ? (currentChapter.questionCount || 0) + 1 : 1
    }
    
    const data = {
      questionText: entryForm.questionText,
      answerText: entryForm.answerText,
      questionType: entryForm.questionType,
      difficulty: entryForm.difficulty,
      details: entryForm.details.map(d => ({
        BusType: d.BusType,
        Title: d.Title,
        Context: d.Context
      })),
      bookId: entryBookId.value,
      chapterName: entryChapterName.value,
      questionSort: questionSort.toString()
    }

    const res = await adminApi.createMathQuestion(data)
    ElMessage.success('保存成功')
    clearEntryQuestion()
    // 刷新章节列表
    const chaptersRes = await adminApi.getMathBookChapters(entryBookId.value)
    entryChapters.value = chaptersRes.data || []
  } catch (error) {
    console.error('保存题目失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// --- 题目导入相关方法 ---
const handleImportFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (Array.isArray(data)) {
        importPreviewData.value = data
      } else if (data.questions && Array.isArray(data.questions)) {
        importPreviewData.value = data.questions
      } else {
        ElMessage.error('JSON格式不正确')
        importPreviewData.value = []
      }
    } catch (err) {
      ElMessage.error('JSON解析失败')
      importPreviewData.value = []
    }
  }
  reader.readAsText(file.raw)
}

const showImportTemplate = () => {
  const template = {
    "questions": [
      {
        "QuestionID": 10001,
        "QuestionText": "设 $f(x) = x^2$，求 $f'(x)$。",
        "QuestionType": "解答题",
        "OriginalAnswerText": "$f'(x) = 2x$",
        "Difficulty": 0.3,
        "BookChapter": "第一章 函数与极限",
        "details": [
          {
            "BusType": "题目详解",
            "Context": "根据导数定义，$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h)-f(x)}{h} = 2x$。"
          }
        ]
      }
    ]
  }
  ElMessageBox.alert(JSON.stringify(template, null, 2), '导入模板', {
    confirmButtonText: '复制',
    callback: (action) => {
      if (action === 'confirm') {
        navigator.clipboard.writeText(JSON.stringify(template, null, 2))
        ElMessage.success('已复制到剪贴板')
      }
    }
  })
}

const confirmImport = async () => {
  if (!importBookId.value) {
    ElMessage.warning('请选择书籍')
    return
  }
  if (importPreviewData.value.length === 0) {
    ElMessage.warning('没有可导入的题目')
    return
  }

  importing.value = true
  try {
    const data = {
      questions: importPreviewData.value,
      bookId: importBookId.value,
      chapterName: importChapterName.value || null
    }
    const res = await adminApi.importMathQuestions(data)
    ElMessage.success(`成功导入 ${res.data?.count || importPreviewData.value.length} 道题目`)
    clearImport()
    fetchBooks()
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

const clearImport = () => {
  importBookId.value = null
  importChapterName.value = ''
  importChapters.value = []
  importPreviewData.value = []
  importSourceCode.value = ''
  importMode.value = 'file'
}

// 导入源代码编辑相关方法
const formatImportSourceCode = () => {
  try {
    if (importSourceCode.value.trim()) {
      const data = JSON.parse(importSourceCode.value)
      importSourceCode.value = JSON.stringify(data, null, 2)
      ElMessage.success('格式化成功')
    }
  } catch (e) {
    ElMessage.error('JSON格式错误，无法格式化')
  }
}

const parseImportSourceCode = () => {
  try {
    if (!importSourceCode.value.trim()) {
      ElMessage.warning('请输入JSON数据')
      return
    }
    const data = JSON.parse(importSourceCode.value)
    
    // 支持数组或对象格式
    let questions = []
    if (Array.isArray(data)) {
      questions = data
    } else if (data.questions && Array.isArray(data.questions)) {
      questions = data.questions
    } else {
      // 单条数据
      questions = [data]
    }
    
    importPreviewData.value = questions
    ElMessage.success(`成功解析 ${questions.length} 道题目`)
  } catch (e) {
    ElMessage.error('JSON解析失败：' + e.message)
    importPreviewData.value = []
  }
}

// 考点分类管理
const knowledgeCategories = ref([])
const loadingKnowledgeCategories = ref(false)
const knowledgeCategoryModalVisible = ref(false)
const movePointModalVisible = ref(false)
const isEditingKnowledgeCategory = ref(false)
const addingChild = ref(false)
const addingSubject = ref(false)
const savingKnowledgeCategory = ref(false)
const movingPointLoading = ref(false)
const selectedParentCategory = ref('0')
const movingPoint = ref(null)
const moveTargetSubject = ref(null)
const moveTargetChapter = ref(null)
const treeProps = {
  children: 'children',
  label: 'CategoryName'
}

const knowledgeCategoryForm = reactive({
  id: null,
  CategoryCode: '',
  CategoryName: '',
  Description: '',
  SortOrder: 0,
  IsActive: 1
})

const getCategoryLevel = (data) => {
  if (!data?.CategoryCode) return 0
  return data.CategoryCode.split('-').length
}

const knowledgeCategoryTree = computed(() => {
  const categories = knowledgeCategories.value
  const tree = []
  
  const level1Cats = categories.filter(cat => {
    const parts = cat.CategoryCode.split('-')
    return parts.length === 1 && parts[0] !== '0'
  })
  
  level1Cats.forEach(level1 => {
    const node = { ...level1, children: [] }
    
    const level2Cats = categories.filter(cat => {
      const parts = cat.CategoryCode.split('-')
      return parts.length === 2 && parts[0] === level1.CategoryCode
    })
    
    level2Cats.forEach(level2 => {
      const level2Node = { ...level2, children: [] }
      
      const level2Parts = level2.CategoryCode.split('-')
      
      const level3Cats = categories.filter(cat => {
        const parts = cat.CategoryCode.split('-')
        return parts.length === 3 && parts[0] === level1.CategoryCode && parts[1] === level2Parts[1]
      })
      
      level2Node.children = level3Cats
      node.children.push(level2Node)
    })
    
    tree.push(node)
  })
  
  return tree
})

const fetchKnowledgeCategories = async () => {
  loadingKnowledgeCategories.value = true
  try {
    const res = await adminApi.getMathKnowledgeCategories()
    knowledgeCategories.value = [...(res.data || [])]
  } catch (error) {
    console.error('获取考点分类失败:', error)
    ElMessage.error('获取考点分类失败')
  } finally {
    loadingKnowledgeCategories.value = false
  }
}

const openCreateSubjectModal = () => {
  isEditingKnowledgeCategory.value = false
  addingChild.value = false
  addingSubject.value = true
  selectedParentCategory.value = '0'
  
  const maxId = Math.max(0, ...knowledgeCategories.value
    .filter(c => c.CategoryCode.split('-').length === 1)
    .map(c => parseInt(c.CategoryCode) || 0)
  )
  
  Object.assign(knowledgeCategoryForm, {
    id: null,
    CategoryCode: String(maxId + 1),
    CategoryName: '',
    Description: '',
    SortOrder: 0,
    IsActive: 1
  })
  knowledgeCategoryModalVisible.value = true
}

const openCreateKnowledgeCategoryModal = () => {
  isEditingKnowledgeCategory.value = false
  addingChild.value = false
  addingSubject.value = false
  selectedParentCategory.value = '0'
  Object.assign(knowledgeCategoryForm, {
    id: null,
    CategoryCode: '',
    CategoryName: '',
    Description: '',
    SortOrder: 0,
    IsActive: 1
  })
  knowledgeCategoryModalVisible.value = true
}

const openAddChildCategoryModal = (parent) => {
  isEditingKnowledgeCategory.value = false
  addingChild.value = true
  addingSubject.value = false
  selectedParentCategory.value = parent.CategoryCode
  
  let newCode = ''
  const parentLevel = getCategoryLevel(parent)
  const parts = parent.CategoryCode.split('-')
  
  if (parentLevel === 1) {
    const maxId = Math.max(0, ...knowledgeCategories.value
      .filter(c => c.CategoryCode.startsWith(parent.CategoryCode + '-') && c.CategoryCode.split('-').length === 2)
      .map(c => parseInt(c.CategoryCode.split('-')[1]) || 0)
    )
    newCode = `${parent.CategoryCode}-${maxId + 1}`
  } else if (parentLevel === 2) {
    const maxId = Math.max(0, ...knowledgeCategories.value
      .filter(c => c.CategoryCode.startsWith(parent.CategoryCode + '-') && c.CategoryCode.split('-').length === 3)
      .map(c => parseInt(c.CategoryCode.split('-')[2]) || 0)
    )
    newCode = `${parent.CategoryCode}-${maxId + 1}`
  }
  
  Object.assign(knowledgeCategoryForm, {
    id: null,
    CategoryCode: newCode,
    CategoryName: '',
    Description: '',
    SortOrder: 0,
    IsActive: 1
  })
  knowledgeCategoryModalVisible.value = true
}

const openEditKnowledgeCategoryModal = (row) => {
  isEditingKnowledgeCategory.value = true
  addingChild.value = false
  addingSubject.value = false
  Object.assign(knowledgeCategoryForm, {
    id: row.id,
    CategoryCode: row.CategoryCode,
    CategoryName: row.CategoryName,
    Description: row.Description,
    SortOrder: row.SortOrder,
    IsActive: row.IsActive
  })
  knowledgeCategoryModalVisible.value = true
}

const openMovePointModal = (point) => {
  movingPoint.value = point
  moveTargetSubject.value = null
  moveTargetChapter.value = null
  movePointModalVisible.value = true
}

const onSubjectChange = () => {
  moveTargetChapter.value = null
}

const confirmMovePoint = async () => {
  if (!moveTargetSubject.value || !moveTargetChapter.value) {
    ElMessage.warning('请选择目标科目和章节')
    return
  }
  
  movingPointLoading.value = true
  try {
    const parts = movingPoint.value.CategoryCode.split('-')
    const pointId = parts[2]
    const newCode = `${moveTargetChapter.value.CategoryCode}-${pointId}`
    
    await adminApi.updateMathKnowledgeCategory(movingPoint.value.id, {
      CategoryCode: newCode,
      CategoryName: movingPoint.value.CategoryName,
      Description: movingPoint.value.Description,
      SortOrder: movingPoint.value.SortOrder,
      IsActive: movingPoint.value.IsActive
    })
    
    ElMessage.success('移动成功')
    movePointModalVisible.value = false
    await fetchKnowledgeCategories()
    
  } catch (error) {
    console.error('移动失败:', error)
    ElMessage.error('移动失败')
  } finally {
    movingPointLoading.value = false
  }
}

const saveKnowledgeCategory = async () => {
  if (!knowledgeCategoryForm.CategoryCode || !knowledgeCategoryForm.CategoryName) {
    ElMessage.warning('请填写分类编码和分类名称')
    return
  }
  
  savingKnowledgeCategory.value = true
  try {
    if (isEditingKnowledgeCategory.value) {
      await adminApi.updateMathKnowledgeCategory(knowledgeCategoryForm.id, knowledgeCategoryForm)
      ElMessage.success('更新成功')
    } else {
      await adminApi.createMathKnowledgeCategory(knowledgeCategoryForm)
      ElMessage.success('创建成功')
    }
    knowledgeCategoryModalVisible.value = false
    fetchKnowledgeCategories()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    savingKnowledgeCategory.value = false
  }
}

const deleteKnowledgeCategory = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该分类吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await adminApi.deleteMathKnowledgeCategory(id)
    ElMessage.success('删除成功')
    fetchKnowledgeCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchCorrections()
  fetchSubjects()
  searchQuestions()
  fetchBooks()
  fetchKnowledgeCategories()
})
</script>

<style scoped>
.math-manage {
  padding: 20px;
}
.mb-20 {
  margin-bottom: 20px;
}
.mb-10 {
  margin-bottom: 10px;
}
.ml-10 {
  margin-left: 10px;
}
.mt-20 {
  margin-top: 20px;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
}
.filter-card {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
}
.filter-bar {
  display: flex;
  align-items: center;
}

/* 编辑表单样式 */
.edit-form-container {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 10px;
}
.latex-preview-box {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  min-height: 120px;
  background: #fafafa;
  overflow-x: auto;
}
.latex-preview-box.small {
  min-height: 80px;
  padding: 10px;
}
.preview-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

/* 详情卡片样式 */
.details-header {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}
.details-list {
  max-height: 400px;
  overflow-y: auto;
}
.detail-card {
  margin-bottom: 10px;
}
.detail-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.detail-title {
  font-weight: 500;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}
.expand-icon {
  margin-left: 10px;
  color: #909399;
}

/* 数学符号助手 */
.math-assistant {
  margin-top: 20px;
}
.symbol-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.symbol-grid .el-button {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.sym-code {
  font-size: 10px;
  color: #909399;
}

/* 自定义标签样式 */
.custom-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  margin: 0 2px;
}
.custom-tag.answer {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}
.custom-tag.analysis {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1565c0;
  border: 1px solid #90caf9;
}
.custom-tag.commentary {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  color: #e65100;
  border: 1px solid #ffcc80;
}
.custom-tag.note {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  color: #616161;
  font-style: italic;
  border: 1px solid #bdbdbd;
}
.custom-tag.step {
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%);
  color: #c2185b;
  border: 1px solid #f48fb1;
}

/* LaTeX错误样式 */
.latex-error {
  color: #f44336;
  background: #ffebee;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

/* 分割线标题 */
.divider-title {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

/* 关联考点样式 - 新版 */
.knowledge-points-section {
  max-height: 500px;
  overflow-y: auto;
  margin-bottom: 20px;
  padding: 10px;
  background: #fafafa;
  border-radius: 8px;
}
.kp-collapse-item {
  margin-bottom: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
}
.kp-collapse-item :deep(.el-collapse-item__header) {
  background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px solid #e4e7ed;
}
.kp-collapse-item :deep(.el-collapse-item__content) {
  padding: 16px;
  background: #fff;
}
.kp-title-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}
.kp-type-tag {
  font-weight: bold;
}
.kp-title-text {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}
.kp-id-tag {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
  font-family: monospace;
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 4px;
}
.kp-section {
  margin-bottom: 20px;
}
.kp-section:last-child {
  margin-bottom: 0;
}
.kp-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #ecf5ff 0%, #f5f7fa 100%);
  border-radius: 6px;
  border-left: 4px solid #409eff;
  font-weight: 600;
  color: #303133;
}
.kp-section-header.notes {
  background: linear-gradient(135deg, #fdf6ec 0%, #f5f7fa 100%);
  border-left-color: #e6a23c;
}
.kp-section-header .el-tag {
  margin-left: auto;
}
.kp-section-body {
  padding-left: 8px;
}
.kp-content-item {
  margin-bottom: 12px;
}
.kp-content-item:last-child {
  margin-bottom: 0;
}
.kp-content-item.multi-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.item-index {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-top: 4px;
}
.kp-content-box {
  flex: 1;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  line-height: 1.8;
  border: 1px solid #e4e7ed;
}
.kp-content-box.content {
  background: linear-gradient(135deg, #f5f7fa 0%, #fff 100%);
  border-left: 4px solid #409eff;
}
.kp-content-box.notes {
  background: linear-gradient(135deg, #fdf6ec 0%, #fff 100%);
  border-left: 4px solid #e6a23c;
}
.kp-content-box :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin: 8px 0;
}
.kp-meta {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #dcdfe6;
}

/* 详情卡片样式优化 */
.detail-card :deep(.el-card__header) {
  background: linear-gradient(135deg, #f5f7fa 0%, #fff 100%);
  padding: 12px 16px;
}
.detail-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.detail-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}
.header-actions .el-button {
  padding: 4px 8px;
}
.expand-icon {
  margin-left: 10px;
  color: #909399;
  transition: transform 0.3s;
}
.detail-card.is-expanded .expand-icon {
  transform: rotate(180deg);
}

/* 预览框样式优化 */
.latex-preview-box {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 16px;
  min-height: 120px;
  background: linear-gradient(135deg, #fafafa 0%, #fff 100%);
  line-height: 1.8;
  overflow-x: auto;
}
.latex-preview-box.small {
  min-height: 80px;
  padding: 12px;
  font-size: 14px;
}
.latex-preview-box :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin: 8px 0;
}
.latex-preview-box :deep(.katex) {
  font-size: 1.1em;
}
.latex-preview-box :deep(.katex-display) {
  margin: 1em 0;
  overflow-x: auto;
  overflow-y: hidden;
}

/* 自定义标签样式 */
.latex-preview-box :deep(.custom-tag) {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.9em;
  margin: 4px 0;
}
.latex-preview-box :deep(.custom-tag.answer) {
  color: #009688;
  background: #e0f2f1;
}
.latex-preview-box :deep(.custom-tag.analysis) {
  color: #2196f3;
  background: #e3f2fd;
}
.latex-preview-box :deep(.custom-tag.commentary) {
  color: #ff5405;
  background: #fff3e0;
}
.latex-preview-box :deep(.custom-tag.note) {
  color: #666;
  font-style: italic;
  background: #f5f5f5;
}
.latex-preview-box :deep(.custom-tag.step) {
  color: #ff5405;
  background: #fff3e0;
}

/* 编辑区域样式 */
.edit-form-container :deep(.el-divider__text) {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
  background: #fff;
  padding: 0 16px;
}
.edit-form-container :deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

/* 左右布局优化 */
.edit-form-container .el-row {
  margin-bottom: 16px;
}
.edit-form-container .el-col-12 {
  display: flex;
  flex-direction: column;
}
.edit-form-container .el-col-12 .el-form-item {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.edit-form-container .el-col-12 .el-form-item__content {
  flex: 1;
}
.edit-form-container .el-textarea {
  height: 100%;
}
.edit-form-container .el-textarea__inner {
  height: 100%;
  min-height: 150px;
  font-family: 'Consolas', 'Monaco', monospace;
  line-height: 1.6;
}

/* 详情卡片编辑区域样式 */
.detail-edit-row {
  align-items: stretch;
}
.detail-edit-row .edit-col,
.detail-edit-row .preview-col {
  display: flex;
  flex-direction: column;
}
.detail-edit-row .edit-col .el-form-item {
  flex: 1;
  margin-bottom: 0;
}
.detail-edit-row .edit-col .el-textarea {
  height: 100%;
}
.detail-edit-row .edit-col .el-textarea__inner {
  min-height: 200px;
  height: 100%;
}
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 0 4px;
}
.preview-title {
  font-weight: 600;
  color: #606266;
  font-size: 14px;
}
.latex-preview-box.detail-preview {
  flex: 1;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

/* 关联考点显示样式 */
.linked-kp-section {
  margin-top: 16px;
  border: 1px solid #fde2e2;
  border-radius: 8px;
  overflow: hidden;
}
.linked-kp-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
  border-bottom: 1px solid #fde2e2;
  font-weight: 600;
  color: #f56c6c;
  font-size: 13px;
}
.linked-kp-content {
  padding: 12px;
  background: #fff;
  max-height: 300px;
  overflow-y: auto;
  line-height: 1.8;
}
.linked-kp-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin: 8px 0;
}

/* 考点编辑区域样式 - 5种颜色区分 */
.kp-edit-section {
  border-radius: 8px;
  overflow: hidden;
  margin-top: 16px;
}
.kp-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-weight: 600;
}
.kp-edit-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.kp-name {
  font-weight: normal;
  opacity: 0.9;
}
.kp-edit-content {
  padding: 16px;
  background: #fff;
}
.kp-preview-section {
  padding: 0 16px 16px;
  background: #fff;
}
.preview-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}
.latex-preview-box.kp-preview {
  min-height: 150px;
  max-height: 300px;
  overflow-y: auto;
}

/* 5种颜色主题 */
.kp-color-0 {
  border: 2px solid #409eff;
  background: linear-gradient(135deg, #ecf5ff 0%, #fff 100%);
}
.kp-color-0 .kp-edit-header {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
}

.kp-color-1 {
  border: 2px solid #67c23a;
  background: linear-gradient(135deg, #f0f9eb 0%, #fff 100%);
}
.kp-color-1 .kp-edit-header {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: #fff;
}

.kp-color-2 {
  border: 2px solid #e6a23c;
  background: linear-gradient(135deg, #fdf6ec 0%, #fff 100%);
}
.kp-color-2 .kp-edit-header {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
  color: #fff;
}

.kp-color-3 {
  border: 2px solid #f56c6c;
  background: linear-gradient(135deg, #fef0f0 0%, #fff 100%);
}
.kp-color-3 .kp-edit-header {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  color: #fff;
}

.kp-color-4 {
  border: 2px solid #909399;
  background: linear-gradient(135deg, #f4f4f5 0%, #fff 100%);
}
.kp-color-4 .kp-edit-header {
  background: linear-gradient(135deg, #909399 0%, #a6a9ad 100%);
  color: #fff;
}

/* 编辑对话框布局样式 */
.edit-question-dialog :deep(.el-dialog__body) {
  padding: 0;
  max-height: 80vh;
  overflow: hidden;
}
.edit-form-container {
  display: flex;
  height: 75vh;
  overflow: hidden;
}

/* 左侧导航栏 */
.edit-sidebar {
  width: 200px;
  background: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.sidebar-header {
  padding: 16px;
  font-weight: 600;
  font-size: 16px;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}
.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  color: #606266;
}
.sidebar-item:hover {
  background: #ecf5ff;
  color: #409eff;
}
.sidebar-item.active {
  background: #409eff;
  color: #fff;
}
.sidebar-item.active .el-tag {
  background: rgba(255,255,255,0.9);
}
.sidebar-item .el-icon {
  font-size: 16px;
}
.sidebar-item-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar-divider {
  padding: 8px 16px;
  font-size: 12px;
  color: #909399;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.sidebar-item.add-item {
  color: #67c23a;
  border-top: 1px dashed #dcdfe6;
  margin-top: 8px;
}
.sidebar-item.add-item:hover {
  background: #f0f9eb;
  color: #67c23a;
}

/* 右侧主内容区 */
.edit-main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #fff;
}
.content-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}
.content-section:last-child {
  border-bottom: none;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
  display: inline-block;
}

/* 左右编辑预览布局 */
.edit-preview-row {
  display: flex;
}
.edit-preview-row .edit-area,
.edit-preview-row .preview-area {
  display: flex;
  flex-direction: column;
}
.edit-preview-row .edit-area .el-form-item {
  flex: 1;
  margin-bottom: 0;
}
.edit-preview-row .edit-area .el-textarea {
  height: 100%;
}
.edit-preview-row .edit-area .el-textarea__inner {
  min-height: 300px;
  height: 100%;
  font-family: 'Consolas', 'Monaco', monospace;
  line-height: 1.6;
}
.preview-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  margin-bottom: 8px;
}
.latex-preview-box.large {
  min-height: 300px;
  max-height: 500px;
}

/* 详情卡片样式 */
.detail-card {
  margin-bottom: 16px;
}
.detail-card.kp-card {
  border-left: 4px solid #f56c6c;
}
.detail-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.detail-card-header .header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}
.detail-title-input {
  width: 200px;
}
.kp-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #fef0f0;
  color: #f56c6c;
  border-radius: 4px;
  font-size: 12px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.detail-card-header .header-actions {
  display: flex;
  gap: 4px;
}
.detail-card-body {
  padding: 16px;
}
.kp-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f56c6c;
}
.kp-info span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* LaTeX助手内容区域样式 */
.latex-helper-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}
.latex-categories {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.latex-category {
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e4e7ed;
}
.category-name {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #ebeef5;
}
.latex-symbols-content {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 6px;
}
.latex-symbol-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 2px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
  border: 1px solid #dcdfe6;
  min-height: 28px;
}
.latex-symbol-btn:hover {
  background: #ecf5ff;
  border-color: #409eff;
}
.latex-symbol-btn .symbol-visual {
  font-size: 12px;
  line-height: 1;
}
.latex-symbol-btn .symbol-visual :deep(.katex) {
  font-size: 1em;
}
.latex-symbol-btn .symbol-visual :deep(.katex-display) {
  display: inline;
  margin: 0;
}
.latex-symbol-btn .symbol-visual :deep(.katex .vlist-t) {
  display: inline-table;
}
.latex-symbol-btn .symbol-visual :deep(.katex .vlist-r) {
  display: table-row;
}

/* 自适应高度 */
.latex-preview-box.auto-height {
  min-height: 80px;
  max-height: none;
  height: auto;
}
.edit-preview-row .edit-area .el-textarea__inner {
  min-height: 200px;
  height: auto;
  resize: vertical;
}

/* 书籍详情对话框样式 */
.book-detail-dialog :deep(.el-dialog__body) {
  padding: 0;
  max-height: 70vh;
  overflow: hidden;
}

.book-detail-container {
  display: flex;
  height: 70vh;
}

.book-detail-sidebar {
  width: 280px;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.book-detail-sidebar .sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #e4e7ed;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
}

.chapter-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.chapter-item:hover {
  background: #ecf5ff;
  border-color: #409eff;
}

.chapter-item.active {
  background: #409eff;
  color: #fff;
}

.chapter-item.active .chapter-count {
  color: rgba(255, 255, 255, 0.8);
}

.chapter-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.chapter-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-count {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.chapter-actions {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.3s;
}

.chapter-item:hover .chapter-actions {
  opacity: 1;
}

.book-detail-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
}

.detail-header h3 {
  margin: 0;
  font-size: 16px;
}

.book-detail-main .el-table {
  flex: 1;
  overflow: auto;
}

.empty-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 源代码编辑样式 */
.source-edit-section,
.source-preview-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  height: 100%;
}

.source-edit-section h4,
.source-preview-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.source-code-input :deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  background: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #3c3c3c;
}

.source-actions {
  display: flex;
  gap: 10px;
}

.source-preview-content {
  background: #fff;
  border-radius: 6px;
  padding: 16px;
  min-height: 500px;
}

/* 导入源代码编辑样式 */
.import-source-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
}

.source-edit-area,
.source-preview-area {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  height: 100%;
}

.source-edit-area h4,
.source-preview-area h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.import-preview-content {
  background: #fafafa;
  border-radius: 6px;
  padding: 12px;
}

.preview-count {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.preview-item {
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid #e4e7ed;
}

.preview-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.item-index {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
}

.chapter-tag {
  font-size: 12px;
  color: #67c23a;
  background: #f0f9eb;
  padding: 2px 8px;
  border-radius: 4px;
}

.preview-item-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.more-items-tip {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-top: 10px;
}

/* 考点分类树状展示样式 */
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  min-width: 0;
}

.custom-tree-node .node-name {
  font-size: 14px;
  color: #303133;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-tree-node .node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 16px;
  flex-shrink: 0;
}

.custom-tree-node .node-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 录入试题样式优化 */
.entry-container .select-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.entry-form-wrapper {
  margin-top: 20px;
}

.edit-section,
.preview-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  height: 100%;
}

.edit-section h4,
.preview-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.details-section {
  background: #fff;
  border-radius: 6px;
  padding: 16px;
  margin-top: 20px;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.details-header h4 {
  margin: 0;
}

.detail-card {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.detail-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.detail-actions {
  margin-left: auto;
  display: flex;
  gap: 5px;
}

.preview-block {
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.preview-block .preview-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  font-weight: 500;
}

.preview-block .preview-content {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
}

.entry-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.empty-tip {
  padding: 60px 0;
}

/* 试题导入样式 */
.file-import-container {
  padding: 20px;
}

.upload-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  height: 100%;
  border: 1px solid #e4e7ed;
}

.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.upload-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.upload-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 13px;
  color: #67c23a;
}

.import-summary {
  margin-top: 20px;
}

.import-result {
  margin-top: 20px;
}

.import-result p {
  margin: 4px 0;
  font-size: 13px;
}
</style>
