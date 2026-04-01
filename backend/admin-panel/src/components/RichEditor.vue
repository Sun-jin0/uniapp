<template>
  <div class="rich-editor">
    <Toolbar
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
      class="editor-toolbar"
    />
    <Editor
      :defaultConfig="editorConfig"
      :mode="mode"
      v-model="valueHtml"
      @onCreated="handleCreated"
      @onChange="handleChange"
      class="editor-content"
    />
    <div class="editor-actions">
      <el-select v-model="selectedModel" size="small" style="width: 180px;">
        <el-option label="DeepSeek-V3.2" value="deepseek-ai/DeepSeek-V3.2" />
        <el-option label="GLM-4.6" value="zai-org/GLM-4.6" />
        <el-option label="Qwen3-235B" value="Qwen/Qwen3-235B-A22B-Instruct-2507" />
      </el-select>
      <el-button type="success" size="small" @click="aiFormat" :loading="aiFormatting">
        <el-icon><MagicStick /></el-icon> AI格式化
      </el-button>
      <el-button type="primary" size="small" @click="removeEmptyLines" :loading="cleaning">
        <el-icon><Delete /></el-icon> 删除空行
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { shallowRef, onBeforeUnmount, watch, ref } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { adminApi } from '@/api'
import { ElMessage } from 'element-plus'
import { Delete, MagicStick } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请输入内容...'
  },
  height: {
    type: Number,
    default: 400
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()

// 内容 HTML
const valueHtml = shallowRef(props.modelValue)

// 删除空行状态
const cleaning = ref(false)

// AI 格式化状态
const aiFormatting = ref(false)

// 选中的AI模型
const selectedModel = ref('deepseek-ai/DeepSeek-V3.2')

// AI 格式化功能
const aiFormat = async () => {
  const editor = editorRef.value
  if (!editor) return
  
  aiFormatting.value = true
  try {
    // 获取当前 HTML 内容
    let html = editor.getHtml()
    
    if (!html || html === '<p><br></p>') {
      ElMessage.warning('编辑器内容为空')
      return
    }
    
    // 保存原始内容
    const originalHtml = html
    
    // 调用 AI API 进行格式化
    const res = await adminApi.aiFormatCode({
      content: html,
      instruction: '请格式化以下内容，删除所有多余空行，保持原有逻辑和内容不变。',
      model: selectedModel.value
    })
    
    let formattedContent = res.data.formattedContent || html
    
    // 确保内容不为空
    if (!formattedContent || formattedContent.trim() === '' || formattedContent === '<p><br></p>') {
      ElMessage.warning('AI格式化后内容为空，已取消操作')
      return
    }
    
    // 更新编辑器内容
    try {
      editor.setHtml(formattedContent)
      
      // 更新值
      valueHtml.value = formattedContent
      emit('update:modelValue', formattedContent)
      emit('change', formattedContent)
      
      ElMessage.success('AI格式化完成')
    } catch (editorError) {
      console.error('编辑器更新失败:', editorError)
      editor.setHtml(originalHtml)
      ElMessage.error('编辑器更新失败，已恢复原内容')
    }
    
  } catch (error) {
    console.error('AI格式化失败:', error)
    ElMessage.error('AI格式化失败')
  } finally {
    aiFormatting.value = false
  }
}

// 删除空行功能
const removeEmptyLines = async () => {
  const editor = editorRef.value
  if (!editor) return
  
  cleaning.value = true
  try {
    // 获取当前 HTML 内容
    let html = editor.getHtml()
    
    if (!html || html === '<p><br></p>') {
      ElMessage.warning('编辑器内容为空')
      return
    }
    
    // 保存原始内容用于恢复
    const originalHtml = html
    
    // 使用正则表达式直接处理 HTML 字符串
    let cleanedHtml = html
    
    // 1. 删除代码块内的 <br> 标签（替换为换行符）
    cleanedHtml = cleanedHtml.replace(/(<pre[^>]*>[\s\S]*?<\/pre>)/gi, (match) => {
      return match.replace(/<br\s*\/?>/gi, '\n')
    })
    
    // 2. 删除所有空段落（只包含 <br> 或 &nbsp; 或空白的段落）
    // 匹配 <p>...</p> 其中内容只有 <br> 或 &nbsp; 或空白
    cleanedHtml = cleanedHtml.replace(/<p[^>]*>\s*(<br\s*\/?>|&nbsp;|\s)*\s*<\/p>/gi, '')
    
    // 3. 删除段落末尾的 <br>
    cleanedHtml = cleanedHtml.replace(/<br\s*\/?>\s*<\/p>/gi, '</p>')
    
    // 4. 删除段落开头的 <br>
    cleanedHtml = cleanedHtml.replace(/<p>\s*<br\s*\/?>/gi, '<p>')
    
    // 5. 删除开头的 <br>
    cleanedHtml = cleanedHtml.replace(/^\s*<br\s*\/?>/gi, '')
    
    // 6. 删除结尾的 <br>
    cleanedHtml = cleanedHtml.replace(/<br\s*\/?>\s*$/gi, '')
    
    // 7. 删除连续的 <br> 标签
    cleanedHtml = cleanedHtml.replace(/(<br\s*\/?>\s*){2,}/gi, '<br>')
    
    // 确保内容不为空
    if (!cleanedHtml || cleanedHtml.trim() === '' || cleanedHtml === '<p><br></p>') {
      ElMessage.warning('清理后内容为空，已取消操作')
      cleaning.value = false
      return
    }
    
    // 使用 setHtml 更新内容
    try {
      editor.setHtml(cleanedHtml)
      
      // 更新值
      valueHtml.value = cleanedHtml
      emit('update:modelValue', cleanedHtml)
      emit('change', cleanedHtml)
      
      ElMessage.success('已删除多余空行')
    } catch (editorError) {
      console.error('编辑器更新失败:', editorError)
      // 如果失败，尝试恢复原内容
      editor.setHtml(originalHtml)
      ElMessage.error('编辑器更新失败，已恢复原内容')
    }
    
  } catch (error) {
    console.error('删除空行失败:', error)
    ElMessage.error('删除空行失败')
  } finally {
    cleaning.value = false
  }
}

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  if (newVal !== valueHtml.value) {
    valueHtml.value = newVal
  }
})

const toolbarConfig = {
  excludeKeys: []
}

// 自定义上传图片到图床
const customUploadImage = async (file, insertFn) => {
  try {
    // 上传到图床 - uploadImage 方法内部会创建 FormData
    const res = await adminApi.uploadImage(file)
    
    if (res.data && res.data.url) {
      // 插入图片到编辑器
      insertFn(res.data.url, file.name, res.data.url)
      
      // 插入后清理编辑器中所有图片的硬编码宽高和空属性
      setTimeout(() => {
        const editor = editorRef.value
        if (editor) {
          // 获取编辑器容器
          const $textElem = editor.$textElem
          if ($textElem && $textElem.elems) {
            $textElem.elems.forEach((elem) => {
              if (elem.tagName === 'IMG') {
                elem.removeAttribute('style')
                elem.removeAttribute('width')
                elem.removeAttribute('height')
                elem.removeAttribute('alt')
                elem.removeAttribute('data-href')
              }
              // 递归检查子元素
              const imgs = elem.querySelectorAll ? elem.querySelectorAll('img') : []
              imgs.forEach((img) => {
                img.removeAttribute('style')
                img.removeAttribute('width')
                img.removeAttribute('height')
                img.removeAttribute('alt')
                img.removeAttribute('data-href')
              })
            })
          }
        }
      }, 100)
      
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error('图片上传失败')
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败: ' + (error.message || '未知错误'))
  }
}

const editorConfig = {
  placeholder: props.placeholder,
  MENU_CONF: {
    uploadImage: {
      // 使用自定义上传
      customUpload: customUploadImage
    }
  }
}

const mode = 'default'

const handleCreated = (editor) => {
  editorRef.value = editor
}

const handleChange = (editor) => {
  let html = editor.getHtml()
  
  // 移除所有图片的硬编码宽高
  html = html.replace(/<img([^>]*?)style="[^"]*width\s*:\s*\d+(\.\d+)?(px|%)?[^"]*height\s*:\s*\d+(\.\d+)?(px|%)?[^"]*"([^>]*?)>/gi, '<img$1$6>')
             .replace(/<img([^>]*?)width="\d+(\.\d+)?"([^>]*?)height="\d+(\.\d+)?"([^>]*?)>/gi, '<img$1$3$5>')
             .replace(/<img([^>]*?)style="[^"]*width\s*:\s*\d+(\.\d+)?(px|%)?[^"]*"([^>]*?)>/gi, '<img$1$4>')
             .replace(/<img([^>]*?)width="\d+(\.\d+)?"([^>]*?)>/gi, '<img$1$3>')
             .replace(/<img([^>]*?)style="[^"]*height\s*:\s*\d+(\.\d+)?(px|%)?[^"]*"([^>]*?)>/gi, '<img$1$4>')
             .replace(/<img([^>]*?)height="\d+(\.\d+)?"([^>]*?)>/gi, '<img$1$3>')
  
  // 清理空属性：alt="" data-href="" style=""
  html = html.replace(/<img\s+([^>]*?)alt=""\s*([^>]*?)>/gi, '<img $1$2>')
             .replace(/<img\s+([^>]*?)data-href=""\s*([^>]*?)>/gi, '<img $1$2>')
             .replace(/<img\s+([^>]*?)style=""\s*([^>]*?)>/gi, '<img $1$2>')
             .replace(/<img\s+([^>]*?)alt=""\s*([^>]*?)>/gi, '<img $1$2>')
             .replace(/<img\s+([^>]*?)data-href=""\s*([^>]*?)>/gi, '<img $1$2>')
             .replace(/<img\s+([^>]*?)style=""\s*([^>]*?)>/gi, '<img $1$2>')
             // 清理重复空格和尾部属性
             .replace(/<img\s+/gi, '<img ')
             .replace(/\s*>/gi, '>')
  
  valueHtml.value = html
  emit('update:modelValue', html)
  emit('change', html)
}

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})
</script>

<style scoped>
.rich-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.editor-toolbar {
  border-bottom: 1px solid #e4e7ed;
}

.editor-content {
  min-height: v-bind('height + "px"');
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-top: 1px solid #e4e7ed;
}

:deep(.w-e-text-container) {
  min-height: v-bind('height + "px"') !important;
}

/* 确保工具栏显示 */
:deep(.w-e-toolbar) {
  display: flex !important;
  visibility: visible !important;
}

/* 编辑器内图片样式 */
:deep(.w-e-text-container img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 8px 0;
}
</style>
