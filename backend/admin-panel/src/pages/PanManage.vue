<template>
  <div class="pan-manage">
    <div class="header-actions">
      <div class="left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索资源标题..."
          class="search-input"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
        <el-select v-model="selectedCategory" placeholder="全部分类" @change="handleSearch" clearable class="category-select">
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
        <el-button type="primary" @click="openAddModal">
          <el-icon><Plus /></el-icon> 添加资源
        </el-button>
        <el-button type="success" @click="showSyncModal = true">
          <el-icon><Connection /></el-icon> 批量获取
        </el-button>
      </div>
      <div class="right">
        <el-button @click="showCategoryModal = true">
          <el-icon><FolderOpened /></el-icon> 分类管理
        </el-button>
        <el-button 
          v-if="selectedIds.length > 0" 
          type="danger" 
          @click="handleBatchDelete"
        >
          批量删除 ({{ selectedIds.length }})
        </el-button>
      </div>
    </div>

    <el-table 
      :data="resources" 
      v-loading="loading" 
      border 
      stripe 
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="排序" width="100" align="center">
        <template #default="{ row }">
          <el-input-number v-model="row.SortOrder" :min="0" :max="999" size="small" style="width: 70px;" @change="handleSortChange(row)" />
        </template>
      </el-table-column>
      <el-table-column label="置顶" width="80" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.IsTop" :active-value="1" :inactive-value="0" @change="handleTopChange(row)" />
        </template>
      </el-table-column>
      <el-table-column label="资源标题" min-width="200">
        <template #default="{ row }">
          <div class="title-cell">
            <el-tag v-if="row.IsTop" size="small" type="danger" effect="dark" class="mr-5">置顶</el-tag>
            <el-tag v-if="row.IsNew" size="small" type="warning" effect="dark" class="mr-5">NEW</el-tag>
            <span class="title-text">{{ row.Title }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="Category" label="分类" width="120" align="center" />
      <el-table-column label="网盘链接" min-width="200">
        <template #default="{ row }">
          <div v-if="row.QuarkUrl" class="link-item">
            <el-tag size="small" class="link-tag quark">夸克</el-tag>
            <el-link :href="row.QuarkUrl" target="_blank" type="primary" :underline="false" class="link-text">
              {{ row.QuarkUrl }}
            </el-link>
          </div>
          <div v-if="row.BaiduUrl" class="link-item">
            <el-tag size="small" type="warning" class="link-tag baidu">百度</el-tag>
            <el-link :href="row.BaiduUrl" target="_blank" type="primary" :underline="false" class="link-text">
              {{ row.BaiduUrl }}
            </el-link>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="CreatedAt" label="发布时间" width="180" align="center">
        <template #default="{ row }">
          {{ formatDate(row.CreatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEditModal(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 添加/编辑弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="isEditing ? '编辑资源' : '添加资源'"
      width="600px"
      destroy-on-close
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="editForm.Title" placeholder="请输入资源标题" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="editForm.Category" placeholder="请选择或输入分类" filterable allow-create style="width: 100%">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="夸克链接">
          <el-input v-model="editForm.QuarkUrl" placeholder="https://pan.quark.cn/s/..." />
        </el-form-item>
        <el-form-item label="百度链接">
          <el-input v-model="editForm.BaiduUrl" placeholder="https://pan.baidu.com/s/..." />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.Description" type="textarea" :rows="3" placeholder="资源详细描述" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="置顶">
              <el-switch v-model="editForm.IsTop" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="editForm.SortOrder" :min="0" :max="999" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="标记为新">
          <el-switch v-model="editForm.IsNew" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分类管理弹窗 -->
    <el-dialog
      v-model="showCategoryModal"
      title="分类管理"
      width="400px"
    >
      <div class="category-modal-body">
        <div class="add-cat-form">
          <el-input v-model="newCategoryName" placeholder="新分类名称">
            <template #append>
              <el-button @click="handleAddCategory">添加</el-button>
            </template>
          </el-input>
        </div>
        <el-table :data="fullCategories" height="300px" style="margin-top: 20px">
          <el-table-column label="分类名称">
            <template #default="{ row }">
              <el-input v-model="row.CategoryName" size="small" @blur="handleUpdateCategory(row)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-button type="danger" link @click="handleDeleteCategory(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 批量同步/解析弹窗 -->
    <el-dialog
      v-model="showSyncModal"
      title="批量解析网盘链接"
      width="700px"
    >
      <div class="sync-tips">
        <el-alert 
          title="系统将自动从文本中提取标题、分类和网盘链接。支持多种格式。" 
          type="info" 
          :closable="false" 
          show-icon 
        />
      </div>
      <el-input
        v-model="rawSyncText"
        type="textarea"
        :rows="12"
        placeholder="例如：
【2026考研资料】链接：https://pan.quark.cn/s/xxxx
资源名称2 https://pan.baidu.com/s/yyyy"
        style="margin-top: 15px"
      />
      <template #footer>
        <el-button @click="showSyncModal = false">取消</el-button>
        <el-button type="primary" @click="handleParse" :loading="parsing">开始解析</el-button>
      </template>
    </el-dialog>

    <!-- 解析结果预览弹窗 -->
    <el-dialog
      v-model="showPreviewModal"
      title="解析结果预览"
      width="90%"
      top="5vh"
    >
      <el-table :data="parsedResults" height="60vh" border stripe>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)">
              {{ getActionText(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标题">
          <template #default="{ row }">
            <el-input v-model="row.Title" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="分类" width="150">
          <template #default="{ row }">
            <el-input v-model="row.Category" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="夸克链接">
          <template #default="{ row }">
            <el-input v-model="row.QuarkUrl" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="百度链接">
          <template #default="{ row }">
            <el-input v-model="row.BaiduUrl" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ $index }">
            <el-button type="danger" link @click="removePreviewItem($index)">排除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="showPreviewModal = false">取消</el-button>
        <el-button type="primary" @click="handleImport" :loading="importing">确认并导入 ({{ parsedResults.length }}条)</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const saving = ref(false)
const resources = ref([])
const categories = ref([])
const fullCategories = ref([])
const selectedCategory = ref('')
const searchKeyword = ref('')
const selectedIds = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 编辑
const editDialogVisible = ref(false)
const isEditing = ref(false)
const editForm = ref({
  ResourceID: null,
  Title: '',
  Category: '',
  QuarkUrl: '',
  BaiduUrl: '',
  Description: '',
  IsNew: false,
  IsTop: 0,
  SortOrder: 0
})

// 分类管理
const showCategoryModal = ref(false)
const newCategoryName = ref('')

// 批量同步
const showSyncModal = ref(false)
const rawSyncText = ref('')
const parsing = ref(false)
const showPreviewModal = ref(false)
const parsedResults = ref([])
const importing = ref(false)

const fetchResources = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchKeyword.value,
      category: selectedCategory.value
    }
    const res = await adminApi.getPanResources(params)
    if (res.code === 0) {
      resources.value = res.data.list || res.data || []
      total.value = res.data.total || (Array.isArray(res.data) ? res.data.length : 0)
    }
  } catch (error) {
    console.error('获取资源失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const res = await adminApi.getPanCategories()
    if (res.code === 0) {
      categories.value = res.data || []
    }
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

const fetchFullCategories = async () => {
  try {
    const res = await adminApi.getPanCategories(true)
    if (res.code === 0) {
      fullCategories.value = res.data || []
    }
  } catch (error) {
    console.error('获取完整分类失败:', error)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchResources()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchResources()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchResources()
}

const handleSelectionChange = (val) => {
  selectedIds.value = val.map(item => item.ResourceID)
}

const openAddModal = () => {
  editForm.value = {
    ResourceID: null,
    Title: '',
    Category: selectedCategory.value || categories.value[0] || '',
    QuarkUrl: '',
    BaiduUrl: '',
    Description: '',
    IsNew: false
  }
  isEditing.value = false
  editDialogVisible.value = true
}

const openEditModal = (row) => {
  editForm.value = { ...row }
  isEditing.value = true
  editDialogVisible.value = true
}

const handleSave = async () => {
  if (!editForm.value.Title || !editForm.value.Category) {
    return ElMessage.warning('标题和分类必填')
  }
  
  saving.value = true
  try {
    let res
    if (isEditing.value) {
      res = await adminApi.updatePanResource(editForm.value.ResourceID, editForm.value)
    } else {
      res = await adminApi.createPanResource(editForm.value)
    }
    
    if (res.code === 0) {
      ElMessage.success('保存成功')
      editDialogVisible.value = false
      fetchResources()
      fetchCategories()
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该资源吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await adminApi.deletePanResource(row.ResourceID)
      if (res.code === 0) {
        ElMessage.success('删除成功')
        fetchResources()
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 处理置顶状态变化
const handleTopChange = async (row) => {
  try {
    const res = await adminApi.updatePanResourceTop(row.ResourceID, { isTop: row.IsTop })
    if (res.code === 0) {
      ElMessage.success(row.IsTop ? '置顶成功' : '取消置顶成功')
      fetchResources()
    }
  } catch (error) {
    ElMessage.error('操作失败')
    row.IsTop = row.IsTop ? 0 : 1 // 恢复原状态
  }
}

// 处理排序值变化
const handleSortChange = async (row) => {
  try {
    const res = await adminApi.updatePanResourceSort(row.ResourceID, { sortOrder: row.SortOrder })
    if (res.code === 0) {
      ElMessage.success('排序更新成功')
      fetchResources()
    }
  } catch (error) {
    ElMessage.error('排序更新失败')
  }
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要批量删除选中的 ${selectedIds.value.length} 条资源吗？`, '警告', {
    type: 'danger'
  }).then(async () => {
    try {
      const res = await adminApi.batchDeletePanResources({ ids: selectedIds.value })
      if (res.code === 0) {
        ElMessage.success('批量删除成功')
        selectedIds.value = []
        fetchResources()
      }
    } catch (error) {
      ElMessage.error('批量删除失败')
    }
  }).catch(() => {})
}

const handleAddCategory = async () => {
  if (!newCategoryName.value.trim()) return
  try {
    const res = await adminApi.createPanCategory({ name: newCategoryName.value.trim() })
    if (res.code === 0) {
      newCategoryName.value = ''
      fetchFullCategories()
      fetchCategories()
    }
  } catch (error) {
    ElMessage.error('添加分类失败')
  }
}

const handleUpdateCategory = async (cat) => {
  try {
    await adminApi.updatePanCategory(cat.CategoryID, { 
      name: cat.CategoryName,
      sortOrder: cat.SortOrder 
    })
    fetchCategories()
  } catch (error) {
    console.error('更新分类失败:', error)
  }
}

const handleDeleteCategory = (cat) => {
  ElMessageBox.confirm(`确定要删除分类“${cat.CategoryName}”吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await adminApi.deletePanCategory(cat.CategoryID)
      if (res.code === 0) {
        fetchFullCategories()
        fetchCategories()
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleParse = async () => {
  if (!rawSyncText.value.trim()) {
    return ElMessage.warning('请粘贴文本')
  }
  
  parsing.value = true
  try {
    const res = await adminApi.parsePanResources({ rawText: rawSyncText.value })
    if (res.code === 0) {
      if (res.data.length === 0) {
        ElMessage.warning('未识别到任何资源')
      } else {
        parsedResults.value = res.data
        showSyncModal.value = false
        showPreviewModal.value = true
      }
    }
  } catch (error) {
    ElMessage.error('解析失败')
  } finally {
    parsing.value = false
  }
}

const removePreviewItem = (index) => {
  parsedResults.value.splice(index, 1)
}

const handleImport = async () => {
  if (parsedResults.value.length === 0) return
  
  importing.value = true
  try {
    const res = await adminApi.importPanResources({ resources: parsedResults.value })
    if (res.code === 0) {
      ElMessage.success(`导入成功: 新增${res.data.createdCount}, 更新${res.data.updatedCount}`)
      showPreviewModal.value = false
      fetchResources()
      fetchCategories()
    }
  } catch (error) {
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

const getActionType = (action) => {
  const map = {
    create: 'success',
    update: 'warning',
    supplement: 'info',
    ignore: 'danger'
  }
  return map[action] || 'info'
}

const getActionText = (action) => {
  const map = {
    create: '新增',
    update: '更新',
    supplement: '补充',
    ignore: '忽略'
  }
  return map[action] || action
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString()
}

onMounted(() => {
  fetchResources()
  fetchCategories()
  fetchFullCategories()
})
</script>

<style scoped>
.pan-manage {
  padding: 20px;
}
.header-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
.header-actions .left {
  display: flex;
  gap: 15px;
}
.search-input {
  width: 250px;
}
.category-select {
  width: 150px;
}
.title-cell {
  display: flex;
  align-items: center;
}
.title-text {
  font-weight: 500;
}
.mr-5 {
  margin-right: 5px;
}
.link-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}
.link-tag {
  width: 40px;
  text-align: center;
  margin-right: 8px;
  flex-shrink: 0;
}
.link-text {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.sync-tips {
  margin-bottom: 15px;
}
</style>
