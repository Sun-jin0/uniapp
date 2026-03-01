<template>
  <view class="app-container">
    <header class="top-bar">
      <div class="back-btn" @click="goBack">❮</div>
      <div class="top-bar-title">计算机题目导入</div>
    </header>

    <main class="main-content">
      <section class="import-section">
        <div class="section-title">上传 JSON 文件</div>
        <div class="upload-area" @click="chooseFile">
          <div class="upload-icon">📄</div>
          <div class="upload-text">{{ fileList.length > 0 ? `已选择 ${fileList.length} 个文件` : '选择 JSON 试题文件' }}</div>
          <div class="upload-hint" v-if="totalQuestions > 0">共加载 {{ totalQuestions }} 条试题</div>
        </div>

        <div class="file-list-container" v-if="fileList.length > 0">
          <div class="file-list-header">
            <span>已选文件清单</span>
            <span class="clear-text" @click="clearData">全部清除</span>
          </div>
          <div class="file-item-list">
            <div v-for="(file, index) in fileList" :key="index" class="file-item">
              <span class="file-name">{{ file.name }} ({{ file.data.length }}题)</span>
              <span class="remove-btn" @click.stop="removeFile(index)">✕</span>
            </div>
          </div>
        </div>
        
        <div class="action-bar" v-if="totalQuestions > 0">
          <button class="import-btn" :loading="importing" @click="startImport">开始导入</button>
          <button class="clear-btn" @click="clearData">清除</button>
        </div>
      </section>

      <section class="import-section">
        <div class="section-title">导入说明</div>
        <div class="instruction-list">
          <div class="instruction-item">1. 支持批量上传多个 JSON 文件。</div>
          <div class="instruction-item">2. 支持单选题、多选题、判断题、填空题和解答题。</div>
          <div class="instruction-item">3. 解答题支持通过 options 数组定义多个小题。</div>
          <div class="instruction-item">4. 知识点标签需预先在系统中存在，否则将不会建立关联。</div>
        </div>
        <div class="template-box">
          <div class="template-header">
            <span>JSON 模版示例</span>
            <span class="copy-btn" @click="copyTemplate">复制</span>
          </div>
          <pre class="template-content">{{ jsonTemplate }}</pre>
        </div>
      </section>

      <section class="preview-section" v-if="allImportData.length > 0">
        <div class="section-title">数据预览 (前 5 条)</div>
        <div class="preview-list">
          <div v-for="(q, index) in allImportData.slice(0, 5)" :key="index" class="preview-item">
            <div class="preview-header">
              <span class="q-index">题目 {{ index + 1 }}</span>
              <span class="q-type">{{ q.exerciseType }}</span>
            </div>
            <div class="q-text" v-html="q.exerciseStem"></div>
            <div class="q-answer" v-if="q.exerciseAnswer">答案: {{ q.exerciseAnswer }}</div>
            <div class="sub-questions" v-if="q.options && q.exerciseType === '解答题'">
              <div class="sub-title">包含 {{ q.options.length }} 个小题</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { request } from '../../api/request';

const fileList = ref([]); // 存储 { name: string, data: array }
const importing = ref(false);

// 计算属性：所有文件的题目总数
const totalQuestions = computed(() => {
  return fileList.value.reduce((total, file) => total + file.data.length, 0);
});

// 计算属性：合并后的题目列表用于预览和导入
const allImportData = computed(() => {
  return fileList.value.flatMap(file => file.data);
});

const jsonTemplate = `[
  {
    "exerciseType": "单选题",
    "exerciseStem": "<p>以下哪个是计算机的输入设备？</p>",
    "exerciseAnswer": "A",
    "exerciseAnalysis": "<p>鼠标是输入设备，显示器是输出设备。</p>",
    "knowledgeTags": ["基础知识", "硬件"],
    "options": [
      { "optionTag": "A", "optionContent": "鼠标", "isAnswer": 1 },
      { "optionTag": "B", "optionContent": "显示器", "isAnswer": 0 }
    ]
  },
  {
    "exerciseType": "解答题",
    "exerciseStem": "<p>请简述操作系统的功能。</p>",
    "options": [
      {
        "questionOrder": 1,
        "questionStem": "<p>进程管理的主要任务是什么？</p>",
        "questionAnswer": "<p>进程调度、同步、通信等。</p>",
        "questionScore": 5
      }
    ]
  }
]`;

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

const chooseFile = () => {
  // #ifdef H5
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.multiple = true;
  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      // 检查是否已存在同名文件
      if (fileList.value.some(f => f.name === file.name)) {
        continue;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          fileList.value.push({
            name: file.name,
            data: data
          });
        } else {
          uni.showToast({ title: `文件 ${file.name} 格式不正确`, icon: 'none' });
        }
      } catch (error) {
        uni.showToast({ title: `解析文件 ${file.name} 失败`, icon: 'none' });
      }
    }
  };
  input.click();
  // #endif
  
  // #ifndef H5
  uni.showToast({ title: '请在 H5 环境下使用文件导入', icon: 'none' });
  // #endif
};

const removeFile = (index) => {
  fileList.value.splice(index, 1);
};

const clearData = () => {
  fileList.value = [];
};

const startImport = async () => {
  if (allImportData.value.length === 0) return;
  
  importing.value = true;
  try {
    const res = await request({
      url: '/computer1/import',
      method: 'POST',
      data: allImportData.value
    });
    
    uni.showModal({
      title: '导入成功',
      content: `从 ${fileList.value.length} 个文件中成功导入 ${res.data.successCount} 条试题`,
      showCancel: false,
      success: () => {
        clearData();
      }
    });
  } catch (error) {
    console.error('导入失败:', error);
    uni.showModal({
      title: '导入失败',
      content: error.message || '未知错误',
      showCancel: false
    });
  } finally {
    importing.value = false;
  }
};
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f8f9fa;
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

.upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 12px;
  padding: 40px 20px;
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

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.upload-hint {
  font-size: 14px;
  color: #007aff;
  margin-top: 8px;
}

.file-list-container {
  margin-top: 20px;
  background: #fff;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #eee;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f3f5;
}

.clear-text {
  font-size: 12px;
  color: #ff4d4f;
  font-weight: normal;
  cursor: pointer;
}

.file-item-list {
  max-height: 200px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #f1f3f5;
}

.file-item:last-child {
  border-bottom: none;
}

.file-name {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 12px;
}

.remove-btn {
  font-size: 14px;
  color: #999;
  cursor: pointer;
  padding: 4px;
}

.remove-btn:hover {
  color: #ff4d4f;
}

.instruction-list {
  margin-bottom: 16px;
}

.instruction-item {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.template-box {
  background: #f1f3f5;
  border-radius: 8px;
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
  max-height: 300px;
  overflow-y: auto;
}

.action-bar {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.import-btn {
  flex: 2;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 15px;
  font-weight: 500;
}

.clear-btn {
  flex: 1;
  background: #f8f9fa;
  color: #666;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 12px;
  font-size: 15px;
}

.preview-section {
  background: #fff;
  padding: 16px;
  border-radius: 12px;
}

.preview-item {
  border-bottom: 1px solid #f1f3f5;
  padding: 12px 0;
}

.preview-item:last-child {
  border-bottom: none;
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
  color: #333;
}

.q-answer {
  font-size: 13px;
  color: #28a745;
  margin-top: 8px;
  font-weight: 500;
}

.sub-questions {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
}
</style>
