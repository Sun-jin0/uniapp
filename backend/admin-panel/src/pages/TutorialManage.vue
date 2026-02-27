<template>
  <div class="tutorial-manage">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 教辅管理 -->
      <el-tab-pane label="教辅管理" name="tutorials">
        <div class="tab-content">
          <div class="filter-card mb-20">
            <el-row :gutter="20" align="middle">
              <el-col :span="6">
                <el-input
                  v-model="tutorialFilter.keyword"
                  placeholder="搜索教辅名称..."
                  clearable
                  @keyup.enter="fetchTutorials"
                >
                  <template #append>
                    <el-button @click="fetchTutorials">
                      <el-icon><Search /></el-icon>
                    </el-button>
                  </template>
                </el-input>
              </el-col>
              <el-col :span="18" style="text-align: right;">
                <el-button type="success" @click="openCreateTutorialModal">
                  <el-icon><Plus /></el-icon> 创建教辅
                </el-button>
                <el-button type="primary" @click="openTutorialImportModal">
                  <el-icon><Upload /></el-icon> 导入教辅
                </el-button>
                <el-button type="danger" plain @click="resetTutorialIds">
                  <el-icon><RefreshLeft /></el-icon> 重置ID
                </el-button>
              </el-col>
            </el-row>
          </div>

          <el-table :data="tutorials" v-loading="loadingTutorials" border stripe>
            <el-table-column prop="id" label="ID" width="80" align="center" />
            <el-table-column prop="name" label="教辅名称" min-width="200" />
            <el-table-column prop="version" label="版本" width="100" align="center" />
            <el-table-column prop="year" label="年份" width="80" align="center" />
            <el-table-column prop="total_questions" label="题目数" width="100" align="center" />
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="160" align="center">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center" fixed="right">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-button size="small" type="primary" @click="viewTutorialChapters(row)">章节</el-button>
                  <el-button size="small" type="success" @click="openEditTutorialModal(row)">编辑</el-button>
                  <el-button size="small" type="info" @click="openCopyTutorialModal(row)">复制</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 合集管理 -->
      <el-tab-pane label="合集管理" name="collections">
        <div class="tab-content">
          <el-card>
            <template #header>
              <div class="card-header">
                <h3>教辅合集管理</h3>
                <el-button type="primary" @click="openCreateCollectionModal">
                  <el-icon><Plus /></el-icon> 创建合集
                </el-button>
              </div>
            </template>

            <!-- 筛选栏 -->
            <div class="filter-bar mb-20">
              <el-input
                v-model="collectionFilter.keyword"
                placeholder="搜索合集名称"
                clearable
                style="width: 250px"
                @keyup.enter="fetchCollections"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-select v-model="collectionFilter.status" placeholder="状态" clearable style="width: 120px" @change="fetchCollections">
                <el-option label="全部" value="" />
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
              <el-button type="primary" @click="fetchCollections">搜索</el-button>
              <el-button @click="resetCollectionFilter">重置</el-button>
            </div>

            <!-- 合集列表 -->
            <el-table :data="collections" v-loading="loadingCollections" border stripe>
              <el-table-column type="index" label="序号" width="60" align="center" />
              <el-table-column label="封面" width="100" align="center">
                <template #default="{ row }">
                  <el-image
                    v-if="row.cover_url"
                    :src="row.cover_url"
                    style="width: 60px; height: 80px; object-fit: cover"
                    fit="cover"
                  />
                  <div v-else class="no-cover">无封面</div>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="合集名称" min-width="150" />
              <el-table-column prop="version" label="版本" width="100" align="center" />
              <el-table-column prop="year" label="年份" width="80" align="center" />
              <el-table-column label="包含科目" min-width="200">
                <template #default="{ row }">
                  <div v-if="row.subjects && row.subjects.length > 0">
                    <el-tag
                      v-for="subject in row.subjects"
                      :key="subject.id"
                      size="small"
                      class="mr-5 mb-5"
                    >
                      {{ subject.subject || subject.name }}
                    </el-tag>
                  </div>
                  <span v-else class="text-gray">暂无科目</span>
                </template>
              </el-table-column>
              <el-table-column prop="total_questions" label="总题数" width="100" align="center" />
              <el-table-column label="状态" width="80" align="center">
                <template #default="{ row }">
                  <el-switch
                    v-model="row.status"
                    :active-value="1"
                    :inactive-value="0"
                    @change="(val) => toggleCollectionStatus(row, val)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="250" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="openEditCollectionModal(row)">
                    编辑
                  </el-button>
                  <el-button type="success" link size="small" @click="manageCollectionSubjects(row)">
                    管理科目
                  </el-button>
                  <el-button type="danger" link size="small" @click="deleteCollection(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="collectionPagination.page"
                v-model:page-size="collectionPagination.pageSize"
                :total="collectionPagination.total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next"
                @size-change="fetchCollections"
                @current-change="fetchCollections"
              />
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建/编辑合集对话框 -->
    <el-dialog
      v-model="collectionModalVisible"
      :title="isEditCollection ? '编辑合集' : '创建合集'"
      width="600px"
    >
      <el-form :model="collectionForm" :rules="collectionRules" ref="collectionFormRef" label-width="100px">
        <el-form-item label="合集名称" prop="name">
          <el-input v-model="collectionForm.name" placeholder="如：王道考研" />
        </el-form-item>
        <el-form-item label="版本" prop="version">
          <el-input v-model="collectionForm.version" placeholder="如：2026版" />
        </el-form-item>
        <el-form-item label="年份" prop="year">
          <el-input-number v-model="collectionForm.year" :min="2000" :max="2100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="封面图">
          <el-upload
            class="cover-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
          >
            <img v-if="collectionForm.cover_url" :src="collectionForm.cover_url" class="cover-image" />
            <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="collectionForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入合集描述"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="collectionForm.sort_order" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="collectionForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="collectionModalVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingCollection" @click="saveCollection">保存</el-button>
      </template>
    </el-dialog>

    <!-- 管理科目对话框 -->
    <el-dialog
      v-model="subjectsModalVisible"
      :title="(currentCollection?.name || '合集') + ' - 管理科目'"
      width="800px"
    >
      <div class="subjects-manage">
        <div class="toolbar mb-20">
          <el-button type="primary" size="small" @click="openAddSubjectModal">
            <el-icon><Plus /></el-icon> 添加科目
          </el-button>
        </div>

        <el-table :data="collectionSubjects" border stripe>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="name" label="教辅名称" min-width="150" />
          <el-table-column prop="subject" label="科目" width="120" align="center" />
          <el-table-column prop="total_questions" label="题目数" width="100" align="center" />
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row, $index }">
              <el-button type="primary" link size="small" @click="viewSubjectDetail(row)">
                查看
              </el-button>
              <el-button type="danger" link size="small" @click="removeSubject(row, $index)">
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 添加科目对话框 -->
    <el-dialog
      v-model="addSubjectModalVisible"
      title="添加科目到合集"
      width="700px"
    >
      <div class="available-tutorials">
        <div class="toolbar mb-20">
          <el-input
            v-model="tutorialSearchKeyword"
            placeholder="搜索教辅名称"
            clearable
            style="width: 250px"
            @input="filterTutorials"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" size="small" @click="refreshTutorials">刷新</el-button>
        </div>
        
        <el-table 
          :data="filteredTutorials" 
          border 
          stripe 
          max-height="400"
          v-loading="loadingTutorialsList"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="name" label="教辅名称" min-width="150" />
          <el-table-column prop="subject" label="科目" width="120" align="center" />
          <el-table-column prop="total_questions" label="题目数" width="100" align="center" />
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                :loading="addingSubjectId === row.id"
                @click="confirmAddSubject(row)"
              >
                添加
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 创建教辅对话框 -->
    <el-dialog v-model="createTutorialModalVisible" title="创建新教辅" width="500px">
      <el-form :model="createTutorialForm" label-width="100px">
        <el-form-item label="教辅名称" required>
          <el-input v-model="createTutorialForm.name" placeholder="请输入教辅名称，如：王道考研数据结构" />
        </el-form-item>
        <el-form-item label="版本">
          <el-input v-model="createTutorialForm.version" placeholder="如：2026版" />
        </el-form-item>
        <el-form-item label="年份">
          <el-input-number v-model="createTutorialForm.year" :min="2000" :max="2100" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createTutorialForm.description" type="textarea" :rows="3" placeholder="请输入教辅描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createTutorialModalVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateTutorial" :loading="creatingTutorial">创建</el-button>
      </template>
    </el-dialog>

    <!-- 编辑教辅对话框 -->
    <el-dialog v-model="editTutorialModalVisible" title="编辑教辅" width="500px">
      <el-form :model="editTutorialForm" label-width="100px">
        <el-form-item label="教辅名称" required>
          <el-input v-model="editTutorialForm.name" placeholder="请输入教辅名称" />
        </el-form-item>
        <el-form-item label="版本">
          <el-input v-model="editTutorialForm.version" placeholder="如：2026版" />
        </el-form-item>
        <el-form-item label="年份">
          <el-input-number v-model="editTutorialForm.year" :min="2000" :max="2100" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editTutorialForm.description" type="textarea" :rows="3" placeholder="请输入教辅描述" />
        </el-form-item>
        <el-divider />
        <el-form-item label="状态">
          <el-switch
            v-model="editTutorialForm.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
            @change="handleEditStatusChange"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="danger" plain @click="handleEditDelete">删除教辅</el-button>
        <el-button @click="editTutorialModalVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEditTutorial" :loading="editingTutorial">保存</el-button>
      </template>
    </el-dialog>

    <!-- 复制教辅对话框 -->
    <el-dialog v-model="copyTutorialModalVisible" title="复制教辅" width="500px">
      <el-alert
        title="复制说明"
        description="复制将创建一个新的教辅，包含原教辅的所有章节结构，但不会复制题目内容。您可以在新教辅中重新添加或导入题目。"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      />
      <el-form :model="copyTutorialForm" label-width="100px">
        <el-form-item label="原教辅">
          <el-input :value="copyTutorialForm.sourceName" disabled />
        </el-form-item>
        <el-form-item label="新教辅名称" required>
          <el-input v-model="copyTutorialForm.name" placeholder="请输入新教辅名称" />
        </el-form-item>
        <el-form-item label="版本">
          <el-input v-model="copyTutorialForm.version" placeholder="如：2027版" />
        </el-form-item>
        <el-form-item label="年份">
          <el-input-number v-model="copyTutorialForm.year" :min="2000" :max="2100" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="copyTutorialModalVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCopyTutorial" :loading="copyingTutorial">复制</el-button>
      </template>
    </el-dialog>

    <!-- 教辅导入对话框 -->
    <el-dialog v-model="tutorialImportModalVisible" title="导入教辅数据" width="700px" :close-on-click-modal="false">
      <el-form :model="tutorialImportForm" label-width="100px">
        <el-form-item label="导入方式">
          <el-radio-group v-model="tutorialImportForm.importMode">
            <el-radio label="collection">创建新合集</el-radio>
            <el-radio label="tutorial">导入到现有合集</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <template v-if="tutorialImportForm.importMode === 'collection'">
          <el-form-item label="合集名称" required>
            <el-input v-model="tutorialImportForm.collectionName" placeholder="如：王道考研" style="width: 300px;" />
          </el-form-item>
        </template>
        
        <template v-else>
          <el-form-item label="选择合集" required>
            <el-select v-model="tutorialImportForm.collectionId" placeholder="请选择合集" style="width: 300px;">
              <el-option 
                v-for="collection in collections" 
                :key="collection.id" 
                :label="collection.name + ' ' + collection.version" 
                :value="collection.id" 
              />
            </el-select>
            <el-button type="primary" link @click="fetchCollections" style="margin-left: 10px;">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
          </el-form-item>
        </template>
        
        <el-form-item label="版本">
          <el-input v-model="tutorialImportForm.version" placeholder="如：25版、26版" style="width: 200px;" />
        </el-form-item>
        <el-form-item label="年份">
          <el-input v-model="tutorialImportForm.year" placeholder="如：2025" style="width: 200px;" />
        </el-form-item>
        <el-form-item label="数据文件">
          <el-upload
            action="#"
            :auto-upload="false"
            :on-change="handleTutorialFileChange"
            accept=".json"
            :limit="1"
            :file-list="tutorialFileList"
          >
            <el-button type="primary">选择JSON文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="tutorialImportModalVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImportTutorial" :loading="importingTutorial" :disabled="!canImport">
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Upload, RefreshLeft } from '@element-plus/icons-vue'

const router = useRouter()

// 当前激活的 tab
const activeTab = ref('tutorials')

// ==================== 教辅管理 ====================
const loadingTutorials = ref(false)
const tutorials = ref([])
const tutorialFilter = reactive({
  keyword: ''
})

// 获取教辅列表
const fetchTutorials = async () => {
  loadingTutorials.value = true
  try {
    const res = await adminApi.getTutorials()
    tutorials.value = res.data?.list || []
    if (tutorialFilter.keyword) {
      tutorials.value = tutorials.value.filter(t => 
        t.name.toLowerCase().includes(tutorialFilter.keyword.toLowerCase())
      )
    }
  } catch (error) {
    console.error('获取教辅列表失败:', error)
    ElMessage.error('获取教辅列表失败')
  } finally {
    loadingTutorials.value = false
  }
}

// 创建教辅
const createTutorialModalVisible = ref(false)
const creatingTutorial = ref(false)
const createTutorialForm = reactive({
  name: '',
  version: '',
  year: new Date().getFullYear(),
  description: ''
})

const openCreateTutorialModal = () => {
  createTutorialForm.name = ''
  createTutorialForm.version = ''
  createTutorialForm.year = new Date().getFullYear()
  createTutorialForm.description = ''
  createTutorialModalVisible.value = true
}

const confirmCreateTutorial = async () => {
  if (!createTutorialForm.name.trim()) {
    ElMessage.warning('请输入教辅名称')
    return
  }
  creatingTutorial.value = true
  try {
    await adminApi.createTutorial(createTutorialForm)
    ElMessage.success('创建成功')
    createTutorialModalVisible.value = false
    fetchTutorials()
  } catch (error) {
    console.error('创建教辅失败:', error)
    ElMessage.error('创建教辅失败')
  } finally {
    creatingTutorial.value = false
  }
}

// 编辑教辅
const editTutorialModalVisible = ref(false)
const editingTutorial = ref(false)
const editTutorialForm = reactive({
  id: null,
  name: '',
  version: '',
  year: new Date().getFullYear(),
  description: '',
  status: 1
})

const openEditTutorialModal = (tutorial) => {
  editTutorialForm.id = tutorial.id
  editTutorialForm.name = tutorial.name
  editTutorialForm.version = tutorial.version
  editTutorialForm.year = tutorial.year || new Date().getFullYear()
  editTutorialForm.description = tutorial.description || ''
  editTutorialForm.status = tutorial.status || 1
  editTutorialModalVisible.value = true
}

const confirmEditTutorial = async () => {
  if (!editTutorialForm.name.trim()) {
    ElMessage.warning('请输入教辅名称')
    return
  }
  editingTutorial.value = true
  try {
    await adminApi.updateTutorial(editTutorialForm.id, {
      name: editTutorialForm.name,
      version: editTutorialForm.version,
      year: editTutorialForm.year,
      description: editTutorialForm.description,
      status: editTutorialForm.status
    })
    ElMessage.success('更新成功')
    editTutorialModalVisible.value = false
    fetchTutorials()
  } catch (error) {
    console.error('更新教辅失败:', error)
    ElMessage.error('更新教辅失败')
  } finally {
    editingTutorial.value = false
  }
}

// 编辑对话框中的状态切换
const handleEditStatusChange = async (val) => {
  try {
    await adminApi.updateTutorial(editTutorialForm.id, { status: val })
    ElMessage.success(val === 1 ? '已启用' : '已禁用')
    // 更新本地状态
    const tutorial = tutorials.value.find(t => t.id === editTutorialForm.id)
    if (tutorial) {
      tutorial.status = val
    }
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
    // 恢复原状态
    editTutorialForm.status = val === 1 ? 0 : 1
  }
}

// 编辑对话框中的删除
const handleEditDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除该教辅吗？这将同时删除相关章节和题目关联。', '警告', { type: 'warning' })
    await adminApi.deleteTutorial(editTutorialForm.id)
    ElMessage.success('删除成功')
    editTutorialModalVisible.value = false
    fetchTutorials()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 复制教辅
const copyTutorialModalVisible = ref(false)
const copyingTutorial = ref(false)
const copyTutorialForm = reactive({
  sourceId: null,
  sourceName: '',
  name: '',
  version: '',
  year: new Date().getFullYear()
})

const openCopyTutorialModal = (tutorial) => {
  copyTutorialForm.sourceId = tutorial.id
  copyTutorialForm.sourceName = tutorial.name
  copyTutorialForm.name = tutorial.name + ' (复制)'
  copyTutorialForm.version = tutorial.version
  copyTutorialForm.year = tutorial.year || new Date().getFullYear()
  copyTutorialModalVisible.value = true
}

const confirmCopyTutorial = async () => {
  if (!copyTutorialForm.name.trim()) {
    ElMessage.warning('请输入新教辅名称')
    return
  }
  copyingTutorial.value = true
  try {
    // 1. 创建新教辅
    const res = await adminApi.createTutorial({
      name: copyTutorialForm.name.trim(),
      version: copyTutorialForm.version.trim(),
      year: copyTutorialForm.year,
      description: `从 ${copyTutorialForm.sourceName} 复制`,
      status: 1
    })
    const newTutorialId = res.data?.id
    
    // 2. 获取原教辅的章节结构和题目关联
    const sourceRes = await adminApi.getTutorialDetail(copyTutorialForm.sourceId)
    const chapters = sourceRes.data?.chapters || []
    
    // 获取原教辅的所有题目关联
    const questionLinksRes = await adminApi.getTutorialQuestions(copyTutorialForm.sourceId)
    const questionLinks = questionLinksRes.data || []
    
    // 3. 复制章节结构和题目关联
    if (chapters.length > 0 && newTutorialId) {
      const chapterMap = {} // 旧ID -> 新ID
      
      // 递归遍历树形结构创建章节
      const createChaptersRecursive = async (chapterList, parentNewId = 0) => {
        for (const chapter of chapterList) {
          try {
            const newChapterRes = await adminApi.createTutorialChapter(newTutorialId, {
              name: chapter.name,
              parent_id: parentNewId,
              level: chapter.level,
              sort_order: chapter.sort_order
            })
            const newId = newChapterRes.data?.id
            chapterMap[chapter.id] = newId
            
            // 递归创建子章节
            if (chapter.children && chapter.children.length > 0) {
              await createChaptersRecursive(chapter.children, newId)
            }
          } catch (err) {
            console.error('创建章节失败:', err)
            throw err
          }
        }
      }
      
      await createChaptersRecursive(chapters)
      
      // 4. 复制题目关联
      if (questionLinks && questionLinks.length > 0) {
        let copiedCount = 0
        for (const link of questionLinks) {
          const newChapterId = chapterMap[link.chapter_id]
          if (newChapterId) {
            try {
              await adminApi.addTutorialQuestion({
                tutorial_id: newTutorialId,
                chapter_id: newChapterId,
                question_id: link.question_id,
                sort_order: link.sort_order
              })
              copiedCount++
            } catch (err) {
              console.error('复制题目关联失败:', err)
            }
          }
        }
        console.log(`复制了 ${copiedCount} 个题目关联`)
      }
    }
    
    ElMessage.success('复制教辅成功')
    copyTutorialModalVisible.value = false
    fetchTutorials()
  } catch (error) {
    console.error('复制教辅失败:', error)
    ElMessage.error('复制教辅失败')
  } finally {
    copyingTutorial.value = false
  }
}

// 查看章节
const viewTutorialChapters = (row) => {
  router.push(`/computer/tutorials/${row.id}/chapters`)
}

// 导入教辅
const tutorialImportModalVisible = ref(false)
const tutorialImportForm = reactive({
  importMode: 'collection',
  collectionName: '',
  collectionId: null,
  version: '',
  year: '',
  data: null
})
const tutorialFileList = ref([])
const importingTutorial = ref(false)

const canImport = computed(() => {
  if (tutorialImportForm.importMode === 'collection') {
    return !!tutorialImportForm.collectionName.trim()
  } else {
    return !!tutorialImportForm.collectionId
  }
})

const openTutorialImportModal = () => {
  tutorialImportForm.importMode = 'collection'
  tutorialImportForm.collectionName = ''
  tutorialImportForm.collectionId = null
  tutorialImportForm.version = ''
  tutorialImportForm.year = ''
  tutorialFileList.value = []
  tutorialImportModalVisible.value = true
}

const handleTutorialFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      tutorialImportForm.data = data
      ElMessage.success('文件读取成功')
    } catch (error) {
      ElMessage.error('JSON 格式错误')
    }
  }
  reader.readAsText(file.raw)
}

const confirmImportTutorial = async () => {
  if (!tutorialImportForm.data) {
    ElMessage.warning('请先选择数据文件')
    return
  }
  importingTutorial.value = true
  try {
    await adminApi.importTutorial(tutorialImportForm)
    ElMessage.success('导入成功')
    tutorialImportModalVisible.value = false
    fetchTutorials()
    fetchCollections()
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败')
  } finally {
    importingTutorial.value = false
  }
}

// 重置教辅ID
const resetTutorialIds = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置教辅ID吗？这将把所有教辅相关表的自增ID重置为1。\n\n注意：此操作需要删除所有教辅、章节、题目关联和合集数据后才能执行！',
      '警告',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await adminApi.resetTutorialIds()
    ElMessage.success('ID重置成功，新记录将从1开始编号')
    fetchTutorials()
    fetchCollections()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置ID失败:', error)
      ElMessage.error(error.response?.data?.message || '重置ID失败')
    }
  }
}

// ==================== 合集管理 ====================
const loadingCollections = ref(false)
const collections = ref([])
const collectionFilter = reactive({
  keyword: '',
  status: ''
})
const collectionPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 获取合集列表
const fetchCollections = async () => {
  loadingCollections.value = true
  try {
    const res = await adminApi.getTutorialCollections({
      keyword: collectionFilter.keyword,
      status: collectionFilter.status,
      page: collectionPagination.page,
      pageSize: collectionPagination.pageSize
    })
    collections.value = res.data?.list || []
    collectionPagination.total = res.data?.total || 0
  } catch (error) {
    console.error('获取合集列表失败:', error)
    ElMessage.error('获取合集列表失败')
  } finally {
    loadingCollections.value = false
  }
}

const resetCollectionFilter = () => {
  collectionFilter.keyword = ''
  collectionFilter.status = ''
  collectionPagination.page = 1
  fetchCollections()
}

// 创建/编辑合集
const collectionModalVisible = ref(false)
const isEditCollection = ref(false)
const collectionFormRef = ref(null)
const savingCollection = ref(false)
const collectionForm = reactive({
  id: null,
  name: '',
  version: '',
  year: new Date().getFullYear(),
  cover_url: '',
  description: '',
  sort_order: 0,
  status: 1
})

const collectionRules = {
  name: [{ required: true, message: '请输入合集名称', trigger: 'blur' }],
  version: [{ required: true, message: '请输入版本', trigger: 'blur' }]
}

const uploadUrl = '/api/upload/image'
const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem('admin_token')}`
}

const openCreateCollectionModal = () => {
  isEditCollection.value = false
  collectionForm.id = null
  collectionForm.name = ''
  collectionForm.version = ''
  collectionForm.year = new Date().getFullYear()
  collectionForm.cover_url = ''
  collectionForm.description = ''
  collectionForm.sort_order = 0
  collectionForm.status = 1
  collectionModalVisible.value = true
}

const openEditCollectionModal = (row) => {
  isEditCollection.value = true
  Object.assign(collectionForm, row)
  collectionModalVisible.value = true
}

const saveCollection = async () => {
  if (!collectionFormRef.value) return
  
  await collectionFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    savingCollection.value = true
    try {
      if (isEditCollection.value) {
        await adminApi.updateTutorialCollection(collectionForm.id, collectionForm)
        ElMessage.success('更新成功')
      } else {
        await adminApi.createTutorialCollection(collectionForm)
        ElMessage.success('创建成功')
      }
      collectionModalVisible.value = false
      fetchCollections()
    } catch (error) {
      console.error('保存合集失败:', error)
      ElMessage.error('保存合集失败')
    } finally {
      savingCollection.value = false
    }
  })
}

const toggleCollectionStatus = async (row, val) => {
  try {
    await adminApi.updateTutorialCollection(row.id, { status: val })
    ElMessage.success('状态更新成功')
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
    row.status = val === 1 ? 0 : 1
  }
}

const deleteCollection = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该合集吗？', '警告', { type: 'warning' })
    await adminApi.deleteTutorialCollection(row.id)
    ElMessage.success('删除成功')
    fetchCollections()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除合集失败:', error)
      ElMessage.error('删除合集失败')
    }
  }
}

// 上传相关
const beforeUpload = (file) => {
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('只支持 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleUploadSuccess = (res) => {
  if (res.code === 0 || res.code === 200) {
    collectionForm.cover_url = res.data.url
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(res.message || '上传失败')
  }
}

// 科目管理
const subjectsModalVisible = ref(false)
const currentCollection = ref(null)
const collectionSubjects = ref([])

const manageCollectionSubjects = async (row) => {
  currentCollection.value = row
  subjectsModalVisible.value = true
  await fetchCollectionSubjects(row.id)
}

const fetchCollectionSubjects = async (collectionId) => {
  try {
    const res = await adminApi.getTutorialCollectionDetail(collectionId)
    collectionSubjects.value = res.data?.subjects || []
  } catch (error) {
    console.error('获取科目列表失败:', error)
    ElMessage.error('获取科目列表失败')
  }
}

// 添加科目
const addSubjectModalVisible = ref(false)
const availableTutorials = ref([])
const filteredTutorials = ref([])
const tutorialSearchKeyword = ref('')
const loadingTutorialsList = ref(false)
const addingSubjectId = ref(null)

const openAddSubjectModal = async () => {
  tutorialSearchKeyword.value = ''
  addSubjectModalVisible.value = true
  await loadAvailableTutorials()
}

const loadAvailableTutorials = async () => {
  loadingTutorialsList.value = true
  try {
    const res = await adminApi.getTutorials({
      noCollection: true,
      page: 1,
      pageSize: 100
    })
    availableTutorials.value = res.data?.list || []
    filteredTutorials.value = [...availableTutorials.value]
  } catch (error) {
    console.error('加载教辅列表失败:', error)
    ElMessage.error('加载教辅列表失败')
  } finally {
    loadingTutorialsList.value = false
  }
}

const refreshTutorials = async () => {
  tutorialSearchKeyword.value = ''
  await loadAvailableTutorials()
}

const filterTutorials = () => {
  const keyword = tutorialSearchKeyword.value.toLowerCase()
  if (!keyword) {
    filteredTutorials.value = [...availableTutorials.value]
    return
  }
  filteredTutorials.value = availableTutorials.value.filter(t => 
    t.name.toLowerCase().includes(keyword) || 
    (t.subject && t.subject.toLowerCase().includes(keyword))
  )
}

const confirmAddSubject = async (row) => {
  addingSubjectId.value = row.id
  try {
    await adminApi.updateTutorial(row.id, {
      collection_id: currentCollection.value.id
    })
    ElMessage.success('添加成功')
    
    const index = availableTutorials.value.findIndex(t => t.id === row.id)
    if (index > -1) {
      availableTutorials.value.splice(index, 1)
      filterTutorials()
    }
    
    await fetchCollectionSubjects(currentCollection.value.id)
    fetchCollections()
  } catch (error) {
    console.error('添加科目失败:', error)
    ElMessage.error('添加科目失败')
  } finally {
    addingSubjectId.value = null
  }
}

const removeSubject = async (row, index) => {
  try {
    await ElMessageBox.confirm('确定要将该教辅从合集中移除吗？', '提示', { type: 'warning' })
    await adminApi.updateTutorial(row.id, {
      collection_id: null
    })
    ElMessage.success('移除成功')
    collectionSubjects.value.splice(index, 1)
    fetchCollections()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除科目失败:', error)
      ElMessage.error('移除科目失败')
    }
  }
}

const viewSubjectDetail = (row) => {
  router.push(`/computer/tutorials/${row.id}/chapters`)
}

// 工具函数
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString()
}

// 监听 tab 切换
watch(activeTab, (val) => {
  if (val === 'tutorials') {
    fetchTutorials()
  } else if (val === 'collections') {
    fetchCollections()
  }
})

onMounted(() => {
  fetchTutorials()
})
</script>

<style scoped>
.tutorial-manage {
  padding: 20px;
}

.tab-content {
  padding: 10px 0;
}

.filter-card {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.mb-20 {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.filter-bar {
  display: flex;
  gap: 10px;
  align-items: center;
}

.mr-5 {
  margin-right: 5px;
}

.mb-5 {
  margin-bottom: 5px;
}

.text-gray {
  color: #909399;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 操作按钮样式 - 不换行 */
.action-buttons {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 4px;
}

.action-buttons .el-button {
  margin: 0;
  padding: 5px 8px;
  font-size: 12px;
}

.no-cover {
  width: 60px;
  height: 80px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 12px;
}

/* 封面上传样式 */
.cover-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 120px;
  height: 160px;
}

.cover-uploader:hover {
  border-color: #409eff;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 160px;
  text-align: center;
  line-height: 160px;
}

.cover-image {
  width: 120px;
  height: 160px;
  display: block;
  object-fit: cover;
}

.subjects-manage {
  padding: 10px;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.available-tutorials {
  padding: 10px;
}

.available-tutorials .toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
