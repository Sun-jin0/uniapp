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
  </div>
</template>

<script setup>
import { shallowRef, onBeforeUnmount, watch } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { adminApi } from '@/api'
import { ElMessage } from 'element-plus'

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
  const html = editor.getHtml()
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

:deep(.w-e-text-container) {
  min-height: v-bind('height + "px"') !important;
}

/* 编辑器内图片样式 */
:deep(.w-e-text-container img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 8px 0;
}
</style>
