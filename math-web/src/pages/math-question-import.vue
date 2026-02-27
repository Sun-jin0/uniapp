<template>
  <view class="app-container">
    <header class="top-bar">
      <div class="back-btn" @click="goBack">❮</div>
      <div class="top-bar-title">批量导入题目</div>
    </header>

    <main class="main-content">
      <section class="import-section">
        <div class="section-title">方法一：基础导入 (JSON)</div>
        <div class="upload-area" @click="chooseFile('basic')">
          <div class="upload-icon">📄</div>
          <div class="upload-text">{{ basicFileName || '选择基础导入 JSON 文件' }}</div>
        </div>
        <div class="action-bar" v-if="basicImportData">
          <button class="import-btn" :loading="importing" @click="startBasicImport">开始导入基础题目</button>
        </div>
      </section>

      <section class="import-section">
        <div class="section-title">方法二：复合导入 (映射 + 详情)</div>
        
        <!-- 新增导入配置项 -->
        <div class="import-config">
          <div class="config-row">
            <div class="config-item">
              <span class="config-label">版本信息:</span>
              <input class="config-input" v-model="importConfig.versionInfo" placeholder="例如: 2026" />
            </div>
            <div class="config-item">
              <span class="config-label">内容类型:</span>
              <select class="config-select" :value="importConfig.contentType" @change="e => importConfig.contentType = e.target.value">
                <option value="book">书籍 (教材/教辅)</option>
                <option value="mock_paper">模拟卷</option>
                <option value="real_paper">真题卷</option>
              </select>
            </div>
          </div>
          <div class="config-row">
            <div class="config-item">
              <span class="config-label">所属科目:</span>
              <select class="config-select" :value="importConfig.subjectId" @change="e => importConfig.subjectId = e.target.value ? Number(e.target.value) : null">
                <option :value="null">请选择科目</option>
                <option v-for="s in displaySubjects" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div class="config-item checkbox-item">
              <label class="checkbox-label">
                <input type="checkbox" v-model="importConfig.isNew" />
                <span class="checkbox-text">标记为新书 (NEW)</span>
              </label>
            </div>
          </div>
        </div>

        <div class="upload-row">
          <div class="upload-half" @click="chooseFile('mapping')">
            <div class="upload-icon-small">🔗</div>
            <div class="upload-text-small">{{ mappingFileName || '选择映射文件' }}</div>
            <button class="mini-import-btn" v-if="mappingData" @click.stop="startMappingImport" :loading="importing">仅导入映射</button>
          </div>
          <div class="upload-half" @click="chooseFile('details')">
            <div class="upload-icon-small">📝</div>
            <div class="upload-text-small">{{ detailsFileName || '选择详情文件' }}</div>
            <button class="mini-import-btn" v-if="detailsData" @click.stop="startDetailsImport" :loading="importing">仅导入详情</button>
          </div>
        </div>
        <div class="action-bar" v-if="mappingData && detailsData">
          <button class="import-btn complex" :loading="importing" @click="startComplexImport">一键复合导入 ({{ mappingCount }} 题)</button>
          <button class="clear-btn" @click="clearComplex">清除</button>
        </div>
        <div class="import-hint" v-if="mappingData || detailsData">
          * 如果文件过大，建议先点击“仅导入映射”，成功后再点击“仅导入详情”。
        </div>
      </section>

      <section class="import-section">
        <div class="section-title">导入说明</div>
        <div class="template-box">
          <div class="template-header">
            <span>基础导入模版</span>
            <span class="copy-btn" @click="copyTemplate">复制</span>
          </div>
          <pre class="template-content">{{ jsonTemplate }}</pre>
        </div>
      </section>

      <section class="preview-section" v-if="importData && importData.questions.length > 0">
        <div class="section-title">导入预览</div>
        <div class="preview-list">
          <div v-for="(q, index) in importData.questions" :key="index" class="preview-item">
            <div class="preview-header">
              <span class="q-index">题目 {{ index + 1 }}</span>
              <span class="q-type">{{ q.QuestionType || '未指定类型' }}</span>
            </div>
            <div class="q-text latex-content" v-html="renderLaTeX(q.QuestionText)"></div>
            <div class="q-answer">答案: {{ q.OriginalAnswerText }}</div>
          </div>
        </div>
      </section>
    </main>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { request } from '@/api/request';
import { transformContextString } from '@/utils/latex';

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
const subjects = ref([]);

const importConfig = ref({
  versionInfo: '2026',
  contentType: 'book',
  subjectId: null,
  isNew: false
});

const displaySubjects = computed(() => {
  return subjects.value
    .filter(s => s && s.name && s.name !== '公共数学')
    .sort((a, b) => {
      const order = { '考研数学(一)': 1, '考研数学(二)': 2, '考研数学(三)': 3 };
      return (order[a.name] || 99) - (order[b.name] || 99);
    });
});

const fetchSubjects = async () => {
  try {
    const res = await request({ url: '/math/subjects' });
    subjects.value = res.data || [];
  } catch (error) {
    console.error('获取科目失败:', error);
  }
};

onMounted(() => {
  fetchSubjects();
});

const mappingCount = computed(() => {
  if (!mappingData.value) return 0;
  if (Array.isArray(mappingData.value)) {
    return mappingData.value.reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0);
  }
  return 0;
});

const goBack = () => {
  uni.navigateBack();
};

const copyTemplate = () => {
  uni.setClipboardData({
    data: jsonTemplate,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
    }
  });
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
    const res = await request({
      url: '/math/admin/import-questions',
      method: 'POST',
      data: basicImportData.value
    });
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
    const res = await request({
      url: '/math/admin/import-complex-questions',
      method: 'POST',
      data: { 
        mapping: mappingData.value,
        config: importConfig.value
      }
    });
    uni.showModal({
      title: '映射导入结果',
      content: `成功 ${res.data.mappingSuccessCount} 条，失败 ${res.data.mappingFailCount} 条`,
      showCancel: false
    });
  } catch (error) {
    console.error('映射导入失败:', error);
    uni.showToast({ title: '映射导入失败', icon: 'none' });
  } finally {
    importing.value = false;
  }
};

const startDetailsImport = async () => {
  if (!detailsData.value) return;
  importing.value = true;
  try {
    const res = await request({
      url: '/math/admin/import-complex-questions',
      method: 'POST',
      data: { details: detailsData.value }
    });
    uni.showModal({
      title: '详情导入结果',
      content: `成功 ${res.data.detailsSuccessCount} 题，失败 ${res.data.detailsFailCount} 题`,
      showCancel: false
    });
  } catch (error) {
    console.error('详情导入失败:', error);
    uni.showToast({ title: '详情导入失败', icon: 'none' });
  } finally {
    importing.value = false;
  }
};

const startComplexImport = async () => {
  if (!mappingData.value || !detailsData.value) return;
  importing.value = true;
  try {
    const res = await request({
      url: '/math/admin/import-complex-questions',
      method: 'POST',
      data: {
        mapping: mappingData.value,
        details: detailsData.value,
        config: importConfig.value
      }
    });
    uni.showModal({
      title: '复合导入结果',
      content: `映射: 成功 ${res.data.mappingSuccessCount}, 失败 ${res.data.mappingFailCount}\n详情: 成功 ${res.data.detailsSuccessCount}, 失败 ${res.data.detailsFailCount}`,
      showCancel: false
    });
  } catch (error) {
    console.error('复合导入失败:', error);
    uni.showToast({ title: '导入失败', icon: 'none' });
  } finally {
    importing.value = false;
  }
};
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.top-bar {
  padding: 44px 16px 12px;
  background: #fff;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.back-btn {
  font-size: 20px;
  padding: 8px;
  margin-right: 12px;
  cursor: pointer;
}

.top-bar-title {
  font-size: 18px;
  font-weight: 600;
}

.main-content {
  flex: 1;
  padding: 20px 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.import-section {
  background: #fff;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.template-box {
  background: #f1f3f5;
  border-radius: 8px;
  margin-bottom: 16px;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #dee2e6;
  font-size: 12px;
  color: #666;
}

.copy-btn {
  color: #007aff;
  cursor: pointer;
}

.template-content {
  padding: 12px;
  font-family: monospace;
  font-size: 12px;
  color: #444;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

.upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 12px;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #007aff;
  background: #f0f7ff;
}

.upload-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.upload-half {
  flex: 1;
  border: 1px dashed #dee2e6;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  background: #fafafa;
}

.upload-icon-small {
  font-size: 24px;
  margin-bottom: 8px;
}

.upload-text-small {
  font-size: 12px;
  color: #666;
  text-align: center;
  word-break: break-all;
}

.upload-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.import-btn.complex {
  background: #28a745;
}

.upload-hint {
  font-size: 12px;
  color: #999;
}

.action-bar {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.import-btn {
  flex: 1;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  font-weight: 500;
}

.import-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.config-row {
  display: flex;
  gap: 20px;
  align-items: center;
}

.config-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-item {
  justify-content: flex-start;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.checkbox-text {
  font-size: 14px;
  color: #333;
}

.config-label {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.config-input, .config-select {
  padding: 6px 10px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
  outline: none;
}

.config-input:focus, .config-select:focus {
  border-color: #007aff;
}

.mini-import-btn {
  margin-top: 10px;
  background: #007aff;
  color: #fff;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 4px;
  border: none;
}

.import-hint {
  font-size: 11px;
  color: #f5222d;
  margin-top: 12px;
  padding: 8px;
  background: #fff1f0;
  border-radius: 4px;
}

.preview-section {
  background: #fff;
  padding: 16px;
  border-radius: 12px;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-item {
  border: 1px solid #f1f3f5;
  border-radius: 8px;
  padding: 12px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.q-index {
  font-size: 12px;
  color: #999;
}

.q-type {
  font-size: 12px;
  background: #e7f3ff;
  color: #007aff;
  padding: 2px 6px;
  border-radius: 4px;
}

.q-text {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 8px;
  word-break: break-all;
}

.q-answer {
  font-size: 13px;
  color: #28a745;
  font-weight: 500;
  padding-top: 8px;
  border-top: 1px dashed #f1f3f5;
}
</style>
