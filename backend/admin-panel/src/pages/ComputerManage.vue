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
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="handleCorrection(row)">处理</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 题目管理 -->
      <el-tab-pane label="题目管理" name="questions">
        <div class="filter-card mb-20">
          <el-row :gutter="20">
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
            <el-col :span="5">
              <el-select v-model="questionFilter.major_id" placeholder="所属科目" clearable @change="searchQuestions" style="width: 100%">
                <el-option v-for="s in subjects" :key="s.major_id" :label="s.major_name" :value="s.major_id" />
              </el-select>
            </el-col>
            <el-col :span="5">
              <el-select v-model="questionFilter.exercise_type_name" placeholder="题型" clearable @change="searchQuestions" style="width: 100%">
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

      <!-- 试卷导入 -->
      <el-tab-pane label="试卷导入" name="paper-import">
        <div class="import-container">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handlePaperFileChange"
            accept=".json"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将试卷 JSON 文件拖到此处，或<em>点击上传</em>
            </div>
          </el-upload>

          <div v-if="paperQuestions.length > 0" class="mt-20">
            <el-alert :title="`已加载 ${paperQuestions.length} 道题目`" type="info" :closable="false" show-icon />
            
            <div class="mt-20">
              <el-button type="primary" :loading="importing" @click="startPaperImport">开始导入试卷</el-button>
              <el-button @click="clearPaperData">清空数据</el-button>
            </div>

            <div class="mt-20">
              <h4>检测到的试卷：</h4>
              <el-table :data="detectedPapers" border size="small">
                <el-table-column prop="title" label="试卷名称" />
                <el-table-column prop="school" label="来源学校" />
                <el-table-column prop="year" label="年份" />
                <el-table-column label="题目数量" width="100" align="center">
                  <template #default="{ row }">
                    {{ row.questions.length }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 题目编辑对话框 -->
    <el-dialog
      v-model="editModalVisible"
      title="编辑题目"
      width="80%"
      top="5vh"
      destroy-on-close
    >
      <el-form :model="editingForm" label-position="top" v-if="editingForm">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="题型">
              <el-input v-model="editingForm.exercise_type_name" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="所属科目">
              <el-select v-model="editingForm.major_id" style="width: 100%">
                <el-option v-for="s in subjects" :key="s.major_id" :label="s.major_name" :value="s.major_id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="所属章节">
              <el-select v-model="editingForm.chapter_id" style="width: 100%">
                <el-option v-for="c in chapters" :key="c.chapter_id" :label="c.chapter_name" :value="c.chapter_id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="难度">
              <el-rate v-model="editingForm.level" :max="5" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="题干内容 (支持 HTML/LaTeX)">
          <el-input v-model="editingForm.stem" type="textarea" :rows="5" />
          <div class="preview-box mt-10" v-html="renderMath(editingForm.stem)"></div>
        </el-form-item>

        <!-- 选项部分 -->
        <div v-if="['单选题', '多选题'].includes(editingForm.exercise_type_name)">
          <el-form-item label="选项列表">
            <div v-for="(opt, index) in editingForm.options" :key="index" class="option-item mb-10">
              <el-row :gutter="10" align="middle">
                <el-col :span="2">
                  <el-input v-model="opt.option_key" placeholder="A" />
                </el-col>
                <el-col :span="20">
                  <el-input v-model="opt.option_value" type="textarea" autosize placeholder="选项内容" />
                </el-col>
                <el-col :span="2">
                  <el-button type="danger" circle @click="removeOption(index)"><el-icon><Delete /></el-icon></el-button>
                </el-col>
              </el-row>
              <div class="preview-box mt-5 small" v-html="renderMath(opt.option_value)"></div>
            </div>
            <el-button type="primary" link @click="addOption">+ 添加选项</el-button>
          </el-form-item>
        </div>

        <el-form-item label="答案">
          <el-input v-model="editingForm.answer" type="textarea" :rows="3" />
          <div class="preview-box mt-10" v-html="renderMath(editingForm.answer)"></div>
        </el-form-item>

        <el-form-item label="解析">
          <el-input v-model="editingForm.analysis" type="textarea" :rows="4" />
          <div class="preview-box mt-10" v-html="renderMath(editingForm.analysis)"></div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="试卷名称">
              <el-input v-model="editingForm.exam_full_name" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="年份">
              <el-input v-model="editingForm.exam_time" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="来源学校">
              <el-input v-model="editingForm.from_school" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 纠错备注 -->
        <div v-if="currentCorrection" class="correction-remark mt-20">
          <el-divider content-position="left">纠错处理</el-divider>
          <el-form-item label="管理员备注">
            <el-input v-model="adminRemark" type="textarea" placeholder="输入处理情况备注..." />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editModalVisible = false">取消</el-button>
          <el-button type="primary" @click="saveQuestion">保存修改</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { adminApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete, UploadFilled } from '@element-plus/icons-vue'
import { transformContextString } from '@/utils/latex'

const activeTab = ref('corrections')
const loadingCorrections = ref(false)
const loadingQuestions = ref(false)
const importing = ref(false)

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
  exercise_type_name: '',
  page: 1,
  pageSize: 20
})
const subjects = ref([])
const chapters = ref([])
const editModalVisible = ref(false)
const editingForm = ref(null)

// 试卷导入
const paperQuestions = ref([])
const detectedPapers = ref([])

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
  try {
    const res = await adminApi.getComputerSubjects()
    subjects.value = res.data || []
  } catch (error) {
    console.error('获取科目失败:', error)
  }
}

// 获取章节列表
const fetchChapters = async (majorId) => {
  if (!majorId) {
    chapters.value = []
    return
  }
  try {
    const res = await adminApi.getComputerChapters({ majorId })
    chapters.value = res.data || []
  } catch (error) {
    console.error('获取章节失败:', error)
  }
}

// 监听编辑表单中的科目变化以更新章节
watch(() => editingForm.value?.major_id, (newVal) => {
  if (newVal) fetchChapters(newVal)
})

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
    const res = await adminApi.searchComputerQuestions(questionFilter)
    questions.value = res.data.list || []
    questionTotal.value = res.data.total || 0
  } catch (error) {
    console.error('搜索题目失败:', error)
  } finally {
    loadingQuestions.value = false
  }
}

// 打开编辑弹窗
const openEditModal = async (questionId) => {
  try {
    const res = await adminApi.getComputerQuestionDetail(questionId)
    editingForm.value = res.data
    // 确保 options 是数组
    if (typeof editingForm.value.options === 'string') {
      try {
        editingForm.value.options = JSON.parse(editingForm.value.options)
      } catch (e) {
        editingForm.value.options = []
      }
    }
    editModalVisible.value = true
  } catch (error) {
    console.error('获取题目详情失败:', error)
    ElMessage.error('获取题目详情失败')
  }
}

// 保存修改
const saveQuestion = async () => {
  if (!editingForm.value) return
  
  try {
    await adminApi.updateComputerQuestion(editingForm.value.question_id, editingForm.value)
    
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
  editingForm.value.options.splice(index, 1)
}

// 试卷导入相关
const handlePaperFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (Array.isArray(data)) {
        paperQuestions.value = data
        detectPapers(data)
      } else {
        ElMessage.error('JSON 格式错误，期望数组')
      }
    } catch (err) {
      ElMessage.error('解析 JSON 失败')
    }
  }
  reader.readAsText(file.raw)
}

const detectPapers = (questions) => {
  const groups = new Map()
  questions.forEach(q => {
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

const clearPaperData = () => {
  paperQuestions.value = []
  detectedPapers.value = []
}

const startPaperImport = async () => {
  if (paperQuestions.value.length === 0) return
  importing.value = true
  try {
    await adminApi.importComputerPaper({
      questions: paperQuestions.value
    })
    ElMessage.success('导入成功')
    clearPaperData()
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败: ' + (error.response?.data?.message || error.message))
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  fetchCorrections()
  fetchSubjects()
  searchQuestions()
})
</script>

<style scoped>
.computer-manage {
  padding: 20px;
}
.mb-10 { margin-bottom: 10px; }
.mb-20 { margin-bottom: 20px; }
.mt-5 { margin-top: 5px; }
.mt-10 { margin-top: 10px; }
.mt-20 { margin-top: 20px; }
.ml-10 { margin-left: 10px; }

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

.option-item {
  border: 1px solid #f0f0f0;
  padding: 10px;
  border-radius: 4px;
  background: #fff;
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
</style>
